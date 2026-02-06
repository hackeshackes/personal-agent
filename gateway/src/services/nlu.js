/**
 * 中文 NLP 服务 - jieba 分词 + 意图识别
 */

const jieba = require('jieba');
const natural = require('natural');

class ChineseNLU {
  constructor() {
    // 意图分类器
    this.classifier = new natural.BayesClassifier();
    
    // 实体识别模式
    this.patterns = {
      date: /(\d{4}[-/]\d{1,2}[-/]\d{1,2})|(今天|明天|后天)|(\d+天[前后])|(周[一二三四五六日])/g,
      time: /(\d{1,2}:\d{2})|(早上|下午|晚上)|(\d+点)/g,
      number: /(\d+(\.\d+)?(千|万|亿)?)/gi,
      money: /(\$|¥|￥)\d+(\.\d+)?/g,
      file: /(\.[a-z]+)$/gi,
      stock: /(\d{4}\.HK|\d{6}\.(SH|SZ))/g,
    };
    
    // 训练意图分类器
    this._train();
  }
  
  /**
   * 训练意图分类器
   */
  _train() {
    // 聊天意图
    this.classifier.addDocument('你好', 'greeting');
    this.classifier.addDocument('在吗', 'greeting');
    this.classifier.addDocument('帮我个忙', 'greeting');
    this.classifier.addDocument('最近怎么样', 'greeting');
    
    // 市场查询意图
    this.classifier.addDocument('黄金价格', 'market_query');
    this.classifier.addDocument('比特币现在多少', 'market_query');
    this.classifier.addDocument('阿里巴巴股价', 'market_query');
    this.classifier.addDocument('港股行情', 'market_query');
    this.classifier.addDocument('美股走势', 'market_query');
    this.classifier.addDocument('今天的行情', 'market_query');
    
    // 文件操作意图
    this.classifier.addDocument('打开文件', 'file_open');
    this.classifier.addDocument('列出文件', 'file_list');
    this.classifier.addDocument('创建文件', 'file_create');
    this.classifier.addDocument('删除文件', 'file_delete');
    this.classifier.addDocument('搜索文件', 'file_search');
    
    // 日历意图
    this.classifier.addDocument('今天有什么安排', 'calendar_today');
    this.classifier.addDocument('明天的日程', 'calendar_tomorrow');
    this.classifier.addDocument('添加日程', 'calendar_add');
    this.classifier.addDocument('删除日程', 'calendar_remove');
    this.classifier.addDocument('这周的计划', 'calendar_week');
    
    // 邮件意图
    this.classifier.addDocument('检查邮件', 'mail_check');
    this.classifier.addDocument('发送邮件', 'mail_send');
    this.classifier.addDocument('未读邮件', 'mail_unread');
    this.classifier.addDocument('最近邮件', 'mail_recent');
    
    // 计算意图
    this.classifier.addDocument('帮我算一下', 'calculate');
    this.classifier.addDocument('等于多少', 'calculate');
    this.classifier.addDocument('多少', 'calculate');
    
    // 搜索意图
    this.classifier.addDocument('搜索', 'search');
    this.classifier.addDocument('查找', 'search');
    this.classifier.addDocument('帮我找', 'search');
    
    // 系统意图
    this.classifier.addDocument('关机', 'system_shutdown');
    this.classifier.addDocument('重启', 'system_reboot');
    this.classifier.addDocument('显示状态', 'system_status');
    
    this.classifier.train();
  }
  
  /**
   * 分析用户输入
   */
  analyze(text) {
    // 分词
    const tokens = jieba.cut(text);
    const words = Array.from(tokens).filter(w => w.trim());
    
    // 意图识别
    const intent = this.classifier.getClassifications(text)[0].value;
    const confidence = this.classifier.getClassifications(text)[0].value;
    
    // 实体抽取
    const entities = this.extractEntities(text);
    
    return {
      text,
      tokens: words,
      intent,
      confidence,
      entities,
      originalText: text
    };
  }
  
  /**
   * 抽取实体
   */
  extractEntities(text) {
    const entities = {
      dates: [],
      times: [],
      numbers: [],
      money: [],
      files: [],
      stocks: [],
    };
    
    // 日期
    const dates = text.match(this.patterns.date);
    if (dates) entities.dates = dates;
    
    // 时间
    const times = text.match(this.patterns.time);
    if (times) entities.times = times;
    
    // 数字
    const numbers = text.match(this.patterns.number);
    if (numbers) entities.numbers = numbers;
    
    // 金额
    const money = text.match(this.patterns.money);
    if (money) entities.money = money;
    
    // 文件
    const files = text.match(this.patterns.file);
    if (files) entities.files = files;
    
    // 股票
    const stocks = text.match(this.patterns.stock);
    if (stocks) entities.stocks = stocks;
    
    return entities;
  }
  
  /**
   * 解析日期实体
   */
  parseDate(dateStr) {
    const now = new Date();
    
    if (dateStr.includes('今天')) return now;
    if (dateStr.includes('明天')) {
      now.setDate(now.getDate() + 1);
      return now;
    }
    if (dateStr.includes('后天')) {
      now.setDate(now.getDate() + 2);
      return now;
    }
    
    // 解析 "N天前/后"
    const match = dateStr.match(/(\d+)天([前后])/);
    if (match) {
      const days = parseInt(match[1]);
      if (match[2] === '前') {
        now.setDate(now.getDate() - days);
      } else {
        now.setDate(now.getDate() + days);
      }
      return now;
    }
    
    // 解析 "周X"
    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const weekMatch = weekDays.findIndex(d => dateStr.includes(d));
    if (weekMatch >= 0) {
      const currentDay = now.getDay();
      const targetDay = weekMatch === 0 ? 7 : weekMatch;
      const diff = targetDay - currentDay;
      now.setDate(now.getDate() + diff);
      return now;
    }
    
    // 解析 YYYY-MM-DD
    const dateMatch = dateStr.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (dateMatch) {
      return new Date(parseInt(dateMatch[1]), parseInt(dateMatch[2]) - 1, parseInt(dateMatch[3]));
    }
    
    return null;
  }
  
  /**
   * 解析数字
   */
  parseNumber(numStr) {
    let num = parseFloat(numStr);
    
    if (numStr.includes('万')) num *= 10000;
    if (numStr.includes('亿')) num *= 100000000;
    if (numStr.includes('千')) num *= 1000;
    
    return num;
  }
  
  /**
   * 生成回复模板
   */
  generateResponse(intent, entities, originalText) {
    const templates = {
      greeting: '你好！我是小智，你的个人AI助理。有什么可以帮你的吗？',
      market_query: '让我查询一下市场数据...',
      file_open: '正在打开文件...',
      file_list: '这是文件列表：',
      file_create: '好的，我来创建文件。',
      file_delete: '请确认要删除的文件。',
      file_search: '搜索中...',
      calendar_today: '今天的日程安排如下：',
      calendar_tomorrow: '明天的日程安排如下：',
      calendar_week: '这周的计划：',
      calendar_add: '好的，添加日程。请问具体时间和内容是什么？',
      calendar_remove: '删除日程。',
      mail_check: '正在检查邮件...',
      mail_unread: '你有未读邮件：',
      mail_recent: '最近的邮件：',
      calculate: '计算结果：',
      search: '搜索中...',
      system_status: '系统状态正常。',
    };
    
    return templates[intent] || '我理解你的意图，让我处理一下...';
  }
}

module.exports = { ChineseNLU };
