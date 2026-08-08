export class CalibrationError extends Error {
  constructor(code, message = code, details = null) {
    super(message === code ? code : `${code}: ${message}`);
    this.name = 'CalibrationError';
    this.code = code;
    this.details = details;
  }
}
