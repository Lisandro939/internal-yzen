import { db } from '~/lib/db';
import type {
	EstadoProyecto,
	Moneda,
	PaymentInstallment,
	Project,
	ProjectFormData,
	ProjectListItem,
	ProjectWithPayments,
} from '~/types/project';
import { computePaymentSummary } from '~/types/project';

// Get all projects with aggregated payment data
export const getAllProjects = async (): Promise<ProjectListItem[]> => {
	try {
		const result = await db.execute(`
			SELECT p.*,
				COALESCE(COUNT(pi.id), 0) as total_cuotas,
				COALESCE(SUM(CASE WHEN pi.estado = 'pagado' THEN 1 ELSE 0 END), 0) as cuotas_pagadas,
				COALESCE(SUM(CASE WHEN pi.estado = 'pagado' THEN pi.monto ELSE 0 END), 0) as total_pagado
			FROM projects p
			LEFT JOIN payment_installments pi ON pi.project_id = p.id
			GROUP BY p.id
			ORDER BY p.created_at DESC
		`);

		return result.rows.map((row) => ({
			id: row.id as string,
			cliente: row.cliente as string,
			nombre_proyecto: row.nombre_proyecto as string,
			precio_total: Number(row.precio_total) || 0,
			moneda: (row.moneda as Moneda) || 'ARS',
			estado: (row.estado as EstadoProyecto) || 'activo',
			created_at: row.created_at as string,
			total_cuotas: Number(row.total_cuotas) || 0,
			cuotas_pagadas: Number(row.cuotas_pagadas) || 0,
			total_pagado: Number(row.total_pagado) || 0,
		}));
	} catch (error) {
		console.error('Failed to get projects:', error);
		return [];
	}
};

// Get project by ID with all payment installments
export const getProjectById = async (id: string): Promise<ProjectWithPayments | null> => {
	try {
		const projectResult = await db.execute({
			sql: 'SELECT * FROM projects WHERE id = ?',
			args: [id],
		});

		if (projectResult.rows.length === 0) return null;

		const row = projectResult.rows[0];

		const project: Project = {
			id: row.id as string,
			cliente: row.cliente as string,
			nombre_proyecto: row.nombre_proyecto as string,
			precio_total: Number(row.precio_total) || 0,
			moneda: (row.moneda as Moneda) || 'ARS',
			notas: (row.notas as string) || '',
			document_id: (row.document_id as string) || null,
			estado: (row.estado as EstadoProyecto) || 'activo',
			created_at: row.created_at as string,
			updated_at: (row.updated_at as string) || null,
		};

		const installmentsResult = await db.execute({
			sql: 'SELECT * FROM payment_installments WHERE project_id = ? ORDER BY numero ASC',
			args: [id],
		});

		const installments: PaymentInstallment[] = installmentsResult.rows.map((r) => ({
			id: r.id as string,
			project_id: r.project_id as string,
			numero: Number(r.numero) || 0,
			descripcion: (r.descripcion as string) || '',
			monto: Number(r.monto) || 0,
			fecha_vencimiento: (r.fecha_vencimiento as string) || null,
			estado: (r.estado as 'pendiente' | 'pagado') || 'pendiente',
			fecha_pago: (r.fecha_pago as string) || null,
			metodo_pago: (r.metodo_pago as string) || null,
			notas: (r.notas as string) || null,
			created_at: r.created_at as string,
			updated_at: (r.updated_at as string) || null,
		}));

		return computePaymentSummary(project, installments);
	} catch (error) {
		console.error('Failed to get project:', error);
		return null;
	}
};

