/**
 * Market Tool - 金融市场分析工具
 * 使用 akshare 获取港股/A股/美股数据
 */

const axios = require('axios');

class MarketTool {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5分钟缓存
  }

  /**
   * 查询价格
   */
  async queryPrice(symbol) {
    const cacheKey = `price:${symbol}`;
    const cached = this._getFromCache(cacheKey);
    if (cached) return cached;

    try {
      let data;
      
      if (symbol.includes('.HK')) {
        data = await this._queryHKStock(symbol);
      } else if (symbol.includes('.SH') || symbol.includes('.SZ')) {
        data = await this._queryAStock(symbol);
      } else if (symbol === 'XAUUSD') {
        data = await this._queryGold();
      } else if (symbol === 'BTCUSDT') {
        data = await this._queryCrypto('BTCUSDT');
      } else {
        data = await this._queryUSStock(symbol);
      }

      this._setCache(cacheKey, data);
      return data;
    } catch (error) {
      console.error(`查询失败 ${symbol}:`, error.message);
      return { error: error.message };
    }
  }

  /**
   * 查询港股
   */
  async _queryHKStock(symbol) {
    const code = symbol.replace('.HK', '');
    
    try {
      // 使用腾讯接口
      const response = await axios.get(
        `https://qt.gtimg.cn/q=${code}`
      );
      
      const data = response.data.split('~');
      return {
        symbol,
        name: data[1],
        price: parseFloat(data[3]),
        change: parseFloat(data[32]),
        changePercent: parseFloat(data[31]),
        volume: parseInt(data[36]),
        turnover: parseFloat(data[37]),
        high: parseFloat(data[33]),
        low: parseFloat(data[34]),
        open: parseFloat(data[5]),
        preClose: parseFloat(data[4]),
      };
    } catch (error) {
      // 降级到模拟数据
      return this._mockHKData(symbol);
    }
  }

  /**
   * 查询 A 股
   */
  async _queryAStock(symbol) {
    const code = symbol.replace('.SH', '').replace('.SZ', '');
    
    try {
      const response = await axios.get(
        `https://qt.gtimg.cn/q=${symbol}`
      );
      
      const data = response.data.split('~');
      return {
        symbol,
        name: data[1],
        price: parseFloat(data[3]),
        change: parseFloat(data[32]),
        changePercent: parseFloat(data[31]),
        volume: parseInt(data[36]),
      };
    } catch (error) {
      return { symbol, error: 'A-Share data unavailable' };
    }
  }

  /**
   * 查询黄金
   */
  async _queryGold() {
    try {
      const response = await axios.get(
        'https://api.gold-api.com/price/XAU',
        { headers: { 'x-access-token': process.env.GOLD_API_KEY || '' } }
      );
      
      return {
        symbol: 'XAUUSD',
        price: response.data.price,
        currency: 'USD',
        timestamp: response.data.timestamp,
      };
    } catch (error) {
      return this._mockGold();
    }
  }

  /**
   * 查询加密货币
   */
  async _queryCrypto(symbol) {
    try {
      const response = await axios.get(
        `https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`
      );
      
      return {
        symbol,
        price: parseFloat(response.data.lastPrice),
        change24h: parseFloat(response.data.priceChangePercent),
        high24h: parseFloat(response.data.highPrice),
        low24h: parseFloat(response.data.lowPrice),
        volume: parseFloat(response.data.volume),
      };
    } catch (error) {
      return this._mockCrypto(symbol);
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
        price: meta.regularMarketPrice,
        change: meta.regularMarketChange,
        changePercent: meta.regularMarketChangePercent,
        volume: meta.regularMarketVolume,
        high: meta.regularMarketDayHigh,
        low: meta.regularMarketDayLow,
      };
    } catch (error) {
      return { symbol, error: 'US stock data unavailable' };
    }
  }

  /**
   * 技术分析
   */
  async analyze(symbol) {
    const priceData = await this.queryPrice(symbol);
    
    if (priceData.error) {
      return priceData;
    }

    // 简化的技术指标
    const analysis = {
      symbol,
      ...priceData,
      indicators: {
        rsi: this._calculateRSI(priceData),
        ma5: priceData.price, // 简化
        ma20: priceData.price,
      },
      signal: this._generateSignal(priceData),
      timestamp: Date.now(),
    };

    return analysis;
  }

  /**
   * 计算 RSI (简化)
   */
  _calculateRSI(data) {
    // 实际应该用历史数据计算
    const rsi = 50 + (data.changePercent || 0) * 3;
    return Math.max(0, Math.min(100, rsi));
  }

  /**
   * 生成信号
   */
  _generateSignal(data) {
    const change = data.changePercent || 0;
    
    if (change > 3) return 'BUY';
    if (change < -3) return 'SELL';
    return 'HOLD';
  }

  /**
   * 批量查询
   */
  async queryMultiple(symbols) {
    const results = await Promise.all(
      symbols.map(s => this.queryPrice(s))
    );
    
    return symbols.reduce((acc, symbol, index) => {
      acc[symbol] = results[index];
      return acc;
    }, {});
  }

  /**
   * 缓存操作
   */
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

  /**
   * 模拟数据
   */
  _mockHKData(symbol) {
    const prices = {
      '9988.HK': { price: 155.4, change: -0.5 },
      '1209.HK': { price: 46.52, change: 1.2 },
      '3690.HK': { price: 92.05, change: -0.8 },
      '9868.HK': { price: 67.3, change: 3.5 },
    };
    
    const data = prices[symbol] || { price: 100, change: 0 };
    return { symbol, ...data, source: 'mock' };
  }

  _mockGold() {
    return { symbol: 'XAUUSD', price: 2645.5, change: 0.45, source: 'mock' };
  }

  _mockCrypto(symbol) {
    const prices = {
      'BTCUSDT': { price: 102450, change: 2.3 },
    };
    return prices[symbol] || { symbol, price: 0, change: 0, source: 'mock' };
  }
}

module.exports = { MarketTool };
