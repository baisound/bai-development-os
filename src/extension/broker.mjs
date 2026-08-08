import { ExtensionError } from './errors.mjs'; import { byteLength,deepFreeze } from './util.mjs';
function capability(entry,id){const c=entry.manifest.capabilities.find(x=>x.capability_id===id);if(!c)throw new ExtensionError('EXTENSION_CAPABILITY_NOT_FOUND');return c;}
function abortPromise(signal){if(!signal)return {promise:new Promise(()=>{}),cleanup:()=>{}};let fn;const promise=new Promise((_,reject)=>{fn=()=>reject(new ExtensionError('EXTENSION_ABORTED'));signal.addEventListener('abort',fn,{once:true});});return {promise,cleanup:()=>signal.removeEventListener('abort',fn)};}
export class CapabilityBroker{
  #active=new Map();
  constructor({registry,sandbox_runner=null,authorization_verifier=null,permission_resolver=null}={}){this.registry=registry;this.sandbox_runner=sandbox_runner;this.authorization_verifier=authorization_verifier;this.permission_resolver=permission_resolver;}
  async invoke({extension_id,capability_id,operation,payload=null,authorization_ref=null,context={},signal=null}={}){
    if(signal?.aborted)throw new ExtensionError('EXTENSION_ABORTED');
    const entry=this.registry.get(extension_id);if(entry.state!=='ENABLED')throw new ExtensionError('EXTENSION_NOT_ENABLED');this.registry.assertDependencies(extension_id);const cap=capability(entry,capability_id);if(!cap.operations.includes(operation))throw new ExtensionError('EXTENSION_OPERATION_DENIED');if(byteLength(payload)>cap.max_payload_bytes)throw new ExtensionError('EXTENSION_PAYLOAD_TOO_LARGE');
    if(cap.sandbox_required&&entry.manifest.execution_mode!=='SANDBOXED')throw new ExtensionError('EXTENSION_SANDBOX_REQUIRED');
    if(cap.requires_authorization){if(!authorization_ref)throw new ExtensionError('EXTENSION_AUTHORIZATION_REQUIRED');if(this.authorization_verifier&&!await this.authorization_verifier({authorization_ref,extension_id,capability_id,operation,context}))throw new ExtensionError('EXTENSION_AUTHORIZATION_INVALID');}
    if(this.permission_resolver){const granted=await this.permission_resolver({extension_id,required_permissions:cap.permissions,context});if(!granted)throw new ExtensionError('EXTENSION_PERMISSION_DENIED');}
    if(entry.manifest.execution_mode==='DECLARATIVE')throw new ExtensionError('EXTENSION_DECLARATIVE_NOT_EXECUTABLE');
    const active=this.#active.get(extension_id)??0;if(active>=entry.manifest.resource_budget.max_concurrency)throw new ExtensionError('EXTENSION_CONCURRENCY_LIMIT');this.#active.set(extension_id,active+1);
    const provider=this.registry.provider(extension_id);if(!provider){this.#release(extension_id);throw new ExtensionError('EXTENSION_PROVIDER_MISSING');}
    const request=deepFreeze({extension_id,capability_id,operation,payload:structuredClone(payload),authorization_ref,context:structuredClone(context)});
    const controller=new AbortController();const forward=()=>controller.abort(signal?.reason);if(signal)signal.addEventListener('abort',forward,{once:true});
    const call=async()=>{if(entry.manifest.execution_mode==='SANDBOXED'){if(!this.sandbox_runner)throw new ExtensionError('EXTENSION_SANDBOX_RUNNER_REQUIRED');return this.sandbox_runner({provider,request,capability:cap,resource_budget:entry.manifest.resource_budget,signal:controller.signal});}if(entry.manifest.execution_mode==='IN_PROCESS_TRUSTED'){const fn=provider?.capabilities?.[capability_id]?.[operation];if(typeof fn!=='function')throw new ExtensionError('EXTENSION_HANDLER_MISSING');return fn(request,{signal:controller.signal,resource_budget:entry.manifest.resource_budget});}throw new ExtensionError('EXTENSION_DECLARATIVE_NOT_EXECUTABLE');};
    const operationPromise=Promise.resolve().then(call);operationPromise.finally(()=>this.#release(extension_id)).catch(()=>{});
    let timer;const timeout=new Promise((_,reject)=>{timer=setTimeout(()=>{controller.abort('timeout');reject(new ExtensionError('EXTENSION_RUNTIME_TIMEOUT'));},Math.min(cap.max_runtime_ms,entry.manifest.resource_budget.max_runtime_ms));});const aborted=abortPromise(signal);
    try{const result=await Promise.race([operationPromise,timeout,aborted.promise]);return deepFreeze({status:'SUCCESS',extension_id,capability_id,operation,result:structuredClone(result??null)});}finally{clearTimeout(timer);aborted.cleanup();if(signal)signal.removeEventListener('abort',forward);}
  }
  #release(id){const n=this.#active.get(id)??0;if(n<=1)this.#active.delete(id);else this.#active.set(id,n-1);}
}
