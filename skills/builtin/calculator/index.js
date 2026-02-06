/**
 * Calculator Skill - 计算器工具
 * 支持数学运算、货币换算、百分比计算
 */

class CalculatorSkill {
  constructor(config = {}) {
    this.name = 'calculator';
    this.version = '1.0.0';
  }
  
  // ========== 元数据 ==========
  
  static metadata = {
    id: 'calculator',
    name: '计算器',
    description: '提供数学计算、货币换算、百分比计算等常用计算功能',
    version: '1.0.0',
    parameters: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['calculate', 'convert', 'percentage', 'finance'],
          description: '计算类型'
        },
        expression: {
          type: 'string',
          description: '数学表达式'
        },
        from: {
          type: 'string',
          description: '源货币/单位'
        },
        to: {
          type: 'string',
          description: '目标货币/单位'
        },
        value: {
          type: 'number',
          description: '要计算的值'
        },
        rate: {
          type: 'number',
          description: '汇率或比率'
        }
      },
      required: ['action']
    }
  };
  
  // ========== 执行入口 ==========
  
  async execute(params, context = {}) {
    const { action } = params;
    
    switch (action) {
      case 'calculate':
        return await this._calculate(params);
      case 'convert':
        return await this._convert(params);
      case 'percentage':
        return await this._percentage(params);
      case 'finance':
        return await this._finance(params);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }
  
  // ========== 数学计算 ==========
  
  async _calculate(params) {
    const { expression } = params;
    
    if (!expression) {
      throw new Error('Missing required parameter: expression');
    }
    
    // 安全计算
    const result = this._safeEval(expression);
    
    return {
      action: 'calculate',
      expression,
      result: this._formatNumber(result),
      formatted: this._formatCurrency(result)
    };
  }
  
  // ========== 货币换算 ==========
  
  async _convert(params) {
    const { value, from, to } = params;
    
    if (value === undefined || !from || !to) {
      throw new Error('Missing required parameters: value, from, to');
    }
    
    const rate = this._getExchangeRate(from, to);
    const result = value * rate;
    
    return {
      action: 'convert',
      from,
      to,
      value,
      rate,
      result: this._formatNumber(result),
      formatted: this._formatCurrency(result, to)
    };
  }
  
  // ========== 百分比计算 ==========
  
  async _percentage(params) {
    const { value, rate, action = 'of' } = params;
    
    if (value === undefined || rate === undefined) {
      throw new Error('Missing required parameters: value, rate');
    }
    
    let result;
    let description;
    
    switch (action) {
      case 'of':
        result = value * (rate / 100);
        description = `${rate}% of ${value}`;
        break;
      case 'what_percent':
        result = (rate / value) * 100;
        description = `${rate} is what percent of ${value}`;
        break;
      case 'increase':
        result = value * (1 + rate / 100);
        description = `${value} + ${rate}%`;
        break;
      case 'decrease':
        result = value * (1 - rate / 100);
        description = `${value} - ${rate}%`;
        break;
      default:
        result = value * (rate / 100);
        description = `${rate}% of ${value}`;
    }
    
    return {
      action: 'percentage',
      originalValue: value,
      percentage: rate,
      operation: action,
      result: this._formatNumber(result),
      description
    };
  }
  
  // ========== 金融计算 ==========
  
  async _finance(params) {
    const { type, principal, rate, time, ...others } = params;
    
    switch (type) {
      case 'compound':
        return this._compoundInterest(principal, rate, time);
      case 'simple':
        return this._simpleInterest(principal, rate, time);
      case 'mortgage':
        return this._mortgage(principal, rate, time);
      case 'roi':
        return this._roi(principal, rate, others);
      default:
        throw new Error(`Unknown finance type: ${type}`);
    }
  }
  
  // ========== 金融公式 ==========
  
  _compoundInterest(principal, annualRate, years) {
    const r = annualRate / 100;
    const n = 12; // 月复利
    const t = years;
    
    const amount = principal * Math.pow(1 + r/n, n * t);
    const interest = amount - principal;
    
    return {
      type: 'compound',
      principal: this._formatCurrency(principal),
      annualRate,
      years,
      total: this._formatCurrency(amount),
      interest: this._formatCurrency(interest)
    };
  }
  
  _simpleInterest(principal, annualRate, years) {
    const interest = principal * (annualRate / 100) * years;
    const amount = principal + interest;
    
    return {
      type: 'simple',
      principal: this._formatCurrency(principal),
      annualRate,
      years,
      total: this._formatCurrency(amount),
      interest: this._formatCurrency(interest)
    };
  }
  
  _mortgage(principal, annualRate, years) {
    const r = annualRate / 100 / 12;
    const n = years * 12;
    
    const monthlyPayment = principal * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    const totalPayment = monthlyPayment * n;
    const totalInterest = totalPayment - principal;
    
    return {
      type: 'mortgage',
      principal: this._formatCurrency(principal),
      annualRate,
      years,
      monthlyPayment: this._formatCurrency(monthlyPayment),
      totalPayment: this._formatCurrency(totalPayment),
      totalInterest: this._formatCurrency(totalInterest)
    };
  }
  
  _roi(investment, returnValue, _) {
    const profit = returnValue - investment;
    const roi = (profit / investment) * 100;
    
    return {
      type: 'roi',
      investment: this._formatCurrency(investment),
      return: this._formatCurrency(returnValue),
      profit: this._formatCurrency(profit),
      roi: roi.toFixed(2) + '%'
    };
  }
  
  // ========== 工具方法 ==========
  
  _safeEval(expression) {
    // 只允许数字和基本运算符
    const sanitized = expression.replace(/[^0-9+\-*/().\s]/g, '');
    
    try {
      return eval(sanitized);
    } catch (error) {
      throw new Error(`Invalid expression: ${expression}`);
    }
  }
  
  _getExchangeRate(from, to) {
    // 简化汇率 (实际应该调用 API)
    const rates = {
      'USD': { 'CNY': 7.2, 'EUR': 0.92, 'JPY': 149.5 },
      'CNY': { 'USD': 0.14, 'EUR': 0.13, 'JPY': 20.7 },
      'EUR': { 'USD': 1.09, 'CNY': 7.8, 'JPY': 162.5 },
      'JPY': { 'USD': 0.0067, 'CNY': 0.048, 'EUR': 0.0062 }
    };
    
    const fromRate = rates[from.toUpperCase()];
    if (!fromRate) {
      throw new Error(`Unknown currency: ${from}`);
    }
    
    const rate = fromRate[to.toUpperCase()];
    if (!rate) {
      throw new Error(`Unknown target currency: ${to}`);
    }
    
    return rate;
  }
  
  _formatNumber(num) {
    if (Number.isInteger(num)) {
      return num.toLocaleString('en-US');
    }
    return num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
  
  _formatCurrency(value, currency = 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(value);
  }
  
  // ========== 健康检查 ==========
  
  async healthCheck() {
    return { status: 'ok', skill: 'calculator' };
  }
}

module.exports = CalculatorSkill;
