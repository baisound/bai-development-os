import http from 'node:http';
import { KnowledgeHubError } from './errors.mjs';

function sendJson(res,status,value,headers={}){const body=JSON.stringify(value);res.writeHead(status,{'content-type':'application/json; charset=utf-8','content-length':Buffer.byteLength(body),'cache-control':'no-store','x-content-type-options':'nosniff',...headers});res.end(body);}
async function readJson(req,limit){const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>limit)throw new KnowledgeHubError('HUB_REQUEST_TOO_LARGE','Request body too large',{status:413});chunks.push(chunk);}try{return JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{throw new KnowledgeHubError('HUB_JSON_INVALID','Invalid JSON',{status:400});}}

export function createKnowledgeHubHttpServer({core,authenticate,bodyLimitBytes=1024*1024}={}){
 if(!core||typeof core.submitBatch!=='function'||typeof core.getClientPolicy!=='function')throw new TypeError('core is required');
 if(typeof authenticate!=='function')throw new TypeError('authenticate callback is required');
 const server=http.createServer(async(req,res)=>{try{
  const url=new URL(req.url,'http://localhost');
  if(req.method==='GET'&&url.pathname==='/healthz'){sendJson(res,200,{status:'ok',service:'bai-knowledge-hub'});return;}
  if(req.method==='GET'&&url.pathname==='/readyz'){const ready=typeof core.checkReady==='function'?await core.checkReady():{ready:false,backend:'unknown'};sendJson(res,ready.ready?200:503,{status:ready.ready?'ready':'not-ready',service:'bai-knowledge-hub',backend:ready.backend??'unknown'});return;}
  const authContext=await authenticate(req);
  if(req.method==='GET'&&url.pathname==='/v1/client-policy'){sendJson(res,200,await core.getClientPolicy({authContext}));return;}
  if(req.method==='POST'&&url.pathname==='/v1/evidence/batch'){
    const body=await readJson(req,bodyLimitBytes);
    const receipt=await core.submitBatch(body,{authContext,transport:'https'});
    sendJson(res,200,receipt);return;
  }
  sendJson(res,404,{error:'HUB_NOT_FOUND'});
 }catch(error){
   const status=Number.isInteger(error?.status)?error.status:400;
   const headers={};if(status===429&&error?.details?.retry_after_seconds)headers['retry-after']=String(error.details.retry_after_seconds);
   sendJson(res,status,{error:error?.code??'HUB_BAD_REQUEST'},headers);
 }});
 return Object.freeze({server,async start({host='127.0.0.1',port=0}={}){await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,host,resolve);});const address=server.address();return{host,port:address.port,base_url:`http://${host}:${address.port}`};},async stop(){if(!server.listening)return;await new Promise((resolve,reject)=>server.close(e=>e?reject(e):resolve()));}});
}
