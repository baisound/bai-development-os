import http from 'node:http';
import { DEFAULT_CLIENT_POLICY } from './constants.mjs';
import { validateConsumerEvidenceBatch } from './contracts.mjs';
import { KnowledgeEvolutionError } from './errors.mjs';

function sendJson(res,status,obj,headers={}){const body=JSON.stringify(obj);res.writeHead(status,{'content-type':'application/json; charset=utf-8','content-length':Buffer.byteLength(body),...headers});res.end(body);}
async function readJson(req,{limit=1024*1024}={}){const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>limit)throw new KnowledgeEvolutionError('CONSUMER_EVIDENCE_BATCH_PAYLOAD_TOO_LARGE');chunks.push(chunk);}try{return JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{throw new KnowledgeEvolutionError('CONSUMER_EVIDENCE_JSON_INVALID');}}
function hasCredential(req){const value=req.headers.authorization;return typeof value==='string'&&/^Bearer\s+\S+$/i.test(value);}

export function createConsumerEvidenceMockHub({scenario='accept',policy=DEFAULT_CLIENT_POLICY,timeoutDelayMs=250,clock=()=>new Date('2026-08-11T00:00:00.000Z')}={}){
  const seen=new Set();
  let receiptCounter=0;
  const server=http.createServer(async(req,res)=>{
    try{
      if(scenario==='timeout'){setTimeout(()=>{if(!res.writableEnded)sendJson(res,504,{error:'MOCK_TIMEOUT'});},timeoutDelayMs);return;}
      if(scenario==='auth-fail'||!hasCredential(req)){sendJson(res,401,{error:'UNAUTHORIZED'});return;}
      if(scenario==='forbidden'){sendJson(res,403,{error:'FORBIDDEN'});return;}
      if(scenario==='rate-limit'){sendJson(res,429,{error:'RATE_LIMITED'},{'retry-after':'1'});return;}
      if(scenario==='server-error'){sendJson(res,500,{error:'MOCK_SERVER_ERROR'});return;}
      const url=new URL(req.url,'http://localhost');
      if(req.method==='GET'&&url.pathname==='/v1/client-policy'){sendJson(res,200,policy);return;}
      if(req.method==='POST'&&url.pathname==='/v1/evidence/batch'){
        const batch=validateConsumerEvidenceBatch(await readJson(req));
        const accepted=[],already_seen=[],rejected=[];
        for(let i=0;i<batch.events.length;i++){
          const event=batch.events[i];
          if(seen.has(event.event_id)){already_seen.push(event.event_id);continue;}
          if(scenario==='partial'&&i===batch.events.length-1){rejected.push({event_id:event.event_id,reason:'MOCK_REJECTED'});continue;}
          seen.add(event.event_id);accepted.push(event.event_id);
        }
        receiptCounter++;sendJson(res,200,{receipt_id:`mock-${String(receiptCounter).padStart(6,'0')}`,accepted,already_seen,rejected,server_time:clock().toISOString()});return;
      }
      sendJson(res,404,{error:'NOT_FOUND'});
    }catch(error){sendJson(res,400,{error:error.code??'BAD_REQUEST'});}
  });
  return {
    server,
    async start({host='127.0.0.1',port=0}={}){await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,host,resolve);});const address=server.address();return {host,address:address.address,port:address.port,base_url:`http://${host}:${address.port}`};},
    async stop(){if(!server.listening)return;await new Promise((resolve,reject)=>server.close(err=>err?reject(err):resolve()));},
    seen
  };
}
