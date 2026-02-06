/**
 * Calendar Tool - 日历管理工具
 * 支持系统日历集成
 */

const fs = require('fs');
const path = require('path');

class CalendarTool {
  constructor() {
    this.dataDir = path.join(__dirname, '../../data');
    this.eventsFile = path.join(this.dataDir, 'calendar.json');
    this._ensureDataDir();
    this.events = this._loadEvents();
  }

  /**
   * 确保数据目录存在
   */
  _ensureDataDir() {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  /**
   * 加载事件
   */
  _loadEvents() {
    if (fs.existsSync(this.eventsFile)) {
      try {
        return JSON.parse(fs.readFileSync(this.eventsFile, 'utf8'));
      } catch (e) {
        return [];
      }
    }
    return [];
  }

  /**
   * 保存事件
   */
  _saveEvents() {
    fs.writeFileSync(this.eventsFile, JSON.stringify(this.events, null, 2));
  }

  /**
   * 获取今日事件
   */
  async getToday() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const events = this.events.filter(e => {
      const eventDate = new Date(e.startTime);
      return eventDate >= today && eventDate < tomorrow;
    });

    return this._formatEvents(events, '今天的日程');
  }

  /**
   * 获取明日事件
   */
  async getTomorrow() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const dayAfter = new Date(tomorrow);
    dayAfter.setDate(dayAfter.getDate() + 1);

    const events = this.events.filter(e => {
      const eventDate = new Date(e.startTime);
      return eventDate >= tomorrow && eventDate < dayAfter;
    });

    return this._formatEvents(events, '明天的日程');
  }

  /**
   * 获取本周事件
   */
  async getWeek() {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    const events = this.events.filter(e => {
      const eventDate = new Date(e.startTime);
      return eventDate >= startOfWeek && eventDate < endOfWeek;
    });

    return {
      title: '本周日程',
      period: `${startOfWeek.toLocaleDateString()} - ${endOfWeek.toLocaleDateString()}`,
      events: events.map(e => this._formatEvent(e)),
      total: events.length,
    };
  }

  /**
   * 添加事件
   */
  async addEvent(eventData) {
    const event = {
      id: `evt-${Date.now()}`,
      title: eventData.title,
      description: eventData.description || '',
      startTime: eventData.startTime,
      endTime: eventData.endTime || eventData.startTime,
      location: eventData.location || '',
      reminder: eventData.reminder || null, // 提前分钟数
      category: eventData.category || 'other',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.events.push(event);
    this._saveEvents();

    return {
      success: true,
      event: this._formatEvent(event),
    };
  }

  /**
   * 删除事件
   */
  async deleteEvent(eventId) {
    const index = this.events.findIndex(e => e.id === eventId);
    
    if (index === -1) {
      return { error: '事件不存在', eventId };
    }

    const deleted = this.events.splice(index, 1)[0];
    this._saveEvents();

    return {
      success: true,
      deleted: this._formatEvent(deleted),
    };
  }

  /**
   * 更新事件
   */
  async updateEvent(eventId, updates) {
    const event = this.events.find(e => e.id === eventId);
    
    if (!event) {
      return { error: '事件不存在', eventId };
    }

    Object.assign(event, updates, { updatedAt: Date.now() });
    this._saveEvents();

    return {
      success: true,
      event: this._formatEvent(event),
    };
  }

  /**
   * 搜索事件
   */
  async search(query) {
    const lowerQuery = query.toLowerCase();
    
    const events = this.events.filter(e => 
      e.title.toLowerCase().includes(lowerQuery) ||
      (e.description && e.description.toLowerCase().includes(lowerQuery))
    );

    return {
      query,
      results: events.map(e => this._formatEvent(e)),
      total: events.length,
    };
  }

  /**
   * 获取所有事件
   */
  async getAll() {
    return {
      events: this.events.map(e => this._formatEvent(e)),
      total: this.events.length,
    };
  }

  /**
   * 获取待办事项
   */
  async getTodos() {
    const now = Date.now();
    
    const todos = this.events.filter(e => {
      return !e.completed && new Date(e.startTime) >= now;
    });

    return {
      title: '待办事项',
      items: todos.map(e => this._formatEvent(e)),
      total: todos.length,
    };
  }

  /**
   * 格式化事件列表
   */
  _formatEvents(events, title) {
    return {
      title,
      date: new Date().toLocaleDateString('zh-CN'),
      events: events.map(e => this._formatEvent(e)),
      total: events.length,
    };
  }

  /**
   * 格式化单个事件
   */
  _formatEvent(event) {
    const startDate = new Date(event.startTime);
    const endDate = new Date(event.endTime);
    
    return {
      id: event.id,
      title: event.title,
      description: event.description,
      startTime: startDate.toLocaleString('zh-CN'),
      endTime: endDate.toLocaleString('zh-CN'),
      location: event.location,
      category: event.category,
      reminder: event.reminder,
      allDay: event.startTime === event.endTime && !event.startTime.includes(':'),
    };
  }

  /**
   * 导入日历 (ICS 格式)
   */
  async importICS(icsContent) {
    // 简化: 解析基本 ICS 结构
    const events = [];
    const lines = icsContent.split('\n');
    
    for (const line of lines) {
      if (line.startsWith('SUMMARY:')) {
        const event = {
          id: `evt-${Date.now()}-${events.length}`,
          title: line.substring(8).trim(),
          description: '',
          startTime: new Date().toISOString(),
          endTime: new Date().toISOString(),
        };
        events.push(event);
      }
    }

    this.events.push(...events);
    this._saveEvents();

    return {
      success: true,
      imported: events.length,
    };
  }

  /**
   * 导出日历 (ICS 格式)
   */
  async exportICS() {
    let ics = 'BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Personal AI Agent//EN\n';
    
    for (const event of this.events) {
      ics += 'BEGIN:VEVENT\n';
      ics += `UID:${event.id}\n`;
      ics += `SUMMARY:${event.title}\n`;
      ics += `DTSTART:${new Date(event.startTime).toISOString().replace(/[-:]/g, '').split('.')[0]}Z\n`;
      if (event.endTime) {
        ics += `DTEND:${new Date(event.endTime).toISOString().replace(/[-:]/g, '').split('.')[0]}Z\n`;
      }
      if (event.description) {
        ics += `DESCRIPTION:${event.description}\n`;
      }
      ics += 'END:VEVENT\n';
    }
    
    ics += 'END:VCALENDAR';
    
    return ics;
  }
}

module.exports = { CalendarTool };
