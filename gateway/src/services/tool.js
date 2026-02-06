/**
 * Tool Registry - 工具注册表
 * 管理所有可用的工具
 */

class ToolRegistry {
  constructor() {
    this.tools = new Map();
    this.aliases = new Map();
  }

  /**
   * 注册工具
   */
  register(toolInfo) {
    const tool = {
      id: toolInfo.id || toolInfo.name,
      name: toolInfo.name,
      description: toolInfo.description || '',
      parameters: toolInfo.parameters || {},
      handler: toolInfo.handler || null,
      enabled: toolInfo.enabled !== false,
      category: toolInfo.category || 'general',
      permissions: toolInfo.permissions || []
    };

    this.tools.set(tool.id, tool);
    console.log(`🔧 工具注册: ${tool.name} (${tool.category})`);
    return tool;
  }

  /**
   * 批量注册工具
   */
  registerMany(tools) {
    tools.forEach(tool => this.register(tool));
  }

  /**
   * 获取工具
   */
  get(toolId) {
    return this.tools.get(toolId) || this.tools.get(this.aliases.get(toolId));
  }

  /**
   * 列出所有工具
   */
  list() {
    return Array.from(this.tools.values()).map(t => ({
      id: t.id,
      name: t.name,
      description: t.description,
      category: t.category,
      enabled: t.enabled
    }));
  }

  /**
   * 按类别列出工具
   */
  listByCategory(category) {
    return Array.from(this.tools.values())
      .filter(t => t.category === category && t.enabled);
  }

  /**
   * 执行工具
   */
  async invoke(toolId, params) {
    const tool = this.get(toolId);
    if (!tool) {
      throw new Error(`工具不存在: ${toolId}`);
    }
    
    if (!tool.enabled) {
      throw new Error(`工具已禁用: ${toolId}`);
    }
    
    if (tool.handler) {
      return await tool.handler(params);
    }
    
    throw new Error(`工具处理器未实现: ${toolId}`);
  }

  /**
   * 启用/禁用工具
   */
  setEnabled(toolId, enabled) {
    const tool = this.tools.get(toolId);
    if (tool) {
      tool.enabled = enabled;
    }
  }

  /**
   * 添加别名
   */
  addAlias(toolId, alias) {
    this.aliases.set(alias, toolId);
  }
}

module.exports = { ToolRegistry };
