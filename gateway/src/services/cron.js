/**
 * Cron Manager - 任务调度
 * 周期性任务管理
 */

const fs = require('fs');
const path = require('path');

class CronManager {
  constructor() {
    this.jobs = new Map();
    this.dataDir = path.join(__dirname, '../../data');
    
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  /**
   * 添加任务
   */
  add(jobInfo) {
    const job = {
      id: jobInfo.id || `job-${Date.now()}`,
      name: jobInfo.name || '未命名任务',
      schedule: jobInfo.schedule, // { kind: 'cron', expr: '*/5 * * * *' } | { kind: 'every', everyMs: 300000 }
      payload: jobInfo.payload, // { kind: 'systemEvent' | 'agentTurn', ... }
      enabled: jobInfo.enabled !== false,
      sessionTarget: jobInfo.sessionTarget || 'main',
      createdAt: Date.now(),
      lastRun: null,
      nextRun: null,
      runCount: 0
    };

    this.calculateNextRun(job);
    this.jobs.set(job.id, job);
    console.log(`⏰ 任务添加: ${job.name} (${job.schedule.kind})`);
    return job;
  }

  /**
   * 计算下次运行时间
   */
  calculateNextRun(job) {
    const now = Date.now();
    
    if (job.schedule.kind === 'every') {
      job.nextRun = now + job.schedule.everyMs;
    } else if (job.schedule.kind === 'cron') {
      // 简化的 cron 解析，实际应使用 cron-parser
      const interval = this.parseCronInterval(job.schedule.expr);
      if (interval) {
        job.nextRun = now + interval;
      }
    }
  }

  /**
   * 解析 cron 表达式为毫秒间隔
   */
  parseCronInterval(expr) {
    // 简化实现: */5 * * * * -> 5分钟
    const parts = expr.split(' ');
    if (parts[0].startsWith('*/')) {
      const minutes = parseInt(parts[0].slice(2));
      return minutes * 60 * 1000;
    }
    return 5 * 60 * 1000; // 默认5分钟
  }

  /**
   * 获取任务
   */
  get(jobId) {
    return this.jobs.get(jobId);
  }

  /**
   * 列出所有任务
   */
  list() {
    return Array.from(this.jobs.values()).map(j => ({
      id: j.id,
      name: j.name,
      schedule: j.schedule,
      enabled: j.enabled,
      nextRun: j.nextRun,
      lastRun: j.lastRun,
      runCount: j.runCount
    }));
  }

  /**
   * 更新任务
   */
  update(jobId, updates) {
    const job = this.jobs.get(jobId);
    if (job) {
      Object.assign(job, updates);
      this.calculateNextRun(job);
    }
    return job;
  }

  /**
   * 删除任务
   */
  remove(jobId) {
    this.jobs.delete(jobId);
    console.log(`🗑️ 任务删除: ${jobId}`);
  }

  /**
   * 触发任务
   */
  trigger(jobId) {
    const job = this.jobs.get(jobId);
    if (job) {
      job.lastRun = Date.now();
      job.runCount++;
      this.calculateNextRun(job);
      return job;
    }
    return null;
  }

  /**
   * 获取待运行的任务
   */
  getDueJobs() {
    const now = Date.now();
    return Array.from(this.jobs.values())
      .filter(j => j.enabled && j.nextRun && j.nextRun <= now);
  }

  /**
   * 保存任务到磁盘
   */
  save() {
    const data = Array.from(this.jobs.entries());
    const filePath = path.join(this.dataDir, 'crons.json');
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  }

  /**
   * 从磁盘加载任务
   */
  load() {
    const filePath = path.join(this.dataDir, 'crons.json');
    
    if (fs.existsSync(filePath)) {
      try {
        const data = JSON.parse(fs.readFileSync(filePath));
        this.jobs = new Map(data);
        console.log(`📂 加载了 ${this.jobs.size} 个任务`);
      } catch (error) {
        console.error('加载任务失败:', error.message);
      }
    }
  }
}

module.exports = { CronManager };
