// ── Type aliases ──

export type Moneda = 'ARS' | 'USD';
export type EstadoProyecto = 'activo' | 'completado' | 'cancelado';
export type EstadoCuota = 'pendiente' | 'pagado';

// ── Core interfaces ──

export interface Project {
	id: string;
	cliente: string;
	nombre_proyecto: string;
	precio_total: number;
	moneda: Moneda;
	notas: string;
	document_id: string | null;
	estado: EstadoProyecto;
	created_at: string;
	updated_at: string | null;
}

export interface PaymentInstallment {
	id: string;
	project_id: string;
	numero: number;
	descripcion: string;
	monto: number;
	fecha_vencimiento: string | null;
	estado: EstadoCuota;
	fecha_pago: string | null;
	metodo_pago: string | null;
	notas: string | null;
	created_at: string;
	updated_at: string | null;
}

export interface ProjectWithPayments extends Project {
	installments: PaymentInstallment[];
	totalPagado: number;
	totalPendiente: number;
	progreso: number;
}

export interface ProjectListItem {
	id: string;
	cliente: string;
	nombre_proyecto: string;
	precio_total: number;
	moneda: Moneda;
	estado: EstadoProyecto;
	created_at: string;
	total_cuotas: number;
	cuotas_pagadas: number;
	total_pagado: number;
}

// ── Plan templates (discriminated union) ──

export type PlanTemplate =
	| { type: 'full' }
	| { type: 'equal'; cantidadCuotas: number }
	| { type: 'advance'; porcentajeAnticipo: number; cantidadCuotasResto: number }
	| { type: 'custom' };

// ── Form data types ──

export interface InstallmentFormData {
	id: string;
	numero: number;
	descripcion: string;
	monto: string;
	fecha_vencimiento: string;
	notas: string;
}

export interface ProjectFormData {
	cliente: string;
	nombre_proyecto: string;
	precio_total: string;
	moneda: Moneda;
	notas: string;
	document_id: string | null;
	estado: EstadoProyecto;
	installments: InstallmentFormData[];
}

// ── Factory functions ──

export const createEmptyProject = (): ProjectFormData => ({
	cliente: '',
	nombre_proyecto: '',
	precio_total: '',
	moneda: 'ARS',
	notas: '',
	document_id: null,
	estado: 'activo',
	installments: [],
});

export const createEmptyInstallment = (numero: number): InstallmentFormData => ({
	id: crypto.randomUUID(),
	numero,
	descripcion: `Cuota ${numero}`,
	monto: '',
	fecha_vencimiento: '',
	notas: '',
});

export const generateInstallmentsFromTemplate = (
	template: PlanTemplate,
	precioTotal: number,
): InstallmentFormData[] => {
	const round2 = (n: number): number => Math.round(n * 100) / 100;

	switch (template.type) {
		case 'full': {
			return [
				{
					...createEmptyInstallment(1),
					descripcion: 'Pago total',
					monto: String(round2(precioTotal)),
				},
			];
		}

		case 'equal': {
			const { cantidadCuotas } = template;
			const base = round2(Math.floor((precioTotal / cantidadCuotas) * 100) / 100);
			const remainder = round2(precioTotal - base * cantidadCuotas);

			return Array.from({ length: cantidadCuotas }, (_, i) => {
				const numero = i + 1;
				const monto = i === 0 ? round2(base + remainder) : base;

				return {
					...createEmptyInstallment(numero),
					descripcion: `Cuota ${numero} de ${cantidadCuotas}`,
					monto: String(monto),
				};
			});
		}

		case 'advance': {
			const { porcentajeAnticipo, cantidadCuotasResto } = template;
			const anticipo = round2((precioTotal * porcentajeAnticipo) / 100);
			const resto = round2(precioTotal - anticipo);
			const baseResto = round2(Math.floor((resto / cantidadCuotasResto) * 100) / 100);
			const remainderResto = round2(resto - baseResto * cantidadCuotasResto);

			const anticipoInstallment: InstallmentFormData = {
				...createEmptyInstallment(1),
				descripcion: `Anticipo (${porcentajeAnticipo}%)`,
				monto: String(anticipo),
			};

			const restoInstallments = Array.from({ length: cantidadCuotasResto }, (_, i) => {
				const numero = i + 2;
				const monto = i === 0 ? round2(baseResto + remainderResto) : baseResto;

				return {
					...createEmptyInstallment(numero),
					descripcion: `Cuota ${i + 1} de ${cantidadCuotasResto}`,
					monto: String(monto),
				};
			});

			return [anticipoInstallment, ...restoInstallments];
		}

		case 'custom': {
			return [createEmptyInstallment(1)];
		}
	}
};

export const computePaymentSummary = (
	project: Project,
	installments: PaymentInstallment[],
): ProjectWithPayments => {
	const totalPagado = installments
		.filter((i) => i.estado === 'pagado')
		.reduce((sum, i) => sum + i.monto, 0);

	const totalPendiente = installments
		.filter((i) => i.estado === 'pendiente')
		.reduce((sum, i) => sum + i.monto, 0);

	const progreso =
		project.precio_total > 0
			? Math.min(Math.round((totalPagado / project.precio_total) * 100), 100)
			: 0;

	return {
		...project,
		installments,
		totalPagado,
		totalPendiente,
		progreso,
	};
};
