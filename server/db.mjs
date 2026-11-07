import pg from 'pg';

let pool;
export function database() {
  const connectionString = process.env.FORJA_URL || process.env.FORJA_DATABASE_URL || process.env.FORJA_POSTGRES_URL;
  if (!connectionString) throw new Error('Banco FORJA não configurado no servidor.');
  const url = new URL(connectionString);
  url.searchParams.set('sslmode', 'verify-full');
  if(!pool) {
    pool=new pg.Pool({ connectionString: url.toString(), max: 3, connectionTimeoutMillis: 15000, idleTimeoutMillis: 10000 });
    const schema=process.env.FORJA_TEST_SCHEMA;
    if(schema) {
      if(process.env.VERCEL || !/^forja_test_[a-z0-9_]+$/.test(schema)) throw new Error('Schema de testes inválido.');
      pool.on('connect',client=>{
        const original=client.query.bind(client);
        client.query=(sql,...args)=>original(typeof sql==='string'?sql.replace(/\bforja\b/g,schema):sql,...args);
      });
    }
  }
  return pool;
}
export async function transaction(action) {
  const client = await database().connect();
  try { await client.query('BEGIN'); const result = await action(client); await client.query('COMMIT'); return result; }
  catch (error) { await client.query('ROLLBACK'); throw error; }
  finally { client.release(); }
}
