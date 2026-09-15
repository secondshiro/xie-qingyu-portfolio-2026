# 执行网持久浏览器与随机验证处理实施计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框语法跟踪进度。

**目标：** 把已经走通的真实 Chrome 验证、查询和详情闭环封装为可测试的持久浏览器运行时，并为 `SLIDER` 与 `WORD_IMAGE_CLICK` 建立自动识别与动作路由。

**架构：** FastAPI 仍只管任务和状态。浏览器层使用专用、已忽略的 Chrome 用户数据目录，不读取用户日常 Chrome 配置。验证层先识别当前 DOM 类型，再调用局部视觉处理器；任何失败都重新读取题型，不沿用旧坐标。

**技术栈：** Python 3.13、Playwright、FastAPI、Pydantic、OpenCV headless、NumPy、本机 Tesseract `chi_sim`、pytest。

---

## 文件结构

- 创建 `execution-query-tool/src/execution_query/browser_session.py`：专用持久 Chrome 配置和启动边界。
- 创建 `execution-query-tool/src/execution_query/challenge_router.py`：随机类型路由、尝试状态和停止规则。
- 创建 `execution-query-tool/src/execution_query/challenge_assets.py`：从当前弹层读取尺寸与临时图像，任务后销毁。
- 创建 `execution-query-tool/src/execution_query/slider_solver.py`：缺口候选、距离缩放和拖动轨迹。
- 创建 `execution-query-tool/src/execution_query/word_click_solver.py`：提示字 OCR、彩色字候选、旋转 OCR 和点选坐标。
- 创建 `execution-query-tool/src/execution_query/query_runner.py`：单任务同会话闭环。
- 创建对应 `tests/test_*.py`，并只使用合成图像或已脱敏本地夹具。

## 任务 1：专用持久 Chrome 会话

- [x] **步骤 1：先写失败测试**

`tests/test_browser_session.py` 要求配置只接受位于 `execution-query-tool/var/browser-profile/` 的目录，拒绝 `~`、系统 Chrome 用户目录和相对跳转：

```python
def test_profile_must_be_inside_private_var(project_root):
    with pytest.raises(ValueError, match="dedicated profile"):
        BrowserSessionConfig(project_root.parent / "Library/Application Support/Google/Chrome")
```

- [x] **步骤 2：运行红灯**

    .venv/bin/pytest tests/test_browser_session.py -q

预期：因 `browser_session` 模块不存在而失败。

- [x] **步骤 3：实现最小启动边界**

```python
@dataclass(frozen=True, slots=True)
class BrowserSessionConfig:
    profile_dir: Path
    headless: bool = False

    def validate(self, private_root: Path) -> None:
        if not self.profile_dir.resolve().is_relative_to(private_root.resolve()):
            raise ValueError("dedicated profile must stay inside private var")
```

`open_context()` 只调用 `launch_persistent_context()`，不再为每个任务 `browser.new_page()`。

- [x] **步骤 4：绿灯与回归**

    .venv/bin/pytest tests/test_browser_session.py tests/test_browser_probe.py tests/test_challenge_probe.py -q

## 任务 2：随机验证类型路由

- [x] **步骤 1：先写失败测试**

`tests/test_challenge_router.py` 要求两类已观察题型有独立处理器，失败刷新后必须重新路由：

```python
async def test_refresh_reclassifies_instead_of_reusing_solver():
    source = FakeChallengeSource([ChallengeType.SLIDER, ChallengeType.WORD_IMAGE_CLICK])
    result = await ChallengeRouter(source, solvers).run(max_attempts=2)
    assert result.types_seen == [ChallengeType.SLIDER, ChallengeType.WORD_IMAGE_CLICK]
    assert result.outcome == ChallengeOutcome.PASSED
```

- [x] **步骤 2：运行红灯**

    .venv/bin/pytest tests/test_challenge_router.py -q

- [x] **步骤 3：实现类型、协议和有限重试**

```python
class ChallengeSolver(Protocol):
    async def solve(self, page: PageProtocol) -> SolverResult: ...

class ChallengeOutcome(StrEnum):
    PASSED = "passed"
    RETRYABLE = "retryable"
    UNSUPPORTED = "unsupported"
    FAILED = "failed"
```

最多两次，每次都读取新 DOM；遇到 `UNKNOWN`、资源失败或站点状态不一致立即停止。

- [x] **步骤 4：绿灯**

    .venv/bin/pytest tests/test_challenge_router.py -q

## 任务 3：临时验证图像边界

- [x] **步骤 1：先写失败测试**

断言图像只能位于单任务临时目录，证据 JSON 只保存尺寸、类型、耗时和结果，不保存 Base64、题目文字或图像路径。

- [x] **步骤 2：红灯**

    .venv/bin/pytest tests/test_challenge_assets.py -q

- [x] **步骤 3：实现上下文管理器**

```python
@asynccontextmanager
async def temporary_challenge_assets(page):
    with TemporaryDirectory(prefix="execution-query-captcha-") as root:
        assets = await capture_assets(page, Path(root))
        yield assets
```

