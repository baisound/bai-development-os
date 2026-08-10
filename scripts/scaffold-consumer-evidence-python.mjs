#!/usr/bin/env node
import { scaffoldPythonConsumerEvidenceClient } from '../src/knowledge-evolution/index.mjs';
const target=process.argv[2]; if(!target){console.error('usage: node scripts/scaffold-consumer-evidence-python.mjs <target> [--force]');process.exit(2);}
const out=await scaffoldPythonConsumerEvidenceClient(target,{force:process.argv.includes('--force')});console.log(out);
