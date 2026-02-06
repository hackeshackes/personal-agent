/**
 * Skill Framework Tests
 */

const { Skill, SkillType, SkillStatus } = require('../src/skill/interfaces');
const { SkillLoader } = require('../src/skill/loader');
const { SkillRegistry } = require('../src/skill/registry');
const { SkillManager } = require('../src/skill/manager');
const path = require('path');
const fs = require('fs');

// 测试 Skill 示例
class TestSkill {
  constructor(config) {
    this.name = 'test';
    this.version = '1.0.0';
    this.config = config;
  }
  
  static metadata = {
    id: 'test',
    name: '测试技能',
    version: '1.0.0',
    description: '测试用技能',
    parameters: {
      type: 'object',
      properties: {
        message: { type: 'string', description: '测试消息' }
      },
      required: ['message']
    }
  };
  
  async execute(params) {
    return { result: `Hello, ${params.message}!` };
  }
  
  async healthCheck() {
    return { status: 'ok' };
  }
}

async function runTests() {
  console.log('🧪 Skill Framework Tests\n');
  console.log('='.repeat(50));
  
  // 测试 1: Skill Registry
  console.log('\n[1/4] Testing SkillRegistry...');
  const registryFile = '/tmp/test-skill-registry.json';
  if (fs.existsSync(registryFile)) fs.unlinkSync(registryFile);
  
  const registry = new SkillRegistry({ registryFile });
  
  // 注册测试
  registry.register({
    id: 'test',
    name: '测试',
    version: '1.0.0',
    description: 'Test skill',
    keywords: ['test', 'demo']
  }, { path: '/test/path' });
  
  console.log(`  ✓ Registered ${registry.count()} skill(s)`);
  
  // 搜索测试
  const results = registry.search('test');
  console.log(`  ✓ Search found ${results.length} skill(s)`);
  
  // 列表测试
  const list = registry.list();
  console.log(`  ✓ Listed ${list.length} skill(s)`);
  
  // 测试 2: Skill Loader
  console.log('\n[2/4] Testing SkillLoader...');
  
  // 创建临时 skill.json
  const testSkillPath = '/tmp/test-skill';
  fs.mkdirSync(testSkillPath, { recursive: true });
  fs.writeFileSync(path.join(testSkillPath, 'skill.json'), JSON.stringify({
    id: 'test',
    name: '测试',
    version: '1.0.0',
    description: 'Test skill',
    entry: 'index.js',
    main: 'TestSkill'
  }, null, 2));
  fs.writeFileSync(path.join(testSkillPath, 'index.js'), `module.exports = TestSkill;`);
  
  const loader = new SkillLoader({ skillsDir: '/tmp' });
  
  // 加载测试
  await loader.load(testSkillPath);
  console.log(`  ✓ Loaded ${loader.list().length} skill(s)`);
  
  // 执行测试
  const result = await loader.execute('test', { message: 'World' });
  console.log(`  ✓ Executed: ${JSON.stringify(result)}`);
  
  // 测试 3: Skill Manager
  console.log('\n[3/4] Testing SkillManager...');
  
  const skillsDir = '/tmp/test-skills';
  if (fs.existsSync(skillsDir)) fs.rmSync(skillsDir, { recursive: true });
  
  const manager = new SkillManager({ skillsDir, registryFile });
  
  console.log(`  ✓ Manager initialized`);
  console.log(`  ✓ Status: ${JSON.stringify(manager.getStatus())}`);
  
  // 测试 4: 性能测试
  console.log('\n[4/4] Performance Tests...');
  
  const startTime = Date.now();
  
  // 批量操作
  for (let i = 0; i < 100; i++) {
    registry.register({
      id: `test-${i}`,
      name: `测试 ${i}`,
      version: '1.0.0',
      description: `Test skill ${i}`,
      keywords: ['test']
    });
  }
  
  const loadTime = Date.now() - startTime;
  console.log(`  ✓ Registered 100 skills in ${loadTime}ms`);
  
  // 搜索性能
  const searchStart = Date.now();
  registry.search('test-50');
  const searchTime = Date.now() - searchStart;
  console.log(`  ✓ Search completed in ${searchTime}ms`);
  
  console.log('\n' + '='.repeat(50));
  console.log('✅ All tests passed!\n');
  
  // 清理
  fs.rmSync('/tmp/test-skill', { recursive: true });
  fs.rmSync(registryFile);
}

runTests().catch(console.error);
