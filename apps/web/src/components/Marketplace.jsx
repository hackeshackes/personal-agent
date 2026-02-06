import React, { useState } from 'react';
import { X, ShoppingBag, Search, Download, Star, ExternalLink } from 'lucide-react';

const marketplaceSkills = [
  {
    id: 'market',
    name: '市场分析',
    description: '股票、加密货币、外汇市场实时分析',
    icon: '📈',
    rating: 4.8,
    downloads: 1234,
    category: 'Finance',
    installed: false,
  },
  {
    id: 'weather',
    name: '天气预报',
    description: '提供全球城市天气预报和空气质量',
    icon: '🌤️',
    rating: 4.7,
    downloads: 2345,
    category: 'Lifestyle',
    installed: true,
  },
  {
    id: 'calculator',
    name: '计算器',
    description: '科学计算、单位换算、货币转换',
    icon: '🔢',
    rating: 4.6,
    downloads: 3456,
    category: 'Tools',
    installed: false,
  },
  {
    id: 'translation',
    name: '翻译',
    description: '支持 100+ 语言实时翻译',
    icon: '🌐',
    rating: 4.9,
    downloads: 4567,
    category: 'Tools',
    installed: true,
  },
  {
    id: 'search',
    name: '网页搜索',
    description: '快速搜索网页、新闻、图片',
    icon: '🔍',
    rating: 4.5,
    downloads: 5678,
    category: 'Tools',
    installed: false,
  },
  {
    id: 'git',
    name: 'Git 操作',
    description: 'Git 仓库管理、PR 审查、代码搜索',
    icon: '📦',
    rating: 4.7,
    downloads: 6789,
    category: 'Development',
    installed: false,
  },
  {
    id: 'docker',
    name: 'Docker 管理',
    description: '容器镜像管理、容器生命周期控制',
    icon: '🐳',
    rating: 4.4,
    downloads: 7890,
    category: 'Development',
    installed: false,
  },
  {
    id: 'database',
    name: '数据库查询',
    description: 'SQL 查询、数据导出、模式查看',
    icon: '🗄️',
    rating: 4.6,
    downloads: 8901,
    category: 'Development',
    installed: false,
  },
];

function Marketplace({ onClose }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [installed, setInstalled] = useState(new Set(['weather', 'translation']));

  const categories = ['All', ...new Set(marketplaceSkills.map(s => s.category))];

  const filteredSkills = marketplaceSkills.filter(skill => {
    const matchesSearch = skill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          skill.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || skill.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleInstall = (skillId) => {
    setInstalled(prev => new Set([...prev, skillId]));
    // TODO: Send install command to Gateway
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <ShoppingBag size={20} />
            Skill 市场
          </h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search and Filter */}
        <div className="p-4 border-b border-white/10 space-y-3">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索 Skills..."
              className="w-full bg-white/10 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-primary-500"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1 rounded-full text-sm whitespace-nowrap transition-colors ${
                  selectedCategory === category 
                    ? 'bg-primary-600 text-white' 
                    : 'bg-white/10 hover:bg-white/20'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Skills Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid gap-3">
            {filteredSkills.map(skill => (
              <div 
                key={skill.id}
                className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="text-3xl">{skill.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-white">{skill.name}</h3>
                      {installed.has(skill.id) && (
                        <span className="px-2 py-0.5 bg-green-600/50 text-green-400 text-xs rounded-full">
                          已安装
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-white/60 mt-1">{skill.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-white/40">
                      <span className="flex items-center gap-1">
                        <Star size={12} className="text-yellow-400" />
                        {skill.rating}
                      </span>
                      <span>{skill.downloads.toLocaleString()} 下载</span>
                      <span>{skill.category}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => installed.has(skill.id) ? null : handleInstall(skill.id)}
                    disabled={installed.has(skill.id)}
                    className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 transition-colors ${
                      installed.has(skill.id)
                        ? 'bg-white/10 text-white/40 cursor-not-allowed'
                        : 'bg-primary-600 hover:bg-primary-700'
                    }`}
                  >
                    {installed.has(skill.id) ? (
                      <>
                        <Download size={14} />
                        已安装
                      </>
                    ) : (
                      <>
                        <Download size={14} />
                        安装
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 text-center text-xs text-white/40">
          共 {filteredSkills.length} 个 Skills
        </div>
      </div>
    </div>
  );
}

export default Marketplace;
