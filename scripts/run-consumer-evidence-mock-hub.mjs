#!/usr/bin/env node
import { createConsumerEvidenceMockHub } from '../src/knowledge-evolution/index.mjs';
const args=process.argv.slice(2); const get=(name,def)=>{const i=args.indexOf(name);return i>=0?args[i+1]:def;};
const scenario=get('--scenario','accept'), port=Number(get('--port','8787'));
const hub=createConsumerEvidenceMockHub({scenario});
const started=await hub.start({port});
console.log(`BAI Consumer Evidence Mock Hub ${scenario} listening at ${started.base_url}`);
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,async()=>{await hub.stop();process.exit(0);});
