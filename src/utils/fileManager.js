export class FileManager {
  constructor() {
    this.CHUNK_SIZE = 50000; // Conservative estimate
    this.WARNING_THRESHOLD = 0.8; // 80% of chunk size
    this.fileCache = new Map();
  }

  async writeFile(path, content, options = {}) {
    const analysis = this.analyzeContent(content);
    
    if (analysis.requiresChunking) {
      return await this.writeChunkedFile(path, content, analysis);
    }
    
    return this.writeSingleFile(path, content, options);
  }

  analyzeContent(content) {
    const size = new TextEncoder().encode(content).length;
    return {
      size,
      requiresChunking: size > this.CHUNK_SIZE,
      chunks: Math.ceil(size / this.CHUNK_SIZE),
      approachingLimit: size > (this.CHUNK_SIZE * this.WARNING_THRESHOLD)
    };
  }

  async writeChunkedFile(path, content, analysis) {
    const chunks = this.splitContent(content, analysis.chunks);
    const results = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunkPath = this.getChunkPath(path, i);
      const result = await this.writeSingleFile(chunkPath, chunks[i]);
      results.push(result);

      // Cache the chunk
      this.fileCache.set(chunkPath, {
        content: chunks[i],
        timestamp: Date.now(),
        metadata: { part: i, total: chunks.length }
      });
    }

    return results;
  }

  splitContent(content, numChunks) {
    const chunks = [];
    const chunkSize = Math.ceil(content.length / numChunks);

    for (let i = 0; i < numChunks; i++) {
      const start = i * chunkSize;
      const end = start + chunkSize;
      chunks.push(content.slice(start, end));
    }

    return chunks;
  }

  getChunkPath(originalPath, index) {
    const parts = originalPath.split('.');
    const ext = parts.pop();
    return `${parts.join('.')}.part${index}.${ext}`;
  }

  async writeSingleFile(path, content, options = {}) {
    // Cache the content before writing
    this.fileCache.set(path, {
      content,
      timestamp: Date.now(),
      metadata: options.metadata || {}
    });

    return {
      path,
      size: content.length,
      cached: true,
      timestamp: Date.now()
    };
  }

  isCached(path) {
    return this.fileCache.has(path);
  }

  getCached(path) {
    return this.fileCache.get(path);
  }

  clearCache(olderThan = 3600000) { // 1 hour default
    const now = Date.now();
    for (const [path, data] of this.fileCache.entries()) {
      if (now - data.timestamp > olderThan) {
        this.fileCache.delete(path);
      }
    }
  }
}
