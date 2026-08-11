import { access, cp, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { KnowledgeEvolutionError } from './errors.mjs';

const here=path.dirname(fileURLToPath(import.meta.url));
const templateRoot=path.resolve(here,'../../templates/consumer-evidence/python');
export async function scaffoldPythonConsumerEvidenceClient(target,{force=false}={}){
  const out=path.resolve(target);
  if(!force){try{await access(out);throw new KnowledgeEvolutionError('CONSUMER_EVIDENCE_SCAFFOLD_TARGET_EXISTS',out);}catch(error){if(error instanceof KnowledgeEvolutionError)throw error;if(error.code!=='ENOENT')throw error;}}
  await mkdir(path.dirname(out),{recursive:true});
  await cp(templateRoot,out,{recursive:true,force});
  return out;
}
export function consumerEvidencePythonTemplateRoot(){return templateRoot;}
