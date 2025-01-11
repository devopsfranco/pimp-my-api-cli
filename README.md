# PimpMyAPI CLI

Command-line interface for the PimpMyAPI system, providing advanced API enhancement capabilities with pattern recognition and evolution tracking.

## Installation

```bash
npm install -g pimp-my-api-cli
```

## Configuration

Create a `.env` file with your configuration:

```env
QDRANT_URL=your_qdrant_url
QDRANT_API_KEY=your_qdrant_api_key
WORKER_URL=your_cloudflare_worker_url
WORKER_TOKEN=your_worker_token
```

## Usage

### Enhance API Specification

```bash
pimp-api enhance path/to/api.json -o enhanced-api.json
```

Enhances an OpenAPI specification with advanced patterns and optimizations.

### Analyze Patterns

```bash
pimp-api analyze path/to/patterns.json -d 5
```

Analyzes API patterns with specified depth of recursion.

### Evolve Patterns

```bash
pimp-api evolve pattern-id-123 -s optimization
```

Evolves a specific pattern using the specified strategy.

## Features

- API specification enhancement
- Pattern recognition and analysis
- Evolution tracking
- Integration with Qdrant for pattern storage
- Cloudflare Workers integration

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Run tests
npm test

# Run linting
npm run lint
```

## Architecture

The CLI interfaces with several Cloudflare Workers:

- `pimp-my-api`: Main API enhancement worker
- `pattern-evolution`: Pattern evolution and analysis
- `pattern-storage`: Pattern storage and optimization
- `recursive-orchestrator`: System coordination

Pattern storage is handled by Qdrant, providing vector search capabilities for pattern matching and evolution.

## License

MIT
