#!/usr/bin/env python3
"""
Personal AI Agent - Python Core
基于 LangChain 的智能体核心
"""

import json
import sys
from datetime import datetime

class AgentCore:
    def __init__(self):
        self.tools = {
            'market': self.query_market,
            'file': self.operate_file,
            'calendar': self.operate_calendar,
            'mail': self.operate_mail,
            'math': self.calculate,
            'search': self.search_web,
        }
        
        # 股票代码映射
        self.stocks = {
            '黄金': 'XAUUSD',
            '比特币': 'BTCUSDT',
            '阿里巴巴': '9988.HK',
            '华润万象': '1209.HK',
            '美团': '3690.HK',
            '小鹏': '9868.HK',
        }
    
    def run(self):
        """主循环"""
        print("🤖 Python Agent 已就绪", flush=True)
        
        for line in sys.stdin:
            try:
                message = json.loads(line.strip())
                self.handle_command(message)
            except json.JSONDecodeError:
                continue
            except Exception as e:
                self.send_response({'id': None, 'error': str(e)})
    
    def handle_command(self, message):
        """处理命令"""
        cmd = message.get('command')
        params = message.get('params', {})
        
        if cmd and cmd.split('.')[0] in self.tools:
            try:
                tool_name = cmd.split('.')[0]
                result = self.tools[tool_name](params)
                self.send_response({
                    'id': message.get('id'),
                    'result': result
                })
            except Exception as e:
                self.send_response({
                    'id': message.get('id'),
                    'error': str(e)
                })
        else:
            self.send_response({
                'id': message.get('id'),
                'error': f'Unknown command: {cmd}'
            })
    
    def send_response(self, response):
        """发送响应"""
        print(json.dumps(response), flush=True)
    
    def query_market(self, params):
        """市场查询"""
        symbol = params.get('symbol', '')
        
        # 模拟市场数据 (实际应调用 akshare)
        mock_data = {
            'XAUUSD': {'price': 2645.50, 'change': 0.45},
            'BTCUSDT': {'price': 102450.00, 'change': 2.3},
            '9988.HK': {'price': 155.40, 'change': -0.5},
            '1209.HK': {'price': 46.52, 'change': 1.2},
            '3690.HK': {'price': 92.05, 'change': -0.8},
            '9868.HK': {'price': 67.30, 'change': 3.5},
        }
        
        symbol = self.stocks.get(symbol, symbol)
        
        if symbol in mock_data:
            return mock_data[symbol]
        
        return {'error': 'Unknown symbol'}
    
    def operate_file(self, params):
        """文件操作"""
        action = params.get('action')
        path = params.get('path', '')
        
        import os
        
        if action == 'list':
            if os.path.exists(path):
                return os.listdir(path)
            return []
        
        if action == 'read':
            if os.path.exists(path) and os.path.isfile(path):
                with open(path, 'r') as f:
                    return f.read()
            return ''
        
        if action == 'exists':
            return os.path.exists(path)
        
        return {'error': 'Unknown action'}
    
    def operate_calendar(self, params):
        """日历操作"""
        action = params.get('action')
        
        # 模拟日历数据
        events = [
            {'title': '团队周会', 'time': '周一 10:00'},
            {'title': '项目汇报', 'time': '周三 14:00'},
        ]
        
        if action == 'list':
            return events
        
        if action == 'today':
            return events
        
        return events
    
    def operate_mail(self, params):
        """邮件操作"""
        action = params.get('action')
        
        # 模拟邮件
        mails = [
            {'from': 'boss@company.com', 'subject': '项目进度汇报', 'unread': True},
            {'from': 'team@company.com', 'subject': '本周会议纪要', 'unread': False},
        ]
        
        if action == 'list':
            return mails
        
        if action == 'unread':
            return [m for m in mails if m['unread']]
        
        return mails
    
    def calculate(self, params):
        """计算"""
        expression = params.get('expression', '')
        
        try:
            result = eval(expression)
            return str(result)
        except:
            return 'Error'
    
    def search_web(self, params):
        """网页搜索"""
        query = params.get('query', '')
        return f'Search results for: {query}'

if __name__ == '__main__':
    agent = AgentCore()
    agent.run()
