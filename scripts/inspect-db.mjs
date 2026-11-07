import { database } from '../server/db.mjs';
try {
  const db = database();
  const { rows } = await db.query("SELECT schemaname, tablename FROM pg_tables WHERE schemaname NOT IN ('pg_catalog','information_schema') ORDER BY 1,2");
  console.log(JSON.stringify({ configured: true, tables: rows }));
} catch { console.error('Não foi possível inspecionar o banco. Nenhum dado foi alterado.'); process.exitCode = 1; }
finally { await database().end(); }
