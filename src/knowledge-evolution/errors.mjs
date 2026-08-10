export class KnowledgeEvolutionError extends Error {
  constructor(code, message = code, details = undefined) {
    super(message);
    this.name = 'KnowledgeEvolutionError';
    this.code = code;
    if (details !== undefined) this.details = details;
  }
}
