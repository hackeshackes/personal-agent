/**
 * Whisper ASR Service - 语音识别服务
 * 支持本地 Whisper 或 OpenAI Whisper API
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class WhisperService {
  constructor() {
    this.modelPath = process.env.WHISPER_MODEL_PATH || './models/whisper';
    this.useLocal = process.env.WHISPER_LOCAL === 'true';
  }

  /**
   * 转录音频
   */
  async transcribe(audioPath, options = {}) {
    console.log(`🔄 转录中: ${audioPath}`);

    const {
      language = 'zh',
      model = 'base',
      prompt = ''
    } = options;

    try {
      if (this.useLocal) {
        return await this._transcribeLocal(audioPath, { language, model });
      } else {
        return await this._transcribeAPI(audioPath, { language, prompt });
      }
    } catch (error) {
      console.error('转录失败:', error);
      throw error;
    }
  }

  /**
   * 本地 Whisper 转录
   */
  async _transcribeLocal(audioPath, options) {
    // 使用 whisper 命令行
    const whisperPath = process.env.WHISPER_PATH || 'whisper';
    
    return new Promise((resolve, reject) => {
      const proc = spawn(whisperPath, [
        audioPath,
        '--model', options.model,
        '--language', options.language,
        '--no_timestamps',
        '--output_format', 'json'
      ]);

      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      proc.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      proc.on('close', (code) => {
        if (code === 0) {
          // 读取输出 JSON
          const outputPath = audioPath.replace(/\.[^.]+$/, '.json');
          if (fs.existsSync(outputPath)) {
            const result = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
            resolve({
              text: result.text,
              segments: result.segments,
              language: result.language
            });
          } else {
            resolve({ text: stdout.trim() });
          }
        } else {
          // 降级到 API
          this._transcribeAPI(audioPath, options).then(resolve).catch(reject);
        }
      });
    });
  }

  /**
   * OpenAI Whisper API 转录
   */
  async _transcribeAPI(audioPath, options) {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    const FormData = require('form-data');
    const axios = require('axios');
    
    const form = new FormData();
    form.append('file', fs.createReadStream(audioPath));
    form.append('model', 'whisper-1');
    form.append('language', options.language);
    form.append('response_format', 'verbose_json');

    if (options.prompt) {
      form.append('prompt', options.prompt);
    }

    const response = await axios.post(
      'https://api.openai.com/v1/audio/transcriptions',
      form,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          ...form.getHeaders()
        },
        timeout: 60000
      }
    );

    return {
      text: response.data.text,
      segments: response.data.segments || [],
      language: response.data.language
    };
  }

  /**
   * 实时转录 (流式)
   */
  async *transcribeStream(audioStream) {
    // TODO: 实现流式转录
    // 使用 WebSocket 连接到 Whisper API
    console.log('🎤 流式转录启动...');
    
    yield { status: 'listening' };
  }

  /**
   * 生成带时间戳的字幕
   */
  async generateSubtitles(audioPath) {
    const result = await this.transcribe(audioPath, { language: 'zh' });
    
    if (result.segments) {
      return result.segments.map(seg => ({
        start: seg.start,
        end: seg.end,
        text: seg.text
      }));
    }
    
    return [];
  }

  /**
   * 检测语言
   */
  async detectLanguage(audioPath) {
    const result = await this.transcribe(audioPath, { 
      language: null // 让模型自动检测
    });
    return result.language;
  }
}

module.exports = { WhisperService };
