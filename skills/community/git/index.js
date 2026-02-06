/**
 * Git Skill - Git 版本控制操作
 */

const { exec } = require('child_process');
const util = require('util');

const execAsync = util.promisify(exec);

class GitSkill {
  constructor(config = {}) {
    this.workDir = config?.workDir || '.';
  }
  
  // ========== 元数据 ==========
  
  static metadata = {
    id: 'git',
    name: 'Git 操作',
    description: 'Git 版本控制操作',
    version: '1.0.0',
    parameters: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['status', 'log', 'commit', 'branch', 'checkout', 'pull', 'push', 'clone'],
          description: '操作类型'
        },
        repo: { type: 'string', description: '仓库路径或 URL' },
        message: { type: 'string', description: '提交信息' },
        branch: { type: 'string', description: '分支名' },
        target: { type: 'string', description: '目标分支' },
        files: { type: 'array', items: { type: 'string' }, description: '文件列表' }
      },
      required: ['action']
    }
  };
  
  // ========== 执行入口 ==========
  
  async execute(params, context = {}) {
    const { action } = params;
    
    switch (action) {
      case 'status':
        return await this._status(params.repo);
      case 'log':
        return await this._log(params.repo);
      case 'commit':
        return await this._commit(params.repo, params.message, params.files);
      case 'branch':
        return await this._branch(params.repo);
      case 'checkout':
        return await this._checkout(params.repo, params.branch);
      case 'pull':
        return await this._pull(params.repo);
      case 'push':
        return await this._push(params.repo);
      case 'clone':
        return await this._clone(params.repo, params.target);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }
  
  // ========== 操作实现 ==========
  
  async _status(repo = '.') {
    try {
      const { stdout } = await execAsync('git status', { cwd: repo });
      return { status: 'ok', output: stdout };
    } catch (error) {
      return { status: 'error', error: error.message };
    }
  }
  
  async _log(repo = '.', limit = 10) {
    try {
      const { stdout } = await execAsync(`git log --oneline -${limit}`, { cwd: repo });
      const commits = stdout.trim().split('\n').filter(Boolean);
      return { status: 'ok', commits };
    } catch (error) {
      return { status: 'error', error: error.message };
    }
  }
  
  async _commit(repo = '.', message, files = ['.']) {
    try {
      // 添加文件
      await execAsync(`git add ${files.join(' ')}`, { cwd: repo });
      
      // 提交
      const { stdout } = await execAsync(`git commit -m "${message}"`, { cwd: repo });
      
      return { status: 'ok', message: 'Commit created' };
    } catch (error) {
      return { status: 'error', error: error.message };
    }
  }
  
  async _branch(repo = '.') {
    try {
      const { stdout } = await execAsync('git branch --format="%(refname:short)"', { cwd: repo });
      const branches = stdout.trim().split('\n').filter(Boolean);
      return { status: 'ok', branches };
    } catch (error) {
      return { status: 'error', error: error.message };
    }
  }
  
  async _checkout(repo = '.', branch) {
    try {
      const { stdout } = await execAsync(`git checkout ${branch}`, { cwd: repo });
      return { status: 'ok', branch };
    } catch (error) {
      return { status: 'error', error: error.message };
    }
  }
  
  async _pull(repo = '.') {
    try {
      const { stdout } = await execAsync('git pull', { cwd: repo });
      return { status: 'ok', output: stdout };
    } catch (error) {
      return { status: 'error', error: error.message };
    }
  }
  
  async _push(repo = '.') {
    try {
      const { stdout } = await execAsync('git push', { cwd: repo });
      return { status: 'ok', output: stdout };
    } catch (error) {
      return { status: 'error', error: error.message };
    }
  }
  
  async _clone(repo, target = '.') {
    try {
      const { stdout } = await execAsync(`git clone ${repo} ${target}`);
      return { status: 'ok', path: target };
    } catch (error) {
      return { status: 'error', error: error.message };
    }
  }
  
  // ========== 健康检查 ==========
  
  async healthCheck() {
    try {
      await execAsync('git --version');
      return { status: 'ok' };
    } catch (error) {
      return { status: 'error', error: 'Git not installed' };
    }
  }
}

module.exports = GitSkill;
