"""Build the public resume with ReportLab; source DOCX stays untouched.

Run with a Python environment containing reportlab. RESUME_FONT / RESUME_FONT_BOLD
may override the default macOS fonts. This is an offline authoring tool, not a site dependency.

版式沿用用户旧简历（~/Documents/OPPO 互联/谢擎宇简历.pdf）：
左侧青绿竖轴与方形节点分区、粗体分区标题、粗体公司名 + 灰字职位 + 日期右对齐。

当前为「单页版」：政府与城市治理类项目合并成一条，其余项目各一段；
公司与时间线一条不少。文本按国脉文化「UI 设计」JD 重写，
依据与取舍见 docs/briefs/resume-guomai-20261102/CHANGES.md。

字号与间距全部可以用环境变量覆盖（默认值即定稿值）：
RESUME_BODY / RESUME_LEADING / RESUME_PGAP   正文、行距、段距
RESUME_TITLE / RESUME_SECT                   公司名、分区标题字号
RESUME_SECT_TOP / RESUME_SECT_BOT            分区标题上下留白
RESUME_ENTRY_OFF / RESUME_ENTRY_AFTER        条目行基线偏移与其后留白
RESUME_HEAD_GAP / RESUME_BOTTOM              抬头到正文的距离、底边留白
RESUME_TALL=3 RESUME_DEBUG=1                 把页高放大三倍量总内容高度，不限字
两个量测脚本在 artifacts/resume-guomai-20261102/：fit.py 量高度、sweep.py 扫组合。
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
c.setTitle('谢擎宇 | UI 设计师')
c.setAuthor('谢擎宇')
c.setSubject('移动端 UI 与交互、交互动效、设计令牌与组件规范、交互走查与还原度核验')

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
c.drawString(LEFT, H - 116, 'UI 设计师 · 移动端界面 / 交互动效 / 设计系统  |  作品集 xie-qingyu-portfolio-2026.pages.dev')
y = H - HEAD_GAP

# ── 个人优势 ────────────────────────────────────────────────────────────
section('个人优势')
block('- 移动端 C 端从界面做到规范：粤见十一屏、八种页型、四色设计令牌、两页规范与四套走查脚本，独立完成。')
block('- 交互动效八种动作原语互不重复，横切 480 毫秒、错峰 26 毫秒，结束态零残留，并做减弱动效降级。')
block('- 六个政府与城市治理平台的大屏 / 后台 / App 独立设计；把设计评审写成 Plan / Review 规则，再用真实项目回查。')

# ── 工作经历 ────────────────────────────────────────────────────────────
section('工作经历')
entry('广东新禾智慧数字科技有限公司', '体验设计师', '2023.05-至今', keep=40)
block('B 端与 G 端产品的 UI 与交互；低空智航平台的大屏、后台与 App 由我独立完成。')
entry('深圳市建艺装饰集团股份有限公司', 'UI 设计师', '2022.03-2023.04', keep=40)
block('城市安全监测预警（大屏 + 后台）、古树态势监控、珠海应急仓库调度、顺德智慧安全城市平台。')
entry('昇辉控股有限公司', 'UI 设计师', '2021.06-2022.02', keep=34)
block('应急领域项目 UI：数据大屏、后台管理系统与手机端 App。')
entry('广州游离像素文化传播有限公司', '视觉设计师', '2018.05-2021.06', keep=34)
block('运营设计与刊物设计的外包项目。')
entry('小牛资本管理集团有限公司', '视觉设计师', '2016.04-2018.05', keep=34)
block('集团品牌运营设计；内刊与发布会的产出见项目经历末条。')
entry('峰范（北京）科技有限公司', '视觉设计师', '2015.04-2016.04', keep=34)
block('公司品牌运营设计。')
entry('广东城市画报社有限公司', '视觉设计师', '2014.06-2015.04', keep=34)
block('《城市画报》杂志 iPad 版制作，杂志推广与品牌合作活动的视觉设计。')

# ── 项目经历 ────────────────────────────────────────────────────────────
section('项目经历')
entry('粤见 · 广府非遗体验小程序', '独立设计', '2026', keep=60)
block('概念产品高保真原型：四 tab、八种页型选页型填槽、15 格状态矩阵，四色令牌与八种动效原语，附两页设计规范与四套走查脚本。未上线，没有业务数据。')
entry('新禾低空智航运营服务平台', 'UI 与交互设计（唯一）', '2025.02-至今', keep=48)
block('实景三维加无人机遥感的运营平台，服务森林防火、应急救援与土地监测：大屏看全域态势与飞行轨迹，后台走巡查到处置的闭环，App 承接任务下发、现场反馈与结果回传。')
entry('房产 GIS 体验重构', '个人回溯重构', '2025', keep=48)
block('信创迁移中的体验重构，对象分楼栋、户室与测绘记录三层；三个原型共用同一栋楼和同一间户室，业务规则待确认。')
entry('政府与城市治理多端项目', 'UI 设计师（兼交互）', '2023.04-2025.02', keep=60)
block('郑州房屋安全（三端共用一套控件与状态）、红安安全生产、红安「一标三实」核采、禾智农数字种植、自然灾害普查成果应用、红安土地储备；六个平台均为项目组唯一 UI 设计师。')
entry('执行网一键查询工具', '独立开发', '2026.04-2026.05', keep=36)
block('Flask 加 ddddocr，自动翻页、一键单查、批量查询与结果导出；已用两项合成任务试用。')
entry('小牛资本内刊与发布会', '视觉设计师', '2015.08-2018.05', keep=36)
block('集团内刊中英两版（获 2016 年度企事业内刊评比综合类一等奖）、家庭金融战略发布会与 FIIL 产品发布会的视觉物料。')

# ── 教育与资格 ──────────────────────────────────────────────────────────
section('教育经历与资格证书')
entry('香港中文大学', '硕士    视觉文化研究', '2013-2014', keep=34)
entry('中山大学', '本科    艺术与设计', '2009-2013', keep=34)
block('大学英语六级（CET-6）    大学英语四级（CET-4）', gap=0)

finish_page()
c.save()
print(OUT, 'pages', page_count)
if os.environ.get('RESUME_DEBUG'):
    used = (H - HEAD_GAP) - y
    budget = 841.89 - HEAD_GAP - BOTTOM
    print('used %.1f  budget %.1f  slack %.1f' % (used, budget, budget - used))
