#!/usr/bin/env node
import { inspectKnowledgeSnapshot } from '../src/knowledge-evolution/index.mjs';
const source=process.argv[2]; if(!source){console.error('usage: node scripts/inspect-knowledge-snapshot.mjs <snapshot.zip|directory|file>');process.exit(2);}
const result=await inspectKnowledgeSnapshot(source);console.log(JSON.stringify(result,null,2));if(result.state==='QUARANTINED')process.exitCode=3;
