export class MaintenanceError extends Error {
  constructor(code, message = code, details = null) {
    super(message);
    this.name = 'MaintenanceError';
    this.code = code;
    if (details !== null) this.details = details;
  }
}
