# 本次扩展采用的设计方法

Codex Design 的主线来自 Bridge Studio 实践：吃透想法、按需澄清（支持用户明确要求的分轮 grill-me）、用一个 Web 外壳模拟相关宿主、让用户在浏览器中持续参与，并留下可以对照的产品边界。

在用户提供的[第三方 Claude Design 资料](https://github.com/asgeirtj/system_prompts_leaks/tree/main/Anthropic/claude-design)中，我们关注了候选对照、视觉微调和可复现交付这些方法。该目录是第三方整理的参考材料，不据此声称获得了官方实现或背书。

这次将它们落为三组可独立使用的能力：

- 稳定候选编号与取舍说明，当前实验独立调参。
- 普通 React/TypeScript Web 工程中的宿主模拟与共享状态，外置场景、视觉和记录控制。
- 区分实验快照、范围确认与业务实施授权；以同一基准关联 JSON、实现依据和产品定义。

没有移植专用的内联文档协议、宿主运行时或原文提示词。提问遵守当前 Codex 模式允许的同步路径；批注使用内置浏览器。核心 Skill 保持简短，具体方法与底座按需读取。

## 提问由 Skill 自主判断

2026-10-09 对照了参考资料的[主 prompt 提问规则](https://github.com/asgeirtj/system_prompts_leaks/blob/main/Anthropic/claude-design/claude-design.md#asking-questions)和[Hi-fi 指令](https://github.com/asgeirtj/system_prompts_leaks/blob/main/Anthropic/claude-design/skills/hi-fi-design/SKILL.md)。前者允许信息充分和小改动跳过提问，后者偏重前置提问与设计上下文；不能将其中一段泛化成所有任务的固定问卷。

Codex Design 将执行判断放在 `SKILL.md` 和 `references/discovery.md`：明确要求深入追问时执行；没有要求时按信息缺口选择直接设计、局部澄清或分轮深入。默认调用提示也不再替用户声明 grill-me。

我们保留同步提问、普通消息等待的兜底，以及从一个点子开始的能力；不引入对方的异步问答生命周期、默认要求接入仓库或固定问题数量。视觉选择适合先看时，先用候选帮助判断。
