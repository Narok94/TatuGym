import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const directory = join(process.cwd(), "dist", "assets");
if (!existsSync(directory)) throw new Error("Execute npm run build antes da verificação de produção.");
const forbidden = /password\s*===\s*["'][^"']+["']|tatugym:dev:teacher-session|postgres(?:ql)?:\/\//;
let hasLogin = false;
for (const filename of readdirSync(directory).filter(name => /\.(js|css)$/.test(name))) {
  const content = readFileSync(join(directory, filename), "utf8");
  hasLogin ||= content.includes("Acesse sua conta");
  if (forbidden.test(content)) {
    throw new Error(`Código de teste do professor encontrado no build de produção: ${filename}`);
  }
}
if (!hasLogin) throw new Error("A tela de login FORJA deve fazer parte do aplicativo principal.");
console.log("Produção validada: login FORJA incluído; credenciais e sessão simuladas excluídas.");
