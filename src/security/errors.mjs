export class SecurityError extends Error {
  constructor(code, message = code, details = null) {
    super(message);
    this.name = 'SecurityError';
    this.code = code;
    this.details = details;
  }
}
