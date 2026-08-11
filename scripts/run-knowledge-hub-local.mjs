#!/usr/bin/env node
import { createCommonIngestionCore, createFixedWindowRateLimiter, createKnowledgeHubHttpServer, InMemoryEvidenceRepository, KnowledgeHubError } from '../src/knowledge-hub/index.mjs';

const token=process.env.BAI_KNOWLEDGE_HUB_DEV_TOKEN;
const productId=process.env.BAI_KNOWLEDGE_HUB_PRODUCT_ID;
const port=Number(process.env.BAI_KNOWLEDGE_HUB_PORT??8787);
if(!token||!productId){console.error('Set BAI_KNOWLEDGE_HUB_DEV_TOKEN and BAI_KNOWLEDGE_HUB_PRODUCT_ID. No default credential is embedded.');process.exit(2);}
if(!Number.isInteger(port)||port<1||port>65535){console.error('BAI_KNOWLEDGE_HUB_PORT must be 1..65535');process.exit(2);}

const repository=new InMemoryEvidenceRepository();
const rateLimiter=createFixedWindowRateLimiter({limit:120,windowMs:60_000});
const core=createCommonIngestionCore({repository,rateLimiter});
const authenticate=req=>{
  if(req.headers.authorization!==`Bearer ${token}`)throw new KnowledgeHubError('HUB_UNAUTHORIZED','Invalid local development credential',{status:401});
  return{subject_id:'local-dev-subject',product_id:productId,scopes:['evidence:write','policy:read'],trust_level:'REGISTERED_CLIENT'};
};
const hub=createKnowledgeHubHttpServer({core,authenticate});
const address=await hub.start({host:'127.0.0.1',port});
console.log(`BAI Knowledge Hub local foundation listening at ${address.base_url}`);
console.log('In-memory repository only. This command is NOT a production deployment mode.');
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,async()=>{await hub.stop();process.exit(0);});
