import {
  fixture,
  makeScenario,
  type MockState,
  type Scenario,
} from "../example/model.ts";
export type Host = "web" | "macos" | "ios" | "android";
export type Theme = "fern" | "ink" | "clay";
export type Density = "comfortable" | "compact";
export type Layout = "list" | "board";
export type DesignConfig = {
  candidateId: string;
  theme: Theme;
  density: Density;
  layout: Layout;
  radius: number;
  textScale: number;
  motion: boolean;
  primary: Host;
  companion: Host | "none";
};
export type Candidate = {
  id: string;
  title: string;
  intent: string;
  tradeoff: string;
  config: Pick<
    DesignConfig,
    "theme" | "density" | "layout" | "radius" | "textScale" | "motion"
  >;
};
export const candidates: readonly Candidate[] = [
  {
    id: "1a",
    title: "安静的工作室",
    intent: "先看清一条反馈，再决定下一步。",
    tradeoff: "留白更舒展，适合逐条梳理。",
    config: {
      theme: "fern",
      density: "comfortable",
      layout: "list",
      radius: 14,
      textScale: 100,
      motion: true,
    },
  },
  {
    id: "1b",
    title: "清晰的编辑台",
    intent: "让更多内容同时进入视野。",
    tradeoff: "紧凑列表，适合频繁处理多条反馈。",
    config: {
      theme: "ink",
      density: "compact",
      layout: "list",
      radius: 7,
      textScale: 100,
      motion: false,
    },
  },
  {
    id: "1c",
    title: "温暖的进度板",
    intent: "按进度分组，看到这一轮的全貌。",
    tradeoff: "卡片层级更鲜明，横向空间需求更高。",
    config: {
      theme: "clay",
      density: "comfortable",
      layout: "board",
      radius: 18,
      textScale: 100,
      motion: true,
    },
  },
];
export const hostLabels: Record<Host, string> = {
  web: "Web",
  macos: "macOS",
  ios: "iOS",
  android: "Android",
};
export const defaultConfig: DesignConfig = {
  ...candidates[0].config,
  candidateId: "1a",
  primary: "macos",
  companion: "none",
};
export const themeTokens = {
  fern: {
    background: "#f5f5ef",
    surface: "#fffef9",
    ink: "#293e32",
    muted: "#747f70",
    accent: "#46664f",
    soft: "#e7eddf",
    border: "#e3e7dc",
    displayFont: 'Georgia, "Songti SC", serif',
  },
  ink: {
    background: "#f1f4f8",
    surface: "#ffffff",
    ink: "#23324b",
    muted: "#67788e",
    accent: "#3d65a0",
    soft: "#e4ecf8",
    border: "#e0e6ef",
    displayFont: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  clay: {
    background: "#f8f1e8",
    surface: "#fffaf3",
    ink: "#523c31",
    muted: "#8b7565",
    accent: "#ac6944",
    soft: "#f0e0cc",
    border: "#ebddce",
    displayFont: 'Georgia, "Songti SC", serif',
  },
} as const;
export function effectiveTokens(config: DesignConfig) {
  return {
    ...themeTokens[config.theme],
    radius: `${config.radius}px`,
    fontSize: `${(14 * config.textScale) / 100}px`,
    rowPadding: config.density === "compact" ? "13px" : "20px",
    motionDuration: config.motion ? "160ms" : "0ms",
  };
}
export function chooseCandidate(
  config: DesignConfig,
  id: string,
): DesignConfig {
  const candidate = candidates.find((candidate) => candidate.id === id);
  if (!candidate) throw new Error("未知候选方案。");
  return { ...config, ...candidate.config, candidateId: id };
}
export function isCustomized(config: DesignConfig): boolean {
  const candidate = candidates.find(
    (candidate) => candidate.id === config.candidateId,
  );
  return (
    !!candidate &&
    Object.entries(candidate.config).some(
      ([key, value]) => config[key as keyof DesignConfig] !== value,
    )
  );
}
export type Baseline = {
  kind: "codex-design-baseline";
  schemaVersion: 1;
  id: string;
  createdAt: string;
  project: { id: string; name: string; revision: string };
  review: {
    status: "experiment" | "confirmed";
    by: string;
    scope: string;
    excluded: string;
    openQuestions: string;
  };
  design: DesignConfig;
  fixture: MockState;
};
export function captureBaseline(
  project: Baseline["project"],
  design: DesignConfig,
  state: MockState,
  review: Baseline["review"],
  id: string,
  createdAt: string,
): Baseline {
  if (state.pending) throw new Error("请等待当前操作完成，或先取消操作。");
  if (!review.scope.trim()) throw new Error("请写明这份记录覆盖的范围。");
  if (review.status === "confirmed" && !review.by.trim())
    throw new Error("请填写评审人或确认依据。");
  const record: Baseline = structuredClone({
    kind: "codex-design-baseline",
    schemaVersion: 1,
    id,
    createdAt,
    project,
    design,
    fixture: { ...state, pending: null, message: "" },
    review,
  });
  if (
    new TextEncoder().encode(JSON.stringify(record, null, 2)).byteLength >
    1_000_000
  )
    throw new Error("记录超过 1 MB，请缩小本轮演示数据后再保存。");
  return record;
}
const object = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);
const text = (v: unknown, max = 4000): v is string =>
  typeof v === "string" && v.length <= max;
