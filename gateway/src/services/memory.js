/**
 * Memory System - 记忆系统
 * 短期记忆、长期记忆、情景记忆
 */

const fs = require('fs');
const path = require('path');

class MemorySystem {
  constructor() {
    this.dataDir = path.join(__dirname, '../../data/memory');
    this._ensureDataDir();
    
    // 各类记忆
    this.shortTerm = new Map();     // 当前会话 (内存)
    this.longTerm = new Map();       // 持久化长期记忆
    this.episodic = [];              // 情景记忆 (事件序列)
    this.semantic = new Map();       // 语义记忆 (事实知识)
    
    // 配置
    this.config = {
      shortTermMaxItems: 50,       // 短期记忆最大条目
      longTermMaxItems: 1000,      // 长期记忆最大条目
      episodicMaxItems: 500,       // 情景记忆最大条目
      relevanceThreshold: 0.7,     // 相关性阈值
      decayTime: 24 * 60 * 60 * 1000, // 24小时衰减
    };
    
    this._loadAllMemories();
  }

  /**
   * 确保目录存在
   */
  _ensureDataDir() {
    const dirs = [this.dataDir, path.join(this.dataDir, 'longterm'), path.join(this.dataDir, 'episodic'), path.join(this.dataDir, 'semantic')];
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  /**
   * 加载所有记忆
   */
  _loadAllMemories() {
    this._loadLongTerm();
    this._loadEpisodic();
    this._loadSemantic();
    console.log('📚 记忆系统已加载');
  }

  /**
   * ========== 短期记忆 ==========
   */

  /**
   * 添加短期记忆
   */
  addShortTerm(key, value, metadata = {}) {
    const item = {
      key,
      value,
      metadata,
      timestamp: Date.now(),
      accessCount: 0,
    };

    this.shortTerm.set(key, item);
    this._maintainShortTerm();
    
    return { success: true, key };
  }

  /**
   * 获取短期记忆
   */
  getShortTerm(key) {
    const item = this.shortTerm.get(key);
    
    if (item) {
      item.accessCount++;
      item.lastAccess = Date.now();
    }
    
    return item;
  }

  /**
   * 获取所有短期记忆
   */
  getAllShortTerm() {
    return Array.from(this.shortTerm.values())
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * 清除短期记忆
   */
  clearShortTerm() {
    this.shortTerm.clear();
    return { success: true };
  }

  /**
   * 维护短期记忆容量
   */
  _maintainShortTerm() {
    if (this.shortTerm.size > this.config.shortTermMaxItems) {
      // 删除最少访问的条目
      const items = Array.from(this.shortTerm.values());
      items.sort((a, b) => a.accessCount - b.accessCount);
      
      for (let i = 0; i < 10; i++) {
        this.shortTerm.delete(items[i].key);
      }
    }
  }

  /**
   * ========== 长期记忆 ==========
   */

  /**
   * 保存到长期记忆
   */
  saveToLongTerm(key, value, importance = 5, metadata = {}) {
    const item = {
      key,
      value,
      importance: Math.min(10, Math.max(1, importance)),
      metadata,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      accessCount: 0,
    };

    this.longTerm.set(key, item);
    this._saveLongTerm(key, item);
    
    return { success: true, key };
  }

  /**
   * 获取长期记忆
   */
  getLongTerm(key) {
    const item = this.longTerm.get(key);
    
    if (item) {
      item.accessCount++;
      item.lastAccess = Date.now();
      this._saveLongTerm(key, item);
    }
    
    return item;
  }

  /**
   * 搜索长期记忆
   */
  searchLongTerm(query) {
    const results = [];
    const lowerQuery = query.toLowerCase();

    this.longTerm.forEach((item, key) => {
      const keyMatch = key.toLowerCase().includes(lowerQuery);
      const valueMatch = String(item.value).toLowerCase().includes(lowerQuery);
      
      if (keyMatch || valueMatch) {
        results.push({
          key: item.key,
          value: item.value,
          importance: item.importance,
          matchType: keyMatch ? 'key' : 'content',
        });
      }
    });

    // 按重要性排序
    results.sort((a, b) => b.importance - a.importance);
    
    return results.slice(0, 10);
  }

  /**
   * 删除长期记忆
   */
  deleteLongTerm(key) {
    this.longTerm.delete(key);
    
    const file = path.join(this.dataDir, 'longterm', `${key}.json`);
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
    }
    
    return { success: true, key };
  }

  /**
   * 获取所有长期记忆
   */
  getAllLongTerm() {
    return Array.from(this.longTerm.values())
      .sort((a, b) => b.importance - a.importance);
  }

  /**
   * ========== 情景记忆 ==========
   */

  /**
   * 记录情景
   */
  recordEpisode(episodeType, content, metadata = {}) {
    const episode = {
      id: `ep-${Date.now()}`,
      type: episodeType,
      content,
      metadata,
      timestamp: Date.now(),
    };

    this.episodic.push(episode);
    this._saveEpisodic(episode);
    this._maintainEpisodic();
    
    return { success: true, episodeId: episode.id };
  }

  /**
   * 获取最近情景
   */
  getRecentEpisodes(limit = 10) {
    return this.episodic
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * 搜索情景
   */
  searchEpisodes(query) {
    const lowerQuery = query.toLowerCase();
    
    return this.episodic
      .filter(ep => {
        const contentMatch = String(ep.content).toLowerCase().includes(lowerQuery);
        const typeMatch = ep.type.toLowerCase().includes(lowerQuery);
        return contentMatch || typeMatch;
      })
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * 按类型获取情景
   */
  getEpisodesByType(type, limit = 50) {
    return this.episodic
      .filter(ep => ep.type === type)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * ========== 语义记忆 ==========
   */

  /**
   * 保存事实知识
   */
  saveFact(fact, category = 'general', confidence = 0.8) {
    const key = this._generateFactKey(fact);
    
    const item = {
      fact,
      category,
      confidence: Math.min(1, Math.max(0, confidence)),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      verifiedCount: 0,
    };

    this.semantic.set(key, item);
    this._saveSemantic(key, item);
    
    return { success: true, fact };
  }

  /**
   * 获取事实
   */
  getFact(query) {
    const key = this._generateFactKey(query);
    const item = this.semantic.get(key);
    
    return item;
  }

  /**
   * 搜索事实
   */
  searchFacts(query) {
    const lowerQuery = query.toLowerCase();
    const results = [];

    this.semantic.forEach((item, key) => {
      if (item.fact.toLowerCase().includes(lowerQuery) || 
          item.category.toLowerCase().includes(lowerQuery)) {
        results.push({
          fact: item.fact,
          category: item.category,
          confidence: item.confidence,
        });
      }
    });

    return results;
  }

  /**
   * ========== 记忆整合 ==========
   */

  /**
   * 将短期记忆整合到长期记忆
   */
  consolidate() {
    const shortTermItems = this.getAllShortTerm();
    let consolidated = 0;

    shortTermItems.forEach(item => {
      if (item.metadata.important || item.accessCount > 3) {
        this.saveToLongTerm(
          item.key,
          item.value,
          item.metadata.importance || 5,
          { fromShortTerm: true, accessCount: item.accessCount }
        );
        consolidated++;
      }
    });

    this.clearShortTerm();
    
    return { consolidated };
  }

  /**
   * 学习新知识
   */
  learn(content, type = 'fact', metadata = {}) {
    if (type === 'fact') {
      return this.saveFact(content, metadata.category, metadata.confidence);
    } else if (type === 'episode') {
      return this.recordEpisode(metadata.episodeType || 'learning', content, metadata);
    } else if (type === 'preference') {
      return this.saveToLongTerm(`pref:${content}`, metadata.value || true, 7, metadata);
    }
    
    return { error: 'Unknown type' };
  }

  /**
   * 回忆
   */
  recall(query) {
    // 1. 检查短期记忆
    const shortTermResult = this.getShortTerm(query);
    if (shortTermResult) {
      return { source: 'shortTerm', ...shortTermResult };
    }

    // 2. 检查长期记忆
    const longTermResults = this.searchLongTerm(query);
    if (longTermResults.length > 0) {
      return { source: 'longTerm', results: longTermResults };
    }

    // 3. 检查语义记忆
    const semanticResults = this.searchFacts(query);
    if (semanticResults.length > 0) {
      return { source: 'semantic', results: semanticResults };
    }

    // 4. 检查情景记忆
    const episodicResults = this.searchEpisodes(query);
    if (episodicResults.length > 0) {
      return { source: 'episodic', results: episodicResults.slice(0, 3) };
    }

    return { source: 'none' };
  }

  /**
   * 获取记忆摘要
   */
  getSummary() {
    return {
      shortTerm: this.shortTerm.size,
      longTerm: this.longTerm.size,
      episodic: this.episodic.length,
      semantic: this.semantic.size,
      lastConsolidation: this.lastConsolidation,
    };
  }

  /**
   * ========== 私有方法 ==========
   */

  _generateFactKey(fact) {
    return crypto
      .createHash('md5')
      .update(fact.toLowerCase().trim())
      .digest('hex')
      .substring(0, 16);
  }

  _maintainLongTerm() {
    if (this.longTerm.size > this.config.longTermMaxItems) {
      const items = Array.from(this.longTerm.values());
      items.sort((a, b) => {
        // 按重要性和访问频率排序
        const scoreA = a.importance * 10 + a.accessCount;
        const scoreB = b.importance * 10 + b.accessCount;
        return scoreA - scoreB;
      });

      for (let i = 0; i < 50; i++) {
        this.longTerm.delete(items[i].key);
      }
    }
  }

  _maintainEpisodic() {
    if (this.episodic.length > this.config.episodicMaxItems) {
      // 删除最早的
      this.episodic = this.episodic.slice(-this.config.episodicMaxItems);
    }
  }

  _saveLongTerm(key, item) {
    const file = path.join(this.dataDir, 'longterm', `${key}.json`);
    fs.writeFileSync(file, JSON.stringify(item, null, 2));
  }

  _loadLongTerm() {
    const dir = path.join(this.dataDir, 'longterm');
    if (!fs.existsSync(dir)) return;

    const files = fs.readdirSync(dir);
    files.forEach(file => {
      if (file.endsWith('.json')) {
        try {
          const item = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
          this.longTerm.set(item.key || file.replace('.json', ''), item);
        } catch (e) {
          // 跳过损坏的文件
        }
      }
    });
  }

  _saveEpisodic(episode) {
    const file = path.join(this.dataDir, 'episodic', `${episode.id}.json`);
    fs.writeFileSync(file, JSON.stringify(episode, null, 2));
  }

  _loadEpisodic() {
    const dir = path.join(this.dataDir, 'episodic');
    if (!fs.existsSync(dir)) return;

    const files = fs.readdirSync(dir);
    this.episodic = files
      .filter(f => f.endsWith('.json'))
      .map(f => {
        try {
          return JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
        } catch {
          return null;
        }
      })
      .filter(Boolean);
  }

  _saveSemantic(key, item) {
    const file = path.join(this.dataDir, 'semantic', `${key}.json`);
    fs.writeFileSync(file, JSON.stringify(item, null, 2));
  }

  _loadSemantic() {
    const dir = path.join(this.dataDir, 'semantic');
    if (!fs.existsSync(dir)) return;

    const files = fs.readdirSync(dir);
    files.forEach(file => {
      if (file.endsWith('.json')) {
        try {
          const item = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
          this.semantic.set(file.replace('.json', ''), item);
        } catch {
          // 跳过损坏的文件
        }
      }
    });
  }
}

module.exports = { MemorySystem };
