export class KnowledgeHubError extends Error {
  constructor(code, message = code, { status = 400, details } = {}) {
    super(message);
    this.name = 'KnowledgeHubError';
    this.code = code;
    this.status = status;
    if (details !== undefined) this.details = details;
  }
}
