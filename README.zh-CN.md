<p align="center">
  <img src="docs/images/cover.svg" alt="Codex Design — 通过可交互原型共同定义产品" width="100%" />
</p>

<p align="center">
  <a href="https://github.com/BppleMan/codex-design/actions/workflows/validate.yml"><img src="https://github.com/BppleMan/codex-design/actions/workflows/validate.yml/badge.svg" alt="验证状态" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-Apache--2.0-blue.svg" alt="许可证：Apache-2.0" /></a>
  <img src="https://img.shields.io/badge/Codex-skill-111827" alt="Codex Skill" />
  <img src="https://img.shields.io/badge/Workflow-mock--first-7c3aed" alt="先用 mock 设计的工作流" />
  <img src="https://img.shields.io/badge/Simulates-Web%20%7C%20macOS%20%7C%20iOS%20%7C%20Android-475569" alt="模拟 Web、macOS、iOS 和 Android 界面" />
</p>

<p align="center"><a href="README.md">English</a> · <strong>简体中文</strong></p>

# Codex Design

**把你的想法变成高保真可交互原型，再通过原型共同定义产品。**

Codex Design 是一个 **Codex Skill**：理解你的意图，分轮追问关键问题，设计可操作的 mock 原型，再和你一起在浏览器中调整功能与视觉。核心交付是有真实操作依据的产品定义。

起点可以是一个火花、一个问题、已有原型或代码。不要求完整 PRD、现有仓库、特定模型、思考档位或前端技术栈。产品类型、业务流程、视觉方向和模拟器组合都围绕你的目标确定。

## 让 AI 帮你安装

把下面整段提示词复制给能够操作本地文件的 Codex 或 AI agent。安装的目标是当前用户的 **Codex 环境**；使用时需要该环境能够加载本地 Skill，并具备运行和评审 Web 原型的工具。

```text
请为当前用户实际安装 Codex Design Skill：
https://github.com/BppleMan/codex-design

仓库根目录就是 Skill 根目录。优先使用当前环境提供的 Skill 安装器；
否则将完整仓库安装到 Codex 的 skills/codex-design 目录，遵循 CODEX_HOME 配置，
未配置时使用当前用户的 ~/.codex/skills/codex-design。
请保留 SKILL.md、agents、references、assets 和 scripts 等配套文件。
如果目标已存在，先核对来源和本地修改；不要直接覆盖或删除已有安装。
完成后检查 SKILL.md 及其本地引用，报告实际安装路径、来源和调用方式，
并说明如何让当前 Codex 环境加载它。遇到权限或环境限制时如实说明，不要声称已完成。
本次只安装 Skill，不运行附带演示、不安装原型的 npm 依赖，也不开始产品设计。
```

偏好手动安装或需要更新已有版本时，参阅[安装与更新说明](docs/installation.md)。

## 从你的想法开始

Skill 加载后，直接对 Codex 说：

```text
使用 $codex-design。
我的想法是：[用自己的话描述你想做的产品、遇到的问题或一闪而过的点子]。
先理解我的目标，再分轮 grill-me，追问会影响产品方向的关键问题。
方向明确后，用 mock 数据做高保真可交互原型，在内置浏览器中让我操作和批注。
和我一起打磨功能边界与视觉，本轮先不接真实后端。
```

不需要自己运行示例工程或先选模板。Codex 会根据讨论结果搭建适合这个产品的原型；原型目录、技术栈和模拟器由实际需要决定。

已有原型时，可以说：

> 使用 $codex-design 继续这个原型，保留已经确认的决定，先检查尚未明确的流程和视觉问题，再根据我的批注调整。

确认某个版本并准备实施时，可以说：

> 我确认原型 [版本] 中的 [具体范围]。使用 $codex-design 将这部分转译到正式项目，保持视觉、交互和状态规则，用相同场景对照验证。

## 工作方式

用户参与贯穿全过程。按产品当前成熟度进入工作，保留已经确定的决定。

1. **吃透意图。** 确认受众、问题、使用情境与预期结果。存在相关实现时，针对性查看，并区分当前实现、用户期望和待确认假设。
2. **分轮 grill-me。** 每轮围绕重要行为和取舍提出少量问题，再用回答决定下一轮。使用当前模式允许的同步原生提问工具，并等待答案返回；如果不可用，就在聊天中提问，等待用户下一轮回复。
3. **构建单个 Web 原型。** 在一个项目中模拟所需的 Web、macOS、iOS、Android、插件或其他宿主界面。可以只有一个模拟器；有关联的模拟器共享 mock 状态。场景控制放在模拟产品之外。
4. **一起评审与精调。** 在 Codex 内置浏览器运行原型，使用其内置批注功能，按反馈做明确修改。显式比较配色、排版、密度、层级和关键状态，同时保留用户已认可的部分。
5. **持续形成产品定义。** 随原型更新范围、对象关系、权限、流程、恢复行为、视觉决定和未解决假设。
6. **按要求启动业务转译。** 用户确认版本并明确要求实施后，将页面、组件、状态和行为对应到目标应用，用相同场景进行对照。

“1:1”既包括布局与视觉，也包括交互和状态规则。必要的平台差异应明确说明。

## 交付内容

- 可运行的独立 Web 原型，以及前后一致的 mock 交互。
- 可复现的相关场景，例如空数据、不同身份、时延、失败和恢复。
- 简洁且持续更新的产品定义，需要时使用[模板](assets/product-definition.template.md)。
- 视觉决定与浏览器验证证据，明确区分已验证行为、待用户评审和假设。
- 用户要求正式实施后：范围明确的转译计划，以及与确认原型的对照。

Skill 不会在你的产品中另建批注系统。当前环境缺少内置浏览器批注时，使用文字或截图位置承接反馈，并说明该限制。

## 能力边界

- Mock 行为不能证明真实 API、网络、认证、支付或原生宿主中的行为。
- 浏览器检查、用户设计确认和生产验收是不同的阶段。
- 视觉精调是明确的工作，不代表沿用统一配色，也不要求重做用户已经认可的设计。
- 用户明确要求后，才按已确认范围开始业务接入。
- Skill 不承诺固定生成速度，也不要求特定模型。

## 深入资料

按需查看[视觉探索](references/visual-exploration.md)、[业务转译](references/handoff.md)与[产品定义模板](assets/product-definition.template.md)。[案例与演示](docs/examples.md)仅说明方法在特定情境中的使用；其中的业务、配色和布局不限定你可以设计的产品。

<details>
<summary>开发者资料与可选底座</summary>

[Skill 指令](SKILL.md) · [提问方法](references/discovery.md) · [原型底座指南](references/prototype-workbench.md) · [底座源码](assets/prototype-starter/) · [实现依据模板](assets/implementation-spec.template.md) · [方法取舍](docs/design-notes.md) · [验证记录](docs/starter-verification.md)

底座是给 Codex 按需复用的开发素材，普通使用无需手动运行。创建命令与改造点见底座指南；实际产品的业务模型和视觉需根据用户目标设计。

## 开发与贡献

```sh
python3 -m pip install -r requirements-dev.txt
python3 scripts/validate.py
python3 -m unittest discover -s tests
cd assets/prototype-starter
npm ci
npm test
npm run build
```

这些检查验证包完整性与底座状态/基准行为，不能代替浏览器评审或用户设计确认。贡献方式见 [CONTRIBUTING.md](CONTRIBUTING.md)。

</details>

## 许可证与致谢

采用 [Apache-2.0](LICENSE) 许可证。由 [BppleMan](https://github.com/BppleMan) 维护的独立社区项目，并非 OpenAI 官方项目。
