import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const db = createClient({
	url: process.env.VITE_TURSO_DATABASE_URL || '',
	authToken: process.env.VITE_TURSO_AUTH_TOKEN || '',
});

async function initDatabase() {
	console.log('🔄 Initializing database...');
	console.log('📡 Connecting to:', process.env.VITE_TURSO_DATABASE_URL);

	try {
		// Create documents table
		console.log('📄 Creating documents table...');
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
		console.log('✅ documents table created');

		// Create document_modulos table
		console.log('🧩 Creating document_modulos table...');
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
		console.log('✅ document_modulos table created');

		// Create modulo_funcionalidades table
		console.log('⚙️ Creating modulo_funcionalidades table...');
		await db.execute(`
			CREATE TABLE IF NOT EXISTS modulo_funcionalidades (
				id TEXT PRIMARY KEY,
				modulo_id TEXT NOT NULL,
				funcionalidad TEXT NOT NULL,
				orden INTEGER DEFAULT 0,
				FOREIGN KEY (modulo_id) REFERENCES document_modulos(id) ON DELETE CASCADE
			)
		`);
		console.log('✅ modulo_funcionalidades table created');

		// Create document_exclusiones table
		console.log('❌ Creating document_exclusiones table...');
		await db.execute(`
			CREATE TABLE IF NOT EXISTS document_exclusiones (
				id TEXT PRIMARY KEY,
				document_id TEXT NOT NULL,
				exclusion TEXT NOT NULL,
				orden INTEGER DEFAULT 0,
				FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
			)
		`);
		console.log('✅ document_exclusiones table created');

		// Verify tables exist
		console.log('\n📊 Verifying tables...');
		const tables = await db.execute(`
			SELECT name FROM sqlite_master WHERE type='table' ORDER BY name
		`);
		console.log('Tables in database:', tables.rows.map(r => r.name).join(', '));

		console.log('\n🎉 Database initialization completed successfully!');
	} catch (error) {
		console.error('❌ Failed to initialize database:', error);
		process.exit(1);
	}
}

initDatabase();