- [x] **步骤 4：绿灯**

    .venv/bin/pytest tests/test_challenge_assets.py tests/test_evidence.py -q

## 任务 4：拼图滑块处理器

- [x] **步骤 1：添加本地图像依赖并锁定**

`pyproject.toml` 增加 `numpy` 和 `opencv-python-headless`，使用 `uv sync` 更新锁文件。

- [x] **步骤 2：先写合成红灯测试**

`tests/test_slider_solver.py` 现场构造一张已知拼图缺口坐标的图像，断言返回的目标中心偏差不超过 3 px，并覆盖两个干扰缺口。

- [x] **步骤 3：红灯**

    .venv/bin/pytest tests/test_slider_solver.py -q

- [x] **步骤 4：实现边缘匹配和坐标缩放**

```python
def slider_distance(piece_left, target_left, image_width, travel_width):
    raw = max(0.0, target_left - piece_left)
    return round(raw * travel_width / image_width)
```

候选选择必须同时考虑模板边缘形状和目标区域的灰度差；置信度低于阈值时返回 `RETRYABLE`，不盲目拖动。

- [x] **步骤 5：绿灯**

    .venv/bin/pytest tests/test_slider_solver.py -q

## 任务 5：文字顺序点选处理器

- [x] **步骤 1：先写合成红灯测试**

`tests/test_word_click_solver.py` 使用本机中文字体生成四个颜色、位置和旋转角随机的汉字，并断言返回坐标顺序与提示文字一致。

- [x] **步骤 2：红灯**

    .venv/bin/pytest tests/test_word_click_solver.py -q

- [x] **步骤 3：实现本地 OCR 适配器**

```python
@dataclass(frozen=True, slots=True)
class GlyphCandidate:
    text: str
    center: tuple[int, int]
    confidence: float
```

对颜色聚类后的单字候选执行 `-30°..30°` 多角度 Tesseract `chi_sim --psm 10`；每个提示字必须有唯一的高置信度坐标，否则返回 `RETRYABLE`。

- [x] **步骤 4：绿灯**

    .venv/bin/pytest tests/test_word_click_solver.py -q

## 任务 6：同会话查询与详情闭环

- [x] **步骤 1：先写失败集成测试**

`tests/test_query_runner.py` 断言状态顺序必须为 `OPENING_SITE → VERIFYING → SEARCHING → FETCHING_DETAILS → COMPLETED_WITH_RECORDS`；验证失败不得生成空结果。

- [x] **步骤 2：红灯**

    .venv/bin/pytest tests/test_query_runner.py -q

- [x] **步骤 3：实现单任务运行器**

运行器只使用当前持久上下文，验证通过后等待结果表格，逐条打开详情并标准化。详情失败要保留在任务错误中，不丢弃已取得列表。

- [x] **步骤 4：全量绿灯**

    .venv/bin/pytest tests -q

## 任务 7：真实低频验收闸门

- [x] **步骤 1：专用配置首次启动**

仅打开目标页，不复制用户日常 Chrome 数据。若站点脚本仍返回 400，停止该路线，转入浏览器伴生载体设计，不通过伪造特征规避风控。

实测结果：专用空白持久配置中主页与三个验证码相关公开资源均返回 200，`TianaiCaptchaUI` 和 `TianaiCaptchaRestPage` 已就绪；未填写或触发验证码。

- [x] **步骤 2：非敏感小样本**

只使用“测试”，最多两次验证尝试，记录题型、处理器、结果和耗时；不保存题目图像、提示文字或坐标。

实测结果：填入“测试”并点击查询后，15 秒内验证码弹层主体未创建，因此没有进入处理器，也没有消耗题型内部的两次尝试。同一 profile 随后两次导航均无法在 15 秒内显示查询表单，判定为会话级不稳定，已停止重复触发。

- [x] **步骤 3：结论**

只有 `SLIDER` 和 `WORD_IMAGE_CLICK` 都至少完成一次自动验证，并在同会话取得列表与详情，才把闸门标记为 passed。任一题型只能依靠代理临时识别时，结论继续为 conditional。

最终结论：conditional。普通 Chrome 中的文字点选、列表和详情闭环仍成立；专用 Playwright profile 只证明了基础资源可加载，未证明可稳定触发验证弹层。下一架构路线是与用户正常 Chrome 会话协作的浏览器伴生载体，不继续通过新建 profile 或清理 Cookie 重试。

## 计划自检

- 当前计划只处理浏览器运行时与两种已观察验证码，不同时扩展完整产品 UI、历史、导出和作品集页。
- 未使用真实主体作为测试夹具。
- 验证码图像只存在于临时目录，不进入持久证据或 `public/`。
- 不绕过站点请求链，不伪造验证成功，不扩大频率。
- 遵守项目 `AGENTS.md`：本目录不是独立 Git 仓库，计划不含提交步骤。
