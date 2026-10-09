# Codex Design prototype starter

A local React/TypeScript Web workbench with an illustrative feedback inbox. All data and asynchronous actions are mocked. No backend, model API, account, or remote font/image service is required.

## Run

Use Node.js 24+:

```sh
npm ci
npm run dev -- --host 127.0.0.1
```

Open the address Vite prints. `npm test` checks state and baseline behavior; `npm run build` checks TypeScript and creates a static build.

## Try the complete loop

1. Read [the example product definition](docs/product-definition.md). Its interview answers are fictional demonstration assumptions, not user approval.
2. Open **方案对照**, choose a direction, and operate the full preview. Visual comparisons use identical example data.
3. Use **业务场景** for empty/offline/loading/error conditions. Recover through the simulated UI.
4. Select another **联动模拟器**. Create or update feedback in one surface; shared business data updates in the other. Navigation and unsaved forms stay independent.
5. Adjust visual controls. Candidate definitions remain stable; the current experiment is marked as modified.
6. Save an experiment or explicitly record a reviewed scope. Records are immutable copies. QA must identify itself as simulated review.
7. Export baseline JSON and implementation Markdown. Import the JSON into the same project, then restore it to reproduce design and mock data.

The JSON does not capture focus, open dialogs, or unsaved form drafts. Restoring begins at the list entry. The initial runtime demo is not a native-platform test.

## Customize

- `src/project.json`: identity, name and revision. Independent projects need distinct IDs.
- `src/example/model.ts` and `src/example/FeedbackApp.tsx`: replace the example business model and product UI.
- `src/studio/model.ts`: candidates, visual tokens, baseline schema, validation and handoff generation.
- `src/studio/Simulator.tsx`: optional platform shells; use only what the product needs.
- `docs/product-definition.md`: replace the illustrative scope and decisions.

Keep baseline import validation and its schema version aligned when changing the model. Do not treat an imported `confirmed` flag as permission to begin production integration.

Browser annotations belong to Codex's built-in browser. This workbench deliberately does not implement an annotation system. Use `?qa=1` for an isolated test-storage namespace. No stored record is silently cleared when resetting the current experiment; local storage failures are reported and JSON exports remain available.

The starter source is covered by the parent Codex Design repository's Apache-2.0 license. Generated projects include LICENSE and NOTICE. Third-party packages retain their own licenses.
