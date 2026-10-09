import test from "node:test";
import assert from "node:assert/strict";
import {
  filterFeedback,
  makeScenario,
  mockReducer,
} from "../src/example/model.ts";
import {
  addBaseline,
  captureBaseline,
  chooseCandidate,
  defaultConfig,
  handoffMarkdown,
  readBaseline,
  restoreBaseline,
} from "../src/studio/model.ts";
const project = {
  id: "threadline-example",
  name: "Threadline",
  revision: "example-1",
};
const review = {
  status: "experiment" as const,
  by: "",
  scope: "反馈列表与状态转换",
  excluded: "真实网络",
  openQuestions: "客户协作待讨论",
};
const make = () =>
  captureBaseline(
    project,
    { ...defaultConfig },
    makeScenario("everyday"),
    review,
    "B-test",
    "2026-10-09T00:00:00.000Z",
  );
test("visual candidates do not mutate current business data or previously saved records", () => {
  const state = makeScenario("everyday"),
    config = { ...defaultConfig };
  const record = captureBaseline(
    project,
    config,
    state,
    review,
    "B-1",
    "2026-10-09T00:00:00Z",
  );
  const selected = chooseCandidate(config, "1b");
  assert.equal(selected.density, "compact");
  assert.equal(config.density, "comfortable");
  state.items[0].title = "changed";
  config.radius = 1;
  assert.notEqual(record.fixture.items[0].title, "changed");
  assert.equal(record.design.radius, 14);
  assert.equal(record.review.status, "experiment");
});
test("cancelled and superseded requests cannot mutate a restored or reset scene", () => {
  const original = makeScenario("everyday");
  const pending = mockReducer(original, {
    type: "begin",
    id: original.items[0].id,
    status: "planned",
    token: "old",
  });
  assert.equal(
    mockReducer(pending, { type: "finish", token: "other" }),
    pending,
  );
  const cancelled = mockReducer(pending, { type: "cancel" });
  assert.equal(
    mockReducer(cancelled, { type: "finish", token: "old" }).items[0].status,
    "new",
  );
  const reset = mockReducer(pending, { type: "scenario", scenario: "empty" });
  assert.equal(
    mockReducer(reset, { type: "finish", token: "old" }).items.length,
    0,
  );
  const restored = mockReducer(pending, { type: "restore", state: original });
  assert.equal(
    mockReducer(restored, { type: "finish", token: "old" }).items[0].status,
    "new",
  );
});
test("offline retains data, blocks changes, and supports recovery without reseeding", () => {
  const offline = makeScenario("offline");
  assert.equal(offline.items.length, 4);
  assert.equal(
    mockReducer(offline, {
      type: "begin",
      id: "feedback-01",
      status: "done",
      token: "a",
    }),
    offline,
  );
  const rejected = mockReducer(offline, {
    type: "create",
    item: { ...offline.items[0], id: "new" },
  });
  assert.equal(rejected.items.length, 4);
  assert.ok(rejected.message);
  const recovered = mockReducer(rejected, { type: "recover" });
  const created = mockReducer(recovered, {
    type: "create",
    item: { ...offline.items[0], id: "new" },
  });
  assert.equal(created.items.length, 5);
  assert.equal(created.items[0].id, "new");
});
test("successful state transitions reach the shared state once", () => {
  let state = makeScenario("everyday");
  state = mockReducer(state, {
    type: "begin",
    id: "feedback-01",
    status: "planned",
    token: "a",
  });
  state = mockReducer(state, { type: "finish", token: "a" });
  assert.equal(state.items[0].status, "planned");
  assert.equal(state.pending, null);
  assert.equal(mockReducer(state, { type: "finish", token: "a" }), state);
});
test("capturing refuses a pending request and unsubstantiated confirmation", () => {
  const pending = mockReducer(makeScenario("everyday"), {
    type: "begin",
    id: "feedback-01",
    status: "done",
    token: "a",
  });
  assert.throws(
    () =>
      captureBaseline(
        project,
        defaultConfig,
        pending,
        review,
        "B",
        "2026-10-09",
      ),
    /等待/,
  );
  assert.throws(
    () =>
      captureBaseline(
        project,
        defaultConfig,
        makeScenario("everyday"),
        { ...review, status: "confirmed" },
        "B",
        "2026-10-09",
      ),
    /评审人/,
  );
  assert.throws(
    () =>
      captureBaseline(
        project,
        defaultConfig,
        makeScenario("everyday"),
        { ...review, scope: " " },
        "B",
        "2026-10-09",
      ),
    /范围/,
  );
});
test("JSON round trip restores design and fixture into independent working copies", () => {
  const baseline = make();
  baseline.design.companion = "android";
  baseline.fixture.items[0].status = "done";
  const decoded = readBaseline(JSON.stringify(baseline), project.id);
  assert.deepEqual(decoded, baseline);
  const restored = restoreBaseline(decoded);
  restored.config.radius = 0;
  restored.mock.items[0].status = "new";
  assert.equal(decoded.design.radius, 14);
  assert.equal(decoded.fixture.items[0].status, "done");
  assert.equal(restored.mock.pending, null);
});
test("invalid imports fail without altering existing records", () => {
  const baseline = make(),
    records = [baseline],
    original = JSON.stringify(records);
  for (const change of [
    (b: any) => (b.schemaVersion = 2),
    (b: any) => (b.design.theme = "not-a-theme"),
    (b: any) => (b.design.radius = 100),
    (b: any) => b.fixture.items.push({ ...b.fixture.items[0] }),
    (b: any) => (b.review = { status: "confirmed", by: "", scope: "x" }),
    (b: any) => (b.fixture.pending = { token: "stale" }),
    (b: any) => (b.createdAt = "invalid"),
  ]) {
    const b = structuredClone(baseline);
    change(b);
    assert.throws(() => readBaseline(JSON.stringify(b), project.id));
  }
  assert.throws(
    () => readBaseline(JSON.stringify(baseline), "another-project"),
    /项目/,
  );
  assert.throws(() => readBaseline("{", project.id), /JSON/);
  assert.equal(JSON.stringify(records), original);
});
test("same ID imports are idempotent, conflicting content never overwrites", () => {
  const baseline = make(),
    records = [baseline];
  assert.equal(addBaseline(records, structuredClone(baseline)), records);
  assert.throws(
    () =>
      addBaseline(records, {
        ...baseline,
        design: { ...baseline.design, radius: 0 },
      }),
    /同编号/,
  );
  assert.equal(records[0].design.radius, 14);
});
test("handoff follows the selected record and preserves unresolved scope", () => {
  const record = make();
  record.design = chooseCandidate(record.design, "1b");
  const doc = handoffMarkdown(record);
  assert.ok(doc.includes("1b"));
  assert.ok(doc.includes("客户协作待讨论"));
  assert.ok(doc.includes("真实网络"));
  assert.ok(doc.includes("实验快照"));
  assert.ok(doc.includes("src/example/FeedbackApp.tsx"));
  assert.ok(doc.includes("#3d65a0"));
});

test("project membership does not follow mentions in another project, and search composes with it", () => {
  const state = makeScenario("everyday");
  state.items[2].body = "也请参考 Morrow · 品牌网站 的按钮";
  const selected = filterFeedback(state.items, {
    project: "Morrow · 品牌网站",
    status: "all",
    query: "",
  });
  assert.equal(selected.length, 3);
  assert.ok(selected.every((item) => item.project === "Morrow · 品牌网站"));
  assert.equal(
    filterFeedback(state.items, {
      project: "Morrow · 品牌网站",
      status: "new",
      query: "第一句话",
    }).length,
    1,
  );
  assert.equal(
    filterFeedback(state.items, {
      project: null,
      status: "planned",
      query: "Morrow",
    }).length,
    1,
  );
});
test("a capture that would exceed the import size limit is refused", () => {
  const state = makeScenario("everyday");
  state.items = Array.from({ length: 100 }, (_, index) => ({
    ...state.items[0],
    id: String(index),
    body: "设".repeat(4000),
  }));
  assert.throws(
    () =>
      captureBaseline(
        project,
        defaultConfig,
        state,
        review,
        "B-large",
        "2026-10-09",
      ),
    /1 MB/,
  );
});
