import { inflateRawSync } from 'node:zlib';
import { KnowledgeEvolutionError } from './errors.mjs';
import { safeArchivePath } from './util.mjs';

const SIG_EOCD = 0x06054b50;
const SIG_CENTRAL = 0x02014b50;
const SIG_LOCAL = 0x04034b50;

const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (const byte of buf) c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function findEocd(buffer) {
  const min = Math.max(0, buffer.length - 0xffff - 22);
  for (let i = buffer.length - 22; i >= min; i--) if (buffer.readUInt32LE(i) === SIG_EOCD) return i;
  throw new KnowledgeEvolutionError('KNOWLEDGE_SNAPSHOT_ZIP_EOCD_MISSING');
}
export function parseZip(buffer, { maxEntries = 10000, maxTotalUncompressed = 512 * 1024 * 1024, maxEntryUncompressed = 32 * 1024 * 1024 } = {}) {
  if (!Buffer.isBuffer(buffer)) buffer = Buffer.from(buffer);
  const eocd = findEocd(buffer);
  const disk = buffer.readUInt16LE(eocd + 4), startDisk = buffer.readUInt16LE(eocd + 6);
  const count = buffer.readUInt16LE(eocd + 10), centralSize = buffer.readUInt32LE(eocd + 12), centralOffset = buffer.readUInt32LE(eocd + 16);
  if (disk !== 0 || startDisk !== 0) throw new KnowledgeEvolutionError('KNOWLEDGE_SNAPSHOT_MULTIDISK_UNSUPPORTED');
  if (count > maxEntries) throw new KnowledgeEvolutionError('KNOWLEDGE_SNAPSHOT_TOO_MANY_ENTRIES');
  if (centralOffset + centralSize > buffer.length) throw new KnowledgeEvolutionError('KNOWLEDGE_SNAPSHOT_ZIP_INVALID');
  const entries = [];
  const names = new Set();
  let p = centralOffset, total = 0;
  for (let i = 0; i < count; i++) {
    if (p + 46 > buffer.length || buffer.readUInt32LE(p) !== SIG_CENTRAL) throw new KnowledgeEvolutionError('KNOWLEDGE_SNAPSHOT_ZIP_CENTRAL_INVALID');
    const flags = buffer.readUInt16LE(p + 8), method = buffer.readUInt16LE(p + 10), expectedCrc = buffer.readUInt32LE(p + 16);
    const compressedSize = buffer.readUInt32LE(p + 20), uncompressedSize = buffer.readUInt32LE(p + 24);
    const nameLen = buffer.readUInt16LE(p + 28), extraLen = buffer.readUInt16LE(p + 30), commentLen = buffer.readUInt16LE(p + 32), externalAttributes = buffer.readUInt32LE(p + 38), localOffset = buffer.readUInt32LE(p + 42);
    if ([compressedSize, uncompressedSize, localOffset].some(v => v === 0xffffffff)) throw new KnowledgeEvolutionError('KNOWLEDGE_SNAPSHOT_ZIP64_UNSUPPORTED');
    if (flags & 0x1) throw new KnowledgeEvolutionError('KNOWLEDGE_SNAPSHOT_ENCRYPTED_UNSUPPORTED');
    if (![0, 8].includes(method)) throw new KnowledgeEvolutionError('KNOWLEDGE_SNAPSHOT_COMPRESSION_UNSUPPORTED', `method ${method}`);
    const rawName = buffer.subarray(p + 46, p + 46 + nameLen).toString('utf8');
    const name = safeArchivePath(rawName);
    if (names.has(name)) throw new KnowledgeEvolutionError('KNOWLEDGE_SNAPSHOT_DUPLICATE_ENTRY', name);
    names.add(name);
    const unixMode = (externalAttributes >>> 16) & 0xffff;
    const isSymlink = (unixMode & 0xf000) === 0xa000;
    const isDirectory = rawName.endsWith('/');
    if (!isDirectory) {
      if (uncompressedSize > maxEntryUncompressed) throw new KnowledgeEvolutionError('KNOWLEDGE_SNAPSHOT_ENTRY_TOO_LARGE', name);
      total += uncompressedSize;
      if (total > maxTotalUncompressed) throw new KnowledgeEvolutionError('KNOWLEDGE_SNAPSHOT_UNCOMPRESSED_LIMIT_EXCEEDED');
      if (compressedSize > 0 && uncompressedSize / compressedSize > 2000) throw new KnowledgeEvolutionError('KNOWLEDGE_SNAPSHOT_COMPRESSION_RATIO_SUSPICIOUS', name);
    }
    entries.push({ name, method, flags, crc32: expectedCrc, compressed_size: compressedSize, uncompressed_size: uncompressedSize, local_offset: localOffset, is_directory: isDirectory, is_symlink: isSymlink });
    p += 46 + nameLen + extraLen + commentLen;
  }
  function readEntry(entry) {
    if (entry.is_directory) return Buffer.alloc(0);
    if (entry.is_symlink) throw new KnowledgeEvolutionError('KNOWLEDGE_SNAPSHOT_SYMLINK_UNSUPPORTED', entry.name);
    const off = entry.local_offset;
    if (off + 30 > buffer.length || buffer.readUInt32LE(off) !== SIG_LOCAL) throw new KnowledgeEvolutionError('KNOWLEDGE_SNAPSHOT_ZIP_LOCAL_INVALID', entry.name);
    const localFlags = buffer.readUInt16LE(off + 6), localMethod = buffer.readUInt16LE(off + 8);
    const nameLen = buffer.readUInt16LE(off + 26), extraLen = buffer.readUInt16LE(off + 28);
    const localName = safeArchivePath(buffer.subarray(off + 30, off + 30 + nameLen).toString('utf8'));
    if (localName !== entry.name || localMethod !== entry.method || localFlags !== entry.flags) throw new KnowledgeEvolutionError('KNOWLEDGE_SNAPSHOT_ZIP_HEADER_MISMATCH', entry.name);
    const dataStart = off + 30 + nameLen + extraLen, dataEnd = dataStart + entry.compressed_size;
    if (dataEnd > buffer.length) throw new KnowledgeEvolutionError('KNOWLEDGE_SNAPSHOT_ZIP_TRUNCATED', entry.name);
    const compressed = buffer.subarray(dataStart, dataEnd);
    const out = entry.method === 0 ? Buffer.from(compressed) : inflateRawSync(compressed, { maxOutputLength: entry.uncompressed_size + 1 });
    if (out.length !== entry.uncompressed_size) throw new KnowledgeEvolutionError('KNOWLEDGE_SNAPSHOT_SIZE_MISMATCH', entry.name);
    if (crc32(out) !== entry.crc32) throw new KnowledgeEvolutionError('KNOWLEDGE_SNAPSHOT_CRC_MISMATCH', entry.name);
    return out;
  }
  return { entries, readEntry, total_uncompressed_bytes: total };
}
