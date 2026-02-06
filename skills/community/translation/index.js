/**
 * Translation Skill - 翻译
 * 提供多语言翻译和语言检测功能
 */

class TranslationSkill {
  constructor(config = {}) {
    this.supportedLanguages = {
      'zh': '中文',
      'en': 'English',
      'ja': '日本語',
      'ko': '한국어',
      'fr': 'Français',
      'de': 'Deutsch',
      'es': 'Español',
      'ru': 'Русский',
      'ar': 'العربية',
      'pt': 'Português'
    };
    
    this.languageCodes = {
      '中文': 'zh',
      'Chinese': 'zh',
      '英文': 'en',
      'English': 'en',
      '日语': 'ja',
      'Japanese': 'ja',
      '韩语': 'ko',
      'Korean': 'ko',
      '法语': 'fr',
      'French': 'fr',
      '德语': 'de',
      'German': 'de',
      '西班牙语': 'es',
      'Spanish': 'es',
      '俄语': 'ru',
      'Russian': 'ru',
      '阿拉伯语': 'ar',
      'Arabic': 'ar',
      '葡萄牙语': 'pt',
      'Portuguese': 'pt'
    };
  }
  
  // ========== 元数据 ==========
  
  static metadata = {
    id: 'translation',
    name: '翻译',
    description: '提供多语言翻译和语言检测功能',
    version: '1.0.0',
    parameters: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['translate', 'detect', 'languages'],
          description: '操作类型'
        },
        text: {
          type: 'string',
          description: '要翻译的文本'
        },
        from: {
          type: 'string',
          description: '源语言'
        },
        to: {
          type: 'string',
          description: '目标语言'
        }
      },
      required: ['action']
    }
  };
  
  // ========== 执行入口 ==========
  
  async execute(params, context = {}) {
    const { action } = params;
    
    switch (action) {
      case 'translate':
        return await this._translate(params);
      case 'detect':
        return await this._detect(params);
      case 'languages':
        return this._languages();
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }
  
  // ========== 翻译 ==========
  
  async _translate(params) {
    const { text, from, to } = params;
    
    if (!text) {
      throw new Error('Missing required parameter: text');
    }
    
    if (!to) {
      throw new Error('Missing required parameter: to');
    }
    
    const fromCode = this._normalizeLang(from);
    const toCode = this._normalizeLang(to);
    
    // 检测源语言
    const detectedFrom = fromCode || this._detectLanguage(text);
    
    // 执行翻译 (模拟)
    const translatedText = this._mockTranslate(text, detectedFrom, toCode);
    
    return {
      action: 'translate',
      original: {
        text,
        language: detectedFrom,
        languageName: this.supportedLanguages[detectedFrom] || detectedFrom
      },
      translated: {
        text: translatedText,
        language: toCode,
        languageName: this.supportedLanguages[toCode] || toCode
      },
      timestamp: Date.now()
    };
  }
  
  // ========== 语言检测 ==========
  
  async _detect(params) {
    const { text } = params;
    
    if (!text) {
      throw new Error('Missing required parameter: text');
    }
    
    const detected = this._detectLanguage(text);
    
    return {
      action: 'detect',
      text: text.substring(0, 100),
      language: detected,
      languageName: this.supportedLanguages[detected] || detected,
      confidence: 0.95,
      timestamp: Date.now()
    };
  }
  
  // ========== 支持的语言 ==========
  
  _languages() {
    return {
      supported: Object.entries(this.supportedLanguages).map(([code, name]) => ({
        code,
        name
      })),
      count: Object.keys(this.supportedLanguages).length
    };
  }
  
  // ========== 语言检测 (简化) ==========
  
  _detectLanguage(text) {
    // 基于字符范围简化检测
    const chineseChars = /[\u4e00-\u9fa5]/;
    const japaneseChars = /[\u3040-\u309f\u30a0-\u30ff]/;
    const koreanChars = /[\uac00-\ud7af]/;
    const cyrillic = /[\u0400-\u04ff]/;
    const arabic = /[\u0600-\u06ff]/;
    
    if (chineseChars.test(text)) return 'zh';
    if (japaneseChars.test(text)) return 'ja';
    if (koreanChars.test(text)) return 'ko';
    if (cyrillic.test(text)) return 'ru';
    if (arabic.test(text)) return 'ar';
    
    // 默认英文
    return 'en';
  }
  
  // ========== 标准化语言代码 ==========
  
  _normalizeLang(lang) {
    if (!lang) return null;
    
    const normalized = lang.toLowerCase();
    
    // 直接匹配
    if (this.supportedLanguages[normalized]) {
      return normalized;
    }
    
    // 模糊匹配
    const code = this.languageCodes[lang] || this.languageCodes[normalized];
    return code || null;
  }
  
  // ========== 模拟翻译 ==========
  
  _mockTranslate(text, from, to) {
    // 这是一个简化实现，实际应该调用翻译 API
    // 如 Google Translate, DeepL, 或 OpenAI API
    
    const translations = {
      'zh|en': (t) => `[EN] ${t}`,
      'en|zh': (t) => `[中文] ${this._mockChinese(t)}`,
      'zh|ja': (t) => `[日本語] ${t}`,
      'ja|zh': (t) => `[中文] ${t}`,
      'zh|ko': (t) => `[한국어] ${t}`,
      'default': (t) => `[${to.toUpperCase()}] ${t}`
    };
    
    const key = `${from}|${to}`;
    const translator = translations[key] || translations['default'];
    
    return translator(text);
  }
  
  _mockChinese(text) {
    // 简化: 返回原文+前缀
    return `中文翻译: ${text}`;
  }
  
  // ========== 健康检查 ==========
  
  async healthCheck() {
    return {
      status: 'ok',
      supportedLanguages: Object.keys(this.supportedLanguages).length
    };
  }
}

module.exports = TranslationSkill;
