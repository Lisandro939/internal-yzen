import { db } from '~/lib/db';
import type { DocumentData, ModuloData } from '~/types/document';

// Get all documents
export const getAllDocuments = async (): Promise<DocumentData[]> => {
	try {
		const result = await db.execute('SELECT * FROM documents ORDER BY created_at DESC');

		const documents: DocumentData[] = [];

		for (const row of result.rows) {
			const doc = await getDocumentById(row.id as string);
			if (doc) documents.push(doc);
		}

		return documents;
	} catch (error) {
		console.error('Failed to get documents:', error);
		return [];
	}
};

// Get document by ID with all related data
export const getDocumentById = async (id: string): Promise<DocumentData | null> => {
	try {
		// Get main document
		const docResult = await db.execute({
			sql: 'SELECT * FROM documents WHERE id = ?',
			args: [id],
		});

		if (docResult.rows.length === 0) return null;

		const row = docResult.rows[0];

		// Get modules
		const modulosResult = await db.execute({
			sql: 'SELECT * FROM document_modulos WHERE document_id = ? ORDER BY orden',
			args: [id],
		});

		const modulos: ModuloData[] = [];
		for (const modRow of modulosResult.rows) {
			// Get functionalities for each module
			const funcsResult = await db.execute({
				sql: 'SELECT funcionalidad FROM modulo_funcionalidades WHERE modulo_id = ? ORDER BY orden',
				args: [modRow.id as string],
			});

			modulos.push({
				id: modRow.id as string,
				nombre: modRow.nombre as string,
				descripcion: (modRow.descripcion as string) || '',
				funcionalidades: funcsResult.rows.map(f => f.funcionalidad as string),
			});
		}

		// Get exclusions
		const exclusResult = await db.execute({
			sql: 'SELECT exclusion FROM document_exclusiones WHERE document_id = ? ORDER BY orden',
			args: [id],
		});

		return {
			id: row.id as string,
			tipo: (row.tipo as 'propuesta' | 'presupuesto' | 'remito') || 'propuesta',
			cliente: row.cliente as string,
			fecha: row.fecha as string,
			nombreProyecto: (row.nombre_proyecto as string) || '',
			puntoVenta: '',
			objetivoGeneral: (row.objetivo_general as string) || '',
			requerimientosDiseno: (row.requerimientos_diseno as string) || '',
			modulos: modulos.length > 0 ? modulos : [{ id: crypto.randomUUID(), nombre: '', descripcion: '', funcionalidades: [''] }],
			exclusiones: exclusResult.rows.length > 0
				? exclusResult.rows.map(e => e.exclusion as string)
				: [''],
			items: [],
			observaciones: (row.observaciones as string) || '',
			inversionTotal: (row.inversion_total as string) || '',
			formaPago: (row.forma_pago as string) || '',
			plazoEntrega: (row.plazo_entrega as string) || '',
			createdAt: row.created_at as string,
		};
	} catch (error) {
		console.error('Failed to get document:', error);
		return null;
	}
};

// Save document (create or update)
export const saveDocumentToDb = async (document: DocumentData): Promise<boolean> => {
	try {
		// Check if document exists
		const existing = await db.execute({
			sql: 'SELECT id FROM documents WHERE id = ?',
			args: [document.id],
		});

		if (existing.rows.length > 0) {
			// Update existing document
			await db.execute({
				sql: `UPDATE documents SET 
					tipo = ?, cliente = ?, fecha = ?, nombre_proyecto = ?,
					objetivo_general = ?, requerimientos_diseno = ?, observaciones = ?,
					inversion_total = ?, forma_pago = ?, plazo_entrega = ?, updated_at = ?
					WHERE id = ?`,
				args: [
					document.tipo,
					document.cliente,
					document.fecha,
					document.nombreProyecto,
					document.objetivoGeneral,
					document.requerimientosDiseno,
					document.observaciones,
					document.inversionTotal,
					document.formaPago,
					document.plazoEntrega,
					new Date().toISOString(),
					document.id,
				],
			});
		} else {
			// Insert new document
			await db.execute({
				sql: `INSERT INTO documents (
					id, tipo, cliente, fecha, nombre_proyecto, objetivo_general,
					requerimientos_diseno, observaciones, inversion_total, forma_pago,
					plazo_entrega, created_at
				) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
				args: [
					document.id,
					document.tipo,
					document.cliente,
					document.fecha,
					document.nombreProyecto,
					document.objetivoGeneral,
					document.requerimientosDiseno,
					document.observaciones,
					document.inversionTotal,
					document.formaPago,
					document.plazoEntrega,
					document.createdAt,
				],
			});
		}

		// Delete existing modules and exclusions (will be recreated)
		await db.execute({
			sql: 'DELETE FROM document_modulos WHERE document_id = ?',
			args: [document.id],
		});
		await db.execute({
			sql: 'DELETE FROM document_exclusiones WHERE document_id = ?',
			args: [document.id],
		});

		// Insert modules and functionalities
		for (let i = 0; i < document.modulos.length; i++) {
			const modulo = document.modulos[i];
			if (!modulo.nombre && modulo.funcionalidades.every(f => !f)) continue;

			const moduloId = modulo.id || crypto.randomUUID();
			await db.execute({
				sql: 'INSERT INTO document_modulos (id, document_id, nombre, descripcion, orden) VALUES (?, ?, ?, ?, ?)',
				args: [moduloId, document.id, modulo.nombre, modulo.descripcion, i],
			});

			for (let j = 0; j < modulo.funcionalidades.length; j++) {
				const func = modulo.funcionalidades[j];
				if (!func) continue;

				await db.execute({
					sql: 'INSERT INTO modulo_funcionalidades (id, modulo_id, funcionalidad, orden) VALUES (?, ?, ?, ?)',
					args: [crypto.randomUUID(), moduloId, func, j],
				});
			}
		}

		// Insert exclusions
		for (let i = 0; i < document.exclusiones.length; i++) {
			const exclusion = document.exclusiones[i];
			if (!exclusion) continue;

			await db.execute({
				sql: 'INSERT INTO document_exclusiones (id, document_id, exclusion, orden) VALUES (?, ?, ?, ?)',
				args: [crypto.randomUUID(), document.id, exclusion, i],
			});
		}

		return true;
	} catch (error) {
		console.error('Failed to save document:', error);
		return false;
	}
};

// Delete document
export const deleteDocumentFromDb = async (id: string): Promise<boolean> => {
	try {
		// Delete related data first (due to foreign keys)
		const modulosResult = await db.execute({
			sql: 'SELECT id FROM document_modulos WHERE document_id = ?',
			args: [id],
		});

		for (const mod of modulosResult.rows) {
			await db.execute({
				sql: 'DELETE FROM modulo_funcionalidades WHERE modulo_id = ?',
				args: [mod.id as string],
			});
		}

		await db.execute({
			sql: 'DELETE FROM document_modulos WHERE document_id = ?',
			args: [id],
		});

		await db.execute({
			sql: 'DELETE FROM document_exclusiones WHERE document_id = ?',
			args: [id],
		});

		await db.execute({
			sql: 'DELETE FROM documents WHERE id = ?',
			args: [id],
		});

		return true;
	} catch (error) {
		console.error('Failed to delete document:', error);
		return false;
	}
};
