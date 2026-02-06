export interface DocumentItem {
	id: string;
	cantidad: string;
	descripcion: string;
	codigo: string;
	precioUnitario: string;
	descuento: string;
	importeTotal: string;
}

export interface DocumentData {
	id: string;
	// Encabezado
	cliente: string;
	fecha: string;
	nombreProyecto: string;

	// Objetivo
	objetivoGeneral: string;

	// Módulos
	modulos: ModuloData[];

	// Requerimientos de diseño
	requerimientosDiseno: string;

	// Exclusiones
	exclusiones: string[];

	// Propuesta económica
	inversionTotal: string;
	formaPago: string;
	plazoEntrega: string;

	// Items/Productos (opcional para presupuestos detallados)
	items: DocumentItem[];

	// Punto de venta
	puntoVenta: string;

	// Observaciones
	observaciones: string;

	// Metadata
	createdAt: string;
	tipo: 'propuesta' | 'presupuesto' | 'remito';
}

export interface ModuloData {
	id: string;
	nombre: string;
	descripcion: string;
	funcionalidades: string[];
}

export const createEmptyDocument = (): Omit<DocumentData, 'id' | 'createdAt'> => ({
	cliente: '',
	fecha: new Date().toISOString().split('T')[0],
	nombreProyecto: '',
	objetivoGeneral: '',
	modulos: [
		{
			id: crypto.randomUUID(),
			nombre: '',
			descripcion: '',
			funcionalidades: [''],
		},
	],
	requerimientosDiseno: '',
	exclusiones: [''],
	inversionTotal: '',
	formaPago: '',
	plazoEntrega: '',
	items: [],
	puntoVenta: '',
	observaciones: '',
	tipo: 'propuesta',
});

export const createEmptyItem = (): DocumentItem => ({
	id: crypto.randomUUID(),
	cantidad: '',
	descripcion: '',
	codigo: '',
	precioUnitario: '',
	descuento: '0',
	importeTotal: '0',
});
