#!/usr/bin/env node

import { Command } from 'commander';
import { CreateProjectCommand } from '../src/commands/project/create.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Configuration validation
if (!process.env.GITHUB_TOKEN) {
  console.error('Error: GITHUB_TOKEN environment variable is required');
  process.exit(1);
}

// CLI Configuration
const config = {
  githubToken: process.env.GITHUB_TOKEN
};

// Initialize Commander
const program = new Command();

// Setup base program
program
  .name('pimp-api')
  .description('CLI for advanced API development with pattern recognition')
  .version('1.0.0');

// Register commands
const createProject = new CreateProjectCommand(config);
createProject.register(program);

// Parse and execute
program.parse(process.argv);