const member = (v: unknown, options: readonly string[]) =>
  typeof v === "string" && options.includes(v);
export function readBaseline(raw: string, projectId: string): Baseline {
  if (new TextEncoder().encode(raw).byteLength > 1_000_000)
    throw new Error("文件过大，请选择工作台导出的基准 JSON。");
  let b: unknown;
  try {
    b = JSON.parse(raw);
  } catch {
    throw new Error("JSON 无法读取。");
  }
  const fail = () => {
    throw new Error("基准结构无效或版本不支持，当前实验未更改。");
  };
  if (
    !object(b) ||
    b.kind !== "codex-design-baseline" ||
    b.schemaVersion !== 1 ||
    !text(b.id, 120) ||
    !b.id.trim() ||
    !text(b.createdAt, 100) ||
    !Number.isFinite(Date.parse(b.createdAt))
  )
    return fail();
  if (
    !object(b.project) ||
    !text(b.project.id, 120) ||
    b.project.id !== projectId ||
    !text(b.project.name, 120) ||
    !text(b.project.revision, 120)
  )
    throw new Error("这份基准不属于当前项目。");
  const d = b.design,
    r = b.review,
    f = b.fixture;
  if (
    !object(d) ||
    !candidates.some((candidate) => candidate.id === d.candidateId) ||
    !member(d.theme, ["fern", "ink", "clay"]) ||
    !member(d.density, ["comfortable", "compact"]) ||
    !member(d.layout, ["list", "board"]) ||
    !member(d.primary, Object.keys(hostLabels)) ||
    !member(d.companion, [...Object.keys(hostLabels), "none"]) ||
    typeof d.motion !== "boolean" ||
    typeof d.radius !== "number" ||
    !Number.isFinite(d.radius) ||
    d.radius < 0 ||
    d.radius > 24 ||
    typeof d.textScale !== "number" ||
    !Number.isFinite(d.textScale) ||
    d.textScale < 90 ||
    d.textScale > 115
  )
    return fail();
  if (
    !object(r) ||
    !member(r.status, ["experiment", "confirmed"]) ||
    !text(r.by, 160) ||
    !text(r.scope) ||
    !r.scope.trim() ||
    !text(r.excluded) ||
    !text(r.openQuestions) ||
    (r.status === "confirmed" && !r.by.trim())
  )
    return fail();
  if (
    !object(f) ||
    !member(f.availability, ["ready", "offline", "loading", "error"]) ||
    f.pending !== null ||
    !text(f.message) ||
    !Array.isArray(f.items)
  )
    return fail();
  const seen = new Set<string>();
  for (const item of f.items) {
    if (
      !object(item) ||
      !text(item.id, 120) ||
      !item.id.trim() ||
      seen.has(item.id) ||
      !text(item.title, 120) ||
      !item.title.trim() ||
      !text(item.project, 120) ||
      !text(item.author, 80) ||
      !text(item.body) ||
      !text(item.date, 80) ||
      !member(item.status, ["new", "planned", "done"])
    )
      return fail();
    seen.add(item.id);
  }
  return b as unknown as Baseline;
}
export function addBaseline(records: Baseline[], next: Baseline): Baseline[] {
  const existing = records.find((record) => record.id === next.id);
  if (existing && JSON.stringify(existing) !== JSON.stringify(next))
    throw new Error("已有同编号但内容不同的记录，未覆盖。");
  return existing ? records : [...records, structuredClone(next)];
}
export function restoreBaseline(baseline: Baseline) {
  return {
    config: structuredClone(baseline.design),
    mock: { ...structuredClone(baseline.fixture), pending: null, message: "" },
  };
}
export const exampleScope =
  "收集反馈、查看详情、安排到本轮、标记完成；桌面与移动端共享反馈状态。";
