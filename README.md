<p align="center">
  <img src="docs/images/cover.svg" alt="Codex Design — define a product through interactive prototypes" width="100%" />
</p>

<p align="center">
  <a href="https://github.com/BppleMan/codex-design/actions/workflows/validate.yml"><img src="https://github.com/BppleMan/codex-design/actions/workflows/validate.yml/badge.svg" alt="Validate" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-Apache--2.0-blue.svg" alt="License: Apache-2.0" /></a>
  <img src="https://img.shields.io/badge/Codex-skill-111827" alt="Codex skill" />
  <img src="https://img.shields.io/badge/Workflow-mock--first-7c3aed" alt="Mock-first workflow" />
  <img src="https://img.shields.io/badge/Simulates-Web%20%7C%20macOS%20%7C%20iOS%20%7C%20Android-475569" alt="Simulates Web, macOS, iOS, and Android interfaces" />
</p>

<p align="center"><strong>English</strong> · <a href="README.zh-CN.md">简体中文</a></p>

# Codex Design

**Turn an idea into a high-fidelity, interactive prototype—and use it to define the product.**

Codex Design is a **Codex Skill** for understanding intent, asking focused questions, building mock experiences, and refining them with the user in the browser. Its central deliverable is a product definition grounded in something people can actually use.

Start with a spark, a problem, an existing prototype, or a codebase. No complete PRD, existing repository, particular model, reasoning level, or frontend stack is required.

This repository contains instructions, reference guides, and a product-definition template. It does **not** bundle a runnable prototype or starter app; the skill guides Codex in creating a separate Web project for your product.

## The workflow

User participation continues throughout. Enter at the product's current maturity; keep decisions that are already settled.

1. **Understand the intent.** Establish the audience, problem, situation, and desired outcome. Where relevant, inspect existing implementation and distinguish it from expectations and assumptions.
2. **Grill in rounds.** Ask a few questions about consequential behavior and tradeoffs, then let the answers shape the next round. Use a permitted synchronous native question tool and wait for its answers. When unavailable in the current mode, ask in chat and wait for the user's next reply.
3. **Build one Web prototype.** Simulate the needed Web, macOS, iOS, Android, plugin, or other host interfaces in one project. One simulator may be enough; related simulators share mock state. Keep scenario controls outside the simulated product.
4. **Review and refine together.** Run the prototype in Codex's built-in browser. Use its built-in annotations, then make focused changes. Explicitly review color, typography, density, hierarchy, and key states; preserve what the user has accepted.
5. **Keep defining the product.** Update scope, object relationships, permissions, flows, recovery behavior, visual decisions, and unresolved assumptions alongside the prototype.
6. **Translate when requested.** After the user confirms a version and explicitly starts implementation, map its screens, components, states, and behavior into the target application. Compare both against the same scenarios.

“1:1” includes interaction and state rules as well as layout and appearance. Necessary platform differences should be explained.

## What you get

- A runnable, independent Web prototype with coherent mock interactions.
- Reproducible scenario controls for relevant conditions such as empty data, different identities, delays, failures, and recovery.
- A concise, evolving product definition, using the [template](assets/product-definition.template.md) where helpful.
- Visual decisions and browser evidence, clearly separating verified behavior, pending user review, and assumptions.
- When implementation is requested: a scoped translation plan and comparisons with the confirmed prototype.

The skill does not create an annotation system inside your product. If built-in browser annotations are unavailable, use written feedback or screenshot locations and state that limitation.

## Install

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

## Example prompts

**From an idea**

> Use $codex-design. I want to help freelance designers track client feedback. First understand the problem and grill me in rounds, then build a mock prototype we can review together. No real backend yet.

**From an existing prototype**

> Use $codex-design to continue this prototype. Keep the decisions we've confirmed, examine the workflow gaps, and ask about the important tradeoffs. Let me operate the revised interface in the built-in browser and refine it through annotations.

**From a confirmed prototype to implementation**

> I approve prototype v3 for onboarding and account settings. Use $codex-design to begin translating those flows into the existing application. Preserve the layout, visual hierarchy, interactions, and state behavior; verify the same scenarios and identify any native-platform differences.

## A real case

![Bridge Studio prototype showing linked plugin and Desktop simulators](docs/images/bridge-studio.jpg)

Bridge Studio used linked mock simulators to clarify connections, identities, permissions, and lifecycle behavior. The [case notes](references/lessons-from-bridge-studio.md) explain the transferable lessons and their limits.

This is a historical prototype example, not a bundled app or a universal layout template. Any custom annotation controls visible in the screenshot belong to an earlier implementation; this skill calls for Codex's built-in annotations.

## Boundaries

- Mock behavior does not prove real API, network, authentication, payment, or native-host behavior.
- Browser checks, user design approval, and production acceptance are separate milestones.
- Visual refinement is explicit work, not a universal palette or mandatory redesign of already accepted choices.
- Production integration starts when the user requests it against a confirmed scope.
- The skill makes no fixed generation-speed promises and requires no specific model.

## Repository guide

| Path | Purpose |
| --- | --- |
| [SKILL.md](SKILL.md) | Skill instructions and workflow boundaries |
| [agents/openai.yaml](agents/openai.yaml) | Display metadata and suggested invocation |
| [references/discovery.md](references/discovery.md) | Intent discovery and round-based questions |
| [references/visual-and-browser-review.md](references/visual-and-browser-review.md) | Visual refinement and browser review |
| [references/lessons-from-bridge-studio.md](references/lessons-from-bridge-studio.md) | Case evidence, counterexamples, and limits |
| [assets/product-definition.template.md](assets/product-definition.template.md) | Product-definition template; not an application scaffold |
| [scripts/validate.py](scripts/validate.py) | Repository validation |
| [tests/](tests/) | Validator tests |

## Development and contributions

```sh
python3 -m pip install -r requirements-dev.txt
python3 scripts/validate.py
python3 -m unittest discover -s tests
```

These checks validate the skill repository; they do not replace browser review of a generated prototype. See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidance.

## License and credits

Released under [Apache-2.0](LICENSE). An independent community project by [BppleMan](https://github.com/BppleMan), developed from the Bridge Studio prototyping practice; not an official OpenAI project.
