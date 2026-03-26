import { createClient } from '@libsql/client';

// Create Turso database client
const db = createClient({
	url: import.meta.env.VITE_TURSO_DATABASE_URL || '',
	authToken: import.meta.env.VITE_TURSO_AUTH_TOKEN || '',
});

// Initialize database schema
export const initDatabase = async (): Promise<void> => {
	try {
		await db.execute(`
			CREATE TABLE IF NOT EXISTS documents (
				id TEXT PRIMARY KEY,
				tipo TEXT NOT NULL DEFAULT 'propuesta',
				cliente TEXT NOT NULL,
				fecha TEXT NOT NULL,
				nombre_proyecto TEXT,
				objetivo_general TEXT,
				requerimientos_diseno TEXT,
				observaciones TEXT,
				inversion_total TEXT,
				forma_pago TEXT,
				plazo_entrega TEXT,
				created_at TEXT NOT NULL,
				updated_at TEXT
			)
		`);

		await db.execute(`
			CREATE TABLE IF NOT EXISTS document_modulos (
				id TEXT PRIMARY KEY,
				document_id TEXT NOT NULL,
				nombre TEXT NOT NULL,
				descripcion TEXT,
				orden INTEGER DEFAULT 0,
				FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
			)
		`);

		await db.execute(`
			CREATE TABLE IF NOT EXISTS modulo_funcionalidades (
				id TEXT PRIMARY KEY,
				modulo_id TEXT NOT NULL,
				funcionalidad TEXT NOT NULL,
				orden INTEGER DEFAULT 0,
				FOREIGN KEY (modulo_id) REFERENCES document_modulos(id) ON DELETE CASCADE
			)
		`);

		await db.execute(`
			CREATE TABLE IF NOT EXISTS document_exclusiones (
				id TEXT PRIMARY KEY,
				document_id TEXT NOT NULL,
				exclusion TEXT NOT NULL,
				orden INTEGER DEFAULT 0,
				FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
			)
		`);

		await db.execute(`
			CREATE TABLE IF NOT EXISTS projects (
				id TEXT PRIMARY KEY,
				cliente TEXT NOT NULL,
				nombre_proyecto TEXT NOT NULL,
				precio_total REAL NOT NULL DEFAULT 0,
				moneda TEXT NOT NULL DEFAULT 'ARS',
				notas TEXT DEFAULT '',
				document_id TEXT,
				estado TEXT NOT NULL DEFAULT 'activo',
				created_at TEXT NOT NULL,
				updated_at TEXT,
				FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE SET NULL
			)
		`);

		await db.execute(`
			CREATE TABLE IF NOT EXISTS payment_installments (
				id TEXT PRIMARY KEY,
				project_id TEXT NOT NULL,
				numero INTEGER NOT NULL,
				descripcion TEXT DEFAULT '',
				monto REAL NOT NULL DEFAULT 0,
				fecha_vencimiento TEXT,
				estado TEXT NOT NULL DEFAULT 'pendiente',
				fecha_pago TEXT,
				metodo_pago TEXT,
				notas TEXT DEFAULT '',
				created_at TEXT NOT NULL,
				updated_at TEXT,
				FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
			)
		`);

		await db.execute(`CREATE INDEX IF NOT EXISTS idx_projects_estado ON projects(estado)`);
		await db.execute(`CREATE INDEX IF NOT EXISTS idx_projects_cliente ON projects(cliente)`);
		await db.execute(`CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at)`);
		await db.execute(`CREATE INDEX IF NOT EXISTS idx_installments_project_id ON payment_installments(project_id)`);
		await db.execute(`CREATE INDEX IF NOT EXISTS idx_installments_fecha_vencimiento ON payment_installments(fecha_vencimiento)`);
		await db.execute(`CREATE INDEX IF NOT EXISTS idx_installments_estado ON payment_installments(estado)`);

		console.log('Database initialized successfully');
	} catch (error) {
		console.error('Failed to initialize database:', error);
		throw error;
	}
};

export { db };
