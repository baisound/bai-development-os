export class KnowledgeError extends Error {
  constructor(code, message = code, details = undefined) {
    super(message);
    this.name = 'KnowledgeError';
    this.code = code;
    if (details !== undefined) this.details = details;
  }
}
