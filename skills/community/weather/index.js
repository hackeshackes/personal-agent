/**
 * Weather Skill - 天气预报
 * 获取全球城市天气预报
 */

const axios = require('axios');

class WeatherSkill {
  constructor(config = {}) {
    this.apiKey = config?.apiKey || process.env.WEATHER_API_KEY;
    this.baseUrl = 'https://api.weatherapi.com/v1';
  }
  
  // ========== 元数据 ==========
  
  static metadata = {
    id: 'weather',
    name: '天气预报',
    description: '获取全球城市天气预报',
    version: '1.0.0',
    parameters: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['current', 'forecast', 'alerts', 'astronomy'],
          description: '操作类型'
        },
        city: {
          type: 'string',
          description: '城市名称'
        },
        days: {
          type: 'integer',
          description: '预报天数(1-7)',
          minimum: 1,
          maximum: 7
        }
      },
      required: ['action', 'city']
    }
  };
  
  // ========== 执行入口 ==========
  
  async execute(params, context = {}) {
    const { action, city } = params;
    
    if (!city) {
      throw new Error('Missing required parameter: city');
    }
    
    switch (action) {
      case 'current':
        return await this._getCurrent(city);
      case 'forecast':
        return await this._getForecast(city, params.days || 3);
      case 'alerts':
        return await this._getAlerts(city);
      case 'astronomy':
        return await this._getAstronomy(city);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }
  
  // ========== 当前天气 ==========
  
  async _getCurrent(city) {
    if (!this.apiKey) {
      return this._mockCurrent(city);
    }
    
    try {
      const response = await axios.get(
        `${this.baseUrl}/current.json`,
        {
          params: {
            key: this.apiKey,
            q: city,
            aqi: 'yes'
          },
          timeout: 10000
        }
      );
      
      const data = response.data;
      
      return {
        city: data.location.name,
        country: data.location.country,
        temp: data.current.temp_c,
        tempF: data.current.temp_f,
        condition: data.current.condition.text,
        icon: data.current.condition.icon,
        humidity: data.current.humidity,
        wind: data.current.wind_kph,
        windDir: data.current.wind_dir,
        pressure: data.current.pressure_mb,
        uv: data.current.uv,
        aqi: data.current.air_quality?.['us-epa-index'],
        updated: data.current.last_updated,
        timestamp: Date.now()
      };
    } catch (error) {
      return this._mockCurrent(city);
    }
  }
  
  // ========== 天气预报 ==========
  
  async _getForecast(city, days = 3) {
    if (!this.apiKey) {
      return this._mockForecast(city, days);
    }
    
    try {
      const response = await axios.get(
        `${this.baseUrl}/forecast.json`,
        {
          params: {
            key: this.apiKey,
            q: city,
            days,
            aqi: 'yes',
            alerts: 'no'
          },
          timeout: 10000
        }
      );
      
      const data = response.data;
      
      return {
        city: data.location.name,
        country: data.location.country,
        forecast: data.forecast.forecastday.map(day => ({
          date: day.date,
          day: {
            maxtemp: day.day.maxtemp_c,
            mintemp: day.day.mintemp_c,
            condition: day.day.condition.text,
            icon: day.day.condition.icon,
            dailyChanceOfRain: day.day.daily_chance_of_rain,
            dailyChanceOfSnow: day.day.daily_chance_of_snow,
            uv: day.day.uv,
            aqi: day.day.air_quality?.['us-epa-index']
          },
          astro: {
            sunrise: day.astro.sunrise,
            sunset: day.astro.sunset
          }
        })),
        timestamp: Date.now()
      };
    } catch (error) {
      return this._mockForecast(city, days);
    }
  }
  
  // ========== 天气警报 ==========
  
  async _getAlerts(city) {
    // 简化实现
    return {
      city,
      alerts: [],
      message: '天气警报服务暂不可用'
    };
  }
  
  // ========== 天文数据 ==========
  
  async _getAstronomy(city) {
    if (!this.apiKey) {
      return {
        city,
        sunrise: '06:30 AM',
        sunset: '06:00 PM',
        moonPhase: 'Waxing Gibbous'
      };
    }
    
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await axios.get(
        `${this.baseUrl}/astronomy.json`,
        {
          params: {
            key: this.apiKey,
            q: city,
            dt: today
          },
          timeout: 10000
        }
      );
      
      const data = response.data;
      
      return {
        city: data.location.name,
        country: data.location.country,
        sunrise: data.astronomy.astro.sunrise,
        sunset: data.astronomy.astro.sunset,
        moonPhase: data.astronomy.astro.moon_phase,
        moonrise: data.astronomy.astro.moonrise,
        moonset: data.astronomy.astro.moonset
      };
    } catch (error) {
      return this._mockForecast(city, 1).forecast[0].astro;
    }
  }
  
  // ========== 模拟数据 ==========
  
  _mockCurrent(city) {
    return {
      city,
      temp: 22 + Math.floor(Math.random() * 10),
      condition: '多云',
      icon: '//cdn.weatherapi.com/weather/64x64/day/116.png',
      humidity: 65,
      wind: 15,
      windDir: 'NE',
      pressure: 1013,
      uv: 5,
      aqi: 2,
      source: 'mock',
      timestamp: Date.now()
    };
  }
  
  _mockForecast(city, days) {
    const forecast = [];
    const conditions = ['晴朗', '多云', '小雨', '阴天'];
    
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      
      forecast.push({
        date: date.toISOString().split('T')[0],
        day: {
          maxtemp: 25 + Math.floor(Math.random() * 5),
          mintemp: 18 + Math.floor(Math.random() * 5),
          condition: conditions[Math.floor(Math.random() * conditions.length)],
          dailyChanceOfRain: Math.floor(Math.random() * 100),
          uv: Math.floor(Math.random() * 10)
        },
        astro: {
          sunrise: '06:15 AM',
          sunset: '06:45 PM'
        }
      });
    }
    
    return {
      city,
      forecast,
      source: 'mock',
      timestamp: Date.now()
    };
  }
  
  // ========== 健康检查 ==========
  
  async healthCheck() {
    if (!this.apiKey) {
      return { status: 'degraded', message: 'API key not configured' };
    }
    
    try {
      await axios.get(`${this.baseUrl}/current.json`, {
        params: { key: this.apiKey, q: 'Beijing' },
        timeout: 5000
      });
      return { status: 'ok' };
    } catch (error) {
      return { status: 'error', message: error.message };
    }
  }
}

module.exports = WeatherSkill;
