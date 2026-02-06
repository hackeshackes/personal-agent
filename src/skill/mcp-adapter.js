/**
 * MCP Protocol Adapter - Model Context Protocol 适配器
 * 将 Skill 转换为 MCP Tool 格式
 */

const path = require('path');

class MCPAdapter {
  constructor(skillFramework) {
    this.framework = skillFramework;
    this.tools = new Map();
  }
  
  /**
   * 将 Skill 转换为 MCP Tool
   */
  skillToMCPTool(skill) {
    const manifest = skill.manifest;
    
    return {
      name: `${manifest.id}_execute`,
      description: manifest.description || 'A Personal AI Agent Skill',
      inputSchema: {
        type: 'object',
        properties: this._parseParameters(manifest.parameters),
        required: manifest.parameters?.required || []
      }
    };
  }
  
  /**
   * 解析参数定义
   */
  _parseParameters(params) {
    if (!params || !params.properties) {
      return {};
    }
    
    const properties = {};
    
    for (const [key, spec] of Object.entries(params.properties)) {
      properties[key] = {
        type: this._mapType(spec.type),
        description: spec.description || ''
      };
      
      if (spec.enum) {
        properties[key].enum = spec.enum;
      }
    }
    
    return properties;
  }
  
  /**
   * 映射数据类型
   */
  _mapType(type) {
    const typeMap = {
      'string': 'string',
      'number': 'number',
      'integer': 'integer',
      'boolean': 'boolean',
      'array': 'array',
      'object': 'object'
    };
    
    return typeMap[type?.toLowerCase()] || 'string';
  }
  
  /**
   * 注册所有 Skill 为 MCP Tools
   */
  registerAll() {
    const skills = this.framework.list();
    
    for (const skill of skills) {
      const tool = this.skillToMCPTool(skill);
      this.tools.set(tool.name, tool);
    }
    
    console.log(`[MCP] Registered ${this.tools.size} tools`);
  }
  
  /**
   * 获取所有 Tools
   */
  getAllTools() {
    return Array.from(this.tools.values());
  }
  
  /**
   * 获取单个 Tool
   */
  getTool(name) {
    return this.tools.get(name);
  }
  
  /**
   * 执行 Tool
   */
  async callTool(name, params) {
    const tool = this.tools.get(name);
    
    if (!tool) {
      throw new Error(`Unknown tool: ${name}`);
    }
    
    // 提取 skillId 和 action
    const match = name.match(/^(\w+)_execute$/);
    if (!match) {
      throw new Error(`Invalid tool name format: ${name}`);
    }
    
    const skillId = match[1];
    
    // 确定 action
    const action = params.action || 'execute';
    
    // 执行 Skill
    return await this.framework.execute(skillId, params, {
      mcpTool: name
    });
  }
  
  /**
   * 生成 MCP Server 清单
   */
  getManifest() {
    return {
      name: 'personal-agent',
      version: '1.0.0',
      tools: this.getAllTools(),
      capabilities: {
        tools: {
          list: true,
          call: true
        }
      }
    };
  }
  
  /**
   * 创建 MCP Server HTTP 端点处理
   */
  createRequestHandler() {
    return async (req, res) => {
      const { method, params } = req.body;
      
      try {
        switch (method) {
          case 'tools/list':
            res.json({
              tools: this.getAllTools()
            });
            break;
            
          case 'tools/call':
            const result = await this.callTool(
              params.name,
              params.arguments || {}
            );
            res.json({
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2)
                }
              ]
            });
            break;
            
          default:
            res.status(400).json({
              error: `Unknown method: ${method}`
            });
        }
      } catch (error) {
        res.status(500).json({
          error: error.message
        });
      }
    };
  }
}

module.exports = { MCPAdapter };
