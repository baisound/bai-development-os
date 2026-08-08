export class ExtensionError extends Error {
  constructor(code, message = code, details = null) {
    super(message); this.name='ExtensionError'; this.code=code; this.details=details;
  }
}
