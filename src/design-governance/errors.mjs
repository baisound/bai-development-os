export class DesignGovernanceError extends Error {
  constructor(code, message = code, details = {}) {
    super(message);
    this.name = 'DesignGovernanceError';
    this.code = code;
    this.details = Object.freeze(structuredClone(details));
  }
}
