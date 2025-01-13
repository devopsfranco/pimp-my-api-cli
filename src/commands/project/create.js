import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';

export class CreateProjectCommand {
  constructor(config) {
    this.config = config;
  }

  register(program) {
    return program
      .command('create-project')
      .description('Create a new GitHub Projects v2 board with pattern recognition')
      .option('-t, --title <string>', 'Project title', 'PimpMyAPI Development Pipeline')
      .option('-d, --description <string>', 'Project description', 'Pattern Recognition and Evolution System')
      .option('-o, --owner <string>', 'Owner node ID', 'MDQ6VXNlcjExOTg3NzI3')
      .action(this.execute.bind(this));
  }

  async execute(options) {
    const spinner = ora('Creating GitHub Project...').start();

    try {
      // Phase 1: Project Creation
      const mutation = `
        mutation {
          createProjectV2(input: {
            ownerId: "${options.owner}"
            title: "${options.title}"
            description: "${options.description}"
          }) {
            projectV2 {
              id
              title
              url
              number
            }
          }
        }
      `;

      const response = await fetch('https://api.github.com/graphql', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.githubToken}`,
          'Content-Type': 'application/json',
          'X-GitHub-Api-Version': '2022-11-28'
        },
        body: JSON.stringify({ query: mutation })
      });

      const result = await response.json();

      if (result.errors) {
        throw new Error(result.errors[0].message);
      }

      const project = result.data.createProjectV2.projectV2;

      // Success output
      spinner.succeed('Project created successfully!');
      console.log('');
      console.log(chalk.blue('Project Details:'));
      console.log(chalk.gray('Title:'), project.title);
      console.log(chalk.gray('Number:'), `#${project.number}`);
      console.log(chalk.gray('URL:'), project.url);
      console.log('');
      console.log(chalk.blue('Next Steps:'));
      console.log(chalk.gray('1.'), 'Configure project fields:');
      console.log('   $ pimp-api configure-fields', project.id);
      console.log(chalk.gray('2.'), 'Set up project views:');
      console.log('   $ pimp-api configure-views', project.id);
      console.log('');

      return project;

    } catch (error) {
      spinner.fail('Failed to create project');
      console.error('');
      console.error(chalk.red('Error:'), error.message);
      if (error.response) {
        console.error('');
        console.error(chalk.gray('API Response:'), error.response);
      }
      process.exit(1);
    }
  }
}
