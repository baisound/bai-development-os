import { ReleaseError } from './errors.mjs';
export function parseSemver(value) {
  if (typeof value !== 'string') throw new ReleaseError('RELEASE_SEMVER_INVALID');
  const m=value.trim().match(/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z.-]+))?(?:\+([0-9A-Za-z.-]+))?$/);
  if(!m) throw new ReleaseError('RELEASE_SEMVER_INVALID', `invalid semver: ${value}`);
  return Object.freeze({ raw:value.trim(), major:+m[1], minor:+m[2], patch:+m[3], prerelease:m[4]??null, build:m[5]??null });
}
function preParts(v){ return v.prerelease===null?null:v.prerelease.split('.').map(x=>/^\d+$/.test(x)?Number(x):x); }
export function compareSemver(a,b){ a=parseSemver(typeof a==='string'?a:a.raw); b=parseSemver(typeof b==='string'?b:b.raw); for(const k of ['major','minor','patch']) if(a[k]!==b[k]) return a[k]<b[k]?-1:1; const ap=preParts(a),bp=preParts(b); if(ap===null&&bp===null)return 0;if(ap===null)return 1;if(bp===null)return -1; const n=Math.max(ap.length,bp.length); for(let i=0;i<n;i++){ if(ap[i]===undefined)return -1;if(bp[i]===undefined)return 1;if(ap[i]===bp[i])continue; if(typeof ap[i]==='number'&&typeof bp[i]==='string')return -1;if(typeof ap[i]==='string'&&typeof bp[i]==='number')return 1;return ap[i]<bp[i]?-1:1;} return 0; }
export const isUpgrade=(from,to)=>compareSemver(to,from)>0;
export const isDowngrade=(from,to)=>compareSemver(to,from)<0;
export function satisfiesBounds(version,{min=null,max=null}={}){ parseSemver(version); if(min&&compareSemver(version,min)<0)return false;if(max&&compareSemver(version,max)>0)return false;return true; }
