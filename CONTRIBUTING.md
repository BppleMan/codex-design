# Contributing to Codex Design

[English](#contributing-to-codex-design) · [中文](#参与贡献)

Codex Design captures a repeatable product-design workflow. Good contributions help the skill ask better questions, model product behavior more accurately, produce stronger visual work, or carry a confirmed prototype into implementation.

## Bring a concrete case

Describe the user's goal, what the skill did, what should have happened, and why the difference matters. A short anonymized transcript, a minimal reproduction, or a before/after image is more useful than a rule without context. Do not include credentials, private client work, or personal information.

Keep project-specific choices in examples. A successful color palette, framework, business model, device layout, or dependency should not become a universal default.

## Make a focused change

- Keep `SKILL.md` concise. Put conditional detail in linked references.
- Preserve the workflow: understand intent, ask questions in rounds, use a single mock Web project, involve the user throughout, refine visuals, and capture the product boundary.
- Keep the synchronous-question rule and ordinary-message fallback intact. Do not introduce asynchronous question callbacks or polling as a substitute.
- Reuse the host browser's annotation tools. A request for feedback does not imply permission to build a separate annotation product.
- Distinguish code checks, browser evidence, user approval, and native-platform validation.
- Update both READMEs when public usage changes. Chinese is currently the instruction language; contributions in either English or Chinese are welcome.

## Validate locally

Python 3.12+ is used in CI. In a virtual environment:

```sh
python3 -m venv .venv
. .venv/bin/activate
python -m pip install -r requirements-dev.txt
python scripts/validate.py
python -m unittest discover -s tests
```

For starter changes, use Node.js 24+ and also run:

```sh
cd assets/prototype-starter
npm ci
npm test
npm run build
```

Use `?qa=1` for isolated browser checks. Verify paired views, failure recovery, candidate tweaks, and baseline export/import when they are affected. Keep example review records clearly marked as QA.

Structural checks catch packaging and documentation errors. For behavior changes, also run a realistic scenario in an isolated conversation or workspace and report what the skill actually did. Do not call an imagined walkthrough a live browser test.

By submitting a contribution, you agree to license it under this repository's [Apache-2.0 license](LICENSE).

## 参与贡献

欢迎提交真实使用中的问题：说明用户想做什么、Skill 实际做了什么、预期是什么，以及差异为什么重要。请使用匿名化记录和最小案例，不上传客户私有内容、凭据或个人信息。

修改尽量聚焦。核心规则写在 `SKILL.md`，条件性细节放在有链接的参考文档里。保留同步提问、内置浏览器批注、单个 Web mock 项目、用户持续参与和产品边界交付；不要把单个项目的配色、技术栈或业务规则泛化为所有任务的默认值。

更新面向用户的流程时，同步修改中英文 README。运行上方校验命令；涉及行为的变更，还需提供隔离情境下的实际演练结果，区分结构检查、浏览器验证、用户确认和真实平台验收。

提交贡献即表示你同意按本仓库的 [Apache-2.0 许可证](LICENSE) 授权该贡献。
