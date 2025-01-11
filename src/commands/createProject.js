import { Command } from 'commander';
import { ChunkManager } from '../managers/chunkManager.js';
import { EvolutionMetrics } from '../metrics/evolutionMetrics.js';

export class CreateProjectCommand {
  constructor(config) {
    this.config = config;
    this.chunkManager = new ChunkManager();
    this.metrics = new EvolutionMetrics();
  }

  register(program) {
    const command = new Command('create-project')
      .description('Create a new GitHub Project with pattern optimization')
      .argument('<title>', 'Project title')
      .option('-d, --description <text>', 'Project description')
      .option('-t, --template <name>', 'Project template (basic, agile, bug-tracking)', 'basic')
      .option('-p, --pattern <name>', 'Base pattern to apply')
      .option('--evolution', 'Enable pattern evolution tracking')
      .action(this.execute.bind(this));

    program.addCommand(command);
  }

  async execute(title, options) {
    console.log('Creating project with pattern recognition...');

    try {
      // Phase 1: Pattern Analysis
      const patterns = await this.analyzePatterns(title, options);
      console.log('Pattern analysis complete. Confidence:', patterns.confidence);

      // Phase 2: Project Creation
      const response = await fetch(`${this.config.bridgeUrl}/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `token ${this.config.githubToken}`
        },
        body: JSON.stringify({
          title,
          description: options.description,
          template: options.template,
          patterns: patterns
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to create project: ${response.statusText}`);
      }

      const result = await response.json();

      // Phase 3: Pattern Evolution
      if (options.evolution) {
        await this.trackEvolution(result, patterns);
        console.log('Pattern evolution tracking enabled');
      }

      // Phase 4: Success Analysis
      await this.analyzeSuccess(result, patterns);

      console.log('\nProject created successfully!');
      console.log('URL:', result.projectV2.url);
      console.log('\nOptimization Metrics:');
      console.log('Pattern Confidence:', patterns.confidence.toFixed(2));
      console.log('Evolution Potential:', result.meta.evolution.adaptability.toFixed(2));

      // Display strategic recommendations
      console.log('\nStrategic Recommendations:');
      result.meta.recommendations.immediate.forEach(rec => {
        console.log(`- ${rec}`);
      });

      return result;

    } catch (error) {
      console.error('Error creating project:', error.message);
      throw error;
    }
  }

  async analyzePatterns(title, options) {
    const basePattern = options.pattern || 'default';
    const analysis = {
      title,
      description: options.description,
      template: options.template,
      base: basePattern
    };

    // Level 1: Pattern Recognition
    const recognized = await this.recognizePatterns(analysis);
    
    // Level 2: Pattern Enhancement
    const enhanced = await this.enhancePatterns(recognized);
    
    // Level 3: Strategy Formation
    const strategy = await this.formStrategy(enhanced);
    
    // Level 4: Optimization
    return await this.optimizePatterns(strategy);
  }

  async trackEvolution(result, patterns) {
    const evolution = {
      projectId: result.projectV2.id,
      patterns: patterns,
      timestamp: Date.now(),
      metrics: await this.metrics.collectMetrics(patterns)
    };

    // Cache evolution data
    await this.chunkManager.writeContentInChunks(
      `evolution_${result.projectV2.id}.json`,
      JSON.stringify(evolution)
    );

    return evolution;
  }

  async analyzeSuccess(result, patterns) {
    const metrics = {
      creation: {
        success: true,
        timestamp: Date.now()
      },
      patterns: {
        confidence: patterns.confidence,
        coverage: this.calculatePatternCoverage(patterns),
        potential: this.calculateEvolutionPotential(patterns)
      },
      evolution: {
        adaptability: result.meta.evolution.adaptability,
        optimization: result.meta.evolution.optimization
      }
    };

    // Store success metrics
    await this.chunkManager.writeContentInChunks(
      `metrics_${result.projectV2.id}.json`,
      JSON.stringify(metrics)
    );

    return metrics;
  }

  // Pattern Analysis Methods
  async recognizePatterns(analysis) {
    return {
      structural: this.recognizeStructuralPatterns(analysis),
      behavioral: await this.recognizeBehavioralPatterns(analysis),
      evolutionary: this.recognizeEvolutionaryPatterns(analysis),
      strategic: await this.recognizeStrategicPatterns(analysis)
    };
  }

  calculatePatternCoverage(patterns) {
    const weights = {
      structural: 0.3,
      behavioral: 0.3,
      evolutionary: 0.2,
      strategic: 0.2
    };

    return Object.entries(weights).reduce((coverage, [key, weight]) => {
      return coverage + (this.calculateComponentCoverage(patterns[key]) * weight);
    }, 0);
  }

  calculateEvolutionPotential(patterns) {
    return {
      immediate: this.calculateImmediatePotential(patterns),
      shortTerm: this.calculateShortTermPotential(patterns),
      longTerm: this.calculateLongTermPotential(patterns)
    };
  }
}
