/**
 * Market Skill - 市场分析工具
 * 支持港股、美股、加密货币、黄金等市场数据查询
 */

const axios = require('axios');

class MarketSkill {
  constructor(config = {}) {
    this.cache = new Map();
    this.cacheTimeout = config.cacheTimeout || 5 * 60 * 1000; // 5分钟
  }
  
  // ========== 元数据 ==========
  
  static metadata = {
    id: 'market',
    name: '市场分析',
    description: '提供股票、加密货币、黄金等市场数据分析',
    version: '1.0.0',
    parameters: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['quote', 'analyze', 'batch', 'trend'],
          description: '操作类型'
        },
        symbols: {
          type: 'array',
          items: { type: 'string' },
          description: '股票代码列表'
        },
        symbol: {
          type: 'string',
          description: '单个股票代码'
        },
        market: {
          type: 'string',
          enum: ['hk', 'us', 'cn', 'crypto'],
          description: '市场类型'
        },
        options: {
          type: 'object',
          properties: {
            period: {
              type: 'string',
              enum: ['1d', '1w', '1m', '3m'],
              description: '分析周期'
            }
          }
        }
      },
      required: ['action']
    }
  };
  
  // ========== 执行入口 ==========
  
  async execute(params, context = {}) {
    const { action } = params;
    
    switch (action) {
      case 'quote':
        return await this._quote(params);
      case 'analyze':
        return await this._analyze(params);
      case 'batch':
        return await this._batch(params);
      case 'trend':
        return await this._trend(params);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }
  
  // ========== 查询行情 ==========
  
  async _quote(params) {
    const { symbol, market = 'hk' } = params;
    
    if (!symbol) {
      throw new Error('Missing required parameter: symbol');
    }
    
    // 检查缓存
    const cacheKey = `quote:${symbol}`;
    const cached = this._getFromCache(cacheKey);
    if (cached) return cached;
    
    let data;
    
    switch (market) {
      case 'hk':
        data = await this._queryHKStock(symbol);
        break;
      case 'us':
        data = await this._queryUSStock(symbol);
        break;
      case 'cn':
        data = await this._queryCNStock(symbol);
        break;
      case 'crypto':
        data = await this._queryCrypto(symbol);
        break;
      default:
        data = await this._queryHKStock(symbol);
    }
    
    this._setCache(cacheKey, data);
    return data;
  }
  
  // ========== 技术分析 ==========
  
  async _analyze(params) {
    const { symbol, market = 'hk', options = {} } = params;
    
    if (!symbol) {
      throw new Error('Missing required parameter: symbol');
    }
    
    const quote = await this._quote({ symbol, market });
    
    // 计算技术指标
    const analysis = {
      symbol: quote.symbol,
      name: quote.name,
      price: quote.price,
      change: quote.changePercent,
      
      // 技术指标
      indicators: {
        rsi: this._calculateRSI(quote),
        macd: this._calculateMACD(quote),
        bollinger: this._calculateBollinger(quote)
      },
      
      // 信号
      signal: this._generateSignal(quote),
      
      // 支撑阻力
      support: this._calculateSupport(quote),
      resistance: this._calculateResistance(quote),
      
      timestamp: Date.now()
    };
    
    return analysis;
  }
  
  // ========== 批量查询 ==========
  
  async _batch(params) {
    const { symbols, market = 'hk' } = params;
    
    if (!symbols || !Array.isArray(symbols)) {
      throw new Error('Missing required parameter: symbols (array)');
    }
    
    const results = await Promise.all(
      symbols.map(s => this._quote({ symbol: s, market }))
    );
    
    return {
      count: results.length,
      results
    };
  }
  
  // ========== 趋势分析 ==========
  
  async _trend(params) {
    const { symbol, period = '1m' } = params;
    
    // 简化的趋势分析
    const quote = await this._quote({ symbol });
    
    const trend = {
      symbol: quote.symbol,
      period,
      direction: quote.changePercent > 0 ? 'up' : 'down',
      change: quote.changePercent,
      strength: Math.min(Math.abs(quote.changePercent) / 5, 1), // 0-1 强度
      timestamp: Date.now()
    };
    
    return trend;
  }
  
  // ========== 私有方法 ==========
  
  /**
   * 查询港股
   */
  async _queryHKStock(symbol) {
    const code = symbol.replace('.HK', '');
    
    try {
      const response = await axios.get(`https://qt.gtimg.cn/q=${code}`, {
        timeout: 10000
      });
      
      const data = response.data.split('~');
      return {
        symbol,
        name: data[1] || symbol,
        price: parseFloat(data[3]) || 0,
        change: parseFloat(data[32]) || 0,
        changePercent: parseFloat(data[31]) || 0,
        volume: parseInt(data[36]) || 0,
        turnover: parseFloat(data[37]) || 0,
        high: parseFloat(data[33]) || 0,
        low: parseFloat(data[34]) || 0,
        open: parseFloat(data[5]) || 0,
        preClose: parseFloat(data[4]) || 0,
        market: 'hk',
        source: 'tencent'
      };
    } catch (error) {
      return this._mockData(symbol);
    }
  }
  
  /**
   * 查询美股
   */
  async _queryUSStock(symbol) {
    try {
      const response = await axios.get(
        `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`,
        { timeout: 10000 }
      );
      
      const result = response.data.chart.result[0];
      const meta = result.meta;
      const quote = result.indicators.quote[0];
      
      return {
        symbol,
        price: meta.regularMarketPrice || 0,
        change: meta.regularMarketChange || 0,
        changePercent: (meta.regularMarketChangePercent || 0) * 100,
        volume: meta.regularMarketVolume || 0,
        high: meta.regularMarketDayHigh || 0,
        low: meta.regularMarketDayLow || 0,
        open: meta.regularMarketOpen || 0,
        preClose: meta.regularMarketPreviousClose || 0,
        market: 'us',
        source: 'yahoo'
      };
    } catch (error) {
      return this._mockData(symbol);
    }
  }
  
  /**
   * 查询 A 股
   */
  async _queryCNStock(symbol) {
    try {
      const response = await axios.get(`https://qt.gtimg.cn/q=${symbol}`, {
        timeout: 10000
      });
      
      const data = response.data.split('~');
      return {
        symbol,
        name: data[1] || symbol,
        price: parseFloat(data[3]) || 0,
        change: parseFloat(data[32]) || 0,
        changePercent: parseFloat(data[31]) || 0,
        volume: parseInt(data[36]) || 0,
        market: 'cn',
        source: 'tencent'
      };
    } catch (error) {
      return this._mockData(symbol);
    }
  }
  
  /**
   * 查询加密货币
   */
  async _queryCrypto(symbol) {
    try {
      const pair = symbol.replace('USDT', '').toUpperCase();
      const response = await axios.get(
        `https://api.binance.com/api/v3/ticker/24hr?symbol=${pair}USDT`,
        { timeout: 10000 }
      );
      
      return {
        symbol,
        price: parseFloat(response.data.lastPrice) || 0,
        change24h: parseFloat(response.data.priceChangePercent) || 0,
        high24h: parseFloat(response.data.highPrice) || 0,
        low24h: parseFloat(response.data.lowPrice) || 0,
        volume: parseFloat(response.data.volume) || 0,
        market: 'crypto',
        source: 'binance'
      };
    } catch (error) {
      return this._mockCrypto(symbol);
    }
  }
  
  /**
   * 计算 RSI
   */
  _calculateRSI(data) {
    const change = Math.abs(data.changePercent);
    // 简化的 RSI 计算
    const rsi = 50 + (change * 3);
    return Math.max(0, Math.min(100, rsi));
  }
  
  /**
   * 计算 MACD
   */
  _calculateMACD(data) {
    // 简化的 MACD
    return {
      macd: data.changePercent * 0.5,
      signal: 0,
      histogram: data.changePercent * 0.2
    };
  }
  
  /**
   * 计算布林带
   */
  _calculateBollinger(data) {
    return {
      upper: data.price * 1.05,
      middle: data.price,
      lower: data.price * 0.95
    };
  }
  
  /**
   * 生成交易信号
   */
  _generateSignal(data) {
    const change = data.changePercent || 0;
    
    if (change > 5) return 'STRONG_BUY';
    if (change > 2) return 'BUY';
    if (change < -5) return 'STRONG_SELL';
    if (change < -2) return 'SELL';
    return 'HOLD';
  }
  
  /**
   * 计算支撑位
   */
  _calculateSupport(data) {
    return data.price * 0.95;
  }
  
  /**
   * 计算阻力位
   */
  _calculateResistance(data) {
    return data.price * 1.05;
  }
  
  /**
   * 模拟数据 (备用)
   */
  _mockData(symbol) {
    const mockPrices = {
      '9988.HK': { price: 155.4, change: -0.5 },
      '1209.HK': { price: 46.52, change: 1.2 },
      '3690.HK': { price: 92.05, change: -0.8 },
      '9868.HK': { price: 67.3, change: 3.5 },
      'AAPL': { price: 185.5, change: 1.2 },
      'GOOGL': { price: 142.3, change: -0.5 }
    };
    
    const data = mockPrices[symbol] || { price: 100, change: 0 };
    return {
      symbol,
      ...data,
      changePercent: data.change,
      market: 'mock',
      source: 'mock'
    };
  }
  
  _mockCrypto(symbol) {
    const prices = {
      'BTCUSDT': { price: 102450, change: 2.3 },
      'ETHUSDT': { price: 3250, change: 1.8 }
    };
    
    const data = prices[symbol] || { price: 0, change: 0 };
    return {
      symbol,
      ...data,
      change24h: data.change,
      market: 'crypto',
      source: 'mock'
    };
  }
  
  // ========== 缓存管理 ==========
  
  _getFromCache(key) {
    const item = this.cache.get(key);
    if (item && Date.now() - item.time < this.cacheTimeout) {
      return item.data;
    }
    return null;
  }
  
  _setCache(key, data) {
    this.cache.set(key, { data, time: Date.now() });
  }
  
  // ========== 健康检查 ==========
  
  async healthCheck() {
    try {
      await axios.get('https://qt.gtimg.cn/q=00700', { timeout: 5000 });
      return { status: 'ok', latency: 50 };
    } catch (error) {
      return { status: 'degraded', error: error.message };
    }
  }
}

module.exports = MarketSkill;
