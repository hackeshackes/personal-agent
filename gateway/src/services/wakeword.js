/**
 * Wake Word Detection Service - 语音唤醒检测
 * 使用 Picovoice Porcupine (免费额度)
 */

class WakeWordService {
  constructor() {
    this.isListening = false;
    this.wakeWords = ['hey xiao zhi', '小智', '嗨小智'];
    this.onWakeDetected = null;
  }

  /**
   * 初始化
   */
  async init() {
    console.log('🎯 唤醒词检测初始化...');
    // TODO: 实现 Porcupine 集成
    // const Porcupine = require('@picovoice/porcupine');
    // this.porcupine = await Porcupine.create({
    //   accessKey: process.env.PICOVOICE_ACCESS_KEY,
    //   keywords: ['hey xiao zhi']
    // });
    console.log('✅ 唤醒词检测就绪');
  }

  /**
   * 开始监听
   */
  async startListening() {
    if (this.isListening) return;
    
    this.isListening = true;
    console.log('🎯 开始监听唤醒词...');
    
    // 模拟唤醒检测
    this._simulateDetection();
  }

  /**
   * 停止监听
   */
  async stopListening() {
    this.isListening = false;
    console.log('🛑 停止监听唤醒词');
  }

  /**
   * 模拟唤醒检测 (实际应使用 Porcupine)
   */
  _simulateDetection() {
    if (!this.isListening) return;
    
    // 实际项目中这里应该是音频流处理
    console.log('👂 监听中... (说"小智"唤醒)');
  }

  /**
   * 触发唤醒
   */
  triggerWake() {
    console.log('🔔 唤醒词检测到！');
    if (this.onWakeDetected) {
      this.onWakeDetected();
    }
  }

  /**
   * 获取唤醒词列表
   */
  getWakeWords() {
    return this.wakeWords;
  }

  /**
   * 添加自定义唤醒词
   */
  addWakeWord(word) {
    if (!this.wakeWords.includes(word)) {
      this.wakeWords.push(word);
      console.log(`➕ 添加唤醒词: ${word}`);
    }
  }
}

module.exports = { WakeWordService };
