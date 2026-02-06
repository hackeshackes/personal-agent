/**
 * RAG Service - 检索增强生成服务
 * 文档分块、向量化、语义搜索
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class RAGService {
  constructor() {
    this.dataDir = path.join(__dirname, '../../data/rag');
    this.collections = new Map();
    this._ensureDataDir();
    this._loadCollections();
  }

  /**
   * 确保数据目录存在
   */
  _ensureDataDir() {
    const dirs = [this.dataDir, path.join(this.dataDir, 'chunks'), path.join(this.dataDir, 'index')];
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  /**
   * 加载已有集合
   */
  _loadCollections() {
    const configFile = path.join(this.dataDir, 'collections.json');
    
    if (fs.existsSync(configFile)) {
      try {
        const data = JSON.parse(fs.readFileSync(configFile, 'utf8'));
        data.forEach(c => this.collections.set(c.name, c));
      } catch (e) {
        console.error('加载集合失败:', e.message);
      }
    }
  }

  /**
   * 创建集合
   */
  async createCollection(name, description = '') {
    const collection = {
      name,
      description,
      documents: [],
      chunks: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.collections.set(name, collection);
    this._saveCollections();
    
    return { success: true, collection };
  }

  /**
   * 添加文档
   */
  async addDocument(collectionName, content, metadata = {}) {
    const collection = this.collections.get(collectionName);
    
    if (!collection) {
      return { error: '集合不存在', collection: collectionName };
    }

    // 创建文档
    const docId = crypto.randomUUID();
    const document = {
      id: docId,
      content,
      metadata,
      addedAt: Date.now(),
    };

    // 分块
    const chunks = this._chunkContent(content, metadata);
    
    // 向量化 (占位 - 实际应调用 embedding API)
    const embeddings = await this._generateEmbeddings(chunks.map(c => c.text));

    // 添加到集合
    collection.documents.push(document);
    chunks.forEach((chunk, index) => {
      chunk.id = `${docId}-chunk-${index}`;
      chunk.embedding = embeddings[index] || this._randomEmbedding();
      chunk.docId = docId;
      collection.chunks.push(chunk);
    });

    collection.updatedAt = Date.now();
    this._saveCollection(collection);
    
    return {
      success: true,
      documentId: docId,
      chunksCreated: chunks.length,
    };
  }

  /**
   * 批量添加文档
   */
  async addDocuments(collectionName, docs) {
    const results = [];
    
    for (const doc of docs) {
      const result = await this.addDocument(collectionName, doc.content, doc.metadata);
      results.push(result);
    }

    return {
      success: true,
      added: results.filter(r => r.success).length,
      failed: results.filter(r => r.error).length,
    };
  }

  /**
   * 搜索
   */
  async search(collectionName, query, options = {}) {
    const collection = this.collections.get(collectionName);
    
    if (!collection) {
      return { error: '集合不存在', collection: collectionName };
    }

    const { limit = 5, threshold = 0.5 } = options;

    // 生成查询向量
    const queryEmbedding = await this._generateEmbeddings([query]);
    
    // 计算相似度
    const results = collection.chunks.map(chunk => ({
      ...chunk,
      score: this._cosineSimilarity(queryEmbedding, chunk.embedding),
    }));

    // 过滤和排序
    const filtered = results
      .filter(r => r.score >= threshold)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return {
      query,
      results: filtered.map(r => ({
        id: r.id,
        text: r.text,
        score: r.score,
        docId: r.docId,
        metadata: r.metadata,
      })),
      total: filtered.length,
    };
  }

  /**
   * 问答
   */
  async ask(collectionName, question, options = {}) {
    const searchResults = await this.search(collectionName, question, {
      limit: options.contextChunks || 3,
    });

    if (searchResults.error) {
      return searchResults;
    }

    // 构建上下文
    const context = searchResults.results
      .map(r => r.text)
      .join('\n\n---\n\n');

    // 生成答案 (占位 - 实际应调用 LLM)
    const answer = this._generateAnswer(question, context);

    return {
      question,
      answer,
      sources: searchResults.results.map(r => ({
        id: r.id,
        score: r.score,
        text: r.text.substring(0, 100) + '...',
      })),
    };
  }

  /**
   * 列出集合
   */
  async listCollections() {
    return Array.from(this.collections.values()).map(c => ({
      name: c.name,
      description: c.description,
      documentCount: c.documents.length,
      chunkCount: c.chunks.length,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));
  }

  /**
   * 获取集合详情
   */
  async getCollection(collectionName) {
    const collection = this.collections.get(collectionName);
    
    if (!collection) {
      return { error: '集合不存在', collection: collectionName };
    }

    return {
      ...collection,
      documents: collection.documents.map(d => ({
        id: d.id,
        metadata: d.metadata,
        addedAt: d.addedAt,
      })),
    };
  }

  /**
   * 删除集合
   */
  async deleteCollection(collectionName) {
    if (!this.collections.has(collectionName)) {
      return { error: '集合不存在', collection: collectionName };
    }

    this.collections.delete(collectionName);
    this._saveCollections();
    
    // 删除相关文件
    const chunksDir = path.join(this.dataDir, 'chunks', collectionName);
    if (fs.existsSync(chunksDir)) {
      fs.rmSync(chunksDir, { recursive: true });
    }

    return { success: true, deleted: collectionName };
  }

  /**
   * 获取集合统计
   */
  async getStats(collectionName) {
    const collection = this.collections.get(collectionName);
    
    if (!collection) {
      return { error: '集合不存在' };
    }

    return {
      collection: collectionName,
      documents: collection.documents.length,
      chunks: collection.chunks.length,
      avgChunksPerDoc: collection.documents.length > 0 
        ? (collection.chunks.length / collection.documents.length).toFixed(1)
        : 0,
      createdAt: collection.createdAt,
      updatedAt: collection.updatedAt,
    };
  }

  /**
   * 内容分块
   */
  _chunkContent(content, metadata = {}) {
    const chunks = [];
    const chunkSize = 500;
    const overlap = 50;
    
    // 清理内容
    const cleanContent = content
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    // 按段落分块
    const paragraphs = cleanContent.split(/\n\n+/);
    
    let currentChunk = '';
    
    for (const para of paragraphs) {
      if (currentChunk.length + para.length < chunkSize) {
        currentChunk += para + '\n\n';
      } else {
        if (currentChunk.trim()) {
          chunks.push({
            text: currentChunk.trim(),
            metadata: { ...metadata, chunkIndex: chunks.length },
          });
        }
        
        // 处理长段落
        if (para.length > chunkSize) {
          const subChunks = this._chunkLongText(para, chunkSize, overlap);
          chunks.push(...subChunks.map((text, i) => ({
            text,
            metadata: { ...metadata, chunkIndex: chunks.length + i },
          })));
          currentChunk = '';
        } else {
          currentChunk = para + '\n\n';
        }
      }
    }

    // 添加最后一块
    if (currentChunk.trim()) {
      chunks.push({
        text: currentChunk.trim(),
        metadata: { ...metadata, chunkIndex: chunks.length },
      });
    }

    return chunks;
  }

  /**
   * 分块长文本
   */
  _chunkLongText(text, size, overlap) {
    const chunks = [];
    let i = 0;
    
    while (i < text.length) {
      chunks.push(text.substring(i, i + size));
      i += size - overlap;
    }
    
    return chunks;
  }

  /**
   * 生成向量 (占位)
   */
  async _generateEmbeddings(texts) {
    // 实际应调用 BGE 或 OpenAI Embedding API
    return texts.map(() => this._randomEmbedding());
  }

  /**
   * 生成随机向量 (测试用)
   */
  _randomEmbedding() {
    const vector = [];
    for (let i = 0; i < 384; i++) {
      vector.push(Math.random() * 2 - 1);
    }
    return this._normalize(vector);
  }

  /**
   * 向量归一化
   */
  _normalize(vector) {
    const norm = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
    return vector.map(v => v / norm);
  }

  /**
   * 余弦相似度
   */
  _cosineSimilarity(a, b) {
    if (!a || !b || a.length !== b.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * 生成答案 (占位)
   */
  _generateAnswer(question, context) {
    return `根据检索到的内容，无法直接回答"${question}"。\n\n建议：\n1. 扩充知识库文档\n2. 调整搜索阈值\n3. 改写问题使其更具体`;
  }

  /**
   * 保存集合配置
   */
  _saveCollections() {
    const configFile = path.join(this.dataDir, 'collections.json');
    const data = Array.from(this.collections.values()).map(c => ({
      name: c.name,
      description: c.description,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));
    fs.writeFileSync(configFile, JSON.stringify(data, null, 2));
  }

  /**
   * 保存单个集合
   */
  _saveCollection(collection) {
    const chunksDir = path.join(this.dataDir, 'chunks', collection.name);
    if (!fs.existsSync(chunksDir)) {
      fs.mkdirSync(chunksDir, { recursive: true });
    }

    const chunksFile = path.join(chunksDir, 'chunks.json');
    fs.writeFileSync(chunksFile, JSON.stringify(collection.chunks, null, 2));
  }
}

module.exports = { RAGService };
