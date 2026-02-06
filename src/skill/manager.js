/**
 * Skill Manager - Skill 管理器
 * 负责安装、卸载、更新和搜索 Skill
 */

const fs = require('fs');
const path = require('path');
const { exec, spawn } = require('child_process');
const { SkillLoader } = require('./loader');
const { SkillRegistry } = require('./registry');

class SkillManager {
  constructor(options = {}) {
    this.skillsDir = options.skillsDir || './skills';
    this.registryFile = options.registryFile || './skills/registry.json';
    this.tempDir = options.tempDir || './temp/skills';
    
    this.loader = new SkillLoader({ skillsDir: this.skillsDir });
    this.registry = new SkillRegistry({ registryFile: this.registryFile });
    
    this._ensureDirectories();
  }
  
  /**
   * 确保目录存在
   */
  _ensureDirectories() {
    const dirs = [
      this.skillsDir,
      path.join(this.skillsDir, 'builtin'),
      path.join(this.skillsDir, 'community'),
      path.join(this.skillsDir, 'custom'),
      this.tempDir
    ];
    
    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
    }
  
  /**
   * 安装 Skill
   */
  async install(skillId, source, options = {}) {
    const { type = 'community', force = false } = options;
    
    console.log(`[Manager] Installing ${skillId} from ${source}...`);
    
    try {
      // 1. 检查是否已安装
      if (this.registry.has(skillId) && !force) {
        console.log(`[Manager] Skill ${skillId} already installed`);
        return {
          success: false,
          reason: 'already_installed',
          skillId
        };
      }
      
      // 2. 下载 Skill
      const tempPath = path.join(this.tempDir, `${skillId}-${Date.now()}`);
      await this._download(source, tempPath);
      
      // 3. 验证下载
      const manifest = await this._loadManifest(tempPath);
      
      if (manifest.id !== skillId) {
        throw new Error(`Skill ID mismatch: expected ${skillId}, got ${manifest.id}`);
      }
      
      // 4. 安装依赖
      await this._installDependencies(tempPath);
      
      // 5. 复制到目标目录
      const targetPath = path.join(this.skillsDir, type, skillId);
      if (fs.existsSync(targetPath)) {
        fs.rmSync(targetPath, { recursive: true });
      }
      fs.mkdirSync(targetPath, { recursive: true });
      
      await this._copy(tempPath, targetPath);
      
      // 6. 加载 Skill
      await this.loader.load(targetPath);
      
      // 7. 注册到 Registry
      this.registry.register(manifest, {
        path: targetPath,
        type
      });
      
      // 8. 清理临时文件
      fs.rmSync(tempPath, { recursive: true });
      
      console.log(`[Manager] ✅ Skill installed: ${skillId} v${manifest.version}`);
      
      return {
        success: true,
        skillId,
        version: manifest.version,
        type,
        path: targetPath
      };
      
    } catch (error) {
      console.error(`[Manager] ❌ Failed to install ${skillId}:`, error.message);
      
      // 清理临时文件
      const tempPath = path.join(this.tempDir, skillId);
      if (fs.existsSync(tempPath)) {
        fs.rmSync(tempPath, { recursive: true });
      }
      
      return {
        success: false,
        skillId,
        error: error.message
      };
    }
  }
  
  /**
   * 卸载 Skill
   */
  async uninstall(skillId, options = {}) {
    const { deleteFiles = true } = options;
    
    console.log(`[Manager] Uninstalling ${skillId}...`);
    
    try {
      // 1. 卸载 (从 loader)
      await this.loader.unload(skillId);
      
      // 2. 从 Registry 移除
      this.registry.unregister(skillId);
      
      // 3. 删除文件
      const skillPath = this._findSkillPath(skillId);
      if (skillPath && deleteFiles) {
        fs.rmSync(skillPath, { recursive: true });
        console.log(`[Manager] Files deleted: ${skillPath}`);
      }
      
      console.log(`[Manager] ✅ Skill uninstalled: ${skillId}`);
      
      return {
        success: true,
        skillId
      };
      
    } catch (error) {
      console.error(`[Manager] ❌ Failed to uninstall ${skillId}:`, error.message);
      
      return {
        success: false,
        skillId,
        error: error.message
      };
    }
  }
  
  /**
   * 更新 Skill
   */
  async update(skillId, options = {}) {
    const { source = null, backup = true } = options;
    
    console.log(`[Manager] Updating ${skillId}...`);
    
    try {
      const current = this.registry.get(skillId);
      
      if (!current) {
        throw new Error(`Skill not installed: ${skillId}`);
      }
      
      // 备份
      let backupPath = null;
      if (backup) {
        backupPath = path.join(this.tempDir, `${skillId}-backup-${Date.now()}`);
        fs.mkdirSync(backupPath, { recursive: true });
        await this._copy(current.installPath, backupPath);
        console.log(`[Manager] Backup created: ${backupPath}`);
      }
      
      try {
        // 卸载当前版本
        await this.uninstall(skillId, { deleteFiles: false });
        
        // 安装新版本
        const result = await this.install(
          skillId,
          source || current.repository || `local:${current.installPath}`,
          { type: current.category === 'builtin' ? 'builtin' : 'community' }
        );
        
        console.log(`[Manager] ✅ Skill updated: ${skillId}`);
        
        return {
          success: true,
          skillId,
          backupPath
        };
        
      } catch (error) {
        // 回滚
        if (backupPath) {
          console.log(`[Manager] Rolling back from backup...`);
          await this.uninstall(skillId, { deleteFiles: true });
          await this._copy(backupPath, current.installPath);
          await this.loader.load(current.installPath);
          this.registry.register(await this._loadManifest(current.installPath), {
            path: current.installPath
          });
        }
        
        throw error;
      }
      
    } catch (error) {
      console.error(`[Manager] ❌ Failed to update ${skillId}:`, error.message);
      
      return {
        success: false,
        skillId,
        error: error.message
      };
    }
  }
  
