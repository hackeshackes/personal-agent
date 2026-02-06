/**
 * Docker Skill - Docker 容器管理
 */

const { exec } = require('child_process');
const util = require('util');

const execAsync = util.promisify(exec);

class DockerSkill {
  constructor(config = {}) {
    this.workDir = config?.workDir || '.';
  }
  
  // ========== 元数据 ==========
  
  static metadata = {
    id: 'docker',
    name: 'Docker 管理',
    description: 'Docker 容器管理',
    version: '1.0.0',
    parameters: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['ps', 'images', 'pull', 'run', 'stop', 'rm', 'logs', 'exec', 'compose'],
          description: '操作类型'
        },
        image: { type: 'string', description: '镜像名' },
        container: { type: 'string', description: '容器名或 ID' },
        command: { type: 'string', description: '要执行的命令' },
        tag: { type: 'string', description: '镜像标签' },
        options: { type: 'string', description: '额外选项' },
        file: { type: 'string', description: 'Compose 文件' }
      },
      required: ['action']
    }
  };
  
  // ========== 执行入口 ==========
  
  async execute(params, context = {}) {
    const { action } = params;
    
    switch (action) {
      case 'ps':
        return await this._ps();
      case 'images':
        return await this._images();
      case 'pull':
        return await this._pull(params.image, params.tag);
      case 'run':
        return await this._run(params.image, params.options);
      case 'stop':
        return await this._stop(params.container);
      case 'rm':
        return await this._rm(params.container);
      case 'logs':
        return await this._logs(params.container);
      case 'exec':
        return await this._exec(params.container, params.command);
      case 'compose':
        return await this._compose(params.action, params.file);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }
  
  // ========== 操作实现 ==========
  
  async _ps() {
    try {
      const { stdout } = await execAsync('docker ps -a --format "{{.ID}}|{{.Names}}|{{.Status}}|{{.Image}}"');
      const containers = stdout.trim().split('\n').filter(Boolean).map(line => {
        const [id, name, status, image] = line.split('|');
        return { id, name, status, image };
      });
      return { status: 'ok', containers };
    } catch (error) {
      return this._mockData('containers');
    }
  }
  
  async _images() {
    try {
      const { stdout } = await execAsync('docker images --format "{{.ID}}|{{.Repository}}|{{.Tag}}|{{.Size}}"');
      const images = stdout.trim().split('\n').filter(Boolean).map(line => {
        const [id, repo, tag, size] = line.split('|');
        return { id, repo, tag, size };
      });
      return { status: 'ok', images };
    } catch (error) {
      return this._mockData('images');
    }
  }
  
  async _pull(image, tag = 'latest') {
    try {
      const { stdout } = await execAsync(`docker pull ${image}:${tag}`);
      return { status: 'ok', image: `${image}:${tag}` };
    } catch (error) {
      return { status: 'error', error: error.message };
    }
  }
  
  async _run(image, options = '-d') {
    try {
      const name = `${image.replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now()}`;
      const { stdout } = await execAsync(`docker run ${options} --name ${name} ${image}`);
      return { status: 'ok', container: name };
    } catch (error) {
      return { status: 'error', error: error.message };
    }
  }
  
  async _stop(container) {
    try {
      await execAsync(`docker stop ${container}`);
      return { status: 'ok', container };
    } catch (error) {
      return { status: 'error', error: error.message };
    }
  }
  
  async _rm(container) {
    try {
      await execAsync(`docker rm ${container}`);
      return { status: 'ok', container };
    } catch (error) {
      return { status: 'error', error: error.message };
    }
  }
  
  async _logs(container, tail = 100) {
    try {
      const { stdout } = await execAsync(`docker logs --tail ${tail} ${container}`);
      return { status: 'ok', container, logs: stdout.substring(0, 5000) };
    } catch (error) {
      return { status: 'error', error: error.message };
    }
  }
  
  async _exec(container, command) {
    try {
      const { stdout } = await execAsync(`docker exec ${container} ${command}`);
      return { status: 'ok', container, output: stdout };
    } catch (error) {
      return { status: 'error', error: error.message };
    }
  }
  
  async _compose(action = 'up', file = 'docker-compose.yml') {
    try {
      const { stdout } = await execAsync(`docker-compose -f ${file} ${action} -d`);
      return { status: 'ok', action, file };
    } catch (error) {
      return { status: 'error', error: error.message };
    }
  }
  
  // ========== 模拟数据 ==========
  
  _mockData(type) {
    if (type === 'containers') {
      return {
        status: 'degraded',
        message: 'Docker not available, using mock data',
        containers: [
          { id: 'abc123', name: 'nginx-proxy', status: 'Up 2 hours', image: 'nginx:latest' },
          { id: 'def456', name: 'redis', status: 'Up 5 days', image: 'redis:alpine' }
        ]
      };
    }
    
    if (type === 'images') {
      return {
        status: 'degraded',
        message: 'Docker not available, using mock data',
        images: [
          { id: 'sha256:abc', repo: 'nginx', tag: 'latest', size: '187MB' },
          { id: 'sha256:def', repo: 'redis', tag: 'alpine', size: '32MB' }
        ]
      };
    }
    
    return { status: 'mock', type };
  }
  
  // ========== 健康检查 ==========
  
  async healthCheck() {
    try {
      await execAsync('docker --version');
      return { status: 'ok' };
    } catch (error) {
      return { status: 'degraded', message: 'Docker not installed' };
    }
  }
}

module.exports = DockerSkill;
