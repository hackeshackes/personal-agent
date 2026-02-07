const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * PPTGenerateSkill - 本地 PPT 生成
 * 使用 python-pptx 生成精美 PPT，无需 API Key
 */
class PPTGenerateSkill {
  static metadata = {
    id: 'ppt-generate',
    name: 'PPT生成',
    version: '1.0.0',
    description: '本地生成精美 PPT 演示文稿，支持多种主题和布局',
    parameters: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          description: '操作类型: generate, themes, templates',
          enum: ['generate', 'themes', 'templates'],
          default: 'generate'
        },
        title: {
          type: 'string',
          description: 'PPT 标题'
        },
        slides: {
          type: 'array',
          description: '幻灯片内容数组',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              content: { type: 'string' },
              bullets: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        theme: {
          type: 'string',
          description: '主题: business, modern, nature, tech, minimal',
          default: 'modern'
        },
        output: {
          type: 'string',
          description: '输出文件路径'
        }
      },
      required: ['action']
    }
  };

  constructor(options = {}) {
    this.outputDir = options.outputDir || path.join(__dirname, '../../data/ppts');
    this.scriptsDir = path.join(__dirname, 'scripts');
    
    // 确保输出目录存在
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * 获取可用主题
   */
  getThemes() {
    return {
      'modern': {
        name: '现代简约',
        colors: ['#2563EB', '#3B82F6', '#60A5FA'],
        font: 'Microsoft YaHei',
        background: '#FFFFFF'
      },
      'business': {
        name: '商务正式',
        colors: ['#1E40AF', '#1E3A8A', '#172554'],
        font: 'Arial',
        background: '#FFFFFF'
      },
      'nature': {
        name: '自然清新',
        colors: ['#059669', '#10B981', '#34D399'],
        font: 'Georgia',
        background: '#ECFDF5'
      },
      'tech': {
        name: '科技风格',
        colors: ['#7C3AED', '#8B5CF6', '#A78BFA'],
        font: 'Consolas',
        background: '#0F172A'
      },
      'minimal': {
        name: '极简风格',
        colors: ['#374151', '#4B5563', '#6B7280'],
        font: 'Helvetica',
        background: '#F9FAFB'
      }
    };
  }

  /**
   * 生成 PPT
   */
  async generate(params) {
    const { title = '演示文稿', slides = [], theme = 'modern', output } = params;
    
    const outputPath = output || path.join(this.outputDir, `${title.replace(/[^a-zA-Z0-9]/g, '_')}.pptx`);
    
    // 构建 Python 脚本
    const pythonScript = this.buildPythonScript(title, slides, theme, outputPath);
    
    return new Promise((resolve, reject) => {
      const proc = spawn('python3', ['-c', pythonScript], {
        cwd: __dirname,
        timeout: 60000
      });

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
          resolve({
            success: true,
            message: 'PPT 生成成功',
            outputPath,
            theme,
            slideCount: slides.length + 1  // +1 封面
          });
        } else {
          reject(new Error(`PPT 生成失败: ${stderr}`));
        }
      });
    });
  }

  /**
   * 构建 Python 脚本
   */
  buildPythonScript(title, slides, theme, outputPath) {
    const themes = this.getThemes();
    const t = themes[theme] || themes['modern'];
    
    const slidesJson = JSON.stringify(slides.map(s => ({
      title: s.title || '',
      content: s.content || '',
      bullets: s.bullets || []
    })));
    
    return `
import sys
sys.path.insert(0, '${__dirname}')
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RgbColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE
import os

# 主题配置
THEME = ${JSON.stringify(t)}
OUTPUT_PATH = '${outputPath}'

# 创建 PPT
prs = Presentation()
prs.slide_width = Inches(13.333)
prs.slide_height = Inches(7.5)

# 封面页
slide_layout = prs.slide_layouts[6]  # 空白
slide = prs.slides.add_slide(slide_layout)

# 背景
background = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, prs.slide_width, prs.slide_height)
background.fill.solid()
background.fill.fore_color.rgb = RgbColor.from_string(THEME['colors'][0][1:])
background.line.fill.background()

# 标题
title_box = slide.shapes.add_textbox(Inches(1), Inches(2.5), Inches(11), Inches(1.5))
title_frame = title_box.text_frame
title_frame.text = '${title}'
title_frame.paragraphs[0].font.size = Pt(54)
title_frame.paragraphs[0].font.bold = True
title_frame.paragraphs[0].font.color.rgb = RgbColor.from_string('FFFFFF')
title_frame.paragraphs[0].alignment = PP_ALIGN.CENTER

# 副标题
subtitle_box = slide.shapes.add_textbox(Inches(1), Inches(4.2), Inches(11), Inches(1))
subtitle_frame = subtitle_box.text_frame
subtitle_frame.text = 'Generated by Personal AI Agent'
subtitle_frame.paragraphs[0].font.size = Pt(24)
subtitle_frame.paragraphs[0].font.color.rgb = RgbColor.from_string('E0E7FF')
subtitle_frame.paragraphs[0].alignment = PP_ALIGN.CENTER

# 内容页
for s in ${slidesJson}:
    slide = prs.slides.add_slide(prs.slide_layouts[1])
    
    # 标题
    title = slide.shapes.title
    title.text = s['title']
    title.text_frame.paragraphs[0].font.size = Pt(40)
    title.text_frame.paragraphs[0].font.color.rgb = RgbColor.from_string(THEME['colors'][0][1:])
    
    # 内容
    content = slide.placeholders[1]
    tf = content.text_frame
    tf.clear()
    
    if s.get('content'):
        p = tf.paragraphs[0]
        p.text = s['content']
        p.font.size = Pt(20)
        p.space_after = Pt(12)
    
    if s.get('bullets'):
        for bullet in s['bullets']:
            p = tf.add_paragraph()
            p.text = '• ' + bullet
            p.font.size = Pt(18)
            p.level = 0
            p.space_before = Pt(6)

# 保存
prs.save(OUTPUT_PATH)
print('PPT saved to:', OUTPUT_PATH)
`;
  }

  /**
   * 列出主题
   */
  async themes() {
    const themes = this.getThemes();
    return {
      success: true,
      themes: Object.entries(themes).map(([id, t]) => ({
        id,
        name: t.name,
        colors: t.colors
      }))
    };
  }

  /**
   * 执行
   */
  async execute(params) {
    const { action = 'generate', ...rest } = params;

    switch (action) {
      case 'generate':
        if (!rest.title || !rest.slides) {
          return { success: false, error: '需要 title 和 slides 参数' };
        }
        return await this.generate(rest);

      case 'themes':
        return await this.themes();

      case 'templates':
        return {
          success: true,
          message: '使用 themes 参数选择主题',
          themes: await this.themes()
        };

      default:
        return { success: false, error: `未知操作: ${action}` };
    }
  }
}

module.exports = PPTGenerateSkill;
