export class DistributedError extends Error {
  constructor(code, message = code, details = null) {
    super(message === code ? code : `${code}: ${message}`);
    this.name = 'DistributedError';
    this.code = code;
    this.details = details;
  }
}
