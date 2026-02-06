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

		console.log('Database initialized successfully');
	} catch (error) {
		console.error('Failed to initialize database:', error);
		throw error;
	}
};

export { db };