  /**
   * 从 GitHub 安装
   */
  async installFromGitHub(owner, repo, options = {}) {
    const { branch = 'main', subpath = '' } = options;
    const source = `github:${owner}/${repo}${subpath ? '/' + subpath : ''}`;
    
    return this.install(`${repo}`, source, options);
  }
  
  /**
   * 从本地安装
   */
  async installFromLocal(skillId, localPath, options = {}) {
    return this.install(skillId, `local:${localPath}`, options);
  }
  
  /**
   * 列出已安装 Skill
   */
  listInstalled(options = {}) {
    return this.loader.list();
  }
  
  /**
   * 搜索可用 Skill
   */
  async searchAvailable(query, options = {}) {
    // 从本地 Registry 搜索已安装的
    const local = this.registry.search(query, options);
    
    // TODO: 从远程市场搜索
    // const remote = await this._searchRemote(query, options);
    
    return {
      local,
      remote: []
    };
  }
  
  /**
   * 加载所有内置 Skill
   */
  async loadBuiltin() {
    console.log('[Manager] Loading builtin skills...');
    return await this.loader.loadAll('builtin');
  }
  
  /**
   * 获取状态概览
   */
  getStatus() {
    const loaded = this.loader.list();
    const registered = this.registry.list();
    
    return {
      loaded: loaded.length,
      installed: registered.filter(r => r.installed).length,
      categories: this.registry.getCategories(),
      memory: process.memoryUsage(),
      uptime: process.uptime()
    };
  }
  
  // ========== 私有方法 ==========
  
  /**
   * 下载 Skill
   */
  async _download(source, targetPath) {
    if (source.startsWith('github:')) {
      await this._downloadFromGitHub(source, targetPath);
    } else if (source.startsWith('local:')) {
      await this._copy(source.replace('local:', ''), targetPath);
    } else {
      // 假设是 URL
      await this._downloadFromURL(source, targetPath);
    }
  }
  
  /**
   * 从 GitHub 下载
   */
  async _downloadFromGitHub(source, targetPath) {
    const parts = source.replace('github:', '').split('/');
    const [owner, repo, ...rest] = parts;
    const branch = 'main';
    const subpath = rest.join('/');
    
    const repoUrl = `https://github.com/${owner}/${repo}.git`;
    
    return new Promise((resolve, reject) => {
      exec(
        `git clone --depth 1 --branch ${branch} ${repoUrl} ${targetPath}`,
        { timeout: 120000 },
        (error) => {
          if (error) {
            reject(new Error(`Git clone failed: ${error.message}`));
          } else {
            resolve();
          }
        }
      );
    });
  }
  
  /**
   * 从 URL 下载
   */
  async _downloadFromURL(url, targetPath) {
    const https = require('https');
    const file = fs.createWriteStream(targetPath);
    
    return new Promise((resolve, reject) => {
      https.get(url, (response) => {
        if (response.statusCode === 302 || response.statusCode === 301) {
          this._downloadFromURL(response.headers.location, targetPath)
            .then(resolve)
            .catch(reject);
        } else {
          response.pipe(file);
          file.on('finish', () => {
            file.close();
            resolve();
          });
        }
      }).on('error', (error) => {
        fs.unlink(targetPath, () => {});
        reject(error);
      });
    });
  }
  
  /**
   * 安装依赖
   */
  async _installDependencies(skillPath) {
    const packageJson = path.join(skillPath, 'package.json');
    
    if (fs.existsSync(packageJson)) {
      console.log(`[Manager] Installing dependencies...`);
      
      return new Promise((resolve, reject) => {
        exec(
          'npm ci --prefer-offline --no-audit',
          { cwd: skillPath, timeout: 180000 },
          (error) => {
            if (error) {
              console.warn(`[Manager] npm install warning: ${error.message}`);
              resolve(); // 不因依赖安装失败而阻止
            } else {
              resolve();
            }
          }
        );
      });
    }
  }
  
  /**
   * 复制目录
   */
  async _copy(src, dest) {
    return new Promise((resolve, reject) => {
      exec(`cp -r "${src}" "${dest}"`, (error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  }
  
  /**
   * 加载 Manifest
   */
  async _loadManifest(skillPath) {
    const manifestPath = path.join(skillPath, 'skill.json');
    const content = await fs.promises.readFile(manifestPath, 'utf8');
    return JSON.parse(content);
  }
  
  /**
   * 查找 Skill 路径
   */
  _findSkillPath(skillId) {
    const types = ['builtin', 'community', 'custom'];
    
    for (const type of types) {
      const p = path.join(this.skillsDir, type, skillId);
      if (fs.existsSync(p)) {
        return p;
      }
    }
    
    return null;
  }
}

module.exports = { SkillManager };
