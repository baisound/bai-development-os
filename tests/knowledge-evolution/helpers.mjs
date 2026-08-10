import { writeFile } from 'node:fs/promises';

const table=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;t[n]=c>>>0;}return t;})();
function crc32(buf){let c=0xffffffff;for(const byte of buf)c=table[(c^byte)&0xff]^(c>>>8);return(c^0xffffffff)>>>0;}
export async function writeStoredZip(file, entries){
  const locals=[],centrals=[];let offset=0;
  for(const item of entries){
    const nameBuf=Buffer.from(item.name,'utf8'), data=Buffer.from(item.data??'',item.encoding??'utf8'), crc=crc32(data), flags=0x800;
    const local=Buffer.alloc(30);local.writeUInt32LE(0x04034b50,0);local.writeUInt16LE(20,4);local.writeUInt16LE(flags,6);local.writeUInt16LE(0,8);local.writeUInt32LE(crc,14);local.writeUInt32LE(data.length,18);local.writeUInt32LE(data.length,22);local.writeUInt16LE(nameBuf.length,26);local.writeUInt16LE(0,28);
    locals.push(local,nameBuf,data);
    const central=Buffer.alloc(46);central.writeUInt32LE(0x02014b50,0);central.writeUInt16LE((3<<8)|20,4);central.writeUInt16LE(20,6);central.writeUInt16LE(flags,8);central.writeUInt16LE(0,10);central.writeUInt32LE(crc,16);central.writeUInt32LE(data.length,20);central.writeUInt32LE(data.length,24);central.writeUInt16LE(nameBuf.length,28);central.writeUInt16LE(0,30);central.writeUInt16LE(0,32);central.writeUInt16LE(0,34);central.writeUInt16LE(0,36);const mode=item.symlink?0xa1ff:0x81a4;central.writeUInt32LE((mode<<16)>>>0,38);central.writeUInt32LE(offset,42);centrals.push(central,nameBuf);offset+=local.length+nameBuf.length+data.length;
  }
  const centralBuf=Buffer.concat(centrals), localBuf=Buffer.concat(locals), eocd=Buffer.alloc(22);eocd.writeUInt32LE(0x06054b50,0);eocd.writeUInt16LE(entries.length,8);eocd.writeUInt16LE(entries.length,10);eocd.writeUInt32LE(centralBuf.length,12);eocd.writeUInt32LE(localBuf.length,16);
  await writeFile(file,Buffer.concat([localBuf,centralBuf,eocd]));
}
export const fixedClock=(iso='2026-08-11T00:00:00.000Z')=>()=>new Date(iso);
export function validEvent(overrides={}){return {schema_version:'1.0',event_id:'evt-12345678',occurred_at:'2026-08-11T00:00:00Z',product:{product_id:'bai-video-production',product_version:'0.17.0'},installation_id:'inst-12345678',event_type:'feature_result',privacy_level:'P0',payload:{feature:'subtitle_import',result:'success',duration_ms:120,retry_count:0},...overrides};}