export const exampleExcluded =
  "真实客户邀请、账号、支付、通知、后端同步和文件上传。";
export function handoffMarkdown(b: Baseline): string {
  const t = effectiveTokens(b.design);
  return `# ${b.project.name} · 实现依据\n\n基准：${b.id} · ${b.createdAt}\n\n记录类型：${b.review.status === "confirmed" ? "已记录范围确认" : "实验快照，尚未确认"}\n评审人 / 依据：${b.review.by || "未填写"}\n产品修订：${b.project.revision}\n\n## 产品边界\n\n${b.review.scope}\n\n不包含：${b.review.excluded || "未记录"}\n\n待解决：${b.review.openQuestions || "未记录；不能据此推断全部问题已解决。"}\n\n## 设计依据\n\n候选来源：${b.design.candidateId}${isCustomized(b.design) ? "（含微调）" : ""}\n布局：${b.design.layout}；密度：${b.design.density}\n主模拟器：${hostLabels[b.design.primary]}；联动模拟器：${b.design.companion === "none" ? "无" : hostLabels[b.design.companion]}\n\n| Token | 值 |\n| --- | --- |\n${Object.entries(
    t,
  )
    .map(([key, value]) => `| ${key} | ${value} |`)
    .join(
      "\n",
    )}\n\n## 页面与行为\n\n| 视图 | 用途 / 行为 | 原型依据 |\n| --- | --- | --- |\n| 反馈列表 | 按待确认、已安排、已完成筛选；进入详情 | src/example/FeedbackApp.tsx |\n| 反馈详情 | 安排、完成、退回；等待时可取消 | src/example/FeedbackApp.tsx |\n| 收集反馈 | 标题及正文必填；失败时保留输入 | src/example/FeedbackApp.tsx |\n\n共享业务状态：src/example/model.ts。模拟器的导航与未提交表单是各自临时状态，不属于快照。恢复时从列表入口开始。\n\n## 可复现验证\n\n导入同名基准 JSON 后应用。环境：${b.fixture.availability}；反馈：${b.fixture.items.length} 条。\n\n- 创建反馈后，联动模拟器出现相同记录。\n- 安排/完成操作按顺序改变状态；取消不改变状态。\n- 离线不能保存；恢复后可继续。加载与错误分别有对应页面。\n- 改变视觉参数不改变反馈记录；应用基准能恢复保存时的数据与配置。\n- 检查两侧间距、长文本、溢出、键盘焦点与不同模拟器尺寸。\n\n## 业务转译\n\n这些文件是前端 mock 设计依据。仅在用户明确启动业务落地后，映射到目标项目组件、状态和接口，并用相同场景对照。当前记录不证明真实平台已验收。\n\n## 素材与版本\n\n系统字体，Phosphor 图标；无远端图片或字体。将本基准 JSON、原型源码提交和已验证尺寸下的截图一并保存；源码提交及浏览器验证结果由执行者据实补充，不能凭生成本文件声称完成验收。\n`;
}
export function sampleState(scenario: Scenario = "everyday") {
  return makeScenario(scenario);
}
export { fixture };
