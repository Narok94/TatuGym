import { createServer } from 'node:http';
import handler from '../api/forja.mjs';
const port=Number(process.env.FORJA_API_PORT||3001);
createServer((req,res)=>{
  if(!req.url?.startsWith('/api/forja')) {res.statusCode=404;res.end();return;}
  handler(req,res);
}).listen(port,'127.0.0.1',()=>console.log(`API FORJA em http://127.0.0.1:${port}`));
