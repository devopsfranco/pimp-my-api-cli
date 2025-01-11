import { FileManager } from '../utils/fileManager.js';

export class ChunkManager {
  constructor() {
    this.fileManager = new FileManager();
    this.pendingChunks = new Map();
  }

  async writeContentInChunks(path, content) {
    const analysis = this.fileManager.analyzeContent(content);
    
    if (analysis.requiresChunking) {
      console.log(`Content requires chunking (${analysis.chunks} chunks)`);
      return await this.handleChunkedWrite(path, content, analysis);
    }
    
    return await this.fileManager.writeSingleFile(path, content);
  }

  async handleChunkedWrite(path, content, analysis) {
    const operationId = this.generateOperationId();
    const chunks = this.fileManager.splitContent(content, analysis.chunks);

    this.pendingChunks.set(operationId, {
      total: chunks.length,
      completed: 0,
      chunks: new Map()
    });

    const results = [];
    for (let i = 0; i < chunks.length; i++) {
      const result = await this.writeChunk(path, chunks[i], i, operationId);
      results.push(result);
    }

    await this.finalizeChunkedOperation(operationId, path);
    return results;
  }

  async writeChunk(path, content, index, operationId) {
    const chunkPath = this.fileManager.getChunkPath(path, index);
    const result = await this.fileManager.writeSingleFile(chunkPath, content, {
      metadata: {
        operationId,
        index,
        isChunk: true
      }
    });

    this.updateChunkProgress(operationId, index, result);
    return result;
  }

  updateChunkProgress(operationId, index, result) {
    const operation = this.pendingChunks.get(operationId);
    if (operation) {
      operation.chunks.set(index, result);
      operation.completed++;

      if (operation.completed === operation.total) {
        this.handleCompletedOperation(operationId);
      }
    }
  }

  async finalizeChunkedOperation(operationId, originalPath) {
    const operation = this.pendingChunks.get(operationId);
    if (!operation) return;

    const allChunks = Array.from(operation.chunks.values());
    const concatenatedContent = await this.concatenateChunks(allChunks);
    
    // Write the final file
    await this.fileManager.writeSingleFile(originalPath, concatenatedContent, {
      metadata: {
        operationId,
        isComplete: true,
        totalChunks: operation.total
      }
    });

    this.pendingChunks.delete(operationId);
    return concatenatedContent;
  }

  async concatenateChunks(chunks) {
    return chunks
      .sort((a, b) => a.metadata.index - b.metadata.index)
      .map(chunk => chunk.content)
      .join('');
  }

  generateOperationId() {
    return `chunk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getOperationStatus(operationId) {
    const operation = this.pendingChunks.get(operationId);
    if (!operation) return null;

    return {
      total: operation.total,
      completed: operation.completed,
      progress: (operation.completed / operation.total) * 100,
      isComplete: operation.completed === operation.total
    };
  }

  cleanupOperation(operationId) {
    const operation = this.pendingChunks.get(operationId);
    if (!operation) return;

    // Clear chunk files
    operation.chunks.forEach((chunk) => {
      this.fileManager.clearCache(chunk.path);
    });

    this.pendingChunks.delete(operationId);
  }
}
