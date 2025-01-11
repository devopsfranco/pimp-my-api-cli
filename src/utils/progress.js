import ora from 'ora';
import chalk from 'chalk';
import cliProgress from 'cli-progress';

export class ProgressTracker {
  constructor() {
    this.spinner = null;
    this.steps = new Map();
    this.currentStep = null;
    this.startTime = null;
    this.multibar = new cliProgress.MultiBar({
      clearOnComplete: false,
      hideCursor: true,
      format: ' {bar} | {percentage}% | {value}/{total} | {step}'
    });
  }

  start(operation) {
    this.startTime = Date.now();
    this.spinner = ora(operation).start();
    console.log(chalk.blue('\n🚀 Starting operation:', operation));
  }

  addStep(id, description, total = 100) {
    const bar = this.multibar.create(total, 0, { step: description });
    this.steps.set(id, {
      id,
      description,
      status: 'pending',
      startTime: null,
      endTime: null,
      duration: null,
      error: null,
      progress: 0,
      total,
      bar
    });
  }

  updateProgress(id, value, total = null) {
    const step = this.steps.get(id);
    if (!step) throw new Error(`Unknown step: ${id}`);

    if (total !== null) {
      step.total = total;
      step.bar.setTotal(total);
    }

    step.progress = value;
    step.bar.update(value, { step: `${step.description}... ${this.formatProgress(value, step.total)}` });
  }

  startStep(id) {
    const step = this.steps.get(id);
    if (!step) throw new Error(`Unknown step: ${id}`);

    step.status = 'running';
    step.startTime = Date.now();
    this.currentStep = step;

    step.bar.update(0, { step: `${step.description}... Starting` });
  }

  completeStep(id, result = {}) {
    const step = this.steps.get(id);
    if (!step) throw new Error(`Unknown step: ${id}`);

    step.status = 'completed';
    step.endTime = Date.now();
    step.duration = step.endTime - step.startTime;
    step.result = result;

    step.bar.update(step.total, { step: `${step.description} ✓ (${this.formatDuration(step.duration)})` });
    this.logStepDetails(step);
  }

  failStep(id, error) {
    const step = this.steps.get(id);
    if (!step) throw new Error(`Unknown step: ${id}`);

    step.status = 'failed';
    step.endTime = Date.now();
    step.duration = step.endTime - step.startTime;
    step.error = error;

    step.bar.update(step.progress, { step: `${step.description} ✗ Error: ${error.message}` });
    this.logStepError(step);
  }

  complete() {
    const totalDuration = Date.now() - this.startTime;
    this.multibar.stop();
    console.log('\n' + chalk.green('✨ Operation completed successfully'));
    console.log(chalk.gray(`Total duration: ${this.formatDuration(totalDuration)}`));
    this.logSummary();
  }

  fail(error) {
    const totalDuration = Date.now() - this.startTime;
    this.multibar.stop();
    console.log('\n' + chalk.red('❌ Operation failed'));
    console.log(chalk.gray(`Total duration: ${this.formatDuration(totalDuration)}`));
    console.error(chalk.red('Error:'), error.message);
    this.logSummary();
  }

  formatProgress(value, total) {
    const percentage = Math.round((value / total) * 100);
    return `${value}/${total} (${percentage}%)`;
  }

  formatDuration(ms) {
    if (ms < 1000) return `${ms}ms`;
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  logStepDetails(step) {
    if (step.result && Object.keys(step.result).length > 0) {
      console.log(chalk.gray('  Results:'));
      Object.entries(step.result).forEach(([key, value]) => {
        console.log(chalk.gray(`    ├─ ${key}: ${value}`));
      });
    }
  }

  logStepError(step) {
    console.log(chalk.red('  Error details:'));
    console.log(chalk.red(`    ├─ Message: ${step.error.message}`));
    if (step.error.stack) {
      console.log(chalk.gray(`    └─ Stack: ${step.error.stack.split('\n').slice(1).join('\n        ')}`));
    }
  }

  logSummary() {
    console.log('\n' + chalk.blue('📊 Operation Summary:'));
    
    const stats = {
      total: this.steps.size,
      completed: 0,
      failed: 0,
      pending: 0
    };

    this.steps.forEach(step => {
      const status = this.getStepStatusIcon(step.status);
      const duration = step.duration ? ` (${this.formatDuration(step.duration)})` : '';
      console.log(`${status} ${step.description}${duration}`);
      stats[step.status === 'completed' ? 'completed' : 
            step.status === 'failed' ? 'failed' : 'pending']++;
    });

    console.log('\n' + chalk.blue('📈 Statistics:'));
    console.log(chalk.gray(`Total Steps: ${stats.total}`));
    console.log(chalk.green(`Completed: ${stats.completed}`));
    console.log(chalk.red(`Failed: ${stats.failed}`));
    if (stats.pending > 0) {
      console.log(chalk.yellow(`Pending: ${stats.pending}`));
    }
  }

  getStepStatusIcon(status) {
    switch (status) {
      case 'completed': return chalk.green('✓');
      case 'failed': return chalk.red('✗');
      case 'running': return chalk.yellow('⟳');
      default: return chalk.gray('○');
    }
  }
}
