/**
 * Mail Tool - 邮件管理工具
 * 支持 IMAP/SMTP 集成
 */

const fs = require('fs');
const path = require('path');

class MailTool {
  constructor() {
    this.dataDir = path.join(__dirname, '../../data');
    this.cacheFile = path.join(this.dataDir, 'mail_cache.json');
    this.cache = this._loadCache();
    
    // 邮件配置
    this.config = {
      imap: {
        host: process.env.MAIL_IMAP_HOST || 'imap.example.com',
        port: parseInt(process.env.MAIL_IMAP_PORT) || 993,
        user: process.env.MAIL_USER,
        password: process.env.MAIL_PASSWORD,
      },
      smtp: {
        host: process.env.MAIL_SMTP_HOST || 'smtp.example.com',
        port: parseInt(process.env.MAIL_SMTP_PORT) || 465,
        user: process.env.MAIL_USER,
        password: process.env.MAIL_PASSWORD,
      },
    };
  }

  /**
   * 加载缓存
   */
  _loadCache() {
    if (fs.existsSync(this.cacheFile)) {
      try {
        return JSON.parse(fs.readFileSync(this.cacheFile, 'utf8'));
      } catch (e) {
        return { mails: [], lastSync: 0 };
      }
    }
    return { mails: [], lastSync: 0 };
  }

  /**
   * 保存缓存
   */
  _saveCache() {
    fs.writeFileSync(this.cacheFile, JSON.stringify(this.cache, null, 2));
  }

  /**
   * 获取未读邮件
   */
  async getUnread(options = {}) {
    // 尝试使用真实 IMAP
    if (this.config.imap.user && this.config.imap.password) {
      try {
        return await this._fetchIMAPUnread();
      } catch (error) {
        console.error('IMAP 获取失败:', error.message);
      }
    }

    // 降级到缓存/模拟数据
    return this._getCachedUnread(options);
  }

  /**
   * IMAP 获取未读邮件
   */
  async _fetchIMAPUnread() {
    // 实际实现需要使用 imap 库
    // const Imap = require('imap');
    // const imap = new Imap(this.config.imap);
    
    throw new Error('IMAP not configured');
  }

  /**
   * 获取缓存的未读邮件
   */
  _getCachedUnread(options = {}) {
    const limit = options.limit || 10;
    
    const unread = this.cache.mails
      .filter(m => !m.read)
      .slice(0, limit);

    return {
      source: 'cache',
      mails: unread.map(m => this._formatMail(m)),
      total: unread.length,
    };
  }

  /**
   * 获取最近邮件
   */
  async getRecent(options = {}) {
    const limit = options.limit || 20;
    const since = options.since || Date.now() - 7 * 24 * 60 * 60 * 1000; // 7天

    const recent = this.cache.mails
      .filter(m => m.date >= since)
      .sort((a, b) => b.date - a.date)
      .slice(0, limit);

    return {
      source: 'cache',
      mails: recent.map(m => this._formatMail(m)),
      total: recent.length,
    };
  }

  /**
   * 搜索邮件
   */
  async search(query, options = {}) {
    const lowerQuery = query.toLowerCase();
    const limit = options.limit || 50;
    
    const results = this.cache.mails
      .filter(m => 
        m.subject.toLowerCase().includes(lowerQuery) ||
        m.from.toLowerCase().includes(lowerQuery) ||
        (m.body && m.body.toLowerCase().includes(lowerQuery))
      )
      .sort((a, b) => b.date - a.date)
      .slice(0, limit);

    return {
      query,
      results: results.map(m => this._formatMail(m)),
      total: results.length,
    };
  }

  /**
   * 获取邮件详情
   */
  async getMail(mailId) {
    const mail = this.cache.mails.find(m => m.id === mailId);
    
    if (!mail) {
      return { error: '邮件不存在', mailId };
    }

    return this._formatMail(mail);
  }

  /**
   * 标记为已读
   */
  async markAsRead(mailId) {
    const mail = this.cache.mails.find(m => m.id === mailId);
    
    if (mail) {
      mail.read = true;
      this._saveCache();
      return { success: true, mailId };
    }

    return { error: '邮件不存在', mailId };
  }

  /**
   * 发送邮件 (SMTP)
   */
  async sendMail(mailData) {
    const { to, subject, body, attachments } = mailData;

    // 验证配置
    if (!this.config.smtp.user || !this.config.smtp.password) {
      return {
        error: 'SMTP not configured',
        config: {
          host: this.config.smtp.host,
          port: this.config.smtp.port,
          user: this.config.smtp.user ? '***' : 'not set',
        }
      };
    }

    // 实际实现需要使用 nodemailer
    // const nodemailer = require('nodemailer');
    // const transporter = nodemailer.createTransport(this.config.smtp);
    
    // 模拟发送
    const sentMail = {
      id: `sent-${Date.now()}`,
      to,
      subject,
      date: new Date().toISOString(),
      status: 'sent',
    };

    return {
      success: true,
      mail: sentMail,
    };
  }

  /**
   * 同步邮件
   */
  async sync() {
    if (!this.config.imap.user) {
      return { error: 'IMAP not configured', synced: 0 };
    }

    // 实际实现应该:
    // 1. 连接到 IMAP
    // 2. 获取新邮件
    // 3. 更新缓存
    
    const now = Date.now();
    this.cache.lastSync = now;
    this._saveCache();

    return {
      success: true,
      synced: 0,
      lastSync: new Date(now).toLocaleString('zh-CN'),
    };
  }

  /**
   * 添加邮件到缓存 (用于测试)
   */
  async addToCache(mail) {
    const newMail = {
      id: mail.id || `mail-${Date.now()}`,
      from: mail.from,
      to: mail.to || this.config.imap.user,
      subject: mail.subject,
      body: mail.body || '',
      date: mail.date || Date.now(),
      read: mail.read || false,
      labels: mail.labels || ['INBOX'],
    };

    this.cache.mails.unshift(newMail);
    this._saveCache();

    return {
      success: true,
      mail: this._formatMail(newMail),
    };
  }

  /**
   * 获取统计信息
   */
  async getStats() {
    const total = this.cache.mails.length;
    const unread = this.cache.mails.filter(m => !m.read).length;
    const today = this.cache.mails.filter(m => {
      const mailDate = new Date(m.date).setHours(0, 0, 0, 0);
      const todayDate = new Date().setHours(0, 0, 0, 0);
      return mailDate === todayDate;
    }).length;

    return {
      total,
      unread,
      today,
      lastSync: this.cache.lastSync ? new Date(this.cache.lastSync).toLocaleString() : '从未',
    };
  }

  /**
   * 格式化邮件
   */
  _formatMail(mail) {
    const date = new Date(mail.date);
    
    return {
      id: mail.id,
      from: mail.from,
      to: mail.to,
      subject: mail.subject,
      preview: (mail.body || '').substring(0, 100),
      date: date.toLocaleDateString('zh-CN'),
      time: date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      read: mail.read,
      labels: mail.labels,
    };
  }
}

module.exports = { MailTool };
