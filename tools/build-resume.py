"""Build the public resume with ReportLab; source DOCX stays untouched.

Run with a Python environment containing reportlab. RESUME_FONT may override
the default macOS Unicode font. This is an offline authoring tool, not a site dependency.
"""
import os
from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import Paragraph
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/resume/xie-qingyu-resume.pdf'
OUT.parent.mkdir(parents=True, exist_ok=True)
pdfmetrics.registerFont(TTFont('Resume', os.environ.get('RESUME_FONT', '/System/Library/Fonts/Supplemental/Arial Unicode.ttf')))
INK, MUTED, ORANGE = '#26251e', '#67665f', '#c64000'
W, H = A4
c = canvas.Canvas(str(OUT), pagesize=A4)
c.setTitle('谢擎宇 | AI 原生产品体验设计师')
c.setAuthor('谢擎宇')
c.setSubject('复杂系统与多端体验、AI 工作流、交互原型与验证')
LEFT, WIDTH = 43, W - 86
y = H - 42

def text(value, size=10, color=INK, gap=6, leading=None):
    global y
    style = ParagraphStyle('resume', fontName='Resume', fontSize=size,
                           leading=leading or size * 1.55, textColor=HexColor(color),
                           wordWrap='CJK')
    p = Paragraph(value, style)
    _, height = p.wrap(WIDTH, H)
    if y - height < 44:
        raise ValueError(f'Page overflow: {value}')
    p.drawOn(c, LEFT, y - height)
    y -= height + gap

def section(label):
    global y
    y -= 9
    text(label, 11, ORANGE, gap=10)

def project(title, role, paragraphs):
    text(title, 12, gap=2)
    text(role, 9, MUTED, gap=6)
    for paragraph in paragraphs:
        text(paragraph, 10, gap=5)

def footer(number):
    c.setStrokeColor(HexColor('#e8e6e0'))
    c.line(LEFT, 35, W - LEFT, 35)
    c.setFillColor(HexColor(MUTED))
    c.setFont('Resume', 8)
    c.drawString(LEFT, 22, '谢擎宇 / 体验设计')
    c.drawRightString(W - LEFT, 22, f'{number} / 2')

text('谢擎宇', 27, gap=5)
text('AI 原生产品体验设计师', 14, gap=9)
text('<link href="mailto:second988@qq.com">second988@qq.com</link>  ·  广州 / 佛山  ·  12 年设计经验', 10, MUTED, gap=16)
text('从复杂系统到可复用的设计方法', 17, gap=9)
text('12 年跨视觉、品牌与产品体验的设计积累，近年的工作聚焦后台、大屏与 App 的多端体验。擅长从业务对象、信息关系与任务路径组织方案，并借助 AI 协作制作可运行原型，将设计检查经验沉淀为可复用的 Skill。', 10.5, gap=9)
text('复杂系统与多端体验  /  AI 工作流与 Skill  /  交互原型与验证', 9.5, ORANGE, gap=7)
section('重点实践')
project('Edgecase Planner · 设计规划与评审 Skill', '个人工具实践 / 规则设计、工作流组织与案例验证', [
    '从选择范围、状态连续性、异步反馈与恢复等实际问题中提炼检查规则，组织 Plan（设计前规划）与 Review（设计后评审）两阶段工作流。',
    '将候选问题与事实结论分开：缺少证据时先追问，通过业务确认和实际操作决定问题是否成立。结合飞行设计评审与 Arco 分步表单验证，补充输入限制与纠错规则，再回到案例检查覆盖情况。',
    '由我负责设计判断、规则取舍与结果确认；AI 协助读图、展开追问、操作验证与整理证据。明确区分工具改进、已确认问题和待修改事项。',
])
section('')
project('房产 GIS · 体验重构', '复杂系统设计 / 信息架构、交互方案与原型验证', [
    '围绕“空间—对象—任务”重组总图、整幢和实测替换预测三个工作面，让空间定位、对象查看与业务办理沿同一上下文继续。',
    '基于真实旧版材料识别分散入口与状态衔接问题，明确对象面板、视图切换和任务反馈的设计取舍；借助 AI 协作实现 HTML/CSS 交互原型，操作检查关键路径。',
    '交付可运行原型与案例说明；体验收益作为待验证假设，不将本次重构表述为已上线成果。',
])
section('')
project('新禾低空智航运营服务平台', '2025.02 - 至今 / 体验设计师', [
    '面向森林防火、应急救援、城管执法等业务场景，负责大屏、后台与 App 的整体体验设计，将不同终端的业务信息与操作任务组织为清晰的产品界面。',
])
footer(1)
c.showPage()
y = H - 37
text('项目经验与职业经历', 19, gap=5)
section('其他真实项目')
project('郑州房屋安全信息化监管平台', '2023.04 - 2024.12 / UI 设计师', [
    '负责大屏、后台与移动端的 UI 设计及设计体系，围绕房屋安全监管业务组织多端信息与界面表达。',
])
project('执行网一键查询工具', '2026.04 - 2026.05 / 独立开发（AI 协作）', [
    '针对法务信息查询需求，基于 Flask 构建查询工具，支持一键单查、批量查询与结果导出，将重复查询步骤组织为可操作的工具流程。',
])
project('新禾智飞品牌视觉系统', '2025.03 - 至今 / 品牌设计师、体验设计师', [
    '整理标识、色彩、字体及触点应用规则，形成规范与物料设计。以真实旧触点诊断问题，并用 AI 辅助视觉探索；本次呈现为品牌系统提案，物料未投产、模板未投放。',
])
text('相关项目：红安安全生产在线监测平台（2024.06 - 2025.02，大屏 / 后台）；禾智农数字种植平台（2023.06 - 2023.10，大屏 / 后台 / App）。', 9, MUTED, gap=2)
section('工作经历')
for company, date, role in [
    ('广东新禾智慧数字科技有限公司', '2023.05 - 至今', '体验设计师 · B/G 端多端产品、品牌规范与 AI 协作实践'),
    ('深圳市建艺装饰集团股份有限公司', '2022.03 - 2023.04', 'UI 设计师 · 城市安全、古树监控与应急仓库调度项目'),
    ('昇辉控股有限公司', '2021.06 - 2022.02', 'UI 设计师 · 应急领域大屏、后台与 App'),
    ('广州游离像素文化传播有限公司', '2018.05 - 2021.06', '视觉设计师 · 运营与刊物设计'),
    ('小牛资本管理集团有限公司', '2016.04 - 2018.05', '视觉设计师 · 集团品牌运营设计'),
    ('峰范（北京）科技有限公司', '2015.04 - 2016.04', '视觉设计师 · 品牌运营设计'),
    ('广东城市画报社有限公司', '2014.06 - 2015.04', '视觉设计师 · 杂志 iPad 版制作与推广视觉'),
]:
    text(f'{company}  |  {date}', 9.5, gap=1, leading=13)
    text(role, 8.5, MUTED, gap=6, leading=12)
section('教育与技能')
text('香港中文大学 · 视觉文化研究硕士（2013 - 2014）<br/>中山大学 · 艺术与设计本科（2009 - 2013）', 9.5, gap=8, leading=14)
text('Figma · UI/UX · 信息架构 · 多端体验 · 数据可视化 · 品牌规范<br/>AI 协作工作流 · Skill 规则设计 · HTML/CSS 交互原型 · Flask 工具实践', 9, MUTED, gap=0, leading=14)
footer(2)
c.save()
print(OUT)
