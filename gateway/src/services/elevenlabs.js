/**
 * ElevenLabs TTS Service - 语音合成服务
 * 支持 ElevenLabs API 和本地 TTS
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');

class ElevenLabsService {
  constructor() {
    this.apiKey = process.env.ELEVENLABS_API_KEY;
    this.baseUrl = 'https://api.elevenlabs.io/v1';
    this.voices = {
      'zh': '21m00Tcm4TlvDq8ikWAM',  // Rachel (English)
      'zh_female': 'EXAVITQu4vr4xnSDxMaL',  // Bella (English)
      'zh_male': 'nPczCjz82KWdKScP46A1X',  // Adam (English)
    };
    
    this.defaultVoice = 'zh_female';
    this.stability = 0.5;
    this.similarityBoost = 0.75;
  }

  /**
   * 语音合成
   */
  async synthesize(text, options = {}) {
    console.log(`🔊 合成语音: "${text.substring(0, 30)}..."`);

    const {
      voiceId = this.voices.zh,
      stability = this.stability,
      similarityBoost = this.similarityBoost,
      outputFormat = 'mp3_44100_128'
    } = options;

    // 检查 API Key
    if (!this.apiKey) {
      console.warn('⚠️ ElevenLabs API Key 未配置，使用占位符');
      return this._generatePlaceholder(text);
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/text-to-speech/${voiceId}`,
        {
          text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability,
            similarity_boost: similarityBoost,
          }
        },
        {
          headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': this.apiKey
          },
          responseType: 'arraybuffer',
          timeout: 30000
        }
      );

      // 保存音频文件
      const outputPath = this._getOutputPath(text);
      fs.writeFileSync(outputPath, response.data);
      
      console.log(`✅ 音频已保存: ${outputPath}`);
      
      return {
        success: true,
        path: outputPath,
        url: `/audio/${path.basename(outputPath)}`,
        duration: response.headers['content-duration'] || 0
      };

    } catch (error) {
      console.error('TTS 失败:', error.message);
      return this._generatePlaceholder(text);
    }
  }

  /**
   * 生成占位音频 (实际应集成离线 TTS)
   */
  _generatePlaceholder(text) {
    const outputPath = this._getOutputPath(text);
    
    // 写入文本文件作为占位
    fs.writeFileSync(
      outputPath.replace('.mp3', '.txt'),
      JSON.stringify({ text, timestamp: Date.now() })
    );
    
    console.log(`⚠️ 使用占位文件: ${outputPath}`);
    
    return {
      success: false,
      path: outputPath,
      error: 'TTS unavailable',
      text
    };
  }

  /**
   * 生成输出路径
   */
  _getOutputPath(text) {
    const audioDir = path.join(__dirname, '../../data/audio');
    if (!fs.existsSync(audioDir)) {
      fs.mkdirSync(audioDir, { recursive: true });
    }
    
    const hash = require('crypto')
      .createHash('md5')
      .update(text + Date.now())
      .digest('hex')
      .substring(0, 8);
    
    return path.join(audioDir, `tts_${hash}.mp3`);
  }

  /**
   * 获取可用声音列表
   */
  async getVoices() {
    if (!this.apiKey) {
      return [
        { id: 'zh_female', name: 'Bella (English)', languages: ['en'] },
        { id: 'zh_male', name: 'Adam (English)', languages: ['en'] },
      ];
    }

    try {
      const response = await axios.get(
        `${this.baseUrl}/voices`,
        {
          headers: { 'xi-api-key': this.apiKey }
        }
      );

      return response.data.voices.map(v => ({
        id: v.voice_id,
        name: v.name,
        languages: v.languages || ['en'],
        gender: v.gender
      }));
    } catch (error) {
      console.error('获取声音列表失败:', error.message);
      return [];
    }
  }

  /**
   * 声音克隆 (高级功能)
   */
  async cloneVoice(name, samples) {
    if (!this.apiKey) {
      throw new Error('ElevenLabs API Key required');
    }

    const FormData = require('form-data');
    
    const form = new FormData();
    form.append('name', name);
    form.append('description', `Voice clone for ${name}`);

    samples.forEach(sample => {
      form.append('files', fs.createReadStream(sample));
    });

    const response = await axios.post(
      `${this.baseUrl}/voices/add`,
      form,
      {
        headers: {
          'xi-api-key': this.apiKey,
          ...form.getHeaders()
        }
      }
    );

    return response.data.voice_id;
  }

  /**
   * 短文本优化 (用于回复)
   */
  async synthesizeReply(text) {
    // 优化短文本的 TTS
    return this.synthesize(text, {
      stability: 0.3,  // 更一致的输出
      similarityBoost: 0.8  // 更高的相似度
    });
  }

  /**
   * 获取使用统计
   */
  async getUsage() {
    if (!this.apiKey) {
      return { character_count: 0, character_limit: 10000 };
    }

    try {
      const response = await axios.get(
        `${this.baseUrl}/user`,
        {
          headers: { 'xi-api-key': this.apiKey }
        }
      );

      return {
        character_count: response.data.subscription.character_count,
        character_limit: response.data.subscription.character_limit
      };
    } catch (error) {
      return { character_count: 0, character_limit: 0 };
    }
  }
}

module.exports = { ElevenLabsService };
