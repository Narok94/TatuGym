import { spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
const schema=`forja_test_${Date.now()}_${randomBytes(3).toString('hex')}`;
const env={...process.env,FORJA_TEST_SCHEMA:schema,FORJA_API_PORT:'3002',FORJA_SEED_STUDENT_PASSWORD:randomBytes(16).toString('hex'),FORJA_SEED_TEACHER_PASSWORD:randomBytes(16).toString('hex'),FORJA_SEED_TEACHER2_PASSWORD:randomBytes(16).toString('hex')};
console.log(`Testes isolados no schema ${schema}. Nenhuma tabela real do app será alterada.`);
for(const args of [
  ['--env-file=.env.development.local','scripts/migrate.mjs'],
  ['--env-file=.env.development.local','scripts/seed-users.mjs'],
  ['--env-file=.env.development.local','--test','tests/server-contract.test.mjs'],
  ['node_modules/@playwright/test/cli.js','test','--config=playwright.neon.config.ts',...process.argv.slice(2)],
]) {
  const result=spawnSync(process.execPath,args,{env,stdio:'inherit'});
  if(result.status!==0) {process.exitCode=result.status||1;break;}
}
