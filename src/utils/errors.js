export class RetryableError extends Error {
  constructor(message) {
    super(message);
    this.name = 'RetryableError';
  }
}

export class ValidationError extends Error {
  constructor(message, details = []) {
    super(message);
    this.name = 'ValidationError';
    this.details = details;
  }
}

export class WorkerError extends Error {
  constructor(message, context = {}) {
    super(message);
    this.name = 'WorkerError';
    this.context = context;
  }
}
