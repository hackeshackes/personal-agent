#!/usr/bin/env node

/**
 * Skill CLI - Skill 管理命令行工具
 */

const { Command } = require('commander');
const { SkillFramework } = require('../src/skill');
const { ClawHubMarketplace } = require('../src/skill/marketplace');
const path = require('path');

class SkillCLI {
  constructor() {
    this.program = new Command();
    this.framework = null;
    this.marketplace = new ClawHubMarketplace();
    
    this._setupCommands();
  }
  
  /**
   * 初始化
   */
  async init() {
    this.framework = await SkillFramework.init({
      skillsDir: './skills',
      registryFile: './skills/registry.json',
      autoLoadBuiltin: true
    });
  }
  
  /**
   * 设置命令
   */
  _setupCommands() {
    this.program
      .name('skill')
      .description('Personal AI Agent Skill 管理工具')
      .version('1.0.0');
    
    // 列表命令
    this.program
      .command('list')
      .alias('ls')
      .description('列出所有已安装的 Skill')
      .action(async () => {
        await this._initFramework();
        const skills = this.framework.list();
        
        console.log('\n📦 已安装的 Skill:\n');
        console.log(`  总计: ${skills.length}\n`);
        
        for (const skill of skills) {
          console.log(`  • ${skill.name} v${skill.version}`);
          console.log(`    ID: ${skill.id} | 状态: ${skill.status}\n`);
        }
      });
    
    // 搜索命令
    this.program
      .command('search [query]')
      .alias('find')
      .description('搜索可用 Skill')
      .option('-l, --limit <number>', '结果数量', '20')
      .action(async (query, options) => {
        const results = await this.marketplace.search(query || '', {
          limit: parseInt(options.limit)
        });
        
        console.log(`\n🔍 搜索结果: "${query || '所有'}"\n`);
        
        for (const skill of results) {
          console.log(`  • ${skill.name} v${skill.version}`);
          console.log(`    ${skill.description}`);
          console.log(`    ⭐ ${skill.rating} | ⬇️ ${skill.downloads}\n`);
        }
      });
    
    // 安装命令
    this.program
      .command('install <skillId> [source]')
      .alias('add')
      .description('安装 Skill')
      .option('-t, --type <type>', '类型', 'community')
      .action(async (skillId, source, options) => {
        await this._initFramework();
        
        if (!source) {
          // 从市场搜索
          const results = await this.marketplace.search(skillId);
          const skill = results.find(s => s.id === skillId);
          
          if (skill) {
            source = skill.repository;
          } else {
            source = `github:clawhub/${skillId}-skill`;
          }
        }
        
        console.log(`\n📦 正在安装: ${skillId}`);
        
        const result = await this.framework.install(skillId, source, {
          type: options.type
        });
        
        if (result.success) {
          console.log(`✅ ${skillId} v${result.version} 安装成功!\n`);
        } else {
          console.log(`❌ 安装失败: ${result.error}\n`);
        }
      });
    
    // 卸载命令
    this.program
      .command('uninstall <skillId>')
      .alias('remove')
      .alias('rm')
      .description('卸载 Skill')
      .action(async (skillId) => {
        await this._initFramework();
        
        console.log(`\n🗑️ 正在卸载: ${skillId}`);
        
        const result = await this.framework.uninstall(skillId);
        
        if (result.success) {
          console.log(`✅ ${skillId} 卸载成功!\n`);
        } else {
          console.log(`❌ 卸载失败: ${result.error}\n`);
        }
      });
    
    // 更新命令
    this.program
      .command('update [skillId]')
      .alias('upgrade')
      .description('更新 Skill (不指定则更新所有)')
      .action(async (skillId) => {
        await this._initFramework();
        
        if (skillId) {
          console.log(`\n🔄 正在更新: ${skillId}`);
          const result = await this.framework.update(skillId);
          
          if (result.success) {
            console.log(`✅ ${skillId} 更新成功!\n`);
          } else {
            console.log(`❌ 更新失败: ${result.error}\n`);
          }
        } else {
          console.log('\n🔄 正在更新所有 Skill...\n');
          // 批量更新逻辑
        }
      });
    
    // 执行命令
    this.program
      .command('exec <skillId> [params...]')
      .alias('run')
      .description('执行 Skill')
      .action(async (skillId, params) => {
        await this._initFramework();
        
        try {
          // 解析参数
          let args = {};
          params.forEach(p => {
            const [key, value] = p.split('=');
            if (key && value) {
              args[key] = value;
            }
          });
          
          console.log(`\n⚡ 执行: ${skillId}`);
          const result = await this.framework.execute(skillId, args);
          
          console.log(`\n✅ 结果:\n${JSON.stringify(result, null, 2)}\n`);
        } catch (error) {
          console.log(`\n❌ 执行失败: ${error.message}\n`);
        }
      });
    
    // 市场命令
    this.program
      .command('market')
      .alias('hub')
      .description('浏览 Skill 市场')
      .action(async () => {
        const featured = await this.marketplace.getFeatured();
        
        console.log('\n🏪 ClawHub Skill 市场\n');
        console.log(`  精选 Skill (${featured.length})\n`);
        
        for (const skill of featured.slice(0, 10)) {
          console.log(`  • ${skill.name} v${skill.version}`);
          console.log(`    ${skill.description}`);
          console.log(`    ⭐ ${skill.rating} | ⬇️ ${skill.downloads}\n`);
        }
      });
    
    // 信息命令
    this.program
      .command('info <skillId>')
      .alias('show')
      .description('显示 Skill 详情')
      .action(async (skillId) => {
        const details = await this.marketplace.getDetails(skillId);
        
        if (details) {
          console.log(`\n📦 ${details.name} v${details.version}\n`);
          console.log(`  描述: ${details.description}`);
          console.log(`  作者: ${details.author}`);
          console.log(`  评分: ⭐ ${details.rating}`);
          console.log(`  下载: ⬇️ ${details.downloads}`);
          console.log(`  标签: ${details.tags.join(', ')}`);
          console.log(`  仓库: ${details.repository}\n`);
        } else {
          console.log(`\n❌ 未找到 Skill: ${skillId}\n`);
        }
      });
    
    // 健康检查命令
    this.program
      .command('health')
      .alias('check')
      .description('检查所有 Skill 健康状态')
      .action(async () => {
        await this._initFramework();
        
        console.log('\n🏥 Skill 健康检查\n');
        
        const status = await this.framework.healthCheck();
        
        for (const check of status) {
          console.log(`  ${check.status === 'ok' ? '✅' : '❌'} ${check.skillId}: ${check.status}`);
        }
        
        console.log('');
      });
    
    // 状态命令
    this.program
      .command('status')
      .alias('stats')
      .description('显示 Skill 系统状态')
      .action(async () => {
        await this._initFramework();
        
        const status = this.framework.getStatus();
        
        console.log('\n📊 Skill 系统状态\n');
        console.log(`  已加载: ${status.loaded.length}`);
        console.log(`  已安装: ${status.installed}`);
        console.log(`  类别: ${status.status.categories.join(', ')}`);
        console.log('');
      });
  }
  
  /**
   * 初始化框架
   */
  async _initFramework() {
    if (!this.framework) {
      await this.init();
    }
  }
  
  /**
   * 运行 CLI
   */
  async run() {
    await this.program.parseAsync(process.argv);
  }
}

// 主入口
if (require.main === module) {
  const cli = new SkillCLI();
  cli.run().catch(console.error);
}

module.exports = { SkillCLI };
