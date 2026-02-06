/**
 * Sandbox Worker - 沙箱工作进程
 */

const fs = require('fs');
const path = require('path');

// 超时检查
const TIMEOUT = parseInt(process.env.SANDBOX_TIMEOUT) || 30000;
const timeoutHandle = setTimeout(() => {
  console.error('[Sandbox] Timeout reached');
  process.exit(1);
}, TIMEOUT);

// 加载 Skill
async function loadSkill(skillPath) {
  const manifestPath = path.join(skillPath, 'skill.json');
  
  if (!fs.existsSync(manifestPath)) {
    throw new Error('skill.json not found');
  }
  
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const entryPath = path.join(skillPath, manifest.entry);
  
  if (!fs.existsSync(entryPath)) {
    throw new Error(`Entry file not found: ${manifest.entry}`);
  }
  
  // 清除缓存
  delete require.cache[require.resolve(entryPath)];
  
  const module = require(entryPath);
  const SkillClass = module[manifest.main] || module.default;
  
  return { manifest, SkillClass };
}

// 执行消息处理
process.on('message', async (message) => {
  try {
    if (message.type === 'execute') {
      const { skillPath, method, params, context } = message;
      
      // 加载 Skill
      const { manifest, SkillClass } = await loadSkill(skillPath);
      
      // 创建实例
      const config = {};
      const skill = new SkillClass(config);
      
      // 执行方法
      if (method && typeof skill[method] === 'function') {
        const result = await skill[method](params, context);
        process.send({ type: 'result', data: result });
      } else if (skill.execute && typeof skill.execute === 'function') {
        const result = await skill.execute(params, context);
        process.send({ type: 'result', data: result });
      } else {
        throw new Error('No executable method found');
      }
    }
  } catch (error) {
    process.send({ type: 'error', error: error.message });
  } finally {
    clearTimeout(timeoutHandle);
    process.exit(0);
  }
});

console.log('[Sandbox] Worker started');
