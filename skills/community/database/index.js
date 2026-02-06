/**
 * Database Skill - SQL 数据库查询和操作
 */

class DatabaseSkill {
  constructor(config = {}) {
    this.databases = new Map();
    this.config = {
      type: config?.type || 'sqlite',
      ...config
    };
  }
  
  // ========== 元数据 ==========
  
  static metadata = {
    id: 'database',
    name: '数据库',
    description: 'SQL 数据库查询和操作',
    version: '1.0.0',
    parameters: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['connect', 'query', 'tables', 'schema', 'insert', 'update', 'delete', 'disconnect'],
          description: '操作类型'
        },
        database: { type: 'string', description: '数据库连接或文件' },
        query: { type: 'string', description: 'SQL 查询' },
        table: { type: 'string', description: '表名' },
        data: { type: 'object', description: '数据' }
      },
      required: ['action']
    }
  };
  
  // ========== 执行入口 ==========
  
  async execute(params, context = {}) {
    const { action } = params;
    
    switch (action) {
      case 'connect':
        return await this._connect(params.database);
      case 'query':
        return await this._query(params.database, params.query);
      case 'tables':
        return await this._tables(params.database);
      case 'schema':
        return await this._schema(params.database, params.table);
      case 'insert':
        return await this._insert(params.database, params.table, params.data);
      case 'update':
        return await this._update(params.database, params.table, params.data, params.query);
      case 'delete':
        return await this._delete(params.database, params.table, params.query);
      case 'disconnect':
        return await this._disconnect(params.database);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }
  
  // ========== 操作实现 ==========
  
  async _connect(database) {
    // 模拟连接
    this.databases.set(database, {
      connected: true,
      type: this.config.type,
      connectedAt: Date.now()
    });
    
    return {
      status: 'ok',
      database,
      message: `Connected to ${database}`
    };
  }
  
  async _query(database, query) {
    const db = this.databases.get(database);
    
    if (!db) {
      return { status: 'error', error: 'Database not connected' };
    }
    
    // 模拟查询结果
    const normalizedQuery = query.toLowerCase().trim();
    
    if (normalizedQuery.startsWith('select')) {
      return this._mockSelect(query);
    }
    
    return {
      status: 'ok',
      affectedRows: Math.floor(Math.random() * 10) + 1
    };
  }
  
  _mockSelect(query) {
    // 生成模拟数据
    const columns = this._extractColumns(query);
    const rows = Math.floor(Math.random() * 10) + 1;
    
    const data = [];
    for (let i = 0; i < rows; i++) {
      const row = {};
      columns.forEach(col => {
        row[col] = this._mockValue(col);
      });
      data.push(row);
    }
    
    return {
      status: 'ok',
      columns,
      rows: data.length,
      data
    };
  }
  
  _extractColumns(query) {
    const match = query.match(/select\s+(.+?)\s+from/i);
    if (match) {
      return match[1].split(',').map(c => c.trim());
    }
    return ['id', 'name', 'created_at'];
  }
  
  _mockValue(column) {
    const lower = column.toLowerCase();
    
    if (lower.includes('id')) return Math.floor(Math.random() * 1000);
    if (lower.includes('name')) return `Item ${Math.floor(Math.random() * 100)}`;
    if (lower.includes('email')) return `user${Math.floor(Math.random() * 100)}@example.com`;
    if (lower.includes('date') || lower.includes('time') || lower.includes('at')) {
      return new Date(Date.now() - Math.random() * 86400000 * 30).toISOString();
    }
    if (lower.includes('price') || lower.includes('amount')) return (Math.random() * 100).toFixed(2);
    return 'value';
  }
  
  async _tables(database) {
    return {
      status: 'ok',
      tables: [
        { name: 'users', rows: 150 },
        { name: 'orders', rows: 320 },
        { name: 'products', rows: 89 },
        { name: 'categories', rows: 12 }
      ]
    };
  }
  
  async _schema(database, table) {
    const schemas = {
      'users': [
        { name: 'id', type: 'INTEGER', primaryKey: true },
        { name: 'email', type: 'VARCHAR(255)', nullable: false },
        { name: 'name', type: 'VARCHAR(100)' },
        { name: 'created_at', type: 'DATETIME' }
      ],
      'orders': [
        { name: 'id', type: 'INTEGER', primaryKey: true },
        { name: 'user_id', type: 'INTEGER' },
        { name: 'total', type: 'DECIMAL(10,2)' },
        { name: 'status', type: 'VARCHAR(50)' }
      ]
    };
    
    return {
      status: 'ok',
      table,
      columns: schemas[table] || []
    };
  }
  
  async _insert(database, table, data) {
    return {
      status: 'ok',
      table,
      affectedRows: 1,
      inserted: data
    };
  }
  
  async _update(database, table, data, query) {
    return {
      status: 'ok',
      table,
      affectedRows: Math.floor(Math.random() * 5) + 1
    };
  }
  
  async _delete(database, table, query) {
    return {
      status: 'ok',
      table,
      affectedRows: Math.floor(Math.random() * 3) + 1
    };
  }
  
  async _disconnect(database) {
    this.databases.delete(database);
    return {
      status: 'ok',
      database,
      message: 'Disconnected'
    };
  }
  
  // ========== 健康检查 ==========
  
  async healthCheck() {
    return {
      status: 'ok',
      connectedDatabases: this.databases.size
    };
  }
}

module.exports = DatabaseSkill;
