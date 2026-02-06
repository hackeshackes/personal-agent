/**
 * Performance Monitor - 性能监控
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      requests: [],
      latency: [],
      memory: [],
      connections: [],
    };
    this.maxSamples = 1000;
    this.startTime = Date.now();
  }

  /**
   * 记录请求
   */
  recordRequest(type, latency, success = true) {
    this.metrics.requests.push({
      type,
      latency,
      success,
      timestamp: Date.now(),
    });

    this.metrics.latency.push({
      type,
      latency,
      timestamp: Date.now(),
    });

    this._trimMetrics();
  }

  /**
   * 记录内存使用
   */
  recordMemory() {
    const usage = process.memoryUsage();
    
    this.metrics.memory.push({
      heapUsed: usage.heapUsed,
      heapTotal: usage.heapTotal,
      rss: usage.rss,
      external: usage.external,
      timestamp: Date.now(),
    });

    this._trimMetrics();
  }

  /**
   * 记录连接数
   */
  recordConnections(count) {
    this.metrics.connections.push({
      count,
      timestamp: Date.now(),
    });
  }

  /**
   * 获取统计
   */
  getStats() {
    const now = Date.now();
    const uptime = now - this.startTime;

    return {
      uptime: this._formatDuration(uptime),
      requests: this._getRequestStats(),
      latency: this._getLatencyStats(),
      memory: this._getMemoryStats(),
      connections: this._getConnectionStats(),
    };
  }

  /**
   * 获取请求统计
   */
  _getRequestStats() {
    const requests = this.metrics.requests;
    const total = requests.length;
    const success = requests.filter(r => r.success).length;
    const failed = total - success;

    return {
      total,
      success,
      failed,
      successRate: total > 0 ? (success / total * 100).toFixed(2) + '%' : 'N/A',
    };
  }

  /**
   * 获取延迟统计
   */
  _getLatencyStats() {
    const latencies = this.metrics.latency.map(l => l.latency);
    
    if (latencies.length === 0) {
      return { avg: 0, min: 0, max: 0, p50: 0, p95: 0, p99: 0 };
    }

    latencies.sort((a, b) => a - b);
    
    return {
      avg: (latencies.reduce((a, b) => a + b, 0) / latencies.length).toFixed(2) + 'ms',
      min: latencies[0] + 'ms',
      max: latencies[latencies.length - 1] + 'ms',
      p50: this._percentile(latencies, 50) + 'ms',
      p95: this._percentile(latencies, 95) + 'ms',
      p99: this._percentile(latencies, 99) + 'ms',
    };
  }

  /**
   * 获取内存统计
   */
  _getMemoryStats() {
    const mem = this.metrics.memory;
    
    if (mem.length === 0) {
      return { current: 'N/A', avg: 'N/A' };
    }

    const latest = mem[mem.length - 1];
    const avgHeap = mem.reduce((sum, m) => sum + m.heapUsed, 0) / mem.length;

    return {
      current: this._formatBytes(latest.heapUsed),
      avg: this._formatBytes(avgHeap),
      rss: this._formatBytes(latest.rss),
    };
  }

  /**
   * 获取连接统计
   */
  _getConnectionStats() {
    const conns = this.metrics.connections;
    
    if (conns.length === 0) {
      return { current: 0, max: 0 };
    }

    const latest = conns[conns.length - 1];
    const max = Math.max(...conns.map(c => c.count));

    return {
      current: latest.count,
      max,
    };
  }

  /**
   * 计算百分位
   */
  _percentile(sorted, p) {
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)] || 0;
  }

  /**
   * 格式化字节
   */
  _formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / 1024 / 1024).toFixed(2) + ' MB';
    return (bytes / 1024 / 1024 / 1024).toFixed(2) + ' GB';
  }

  /**
   * 格式化时间
   */
  _formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }

  /**
   * 修剪指标
   */
  _trimMetrics() {
    Object.keys(this.metrics).forEach(key => {
      if (this.metrics[key].length > this.maxSamples) {
        this.metrics[key] = this.metrics[key].slice(-this.maxSamples);
      }
    });
  }

  /**
   * 导出指标 (Prometheus 格式)
   */
  exportPrometheus() {
    const stats = this.getStats();
    let output = '# HELP personal_agent_requests_total Total requests\n';
    output += '# TYPE personal_agent_requests_total counter\n';
    output += `personal_agent_requests_total ${stats.requests.total}\n\n`;
    
    output += '# HELP personal_agent_latency_ms Request latency in milliseconds\n';
    output += '# TYPE personal_agent_latency_ms histogram\n';
    output += `personal_agent_latency_ms_bucket{le="10"} ${this.metrics.latency.filter(l => l.latency <= 10).length}\n`;
    output += `personal_agent_latency_ms_bucket{le="50"} ${this.metrics.latency.filter(l => l.latency <= 50).length}\n`;
    output += `personal_agent_latency_ms_bucket{le="100"} ${this.metrics.latency.filter(l => l.latency <= 100).length}\n`;
    output += `personal_agent_latency_ms_bucket{le="+Inf"} ${this.metrics.latency.length}\n\n`;
    
    output += '# HELP personal_agent_memory_bytes Memory usage in bytes\n';
    output += '# TYPE personal_agent_memory_bytes gauge\n';
    const mem = this.metrics.memory;
    if (mem.length > 0) {
      output += `personal_agent_memory_bytes ${mem[mem.length - 1].heapUsed}\n`;
    }

    return output;
  }
}

module.exports = { PerformanceMonitor };