// Save project (create or update)
export const saveProject = async (formData: ProjectFormData, existingId?: string): Promise<string | null> => {
	try {
		const now = new Date().toISOString();
		const precioTotal = parseFloat(formData.precio_total) || 0;

		if (existingId) {
			// Update existing project
			await db.execute({
				sql: `UPDATE projects SET
					cliente = ?, nombre_proyecto = ?, precio_total = ?, moneda = ?,
					notas = ?, document_id = ?, estado = ?, updated_at = ?
					WHERE id = ?`,
				args: [
					formData.cliente,
					formData.nombre_proyecto,
					precioTotal,
					formData.moneda,
					formData.notas,
					formData.document_id,
					formData.estado,
					now,
					existingId,
				],
			});

			// Delete old installments
			await db.execute({
				sql: 'DELETE FROM payment_installments WHERE project_id = ?',
				args: [existingId],
			});

			// Insert new installments
			for (const inst of formData.installments) {
				await db.execute({
					sql: `INSERT INTO payment_installments (
						id, project_id, numero, descripcion, monto, fecha_vencimiento,
						estado, notas, created_at
					) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
					args: [
						crypto.randomUUID(),
						existingId,
						inst.numero,
						inst.descripcion,
						parseFloat(inst.monto) || 0,
						inst.fecha_vencimiento || null,
						'pendiente',
						inst.notas || null,
						now,
					],
				});
			}

			return existingId;
		}

		// Create new project
		const id = crypto.randomUUID();

		await db.execute({
			sql: `INSERT INTO projects (
				id, cliente, nombre_proyecto, precio_total, moneda,
				notas, document_id, estado, created_at
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
			args: [
				id,
				formData.cliente,
				formData.nombre_proyecto,
				precioTotal,
				formData.moneda,
				formData.notas,
				formData.document_id,
				formData.estado,
				now,
			],
		});

		// Insert installments
		for (const inst of formData.installments) {
			await db.execute({
				sql: `INSERT INTO payment_installments (
					id, project_id, numero, descripcion, monto, fecha_vencimiento,
					estado, notas, created_at
				) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
				args: [
					crypto.randomUUID(),
					id,
					inst.numero,
					inst.descripcion,
					parseFloat(inst.monto) || 0,
					inst.fecha_vencimiento || null,
					'pendiente',
					inst.notas || null,
					now,
				],
			});
		}

		return id;
	} catch (error) {
		console.error('Failed to save project:', error);
		return null;
	}
};

// Delete project (CASCADE handles installments)
export const deleteProject = async (id: string): Promise<boolean> => {
	try {
		await db.execute({
			sql: 'DELETE FROM projects WHERE id = ?',
			args: [id],
		});

		return true;
	} catch (error) {
		console.error('Failed to delete project:', error);
		return false;
	}
};

// Mark installment as paid
export const markInstallmentPaid = async (id: string, metodoPago: string): Promise<boolean> => {
	try {
		const now = new Date().toISOString();

		await db.execute({
			sql: `UPDATE payment_installments SET
				estado = 'pagado', fecha_pago = ?, metodo_pago = ?, updated_at = ?
				WHERE id = ?`,
			args: [now, metodoPago, now, id],
		});

		// Check if all installments for this project are paid
		const installmentResult = await db.execute({
			sql: 'SELECT project_id FROM payment_installments WHERE id = ?',
			args: [id],
		});

		if (installmentResult.rows.length > 0) {
			const projectId = installmentResult.rows[0].project_id as string;

			const pendingResult = await db.execute({
				sql: `SELECT COUNT(*) as pending FROM payment_installments
					WHERE project_id = ? AND estado = 'pendiente'`,
				args: [projectId],
			});

			const pending = Number(pendingResult.rows[0].pending) || 0;

			if (pending === 0) {
				await db.execute({
					sql: `UPDATE projects SET estado = 'completado', updated_at = ? WHERE id = ?`,
					args: [now, projectId],
				});
			}
		}

		return true;
	} catch (error) {
		console.error('Failed to mark installment as paid:', error);
		return false;
	}
};

// Mark installment as unpaid
export const markInstallmentUnpaid = async (id: string): Promise<boolean> => {
	try {
		const now = new Date().toISOString();

		await db.execute({
			sql: `UPDATE payment_installments SET
				estado = 'pendiente', fecha_pago = NULL, metodo_pago = NULL, updated_at = ?
				WHERE id = ?`,
			args: [now, id],
		});

		// Revert project to 'activo' if it was 'completado'
		const installmentResult = await db.execute({
			sql: 'SELECT project_id FROM payment_installments WHERE id = ?',
			args: [id],
		});

		if (installmentResult.rows.length > 0) {
			const projectId = installmentResult.rows[0].project_id as string;

			await db.execute({
				sql: `UPDATE projects SET estado = 'activo', updated_at = ?
					WHERE id = ? AND estado = 'completado'`,
				args: [now, projectId],
			});
		}

		return true;
	} catch (error) {
		console.error('Failed to mark installment as unpaid:', error);
		return false;
	}
};

// Update project estado
export const updateProjectEstado = async (id: string, estado: EstadoProyecto): Promise<boolean> => {
	try {
		await db.execute({
			sql: 'UPDATE projects SET estado = ?, updated_at = ? WHERE id = ?',
			args: [estado, new Date().toISOString(), id],
		});

		return true;
	} catch (error) {
		console.error('Failed to update project estado:', error);
		return false;
	}
};

// Get upcoming pending payments
export const getUpcomingPayments = async (
	limit: number = 5,
): Promise<Array<PaymentInstallment & { cliente: string; nombre_proyecto: string; moneda: Moneda }>> => {
	try {
		const result = await db.execute({
			sql: `SELECT pi.*, p.cliente, p.nombre_proyecto, p.moneda
				FROM payment_installments pi
				JOIN projects p ON p.id = pi.project_id
				WHERE pi.estado = 'pendiente' AND p.estado = 'activo'
				ORDER BY pi.fecha_vencimiento ASC
				LIMIT ?`,
			args: [limit],
		});

		return result.rows.map((r) => ({
			id: r.id as string,
			project_id: r.project_id as string,
			numero: Number(r.numero) || 0,
			descripcion: (r.descripcion as string) || '',
			monto: Number(r.monto) || 0,
			fecha_vencimiento: (r.fecha_vencimiento as string) || null,
			estado: (r.estado as 'pendiente' | 'pagado') || 'pendiente',
			fecha_pago: (r.fecha_pago as string) || null,
			metodo_pago: (r.metodo_pago as string) || null,
			notas: (r.notas as string) || null,
			created_at: r.created_at as string,
			updated_at: (r.updated_at as string) || null,
			cliente: r.cliente as string,
			nombre_proyecto: r.nombre_proyecto as string,
			moneda: (r.moneda as Moneda) || 'ARS',
		}));
	} catch (error) {
		console.error('Failed to get upcoming payments:', error);
		return [];
	}
};
