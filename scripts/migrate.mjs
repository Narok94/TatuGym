import { readdir, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { database, transaction } from '../server/db.mjs';

try {
  await transaction(async db => {
    await db.query("SELECT pg_advisory_xact_lock(702156901)");
    await db.query('CREATE SCHEMA IF NOT EXISTS forja');
    await db.query('CREATE TABLE IF NOT EXISTS forja.schema_migrations (name text PRIMARY KEY, checksum text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())');
    for (const name of (await readdir(new URL('../migrations/', import.meta.url))).filter(x => x.endsWith('.sql')).sort()) {
      const sql = await readFile(new URL(`../migrations/${name}`, import.meta.url), 'utf8');
      const checksum = createHash('sha256').update(sql).digest('hex');
      const old = await db.query('SELECT checksum FROM forja.schema_migrations WHERE name=$1', [name]);
      if (old.rowCount) { if (old.rows[0].checksum !== checksum) throw new Error('Migration alterada após aplicação.'); continue; }
      await db.query(sql);
      await db.query('INSERT INTO forja.schema_migrations(name,checksum) VALUES($1,$2)', [name,checksum]);
      console.log(`Migration aplicada: ${name}`);
    }
  });
} catch { console.error('Migration interrompida; transação revertida. Verifique o schema e a conexão.'); process.exitCode = 1; }
finally { await database().end(); }
