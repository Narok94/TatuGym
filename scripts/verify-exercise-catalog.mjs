import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import catalog from '../shared/exercise-catalog.json' with { type: 'json' };

const ids = new Set(), names = new Set(), groups = new Map(), hashes = new Set();
for(const item of catalog) {
  if(ids.has(item.id) || names.has(item.name)) throw new Error(`Exercício duplicado: ${item.name}`);
  ids.add(item.id); names.add(item.name);
  groups.set(item.muscleGroup,(groups.get(item.muscleGroup)??0)+1);
  if(!/^forja:[a-z0-9-]+$/.test(item.id) || item.imageUrl!==`/exercises/${item.id.slice(6)}.webp`) throw new Error(`Imagem incompatível: ${item.name}`);
  const file=new URL(`../public${item.imageUrl}`,import.meta.url);
  if(!existsSync(file)) throw new Error(`Falta imagem de ${item.name}: ${item.imageUrl}`);
  const bytes=readFileSync(file);
  if(bytes.length<5000 || bytes.toString('ascii',0,4)!=='RIFF' || bytes.toString('ascii',8,12)!=='WEBP') throw new Error(`WebP inválido: ${item.name}`);
  const hash=createHash('sha256').update(bytes).digest('hex');
  if(hashes.has(hash)) throw new Error(`Imagem repetida em movimentos diferentes: ${item.name}`);
  hashes.add(hash);
  if(!item.equipment || !item.instructions || !['reps','seconds'].includes(item.unit)) throw new Error(`Cadastro incompleto: ${item.name}`);
}
const baseGroups=['Peito','Costas','Ombros','Bíceps','Tríceps','Quadríceps','Posteriores de coxa','Glúteos','Panturrilhas','Abdômen'];
if(baseGroups.some(group=>(groups.get(group)??0)<10)) throw new Error('Preserve os 10 exercícios de cada grupo original ao ampliar o catálogo.');
const expectedFiles=new Set(catalog.map(item=>item.imageUrl.split('/').pop()));
for(const file of readdirSync(new URL('../public/exercises/',import.meta.url))) if(!expectedFiles.has(file)) throw new Error(`Imagem fora do catálogo: ${file}`);
console.log(`Catálogo validado: ${ids.size} exercícios, ${groups.size} grupos, ${hashes.size} imagens próprias em WebP.`);
