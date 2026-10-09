# Installation and updates / 安装与更新

The main entry is the copyable AI installation prompt in the [README](../README.md#have-an-ai-agent-install-it). These instructions are for manual installation and maintenance. Installing the skill does not require running the example app or installing its npm dependencies.

主要入口是 [README 中可复制的 AI 安装提示词](../README.zh-CN.md#让-ai-帮你安装)。以下供手动安装和维护使用；安装 Skill 不需要启动示例应用或安装它的 npm 依赖。

Shell examples below use POSIX syntax (macOS/Linux). On other platforms, use the available Skill installer or adapt the commands to the current shell while preserving the same destination and no-overwrite behavior.

下方命令采用 macOS/Linux 的 POSIX shell 语法。其他平台优先使用可用的 Skill 安装器，或按当前 shell 调整命令，保留相同的目录与不覆盖规则。

## Manual installation

Requirements: a Codex environment that can load local skills, permission to create and run a local Web project, and suitable frontend tooling. Browser review uses the browser capabilities available in that environment.

**Check the destination first.** If it already exists, inspect its contents and installation method; do not overwrite it. For an unused destination:

```sh
git clone https://github.com/BppleMan/codex-design.git "${CODEX_HOME:-$HOME/.codex}/skills/codex-design"
```

The repository root contains `SKILL.md`; no subdirectory needs to be copied. Invoke `$codex-design` in a Codex session that has loaded the installed skill.

If your environment provides a skill installer, you can instead ask:

> Install the Codex skill from https://github.com/BppleMan/codex-design. Its SKILL.md is at the repository root.

### Update a Git installation

Use this only when the destination is the Git clone of this repository. Check its working tree first:

```sh
git -C "${CODEX_HOME:-$HOME/.codex}/skills/codex-design" status --short
```

Only when the working tree is clean:

```sh
git -C "${CODEX_HOME:-$HOME/.codex}/skills/codex-design" pull --ff-only
```

If there are local changes or Git cannot fast-forward, inspect and preserve that work before updating.

## 手动安装

需要能够加载本地 Skill 的 Codex 环境、创建并运行本地 Web 项目的权限，以及适用的前端工具。浏览器评审使用当前环境实际提供的浏览器能力。

**先检查目标目录。** 如果目录已经存在，检查其内容和安装方式，不要覆盖。仅在目标目录尚未使用时运行：

```sh
git clone https://github.com/BppleMan/codex-design.git "${CODEX_HOME:-$HOME/.codex}/skills/codex-design"
```

仓库根目录就是 `SKILL.md` 所在位置，无需复制内部子目录。在已加载该 Skill 的 Codex 会话中使用 `$codex-design`。

如果当前环境提供 Skill 安装器，也可以直接提出：

> 从 https://github.com/BppleMan/codex-design 安装这个 Codex Skill。SKILL.md 位于仓库根目录。

### 更新 Git 安装

仅适用于目标目录确实是本仓库 Git 克隆的情况。先检查工作区：

```sh
git -C "${CODEX_HOME:-$HOME/.codex}/skills/codex-design" status --short
```

只有工作区干净时才运行：

```sh
git -C "${CODEX_HOME:-$HOME/.codex}/skills/codex-design" pull --ff-only
```

如果存在本地改动，或 Git 无法快进更新，先检查并保留这些工作，再处理更新。

## Verify the installation / 检查安装

- Verify that the installed root contains `SKILL.md` with `name: codex-design` and its supporting `agents`, `references`, `assets`, and `scripts` directories. Follow local references to confirm the package is complete.
- Report the actual source and destination. Follow the current environment's skill-loading behavior; do not claim a newly installed skill is already loaded without evidence.
- If an existing installation has local changes or comes from a different source, preserve it and report the difference. A non-Git installation cannot be updated with `git pull`; inspect its installation method before choosing an update path.

检查根目录 `SKILL.md` 的名称及配套目录，核对本地引用，报告真实来源、安装位置和加载方式。有本地修改、来源不同或使用非 Git 安装时，先保留现状并说明差异，不直接覆盖或套用 `git pull`。
