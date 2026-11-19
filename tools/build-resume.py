"""Build the public resume with ReportLab; source DOCX stays untouched.

Run with a Python environment containing reportlab. RESUME_FONT / RESUME_FONT_BOLD
may override the default macOS fonts. This is an offline authoring tool, not a site dependency.

版式沿用旧简历：
左侧青绿竖轴与方形节点分区、粗体分区标题、粗体公司名 + 灰字职位 + 日期右对齐。

当前为公共「产品体验设计师」单页版，优先展示低空智航、房产 GIS 与 AI 评审工作流。
发布和排版说明见 docs/README.md。本地头像文件可选，已公开版本包含头像。

字号与间距全部可以用环境变量覆盖（默认值即定稿值）：
RESUME_BODY / RESUME_LEADING / RESUME_PGAP   正文、行距、段距
RESUME_TITLE / RESUME_SECT                   公司名、分区标题字号
RESUME_SECT_TOP / RESUME_SECT_BOT            分区标题上下留白
RESUME_ENTRY_OFF / RESUME_ENTRY_AFTER        条目行基线偏移与其后留白
RESUME_HEAD_GAP / RESUME_BOTTOM              抬头到正文的距离、底边留白
RESUME_TALL=3 RESUME_DEBUG=1                 把页高放大三倍量总内容高度，不限字
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
OUT = Path(os.environ.get('RESUME_OUTPUT', str(ROOT / 'public/resume/xie-qingyu-resume.pdf')))
OUT.parent.mkdir(parents=True, exist_ok=True)

REGULAR = ('Light', os.environ.get('RESUME_FONT', '/System/Library/Fonts/STHeiti Light.ttc'))
BOLD = ('Medium', os.environ.get('RESUME_FONT_BOLD', '/System/Library/Fonts/STHeiti Medium.ttc'))
pdfmetrics.registerFont(TTFont(REGULAR[0], REGULAR[1], subfontIndex=1))
pdfmetrics.registerFont(TTFont(BOLD[0], BOLD[1], subfontIndex=1))
REG, BD = REGULAR[0], BOLD[0]

INK, MUTED, BLACK, NAME = '#333333', '#666666', '#000000', '#202329'
TEAL = '#49b9b4'
W, H = A4
TALL = float(os.environ.get('RESUME_TALL', '1'))
H = H * TALL
LEFT, RIGHT = 49.5, 49.5
WIDTH = W - LEFT - RIGHT
RAIL_X, RAIL_W, NODE = 24, 0.8, 6.8
BODY = float(os.environ.get('RESUME_BODY', '8.5'))
LEADING = float(os.environ.get('RESUME_LEADING', '14.2'))
PGAP = float(os.environ.get('RESUME_PGAP', '4.5'))
TITLE = float(os.environ.get('RESUME_TITLE', '9.9'))
SECT_TOP = float(os.environ.get('RESUME_SECT_TOP', '5'))
SECT_BOT = float(os.environ.get('RESUME_SECT_BOT', '11'))
ENTRY_OFF = float(os.environ.get('RESUME_ENTRY_OFF', '8.0'))
ENTRY_AFTER = float(os.environ.get('RESUME_ENTRY_AFTER', '6.4'))
HEAD_GAP = float(os.environ.get('RESUME_HEAD_GAP', '122'))
BOTTOM = float(os.environ.get('RESUME_BOTTOM', '34'))
SECT = float(os.environ.get('RESUME_SECT', '12.5'))
TOP = H - 62

c = canvas.Canvas(str(OUT), pagesize=(W, H))
c.setTitle('谢擎宇 | 产品体验设计师')
c.setAuthor('谢擎宇')
c.setSubject('复杂业务、多端体验与 AI 工作流；低空智航、房产 GIS、AI 评审实践')

y = TOP
nodes = []
page_count = 1


def finish_page():
    """竖轴只从第一个节点画到最后一个节点，两端都不出血；节点是圆角方块，轴心穿过它。"""
    c.setFillColor(HexColor(TEAL))
    if nodes:
        lo, hi = min(nodes), max(nodes)
        c.rect(RAIL_X, lo, RAIL_W, hi - lo, stroke=0, fill=1)
    for cy in nodes:
        c.roundRect(RAIL_X + RAIL_W / 2 - NODE / 2, cy - NODE / 2, NODE, NODE, 1.8, stroke=0, fill=1)


def new_page():
    global y, page_count
    finish_page()
    c.showPage()
    page_count += 1
    nodes.clear()
    y = H - 50


def block(value, size=BODY, leading=LEADING, color=INK, gap=PGAP):
    global y
    style = ParagraphStyle('p', fontName=REG, fontSize=size, leading=leading,
                           textColor=HexColor(color), wordWrap='CJK')
    p = Paragraph(value, style)
    _, h = p.wrap(WIDTH, 4000)
    if y - h < BOTTOM:
        new_page()
        p = Paragraph(value, style)
        _, h = p.wrap(WIDTH, 4000)
    p.drawOn(c, LEFT, y - h)
    y -= h + gap


def section(title):
    global y
    if y - 44 < BOTTOM:
        new_page()
    y -= SECT_TOP
    baseline = y - 11
    c.setFillColor(HexColor(BLACK))
    c.setFont(BD, SECT)
    c.drawString(LEFT, baseline, title)
    nodes.append(baseline + 3)
    y = baseline - SECT_BOT


def entry(title, role, date, gap=3, keep=52):
    """keep 是这个条目至少要占的高度，不够就整条挪到下一页，避免标题与正文被拆开。"""
    global y
    if y - keep < BOTTOM:
        new_page()
    baseline = y - ENTRY_OFF
    c.setFillColor(HexColor(INK))
    c.setFont(BD, TITLE)
    c.drawString(LEFT, baseline, title)
    offset = pdfmetrics.stringWidth(title, BD, TITLE) + 12
    c.setFillColor(HexColor(MUTED))
    c.setFont(REG, BODY)
    c.drawString(LEFT + offset, baseline, role)
    c.drawRightString(W - RIGHT, baseline, date)
    y = baseline - ENTRY_AFTER


# ── 抬头 ────────────────────────────────────────────────────────────────
PHOTO = ROOT / 'tools/assets/resume-photo.png'
if PHOTO.exists():
    psize = 56
    px, py = W - 24 - psize, H - 64 - psize
    c.saveState()
    clip = c.beginPath()
    clip.roundRect(px, py, psize, psize, 9)
    c.clipPath(clip, stroke=0, fill=0)
    c.drawImage(str(PHOTO), px, py, psize, psize)
    c.restoreState()

c.setFillColor(HexColor(NAME))
c.setFont(BD, 19)
c.drawString(LEFT, H - 82, '谢擎宇')
c.setFillColor(HexColor(INK))
c.setFont(REG, BODY)
c.drawString(LEFT, H - 102, '男 | 35 岁 | second988@qq.com | 广州 / 佛山 | 12 年工作经验')
c.drawString(LEFT, H - 116, '产品体验设计师 · 复杂业务 / 多端体验 / AI 工作流  |  作品集 xie-qingyu-portfolio-2026.pages.dev')
y = H - HEAD_GAP

# ── 个人优势 ────────────────────────────────────────────────────────────
section('个人优势')
block('- 复杂业务与多端体验：独立承担低空智航大屏、后台与 App 的 UI 和交互设计。')
block('- AI 协作：把评审经验写成 Plan / Review 规则，人确认业务条件与取舍，AI 辅助检查与实现。')
block('- 视觉与实现：12 年跨刊物、品牌与产品设计经验，制作可操作原型、本地工具及配套规范。')

# ── 工作经历 ────────────────────────────────────────────────────────────
section('工作经历')
entry('广东新禾智慧数字科技有限公司', '体验设计师', '2023.05-至今', keep=40)
block('B 端与 G 端产品的 UI 与交互；低空智航平台的大屏、后台与 App 由我独立完成。')
entry('深圳市建艺装饰集团股份有限公司', 'UI 设计师', '2022.03-2023.04', keep=40)
block('城市安全监测预警（大屏 + 后台）、古树态势监控、珠海应急仓库调度、顺德智慧安全城市平台。')
entry('昇辉控股有限公司', 'UI 设计师', '2021.06-2022.02', keep=34)
block('应急领域项目 UI：数据大屏、后台管理系统与手机端 App。')
entry('广州游离像素文化传播有限公司', '视觉设计师', '2018.05-2021.06', keep=34)
block('承接运营设计与刊物设计项目。')
entry('小牛资本管理集团有限公司', '视觉设计师', '2016.04-2018.05', keep=34)
block('集团品牌运营设计；内刊与发布会的产出见项目经历末条。')
entry('峰范（北京）科技有限公司', '视觉设计师', '2015.04-2016.04', keep=34)
block('公司品牌运营设计。')
entry('广东城市画报社有限公司', '视觉设计师', '2014.06-2015.04', keep=34)
block('《城市画报》杂志 iPad 版制作，杂志推广与品牌合作活动的视觉设计。')

# ── 项目经历 ────────────────────────────────────────────────────────────
section('项目经历')
entry('新禾低空智航运营服务平台', 'UI 与交互设计（唯一）', '2025.02-至今', keep=48)
block('无人机巡查运营平台。独立设计大屏态势与飞行轨迹、后台巡查调度与处置、App 任务下发与现场反馈。')
entry('房产 GIS 体验重构', '个人回溯重构', '2025', keep=48)
block('围绕楼栋、户室与测绘记录的对应关系，重排地图定位、整幢查看和测绘核对的信息与操作，完成三个可操作原型；业务规则待确认。')
entry('AI 评审工作流 · Edgecase Planner', '规则设计与回查', '2026', keep=48)
block('从批量下载问题提炼 Plan / Review 规则，用需求、设计稿与页面操作回查。个人工具实践，未进入正式产品流程。')
entry('政府与城市治理多端项目', 'UI 设计师（兼交互）', '2023.04-2025.02', keep=48)
block('独立负责郑州房屋安全、红安安全生产与核采、禾智农数字种植、灾害普查成果应用、红安土地储备六个平台的 UI 设计。')
entry('执行网查询助手', '独立设计与实现', '2026', keep=48)
block('独立实现名单排队、任务历史与三表导出，人工在官网完成验证后继续查询。以两项合成任务试用，需随官网变化维护。')
entry('粤见 · 广府非遗体验小程序', '独立设计', '2026', keep=48)
block('完成十一屏高保真原型、纸张交互动效与视觉规范。未上线的概念产品，界面照片为生成示意图。')
entry('小牛资本内刊与发布会', '视觉设计师', '2015.08-2018.05', keep=36)
block('设计集团中英双语内刊（获 2016 年度企事业内刊评比综合类一等奖），以及家庭金融与 FIIL 发布会视觉物料。')

# ── 教育与资格 ──────────────────────────────────────────────────────────
section('教育经历与资格证书')
entry('香港中文大学', '硕士    视觉文化研究', '2013-2014', keep=34)
entry('中山大学', '本科    艺术与设计', '2009-2013', keep=34)
block('大学英语六级（CET-6）    大学英语四级（CET-4）', gap=0)

if page_count != 1:
    raise RuntimeError('公共简历超出单页，请调整内容或间距后重新生成')
finish_page()
email_x = LEFT + pdfmetrics.stringWidth('男 | 35 岁 | ', REG, BODY)
c.linkURL('mailto:second988@qq.com', (email_x, H - 105, email_x + pdfmetrics.stringWidth('second988@qq.com', REG, BODY), H - 94), relative=0, thickness=0)
site_x = LEFT + pdfmetrics.stringWidth('产品体验设计师 · 复杂业务 / 多端体验 / AI 工作流  |  作品集 ', REG, BODY)
c.linkURL('https://xie-qingyu-portfolio-2026.pages.dev/', (site_x, H - 119, site_x + pdfmetrics.stringWidth('xie-qingyu-portfolio-2026.pages.dev', REG, BODY), H - 107), relative=0, thickness=0)
c.save()
print(OUT, 'pages', page_count)
if os.environ.get('RESUME_DEBUG'):
    used = (H - HEAD_GAP) - y
    budget = 841.89 - HEAD_GAP - BOTTOM
    print('used %.1f  budget %.1f  slack %.1f' % (used, budget, budget - used))
