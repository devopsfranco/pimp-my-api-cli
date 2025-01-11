import { Command } from 'commander';
import { ProjectManager } from '../managers/projectManager.js';
import { ProgressTracker } from '../utils/progress.js';

export class ProjectCommand {
  constructor(config) {
    this.config = config;
    this.manager = new ProjectManager(config);
    this.progress = new ProgressTracker();
  }

  register(program) {
    const command = new Command('project')
      .description('Manage GitHub Projects with agile workflow');

    command
      .command('create')
      .description('Create a new agile project')
      .argument('<name>', 'Project name')
      .option('-d, --description <text>', 'Project description')
      .option('-t, --template <name>', 'Project template', 'agile-basic')
      .action(this.handleCreate.bind(this));

    command
      .command('setup-backlog')
      .description('Set up project backlog structure')
      .argument('<projectId>', 'Project ID')
      .option('-l, --labels', 'Create standard agile labels')
      .option('-m, --milestones', 'Create sprint milestones')
      .action(this.handleBacklogSetup.bind(this));

    command
      .command('sprint')
      .description('Manage sprint operations')
      .argument('<projectId>', 'Project ID')
      .argument('<action>', 'Sprint action: create, start, end')
      .option('-n, --number <number>', 'Sprint number')
      .option('-d, --duration <days>', 'Sprint duration in days', '14')
      .action(this.handleSprint.bind(this));

    program.addCommand(command);
  }

  async handleCreate(name, options) {
    this.progress.start('Creating new agile project');

    try {
      // Phase 1: Project Creation
      this.progress.addStep('creation', 'Creating base project');
      this.progress.startStep('creation');
      const project = await this.manager.createProject(name, options);
      this.progress.completeStep('creation', {
        'Project ID': project.id,
        'URL': project.url
      });

      // Phase 2: Template Application
      this.progress.addStep('template', 'Applying agile template');
      this.progress.startStep('template');
      await this.manager.applyTemplate(project.id, options.template);
      this.progress.completeStep('template');

      // Phase 3: Automation Setup
      this.progress.addStep('automation', 'Setting up automations');
      this.progress.startStep('automation');
      await this.manager.setupAutomations(project.id);
      this.progress.completeStep('automation');

      this.progress.complete();
      return project;

    } catch (error) {
      this.progress.fail(error);
      throw error;
    }
  }

  async handleBacklogSetup(projectId, options) {
    this.progress.start('Setting up project backlog');

    try {
      // Phase 1: Label Creation
      if (options.labels) {
        this.progress.addStep('labels', 'Creating agile labels');
        this.progress.startStep('labels');
        await this.manager.createAgileLabels(projectId);
        this.progress.completeStep('labels');
      }

      // Phase 2: Milestone Creation
      if (options.milestones) {
        this.progress.addStep('milestones', 'Creating sprint milestones');
        this.progress.startStep('milestones');
        await this.manager.createSprintMilestones(projectId);
        this.progress.completeStep('milestones');
      }

      // Phase 3: Column Setup
      this.progress.addStep('columns', 'Setting up backlog columns');
      this.progress.startStep('columns');
      await this.manager.setupBacklogColumns(projectId);
      this.progress.completeStep('columns');

      // Phase 4: Automation Rules
      this.progress.addStep('rules', 'Configuring automation rules');
      this.progress.startStep('rules');
      await this.manager.setupBacklogAutomation(projectId);
      this.progress.completeStep('rules');

      this.progress.complete();

    } catch (error) {
      this.progress.fail(error);
      throw error;
    }
  }

  async handleSprint(projectId, action, options) {
    this.progress.start(`Managing sprint: ${action}`);

    try {
      switch (action) {
        case 'create':
          await this.createSprint(projectId, options);
          break;
        case 'start':
          await this.startSprint(projectId, options);
          break;
        case 'end':
          await this.endSprint(projectId, options);
          break;
        default:
          throw new Error(`Unknown sprint action: ${action}`);
      }

      this.progress.complete();

    } catch (error) {
      this.progress.fail(error);
      throw error;
    }
  }

  // Sprint Management Methods
  async createSprint(projectId, options) {
    const { number, duration } = options;

    this.progress.addStep('creation', 'Creating new sprint');
    this.progress.startStep('creation');
    const sprint = await this.manager.createSprint(projectId, number, duration);
    this.progress.completeStep('creation', {
      'Sprint Number': sprint.number,
      'Duration': `${duration} days`,
      'Start Date': sprint.startDate
    });
  }

  async startSprint(projectId, options) {
    const { number } = options;

    this.progress.addStep('start', 'Starting sprint');
    this.progress.startStep('start');
    const sprint = await this.manager.startSprint(projectId, number);
    this.progress.completeStep('start', {
      'Sprint Number': sprint.number,
      'Started At': sprint.startedAt,
      'End Date': sprint.endDate
    });
  }

  async endSprint(projectId, options) {
    const { number } = options;

    // Phase 1: Sprint Completion
    this.progress.addStep('completion', 'Completing sprint');
    this.progress.startStep('completion');
    const sprint = await this.manager.endSprint(projectId, number);
    this.progress.completeStep('completion', {
      'Sprint Number': sprint.number,
      'Completed At': sprint.completedAt,
      'Velocity': sprint.velocity
    });

    // Phase 2: Sprint Review
    this.progress.addStep('review', 'Generating sprint review');
    this.progress.startStep('review');
    const review = await this.manager.generateSprintReview(projectId, number);
    this.progress.completeStep('review', {
      'Completed Stories': review.completedStories,
      'Story Points': review.storyPoints,
      'Blockers': review.blockers
    });
  }
}
