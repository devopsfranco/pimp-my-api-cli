import chalk from 'chalk';
import { RetryableError, ValidationError, WorkerError } from './errors.js';

export class ErrorHandler {
  constructor(options = {}) {
    this.maxRetries = options.maxRetries || 3;
    this.baseDelay = options.baseDelay || 1000;
    this.maxDelay = options.maxDelay || 10000;
  }

  async withRetry(operation, context = {}) {
    let lastError;
    let delay = this.baseDelay;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        if (!this.isRetryable(error)) {
          throw this.enhanceError(error, context);
        }

        if (attempt === this.maxRetries) {
          throw this.enhanceError(
            new Error(`Operation failed after ${this.maxRetries} attempts: ${error.message}`),
            { ...context, finalAttempt: true }
          );
        }

        console.warn(chalk.yellow(`Attempt ${attempt} failed, retrying in ${delay}ms...`));
        await this.sleep(delay);
        delay = Math.min(delay * 2, this.maxDelay);
      }
    }
  }

  isRetryable(error) {
    if (error instanceof RetryableError) return true;
    if (error instanceof ValidationError) return false;
    if (error.status >= 500) return true;
    if (error.code === 'ECONNRESET') return true;
    if (error.code === 'ETIMEDOUT') return true;
    return false;
  }

  enhanceError(error, context) {
    const enhanced = error instanceof WorkerError ? error : new WorkerError(error.message);
    enhanced.context = context;
    enhanced.timestamp = Date.now();
    return enhanced;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Specific error handlers
  handleWorkerError(error) {
    console.error(chalk.red('Worker Error:'), error.message);
    if (error.context) {
      console.error(chalk.gray('Context:'), JSON.stringify(error.context, null, 2));
    }
    process.exit(1);
  }

  handleValidationError(error) {
    console.error(chalk.red('Validation Error:'), error.message);
    if (error.details) {
      console.error(chalk.gray('Details:'));
      error.details.forEach(detail => {
        console.error(chalk.gray(`- ${detail}`));
      });
    }
    process.exit(1);
  }

  handleUnexpectedError(error) {
    console.error(chalk.red('Unexpected Error:'), error.message);
    console.error(chalk.gray('Stack:'), error.stack);
    process.exit(1);
  }
}
