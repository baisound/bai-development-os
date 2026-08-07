export class CostGuardError extends Error {
  constructor(code, message = code) { super(message); this.name = 'CostGuardError'; this.code = code; }
}
