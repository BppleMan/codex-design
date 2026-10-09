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

**Turn your idea into a high-fidelity, interactive prototype—and use it to define the product.**

Codex Design is a **Codex Skill** that understands your intent, clarifies key questions when needed, builds a working mock prototype, and refines functionality and visuals with you in the browser. Its central deliverable is a product definition grounded in something you can actually use.

Start with a spark, a problem, an existing prototype, or a codebase. No complete PRD, existing repository, particular model, reasoning level, or frontend stack is required. The product, workflows, visual direction, and simulator setup follow your goals.

## Have an AI agent install it

Copy this entire prompt into Codex or an AI agent with local filesystem access. The installation target is your **Codex environment**; using the skill requires support for local skills and tools to run and review Web prototypes.

```text
Please actually install the Codex Design Skill for the current user:
https://github.com/BppleMan/codex-design

The repository root is the skill root. Prefer the skill installer available in this environment.
Otherwise install the complete repository into Codex's skills/codex-design directory,
respecting CODEX_HOME, or ~/.codex/skills/codex-design when it is unset.
Keep supporting files including SKILL.md, agents, references, assets, and scripts.
If the destination exists, inspect its origin and local changes first; do not overwrite or delete it.
Verify SKILL.md and its local references, then report the actual installation path, source,
and invocation, and explain how this Codex environment will load it.
Report permission or environment limitations honestly; do not claim an incomplete installation succeeded.
Only install the skill. Do not launch the bundled demo, install prototype npm dependencies,
or start designing a product yet.
```

For manual installation or updating an existing copy, see the [installation guide](docs/installation.md).

## Start with your idea

Once the skill is loaded, tell Codex:

```text
Use $codex-design. I want to make: [describe your product idea or problem in your own words].
Help me turn it into an interactive prototype, without a real backend for now.
```

Just express your idea. Codex uses the available context to decide whether questions are needed: it starts directly when the brief is clear enough and asks when a missing decision would change the design.

You do not need to run an example project or choose a template first. Codex builds a prototype around the discussion; the project directory, frontend stack, and simulators follow the actual need.

For an existing prototype:

> Use $codex-design to continue this prototype. Preserve confirmed decisions, examine unresolved flows and visual questions, then refine it using my annotations.

When a version is confirmed and you are ready to implement:

> I approve [specific scope] in prototype [version]. Use $codex-design to translate that scope into the production project, preserving visuals, interactions, and state rules, and verify matching scenarios.

## The workflow

User participation continues throughout. Enter at the product's current maturity; keep decisions that are already settled.

1. **Understand the intent.** Establish the audience, problem, situation, and desired outcome. Where relevant, inspect existing implementation and distinguish it from expectations and assumptions.
2. **Decide whether to ask.** Start designing when the brief is clear enough; clarify specific consequential gaps, or ask in rounds when several product choices depend on each other. Honor an explicit request for grill-me. When asking, use a permitted synchronous native question tool and wait for the answers; if unavailable, ask in chat and wait for the next reply.
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

## Boundaries

- Mock behavior does not prove real API, network, authentication, payment, or native-host behavior.
- Browser checks, user design approval, and production acceptance are separate milestones.
- Visual refinement is explicit work, not a universal palette or mandatory redesign of already accepted choices.
- Production integration starts when the user requests it against a confirmed scope.
- The skill makes no fixed generation-speed promises and requires no specific model.

## Further reading

Explore [visual directions](references/visual-exploration.md), [production translation](references/handoff.md), or the [product-definition template](assets/product-definition.template.md) as needed. [Cases and demonstrations](docs/examples.md) illustrate particular situations; their business models, palettes, and layouts do not limit what you can design.

<details>
<summary>Developer resources and optional starter</summary>

[Skill instructions](SKILL.md) · [Discovery](references/discovery.md) · [Starter guide](references/prototype-workbench.md) · [Starter source](assets/prototype-starter/) · [Implementation template](assets/implementation-spec.template.md) · [Design notes](docs/design-notes.md) · [Verification record](docs/starter-verification.md) · [Discovery behavior checks](docs/discovery-verification.md)

The starter is development material Codex can reuse when appropriate. You do not need to launch it to use the skill. The starter guide contains creation commands and customization points; the actual business model and visual design must follow the user's goals.

## Development and contributions

```sh
python3 -m pip install -r requirements-dev.txt
python3 scripts/validate.py
python3 -m unittest discover -s tests
cd assets/prototype-starter
npm ci
npm test
npm run build
```

These checks validate package integrity and starter state/baseline behavior; they do not replace browser review or user design approval. See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidance.

</details>

## License and credits

Released under [Apache-2.0](LICENSE). An independent community project maintained by [BppleMan](https://github.com/BppleMan); not an official OpenAI project.
