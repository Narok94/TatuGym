import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
const envFile=existsSync('.env.development.local')?'.env.development.local':'.env.local';
const api=spawn(process.execPath,[`--env-file-if-exists=${envFile}`,'server/local.mjs'],{stdio:'inherit'});
const vite=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','0.0.0.0',...process.argv.slice(2)],{stdio:'inherit'});
const stop=()=>{api.kill();vite.kill();};
process.on('SIGINT',stop);process.on('SIGTERM',stop);
api.on('exit',code=>{vite.kill();process.exitCode=code||0;});
vite.on('exit',code=>{api.kill();process.exitCode=code||0;});
