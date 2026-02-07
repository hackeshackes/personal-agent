# find-skills

> 技能搜索与发现 Skill for Personal AI Agent

## 功能

- 📋 **列出 Skills** - 查看所有可用 Skills
- 🔍 **搜索 Skills** - 按名称/关键词搜索
- 📊 **分类浏览** - 按分类筛选 (builtin/community)
- ℹ️ **详情查看** - 获取 Skill 详细信息

## 使用方法

```javascript
// 列出所有 Skills
await framework.execute('find-skills', {
  action: 'list'
});

// 搜索 Skills
await framework.execute('find-skills', {
  action: 'search',
  query: 'weather'
});

// 获取 Skill 详情
await framework.execute('find-skills', {
  action: 'info',
  query: 'weather'
});

// 查看分类
await framework.execute('find-skills', {
  action: 'categories'
});
```

## CLI 使用

```bash
# 列出所有 Skills
skill list

# 搜索 Skills
skill search weather
```

## 参数

| 参数 | 类型 | 描述 |
|------|------|------|
| action | string | 操作: list/search/info/categories |
| query | string | 搜索关键词或 Skill ID |
| category | string | 分类过滤 (builtin/community) |
| installedOnly | boolean | 仅显示已安装 |
| limit | number | 结果数量限制 |

## 安装

```bash
skill install find-skills
```

## License

MIT
