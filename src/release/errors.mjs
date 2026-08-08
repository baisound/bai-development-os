export class ReleaseError extends Error {
  constructor(code, message = code, details = undefined) {
    super(message);
    this.name = 'ReleaseError';
    this.code = code;
    if (details !== undefined) this.details = details;
  }
}
