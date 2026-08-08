export class ConformanceError extends Error {
  constructor(code, message = code, details = null) {
    super(message);
    this.name = 'ConformanceError';
    this.code = code;
    this.details = details;
  }
}
