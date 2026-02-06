/**
 * File Tool - 文件操作工具
 */

const fs = require('fs');
const path = require('path');

class FileTool {
  constructor() {
    this.baseDir = process.env.FILE_BASE_DIR || '/Users/yubao';
  }

  /**
   * 列出文件
   */
  async list(dirPath, options = {}) {
    const fullPath = this._resolvePath(dirPath);
    
    try {
      const entries = await fs.promises.readdir(fullPath, { withFileTypes: true });
      
      const items = await Promise.all(
        entries.map(async (entry) => {
          const itemPath = path.join(fullPath, entry.name);
          const stats = await fs.promises.stat(itemPath);
          
          return {
            name: entry.name,
            path: itemPath,
            isDirectory: entry.isDirectory(),
            isFile: entry.isFile(),
            size: stats.size,
            mtime: stats.mtime,
          };
        })
      );

      // 过滤
      let result = items;
      if (options.filter) {
        result = items.filter(item => options.filter.test(item.name));
      }
      
      // 排序
      if (options.sortBy === 'name') {
        result.sort((a, b) => a.name.localeCompare(b.name));
      } else if (options.sortBy === 'date') {
        result.sort((a, b) => b.mtime - a.mtime);
      } else if (options.sortBy === 'size') {
        result.sort((a, b) => b.size - a.size);
      }

      return {
        path: fullPath,
        items: result,
        total: result.length,
      };
    } catch (error) {
      return { error: error.message, path: dirPath };
    }
  }

  /**
   * 读取文件
   */
  async read(filePath, options = {}) {
    const fullPath = this._resolvePath(filePath);
    
    try {
      const stats = await fs.promises.stat(fullPath);
      
      if (stats.isDirectory()) {
        return this.list(fullPath);
      }

      // 限制大小
      const maxSize = options.maxSize || 1024 * 1024; // 1MB
      if (stats.size > maxSize) {
        return {
          error: 'File too large',
          size: stats.size,
          maxSize,
        };
      }

      const content = await fs.promises.readFile(fullPath, 'utf8');
      
      return {
        path: fullPath,
        content,
        size: stats.size,
        lines: content.split('\n').length,
      };
    } catch (error) {
      return { error: error.message, path: filePath };
    }
  }

  /**
   * 创建文件
   */
  async create(filePath, content = '') {
    const fullPath = this._resolvePath(filePath);
    
    try {
      // 确保目录存在
      const dir = path.dirname(fullPath);
      await fs.promises.mkdir(dir, { recursive: true });
      
      await fs.promises.writeFile(fullPath, content);
      
      return {
        success: true,
        path: fullPath,
        size: content.length,
      };
    } catch (error) {
      return { error: error.message, path: filePath };
    }
  }

  /**
   * 写入文件
   */
  async write(filePath, content) {
    return this.create(filePath, content);
  }

  /**
   * 删除文件
   */
  async delete(filePath, options = {}) {
    const fullPath = this._resolvePath(filePath);
    
    try {
      const stats = await fs.promises.stat(fullPath);
      
      if (stats.isDirectory()) {
        if (!options.recursive) {
          return { error: 'Directory not empty, use recursive: true' };
        }
        await fs.promises.rm(fullPath, { recursive: true, force: true });
      } else {
        await fs.promises.unlink(fullPath);
      }
      
      return { success: true, path: fullPath };
    } catch (error) {
      return { error: error.message, path: filePath };
    }
  }

  /**
   * 搜索文件
   */
  async search(query, options = {}) {
    const searchDir = this._resolvePath(options.directory || '.');
    const maxDepth = options.depth || 3;
    const results = [];
    
    try {
      await this._searchDir(searchDir, query, 0, maxDepth, results);
      
      return {
        query,
        directory: searchDir,
        results: results.slice(0, options.limit || 50),
        total: results.length,
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * 递归搜索目录
   */
  async _searchDir(dir, query, currentDepth, maxDepth, results) {
    if (currentDepth > maxDepth) return;
    
    try {
      const entries = await fs.promises.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        // 检查文件名匹配
        if (entry.name.toLowerCase().includes(query.toLowerCase())) {
          const stats = await fs.promises.stat(fullPath);
          results.push({
            name: entry.name,
            path: fullPath,
            isDirectory: entry.isDirectory(),
            size: stats.size,
            mtime: stats.mtime,
          });
        }
        
        // 递归搜索子目录
        if (entry.isDirectory() && !entry.name.startsWith('.')) {
          await this._searchDir(fullPath, query, currentDepth + 1, maxDepth, results);
        }
      }
    } catch (error) {
      // 跳过权限问题
    }
  }

  /**
   * 获取文件信息
   */
  async info(filePath) {
    const fullPath = this._resolvePath(filePath);
    
    try {
      const stats = await fs.promises.stat(fullPath);
      
      return {
        path: fullPath,
        name: path.basename(fullPath),
        size: stats.size,
        isDirectory: stats.isDirectory(),
        isFile: stats.isFile(),
        created: stats.birthtime,
        modified: stats.mtime,
        extension: path.extname(fullPath),
      };
    } catch (error) {
      return { error: error.message, path: filePath };
    }
  }

  /**
   * 复制文件
   */
  async copy(source, destination) {
    const srcPath = this._resolvePath(source);
    const destPath = this._resolvePath(destination);
    
    try {
      await fs.promises.copyFile(srcPath, destPath);
      
      return {
        success: true,
        source: srcPath,
        destination: destPath,
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * 移动文件
   */
  async move(source, destination) {
    const srcPath = this._resolvePath(source);
    const destPath = this._resolvePath(destination);
    
    try {
      await fs.promises.rename(srcPath, destPath);
      
      return {
        success: true,
        source: srcPath,
        destination: destPath,
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * 创建目录
   */
  async mkdir(dirPath) {
    const fullPath = this._resolvePath(dirPath);
    
    try {
      await fs.promises.mkdir(fullPath, { recursive: true });
      
      return {
        success: true,
        path: fullPath,
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * 解析路径
   */
  _resolvePath(filePath) {
    // 处理相对路径
    if (!path.isAbsolute(filePath)) {
      return path.resolve(this.baseDir, filePath);
    }
    return filePath;
  }
}

module.exports = { FileTool };
