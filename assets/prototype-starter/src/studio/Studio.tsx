import {
  useEffect,
  useRef,
  useState,
  useReducer,
  type ChangeEvent,
} from "react";
import {
  ArrowClockwise,
  ArrowDown,
  ArrowRight,
  ArrowSquareOut,
  Check,
  CheckCircle,
  ClockCounterClockwise,
  DownloadSimple,
  FloppyDisk,
  FolderOpen,
  GitBranch,
  Info,
  Layout,
  Monitor,
  SlidersHorizontal,
  SquaresFour,
  Stack,
  UploadSimple,
  X,
} from "@phosphor-icons/react";
import project from "../project.json";
import { FeedbackApp } from "../example/FeedbackApp.tsx";
import {
  makeScenario,
  mockReducer,
  scenarioLabels,
  type FeedbackStatus,
  type MockState,
  type Scenario,
} from "../example/model.ts";
import {
  addBaseline,
  candidates,
  captureBaseline,
  chooseCandidate,
  defaultConfig,
  exampleExcluded,
  exampleScope,
  handoffMarkdown,
  hostLabels,
  isCustomized,
  readBaseline,
  restoreBaseline,
  themeTokens,
  type Baseline,
  type DesignConfig,
  type Host,
} from "./model.ts";
import { CandidatePreview } from "./CandidatePreview.tsx";
import { Simulator } from "./Simulator.tsx";
import { useOverlayScrollbars } from "./scrollbars.ts";

