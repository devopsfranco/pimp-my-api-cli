#!/usr/bin/env node

import { Command } from 'commander';
import dotenv from 'dotenv';
import { QdrantClient } from '@qdrant/js-client-rest';
import chalk from 'chalk';
import ora from 'ora';
import fetch from 'node-fetch';

dotenv.config();

class PimpApi {
  constructor() {
    this.program = new Command();
    this.qdrant = new QdrantClient({
      url: process.env.QDRANT_URL,
      apiKey: process.env.QDRANT_API_KEY
    });
  }

  async initialize() {
    this.program
      .name('pimp-api')
      .description('CLI for the PimpMyAPI system')
      .version('1.0.0');

    // Add commands
    this.program
      .command('enhance')
      .description('Enhance an API specification')
      .argument('<file>', 'Path to OpenAPI specification file')
      .option('-o, --output <file>', 'Output file for enhanced specification')
      .action(this.handleEnhance.bind(this));

    this.program
      .command('analyze')
      .description('Analyze API patterns')
      .argument('<file>', 'Path to API specification or pattern file')
      .option('-d, --depth <number>', 'Analysis depth', '3')
      .action(this.handleAnalyze.bind(this));

    this.program
      .command('evolve')
      .description('Evolve API patterns')
      .argument('<patternId>', 'Pattern ID to evolve')
      .option('-s, --strategy <type>', 'Evolution strategy')
      .action(this.handleEvolve.bind(this));

    this.program.parse();
  }

  async handleEnhance(file, options) {
    const spinner = ora('Enhancing API specification...').start();

    try {
      // Call pimp-my-api worker
      const response = await fetch(`${process.env.WORKER_URL}/pimp-my-api`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.WORKER_TOKEN}`
        },
        body: JSON.stringify({
          operation: 'enhance',
          spec: await this.readFile(file)
        })
      });

      if (!response.ok) {
        throw new Error(`Enhancement failed: ${response.statusText}`);
      }

      const result = await response.json();

      // Store patterns in Qdrant
      await this.storePatterns(result.patterns);

      spinner.succeed('API specification enhanced successfully');
      
      if (options.output) {
        await this.writeFile(options.output, result.enhanced);
        console.log(chalk.green(`Enhanced specification written to ${options.output}`));
      } else {
        console.log(JSON.stringify(result.enhanced, null, 2));
      }
    } catch (error) {
      spinner.fail(`Enhancement failed: ${error.message}`);
      process.exit(1);
    }
  }

  async handleAnalyze(file, options) {
    const spinner = ora('Analyzing API patterns...').start();

    try {
      // Call pattern-evolution worker
      const response = await fetch(`${process.env.WORKER_URL}/pattern-evolution`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.WORKER_TOKEN}`
        },
        body: JSON.stringify({
          operation: 'analyze',
          patterns: await this.readFile(file),
          depth: parseInt(options.depth)
        })
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.statusText}`);
      }

      const result = await response.json();

      spinner.succeed('Analysis completed successfully');
      console.log(JSON.stringify(result, null, 2));
    } catch (error) {
      spinner.fail(`Analysis failed: ${error.message}`);
      process.exit(1);
    }
  }

  async handleEvolve(patternId, options) {
    const spinner = ora('Evolving pattern...').start();

    try {
      // Get pattern from Qdrant
      const pattern = await this.qdrant.retrieve('patterns', patternId);

      // Call pattern-evolution worker
      const response = await fetch(`${process.env.WORKER_URL}/pattern-evolution`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.WORKER_TOKEN}`
        },
        body: JSON.stringify({
          operation: 'evolve',
          pattern,
          strategy: options.strategy
        })
      });

      if (!response.ok) {
        throw new Error(`Evolution failed: ${response.statusText}`);
      }

      const result = await response.json();

      // Store evolved pattern
      await this.storePatterns([result]);

      spinner.succeed('Pattern evolved successfully');
      console.log(JSON.stringify(result, null, 2));
    } catch (error) {
      spinner.fail(`Evolution failed: ${error.message}`);
      process.exit(1);
    }
  }

  async storePatterns(patterns) {
    try {
      for (const pattern of patterns) {
        await this.qdrant.upsert('patterns', {
          wait: true,
          points: [{
            id: pattern.id,
            vector: pattern.embedding,
            payload: pattern
          }]
        });
      }
    } catch (error) {
      console.error('Pattern storage failed:', error);
      throw error;
    }
  }

  async readFile(path) {
    try {
      return JSON.parse(await fs.readFile(path, 'utf8'));
    } catch (error) {
      throw new Error(`Failed to read file ${path}: ${error.message}`);
    }
  }

  async writeFile(path, content) {
    try {
      await fs.writeFile(path, JSON.stringify(content, null, 2));
    } catch (error) {
      throw new Error(`Failed to write file ${path}: ${error.message}`);
    }
  }
}

// Run CLI
const cli = new PimpApi();
cli.initialize().catch(error => {
  console.error(chalk.red(`Initialization failed: ${error.message}`));
  process.exit(1);
});
