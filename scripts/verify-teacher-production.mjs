import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const directory = join(process.cwd(), "dist", "assets");
if (!existsSync(directory)) throw new Error("Execute npm run build antes da verificação de produção.");
const forbidden = /teacher-demo-1|teacher-demo-2|professor2|teacher-login|teacher-workspace|Entrar como professor/;
for (const filename of readdirSync(directory).filter(name => /\.(js|css)$/.test(name))) {
  if (forbidden.test(readFileSync(join(directory, filename), "utf8"))) {
    throw new Error(`Código de teste do professor encontrado no build de produção: ${filename}`);
  }
}
console.log("Produção validada: login, credenciais e interface de teste do professor excluídos.");