const storageKey = `codex-design:${project.id}:v1${new URLSearchParams(location.search).has("qa") ? ":qa" : ""}`;
function loadWorkspace() {
  const fallback = {
    config: structuredClone(defaultConfig),
    mock: makeScenario("everyday"),
    records: [] as Baseline[],
    error: "",
  };
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return fallback;
    const data = JSON.parse(raw);
    if (
      data.kind !== "codex-design-workspace" ||
      data.schemaVersion !== 1 ||
      !Array.isArray(data.records)
    )
      throw new Error();
    const current = readBaseline(JSON.stringify(data.current), project.id);
    return {
      ...restoreBaseline(current),
      records: data.records.map((record: unknown) =>
        readBaseline(JSON.stringify(record), project.id),
      ) as Baseline[],
      error: "",
    };
  } catch {
    return {
      ...fallback,
      error:
        "本地存档无法恢复，当前使用临时实验；原存档未覆盖，仍可导出新记录。",
    };
  }
}
function download(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function Studio() {
  useOverlayScrollbars();
  const [initial] = useState(loadWorkspace);
  const [config, setConfig] = useState(initial.config);
  const [mock, dispatch] = useReducer(mockReducer, initial.mock);
  const [records, setRecords] = useState<Baseline[]>(initial.records);
  const [tab, setTab] = useState<"preview" | "compare" | "records">("preview");
  const [controls, setControls] = useState(true);
  const [toast, setToast] = useState("");
  const [storageIssue, setStorageIssue] = useState(initial.error);
  const [reviewType, setReviewType] = useState<
    "experiment" | "confirmed" | null
  >(null);
  const [review, setReview] = useState({
    by: "",
    scope: exampleScope,
    excluded: exampleExcluded,
    openQuestions: "客户是否需要参与确认，尚待下一轮讨论。",
  });
  const reviewDialog = useRef<HTMLFormElement>(null);
  const reviewOpener = useRef<HTMLElement | null>(null);
  const beginReview = (status: "experiment" | "confirmed") => {
    reviewOpener.current = document.activeElement as HTMLElement | null;
    setReviewType(status);
  };
  const fileInput = useRef<HTMLInputElement>(null);
  const pendingTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const notify = (message: string) => {
    clearTimeout(noticeTimer.current);
    setToast(message);
    noticeTimer.current = setTimeout(() => setToast(""), 4500);
  };
  useEffect(() => {
    if (initial.error) return;
    try {
      const current = captureBaseline(
        project,
        config,
        { ...mock, pending: null },
        {
          status: "experiment",
          by: "",
          scope: exampleScope,
          excluded: exampleExcluded,
          openQuestions: "",
        },
        "working-copy",
        new Date().toISOString(),
      );
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          kind: "codex-design-workspace",
          schemaVersion: 1,
          current,
          records,
        }),
      );
      setStorageIssue("");
    } catch {
      setStorageIssue(
        "本地保存暂不可用，当前修改仍在内存中；请导出需要保留的记录。",
      );
    }
  }, [config, mock, records, initial.error]);
  useEffect(
    () => () => {
      clearTimeout(pendingTimer.current);
      clearTimeout(noticeTimer.current);
    },
    [],
  );
  useEffect(() => {
    if (!reviewType) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setReviewType(null);
      if (event.key === "Tab") {
        const controls = reviewDialog.current?.querySelectorAll<HTMLElement>(
          "button:not(:disabled), input, textarea, select",
        );
        if (!controls?.length) return;
        const first = controls[0],
          last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("keydown", close);
      reviewOpener.current?.focus();
    };
  }, [reviewType]);
  const transition = (id: string, status: FeedbackStatus) => {
    if (mock.availability !== "ready" || mock.pending) return;
    const token = crypto.randomUUID();
    dispatch({ type: "begin", id, status, token });
    clearTimeout(pendingTimer.current);
    pendingTimer.current = setTimeout(
      () => dispatch({ type: "finish", token }),
      900,
    );
  };
  const patch = (next: Partial<DesignConfig>) =>
    setConfig((previous) => ({ ...previous, ...next }));
  const applyScenario = (scenario: Scenario) => {
    clearTimeout(pendingTimer.current);
    dispatch({ type: "scenario", scenario });
  };
  const restore = (record: Baseline) => {
    clearTimeout(pendingTimer.current);
    const restored = restoreBaseline(record);
    setConfig(restored.config);
    setReview({
      by: record.review.by,
      scope: record.review.scope,
      excluded: record.review.excluded,
      openQuestions: record.review.openQuestions,
    });
    dispatch({ type: "restore", state: restored.mock });
    setTab("preview");
    notify(`已从「${record.id}」恢复实验，原记录保持不变。`);
  };
  const saveReview = () => {
    try {
      const record = captureBaseline(
        project,
        config,
        mock,
        { ...review, status: reviewType! },
        `B-${crypto.randomUUID().slice(0, 8)}`,
        new Date().toISOString(),
      );
      setRecords((previous) => addBaseline(previous, record));
      setReviewType(null);
      setTab("records");
      notify(
        reviewType === "confirmed"
          ? "已保存本轮范围确认，可导出实现依据。"
          : "实验快照已保存，尚未标记为确认。",
      );
    } catch (error) {
      notify((error as Error).message);
    }
  };
  const importRecord = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget,
      file = input.files?.[0];
    if (!file) return;
    try {
      if (file.size > 1_000_000) throw new Error("文件过大，请选择基准 JSON。");
      const record = readBaseline(await file.text(), project.id);
      const next = addBaseline(records, record);
      setRecords(next);
      setTab("records");
      notify("已导入记录。点击「恢复实验」后应用，当前实验未被替换。");
    } catch (error) {
      notify((error as Error).message);
    } finally {
      input.value = "";
    }
  };
  const renderProduct = (
    host: Host,
    miniature = false,
    selectedConfig = config,
  ) => (
    <FeedbackApp
      key={host}
      name={project.name}
      config={selectedConfig}
      state={miniature ? makeScenario("everyday") : mock}
      dispatch={miniature ? () => {} : dispatch}
      onTransition={miniature ? () => {} : transition}
      mobile={host === "ios" || host === "android"}
      readOnly={miniature}
    />
  );
  return (
    <main className="studio-workbench">
      <header className="studio-header" inert={!!reviewType}>
        <a
          className="studio-identity"
          href="#"
          onClick={(event) => {
            event.preventDefault();
            setTab("preview");
          }}
        >
          <span>
            <Stack size={23} weight="duotone" />
          </span>
          <div>
            <strong>Codex Design</strong>
            <small>让想法，在操作中变清楚。</small>
          </div>
        </a>
        <div className="studio-project">
          <i />
          <span>{project.name}</span>
          <small>示例 · 前端模拟</small>
        </div>
        <div className="studio-header-actions">
          <button
            className="plain-button"
            onClick={() => fileInput.current?.click()}
          >
            <UploadSimple size={15} />
            导入基准
          </button>
          <button
            className="studio-button"
            disabled={!!mock.pending}
            onClick={() => beginReview("confirmed")}
          >
            <CheckCircle size={15} />
            记录本轮确认
          </button>
        </div>
      </header>
      <input
        className="file-input"
        ref={fileInput}
        type="file"
        accept="application/json,.json"
        aria-label="导入基准 JSON"
        onChange={importRecord}
      />
      <nav className="studio-nav" aria-label="工作台视图" inert={!!reviewType}>
        <div>
          {(
            [
              ["preview", "操作预览", Monitor],
              ["compare", "方案对照", SquaresFour],
              ["records", "交付基准", FolderOpen],
            ] as const
          ).map(([key, title, Icon]) => (
            <button
              key={key}
              className={tab === key ? "active" : ""}
              onClick={() => setTab(key)}
            >
              <Icon size={16} />
              {title}
              {key === "records" && records.length > 0 && (
                <span>{records.length}</span>
              )}
            </button>
          ))}
        </div>
        <span className="studio-scope">同一个 Web 项目 · 多种使用情境</span>
        <button
          className={`plain-button ${controls ? "active" : ""}`}
          onClick={() => setControls(!controls)}
        >
          <SlidersHorizontal size={16} />
          {controls ? "收起调节" : "展开调节"}
        </button>
      </nav>
      {storageIssue && (
        <div className="storage-notice" role="alert">
          <Info size={16} />
          {storageIssue}
        </div>
      )}
      <div
        className={`studio-grid ${controls ? "" : "controls-hidden"}`}
        inert={!!reviewType}
      >
        <section className="studio-canvas">
          {tab === "preview" ? (
            <>
              <div className="canvas-heading">
                <div>
                  <span className="eyebrow">WORKING PROTOTYPE</span>
                  <h1>先体验，再决定。</h1>
                  <p>在模拟器里操作；用内置浏览器批注一起打磨。</p>
                </div>
                <div className="experiment-tag">
                  <i />
                  {config.candidateId}
                  {isCustomized(config) ? " · 已微调" : " · 原始候选"}
                  <small>当前实验</small>
                </div>
              </div>
              <div
                className={`preview-stage ${config.companion !== "none" ? "paired" : ""}`}
                data-scroll-area
                tabIndex={0}
                aria-label="模拟器画布"
              >
                <Simulator
                  key={`primary-${config.primary}`}
                  host={config.primary}
                  label="主视图"
                  title={project.name}
                >
                  {renderProduct(config.primary)}
                </Simulator>
                {config.companion !== "none" && (
                  <Simulator
                    key={`companion-${config.companion}`}
                    host={config.companion}
                    label="联动视图"
                    title={project.name}
                  >
                    {renderProduct(config.companion)}
                  </Simulator>
                )}
              </div>
              <div className="canvas-foot">
                <span>
                  <Info size={14} />
                  修改反馈会同步到联动视图；导航和未提交输入各自独立。
                </span>
                <button
                  onClick={() => {
                    setConfig(structuredClone(defaultConfig));
                    applyScenario("everyday");
                    notify("实验已重置，保存的记录仍然保留。");
                  }}
                >
                  <ArrowClockwise size={14} />
                  重置实验
                </button>
              </div>
            </>
          ) : tab === "compare" ? (
            <>
              <div className="canvas-heading">
                <div>
                  <span className="eyebrow">A QUESTION YOU CAN SEE</span>
                  <h1>你更想怎样处理反馈？</h1>
                  <p>同样的内容，比较密度、布局与视觉气质。编号始终保留。</p>
                </div>
              </div>
              <div className="candidate-grid">
                {candidates.map((candidate) => (
                  <article
                    className={`candidate-card ${config.candidateId === candidate.id ? "selected" : ""}`}
                    key={candidate.id}
                  >
                    <header>
                      <span className="candidate-id">{candidate.id}</span>
                      <div>
                        <h2>{candidate.title}</h2>
                        <p>{candidate.intent}</p>
                      </div>
                    </header>
                    <CandidatePreview>
                      {renderProduct("web", true, {
                        ...config,
                        ...candidate.config,
                        candidateId: candidate.id,
                      })}
                    </CandidatePreview>
                    <footer>
                      <span>{candidate.tradeoff}</span>
                      <button
                        onClick={() => {
                          if (config.candidateId !== candidate.id) {
                            setConfig(chooseCandidate(config, candidate.id));
                          }
                          setTab("preview");
                        }}
                      >
                        {config.candidateId === candidate.id
                          ? "继续体验"
                          : "试用这个方向"}
                        <ArrowRight size={14} />
                      </button>
                    </footer>
                  </article>
                ))}
              </div>
              <div className="compare-note">
                <GitBranch size={18} />
                <p>
                  这些是演示候选，不是固定模板。新方向使用新编号；微调当前实验后，可以保存独立快照。
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="canvas-heading">
                <div>
                  <span className="eyebrow">DECISIONS THAT TRAVEL</span>
                  <h1>让确认过的选择留下来。</h1>
                  <p>
                    快照保留实验，确认记录保存范围；JSON 用于复现，Markdown
                    用于转译。
                  </p>
                </div>
                <button
                  className="studio-button secondary"
                  disabled={!!mock.pending}
                  onClick={() => beginReview("experiment")}
                >
                  <FloppyDisk size={15} />
                  保存实验快照
                </button>
              </div>
              {!records.length ? (
                <div className="records-empty">
                  <FolderOpen size={40} weight="duotone" />
                  <h2>还没有需要带走的决定。</h2>
                  <p>先体验原型，保存一个实验快照；确认范围后再记录基准。</p>
                  <button
                    className="studio-button secondary"
                    onClick={() => setTab("preview")}
                  >
                    返回操作预览
                    <ArrowRight size={15} />
                  </button>
                </div>
              ) : (
                <div className="baseline-list">
                  {[...records].reverse().map((record) => (
                    <article className="baseline-card" key={record.id}>
                      <header>
                        <span className={`record-type ${record.review.status}`}>
                          {record.review.status === "confirmed" ? (
                            <CheckCircle size={16} />
                          ) : (
                            <GitBranch size={16} />
                          )}{" "}
                          {record.review.status === "confirmed"
                            ? "范围确认"
                            : "实验快照"}
                        </span>
                        <time>
                          {new Date(record.createdAt).toLocaleString("zh-CN")}
                        </time>
                      </header>
                      <h2>
                        {record.id}
                        <span>
                          {record.design.candidateId} ·{" "}
                          {hostLabels[record.design.primary]} ·{" "}
                          {record.design.density === "compact"
                            ? "紧凑"
                            : "舒展"}
                        </span>
                      </h2>
                      <p>{record.review.scope}</p>
                      <div className="baseline-detail">
                        <span>
                          评审依据
                          <strong>{record.review.by || "尚未确认"}</strong>
                        </span>
                        <span>
                          不包含
                          <strong>{record.review.excluded || "未记录"}</strong>
                        </span>
                        {record.review.openQuestions && (
                          <span>
                            仍待讨论
                            <strong>{record.review.openQuestions}</strong>
                          </span>
                        )}
                      </div>
                      <footer>
                        <button onClick={() => restore(record)}>
                          <ClockCounterClockwise size={15} />
                          恢复实验
                        </button>
                        <button
                          onClick={() =>
                            download(
                              `${record.id}.json`,
                              JSON.stringify(record, null, 2),
                              "application/json",
                            )
                          }
                        >
                          <DownloadSimple size={15} />
                          基准 JSON
                        </button>
                        <button
                          onClick={() =>
                            download(
                              `${record.id}-handoff.md`,
                              handoffMarkdown(record),
                              "text/markdown",
                            )
                          }
                        >
                          <ArrowSquareOut size={15} />
                          实现依据
                        </button>
                      </footer>
                    </article>
                  ))}
                </div>
              )}
              <div className="compare-note">
                <Info size={17} />
                <p>
                  确认只覆盖记录中的范围。恢复或导入不会覆盖原记录，也不代表正式业务已经验收。
                </p>
              </div>
            </>
          )}
        </section>
        {controls && (
          <aside
            className="control-panel"
            aria-label="原型调节面板"
            data-scroll-area
          >
            <header>
              <SlidersHorizontal size={17} />
              <strong>原型调节</strong>
              <span>模拟器外</span>
            </header>
            <section>
              <h2>
                <span>01</span>业务场景
              </h2>
              <div className="scenario-options">
                {Object.entries(scenarioLabels).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => applyScenario(key as Scenario)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <p>切换会重置演示数据；已保存的快照保持不变。</p>
              {mock.availability !== "ready" && (
                <button
                  className="scenario-recover"
                  onClick={() => dispatch({ type: "recover" })}
                >
                  {mock.availability === "loading"
                    ? "完成加载"
                    : mock.availability === "offline"
                      ? "恢复网络"
                      : "恢复服务"}
                  <ArrowRight size={13} />
                </button>
              )}
              <div className="state-summary">
                <i className={mock.availability} />
                {mock.availability === "ready"
                  ? "可操作"
                  : mock.availability === "offline"
                    ? "离线，保留内容"
                    : mock.availability === "loading"
                      ? "正在加载"
                      : "加载失败"}
                <span>{mock.items.length} 条反馈</span>
              </div>
            </section>
            <section>
              <h2>
                <span>02</span>视觉实验
              </h2>
              <label>
                候选方向
                <select
                  aria-label="候选方向"
                  value={config.candidateId}
                  onChange={(event) =>
                    setConfig(chooseCandidate(config, event.target.value))
                  }
                >
                  {candidates.map((candidate) => (
                    <option key={candidate.id} value={candidate.id}>
                      {candidate.id} · {candidate.title}
                    </option>
                  ))}
                </select>
              </label>
              <fieldset className="control-group">
                <legend>配色</legend>
                <div className="theme-choices">
                  {(["fern", "ink", "clay"] as const).map((theme, index) => (
                    <button
                      key={theme}
                      aria-label={["苔绿配色", "蓝墨配色", "陶土配色"][index]}
                      aria-pressed={config.theme === theme}
                      style={{ background: themeTokens[theme].accent }}
                      onClick={() => patch({ theme })}
                    >
                      {config.theme === theme && <Check size={15} />}
                    </button>
                  ))}
                </div>
              </fieldset>
              <fieldset className="control-group">
                <legend>密度</legend>
                <div className="segmented">
                  {(["comfortable", "compact"] as const).map((density) => (
                    <button
                      key={density}
                      aria-pressed={config.density === density}
                      onClick={() => patch({ density })}
                    >
                      {density === "comfortable" ? "舒展" : "紧凑"}
                    </button>
                  ))}
                </div>
              </fieldset>
              <fieldset className="control-group">
                <legend>布局</legend>
                <div className="segmented">
                  {(["list", "board"] as const).map((layout) => (
                    <button
                      key={layout}
                      aria-pressed={config.layout === layout}
                      onClick={() => patch({ layout })}
                    >
                      {layout === "list" ? "列表" : "进度板"}
                    </button>
                  ))}
                </div>
              </fieldset>
              <label className="range-label">
                圆角 <output>{config.radius}px</output>
                <input
                  aria-label="圆角"
                  type="range"
                  min="0"
                  max="24"
                  value={config.radius}
                  onChange={(event) =>
                    patch({ radius: Number(event.target.value) })
                  }
                />
              </label>
              <label className="range-label">
                文字大小 <output>{config.textScale}%</output>
                <input
                  aria-label="文字大小"
                  type="range"
                  min="90"
                  max="115"
                  value={config.textScale}
                  onChange={(event) =>
                    patch({ textScale: Number(event.target.value) })
                  }
                />
              </label>
              <label className="toggle-label">
                交互动效
                <input
                  type="checkbox"
                  checked={config.motion}
                  onChange={(event) => patch({ motion: event.target.checked })}
                />
              </label>
            </section>
            <section>
              <h2>
                <span>03</span>模拟器
              </h2>
              <label>
                主视图
                <select
                  aria-label="主模拟器"
                  value={config.primary}
                  onChange={(event) =>
                    patch({ primary: event.target.value as Host })
                  }
                >
                  {Object.entries(hostLabels).map(([key, title]) => (
                    <option key={key} value={key}>
                      {title}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                联动视图
                <select
                  aria-label="联动模拟器"
                  value={config.companion}
                  onChange={(event) =>
                    patch({ companion: event.target.value as Host | "none" })
                  }
                >
                  <option value="none">不显示</option>
                  {Object.entries(hostLabels).map(([key, title]) => (
                    <option key={key} value={key}>
                      {title}
                    </option>
                  ))}
                </select>
              </label>
            </section>
            <footer>
              <button
                className="studio-button secondary"
                disabled={!!mock.pending}
                onClick={() => beginReview("experiment")}
              >
                <FloppyDisk size={15} />
                保存实验快照
              </button>
              <small>调整会改变当前实验，不会覆盖已保存的记录。</small>
            </footer>
          </aside>
        )}
      </div>
      <footer className="studio-footer" inert={!!reviewType}>
        <span>
          <i />
          本地模拟 · 无真实服务接入
        </span>
        <span>
          批注使用 Codex 内置浏览器
          <ArrowDown size={12} />
        </span>
      </footer>
      {toast && (
        <div className="studio-toast" role="status">
          <Info size={17} />
          {toast}
        </div>
      )}
      {reviewType && (
        <div
          className="studio-dialog-backdrop"
          onClick={(event) => {
            if (event.target === event.currentTarget) setReviewType(null);
          }}
        >
          <form
            className="studio-dialog"
            ref={reviewDialog}
            role="dialog"
            aria-modal="true"
            aria-label={
              reviewType === "confirmed" ? "记录本轮确认" : "保存实验快照"
            }
            onSubmit={(event) => {
              event.preventDefault();
              saveReview();
            }}
            data-scroll-area
          >
            <header>
              <span className="eyebrow">SAVE A CLEAR DECISION</span>
              <button
                type="button"
                aria-label="关闭保存记录"
                onClick={() => setReviewType(null)}
              >
                <X size={20} />
              </button>
              <h2>
                {reviewType === "confirmed"
                  ? "这次确认，覆盖哪些内容？"
                  : "为当前实验留一个位置。"}
              </h2>
              <p>
                保存设计参数和演示数据；临时弹窗、光标与未提交输入不包含在记录中。
              </p>
            </header>
            <label>
              评审人或确认依据{reviewType === "confirmed" && <em>必填</em>}
              <input
                autoFocus
                maxLength={160}
                required={reviewType === "confirmed"}
                value={review.by}
                onChange={(event) =>
                  setReview({ ...review, by: event.target.value })
                }
                placeholder="例如：Alex · 已在本轮评审确认"
              />
            </label>
            <label>
              本轮范围<em>必填</em>
              <textarea
                required
                maxLength={4000}
                value={review.scope}
                onChange={(event) =>
                  setReview({ ...review, scope: event.target.value })
                }
              />
            </label>
            <label>
              明确不包含
              <textarea
                maxLength={4000}
                value={review.excluded}
                onChange={(event) =>
                  setReview({ ...review, excluded: event.target.value })
                }
              />
            </label>
            <label>
              仍待讨论
              <textarea
                maxLength={4000}
                value={review.openQuestions}
                onChange={(event) =>
                  setReview({ ...review, openQuestions: event.target.value })
                }
              />
            </label>
            <div className="review-warning">
              <Info size={16} />
              {reviewType === "confirmed"
                ? "仅在用户实际确认后记录。自动化测试请注明 QA 模拟，不能当成用户定稿。"
                : "快照保持“实验”状态，不会自动升级为确认。"}
            </div>
            <footer>
              <button
                type="button"
                className="plain-button"
                onClick={() => setReviewType(null)}
              >
                继续调整
              </button>
              <button className="studio-button" disabled={!!mock.pending}>
                <FloppyDisk size={15} />
                {reviewType === "confirmed" ? "保存确认记录" : "保存快照"}
              </button>
            </footer>
          </form>
        </div>
      )}
    </main>
  );
}
