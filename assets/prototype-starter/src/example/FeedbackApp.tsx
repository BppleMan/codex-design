import { useEffect, useState, type CSSProperties, type Dispatch } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  CaretDown,
  Check,
  CheckCircle,
  ChatCircleDots,
  CircleNotch,
  Clock,
  DotsThree,
  FileText,
  MagnifyingGlass,
  Plus,
  Tray,
  WarningCircle,
  WifiSlash,
  X,
} from "@phosphor-icons/react";
import { effectiveTokens, type DesignConfig } from "../studio/model.ts";
import {
  filterFeedback,
  statusLabels,
  type Feedback,
  type FeedbackStatus,
  type MockAction,
  type MockState,
} from "./model.ts";

type Props = {
  name: string;
  config: DesignConfig;
  state: MockState;
  dispatch: Dispatch<MockAction>;
  onTransition: (id: string, status: FeedbackStatus) => void;
  mobile?: boolean;
  readOnly?: boolean;
};
export function FeedbackApp({
  name,
  config,
  state,
  dispatch,
  onTransition,
  mobile = false,
  readOnly = false,
}: Props) {
  const [filter, setFilter] = useState<"all" | FeedbackStatus>("all");
  const [query, setQuery] = useState("");
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [composing, setComposing] = useState(false);
  const [draft, setDraft] = useState({
    title: "",
    body: "",
    project: "Morrow · 品牌网站",
  });
  const [formError, setFormError] = useState("");
  const selected = state.items.find((item) => item.id === selectedId);
  useEffect(() => {
    if (selectedId && !state.items.some((item) => item.id === selectedId))
      setSelectedId(null);
  }, [selectedId, state.items]);
  const tokens = effectiveTokens(config);
  const style = Object.fromEntries(
    Object.entries(tokens).map(([key, value]) => [`--p-${key}`, value]),
  ) as CSSProperties;
  const visible = filterFeedback(state.items, {
    status: filter,
    query,
    project: selectedProject,
  });
  const count = (status: FeedbackStatus) =>
    state.items.filter((item) => item.status === status).length;
  const blocked = state.availability !== "ready";
  const create = () => {
    if (draft.title.trim().length < 2) {
      setFormError("请用至少两个字描述这条反馈。");
      return;
    }
    if (!draft.body.trim()) {
      setFormError("补充具体意见，之后更容易判断要做什么。");
      return;
    }
    if (blocked) {
      setFormError("当前无法保存，输入内容仍然保留。");
      return;
    }
    const item: Feedback = {
      ...draft,
      id: crypto.randomUUID(),
      author: "我",
      status: "new",
      date: "刚刚",
    };
    dispatch({ type: "create", item });
    setComposing(false);
    setDraft({ title: "", body: "", project: "Morrow · 品牌网站" });
    setFilter("all");
    setSelectedProject(null);
    setQuery("");
    setSelectedId(item.id);
  };
  const row = (item: Feedback) => (
    <button
      className="feedback-row"
      key={item.id}
      onClick={() => setSelectedId(item.id)}
      aria-label={`查看反馈：${item.title}`}
    >
      <span className={`item-icon ${item.status}`}>
        <ChatCircleDots size={21} />
      </span>
      <span className="row-copy">
        <strong>{item.title}</strong>
        <small>
          {item.project}
          <i />
          {item.author}
        </small>
      </span>
      <span className={`feedback-badge ${item.status}`}>
        {statusLabels[item.status]}
      </span>
      <span className="row-date">{item.date}</span>
      <ArrowUpRight className="row-arrow" size={15} />
    </button>
  );
  return (
    <div
      className={`product theme-${config.theme} density-${config.density} ${mobile ? "is-mobile" : ""} ${readOnly ? "is-readonly" : ""} ${config.motion ? "" : "motion-off"}`}
      style={style}
    >
      {!mobile && (
        <aside className="product-sidebar" inert={composing}>
          <div className="product-brand">
            <span>
              <ChatCircleDots size={22} weight="fill" />
            </span>
            <strong>{name}</strong>
          </div>
          <div className="workspace-label">
            我的工作室 <CaretDown size={12} />
          </div>
          <button
            className={`nav-current ${selectedProject ? "" : "active"}`}
            onClick={() => {
              setSelectedId(null);
              setQuery("");
              setFilter("all");
              setSelectedProject(null);
            }}
          >
            <Tray size={19} />
            反馈收件箱<span>{state.items.length}</span>
          </button>
          <div className="project-nav">
            <small>进行中的项目</small>
            {["Morrow · 品牌网站", "Forma · 商店"].map((project, index) => (
              <button
                key={project}
                aria-pressed={selectedProject === project}
                onClick={() => {
                  setSelectedProject(
                    selectedProject === project ? null : project,
                  );
                  setQuery("");
                  setFilter("all");
                  setSelectedId(null);
                }}
              >
                <i className={index ? "apricot" : ""} />
                <span>{project}</span>
              </button>
            ))}
          </div>
          <div className="sidebar-note">
            <span>
              留一点空间，
              <br />
              把事情想清楚。
            </span>
            <div className="note-lines">
              <i />
              <i />
              <i />
            </div>
          </div>
          <div className="product-user">
            <span>AL</span>
            <div>
              <strong>Alex</strong>
              <small>独立设计师</small>
            </div>
            <DotsThree size={19} />
          </div>
        </aside>
      )}
      <section
        className="product-main"
        aria-label="反馈工作区"
        inert={composing}
      >
        <header className="product-toolbar">
          {mobile ? (
            <strong className="mobile-brand">
              <ChatCircleDots size={21} weight="fill" />
              {name}
            </strong>
          ) : (
            <span>
              工作室 <span className="slash">/</span> 反馈收件箱
            </span>
          )}
          <span className="private-note">
            <i />
            仅自己可见
          </span>
        </header>
        {state.availability === "offline" && (
          <div className="product-notice">
            <WifiSlash size={15} />
            <span>暂时离线 · 已有反馈仍可查看</span>
            <button onClick={() => dispatch({ type: "recover" })}>
              重新连接
            </button>
          </div>
        )}
        <div
          className="product-scroll"
          data-scroll-area
          tabIndex={0}
          aria-label="反馈内容滚动区"
        >
          {state.availability === "loading" ? (
            <div className="product-empty">
              <CircleNotch className="spin" size={28} />
              <h2>正在收好每条意见</h2>
              <p>正在读取最近的反馈，请稍候。</p>
            </div>
          ) : state.availability === "error" ? (
            <div className="product-empty">
              <WarningCircle size={32} />
              <h2>这次没能加载反馈</h2>
              <p>已有内容没有被删除，可以重新试一次。</p>
              <button
                className="product-button"
                onClick={() => dispatch({ type: "recover" })}
              >
                重试
              </button>
            </div>
          ) : selected ? (
            <div className="feedback-detail">
              <button
                className="product-back"
                onClick={() => setSelectedId(null)}
              >
                <ArrowLeft size={15} />
                所有反馈
              </button>
              <span className={`feedback-badge ${selected.status}`}>
                {statusLabels[selected.status]}
              </span>
              <h1>{selected.title}</h1>
              <div className="detail-meta">
                <span className="author-avatar">
                  {selected.author.slice(0, 1)}
                </span>
                <span>
                  {selected.author}
                  <small>
                    {selected.project} · {selected.date}
                  </small>
                </span>
              </div>
              <div className="feedback-message">
                <ChatCircleDots size={22} />
                <p>{selected.body}</p>
              </div>
              <div className="decision-callout">
                <Clock size={18} />
                <span>
                  {selected.status === "new"
                    ? "先确认这条意见是否属于本轮，再安排下一步。"
                    : selected.status === "planned"
                      ? "已纳入本轮。完成后标记，保留清晰的处理结果。"
                      : "这条反馈已经完成。需要继续调整时，可以重新打开。"}
                </span>
              </div>
              <div className="detail-actions">
                <button
                  className="product-button"
                  disabled={blocked || !!state.pending}
                  onClick={() =>
                    onTransition(
                      selected.id,
                      selected.status === "new"
                        ? "planned"
                        : selected.status === "planned"
                          ? "done"
                          : "new",
                    )
                  }
                >
                  {state.pending?.id === selected.id ? (
                    <>
                      <CircleNotch className="spin" size={16} />
                      正在保存
                    </>
                  ) : selected.status === "new" ? (
                    <>
                      安排到本轮
                      <ArrowRight size={16} />
                    </>
                  ) : selected.status === "planned" ? (
                    <>
                      标记完成
                      <Check size={16} />
                    </>
                  ) : (
                    "重新打开"
                  )}
                </button>
                {state.pending?.id === selected.id && (
                  <button
                    className="product-link"
                    onClick={() => dispatch({ type: "cancel" })}
                  >
                    取消操作
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="feedback-inbox">
              <div className="inbox-heading">
                <div>
                  <span className="product-kicker">A LITTLE MORE CLARITY</span>
                  <h1>每条意见，都有下一步。</h1>
                  <p>把零散的反馈收好，留出专注设计的时间。</p>
                </div>
                <button
                  className="product-button"
                  onClick={() => {
                    setComposing(true);
                    setFormError("");
                  }}
                >
                  <Plus size={16} />
                  <span>收集反馈</span>
                </button>
              </div>
              <div className="product-stats">
                <button onClick={() => setFilter("new")}>
                  <span className="stat-icon">
                    <Tray size={20} />
                  </span>
                  <div>
                    <strong>{count("new")}</strong>
                    <small>待确认</small>
                  </div>
                </button>
                <button onClick={() => setFilter("planned")}>
                  <span className="stat-icon warm">
                    <Clock size={20} />
                  </span>
                  <div>
                    <strong>{count("planned")}</strong>
                    <small>本轮已安排</small>
                  </div>
                </button>
                <button onClick={() => setFilter("done")}>
                  <span className="stat-icon">
                    <CheckCircle size={20} />
                  </span>
                  <div>
                    <strong>{count("done")}</strong>
                    <small>已完成</small>
                  </div>
                </button>
              </div>
              <div className="feedback-tools">
                {selectedProject && (
                  <button
                    className="project-filter"
                    onClick={() => setSelectedProject(null)}
                    aria-label="清除项目筛选"
                  >
                    {selectedProject}
                    <X size={13} />
                  </button>
                )}
                <div className="filter-tabs">
                  {(["all", "new", "planned", "done"] as const).map((key) => (
                    <button
                      className={filter === key ? "active" : ""}
                      key={key}
                      onClick={() => setFilter(key)}
                    >
                      {key === "all" ? "全部反馈" : statusLabels[key]}
                    </button>
                  ))}
                </div>
                <label className="search-feedback">
                  <MagnifyingGlass size={16} />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="搜索反馈"
                    aria-label="搜索反馈"
                  />
                </label>
              </div>
              {!state.items.length ? (
                <div className="product-empty">
                  <Tray size={35} />
                  <h2>第一条反馈，从这里开始。</h2>
                  <p>粘贴一条客户意见，或者记下自己的观察。</p>
                  <button
                    className="product-button"
                    onClick={() => setComposing(true)}
                  >
                    收集第一条反馈
                    <Plus size={16} />
                  </button>
                </div>
              ) : !visible.length ? (
                <div className="product-empty">
                  <MagnifyingGlass size={28} />
                  <h2>还没有符合条件的反馈</h2>
                  <button
                    className="product-link"
                    onClick={() => {
                      setFilter("all");
                      setSelectedProject(null);
                      setQuery("");
                    }}
                  >
                    清除筛选
                  </button>
                </div>
              ) : config.layout === "board" ? (
                <div className="feedback-board">
                  {(["new", "planned", "done"] as const).map((status) => (
                    <section key={status}>
                      <h3>
                        {statusLabels[status]}{" "}
                        <span>
                          {
                            visible.filter((item) => item.status === status)
                              .length
                          }
                        </span>
                      </h3>
                      {visible
                        .filter((item) => item.status === status)
                        .map(row)}
                    </section>
                  ))}
                </div>
              ) : (
                <div className="feedback-list">{visible.map(row)}</div>
              )}
              <div className="inbox-footer">
                <FileText size={15} />
                <span>这一轮，只专注值得做的改变。</span>
              </div>
            </div>
          )}
        </div>
        {state.message && (
          <div className="product-feedback" role="status">
            <CheckCircle size={13} />
            {state.message}
          </div>
        )}
      </section>
      {composing && (
        <div className="product-dialog-backdrop">
          <form
            className="product-dialog"
            data-scroll-area
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                event.stopPropagation();
                setComposing(false);
              }
            }}
            role="dialog"
            aria-label="收集反馈"
            onSubmit={(event) => {
              event.preventDefault();
              create();
            }}
          >
            <header>
              <div>
                <small>KEEP THE DETAILS</small>
                <h2>收好一条反馈</h2>
              </div>
              <button
                type="button"
                aria-label="关闭收集反馈"
                onClick={() => setComposing(false)}
              >
                <X size={18} />
              </button>
            </header>
            <label>
              一句话概括
              <input
                autoFocus
                maxLength={120}
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                placeholder="例如：让首页的第一句话更明确"
              />
            </label>
            <label>
              具体意见
              <textarea
                maxLength={4000}
                value={draft.body}
                onChange={(e) => setDraft({ ...draft, body: e.target.value })}
                placeholder="保留必要的上下文，之后更容易判断。"
              />
            </label>
            <label>
              所属项目
              <select
                value={draft.project}
                onChange={(e) =>
                  setDraft({ ...draft, project: e.target.value })
                }
              >
                <option>Morrow · 品牌网站</option>
                <option>Forma · 商店</option>
              </select>
            </label>
            {(formError || blocked) && (
              <p className="form-error" role="alert">
                {formError || "当前离线，输入会保留；重新连接后可保存。"}
              </p>
            )}
            {blocked && (
              <button
                type="button"
                className="product-link"
                onClick={() => {
                  dispatch({ type: "recover" });
                  setFormError("");
                }}
              >
                重新连接
              </button>
            )}
            <footer>
              <button
                type="button"
                className="product-link"
                onClick={() => setComposing(false)}
              >
                稍后再说
              </button>
              <button className="product-button" disabled={blocked}>
                保存反馈
                <ArrowRight size={16} />
              </button>
            </footer>
          </form>
        </div>
      )}
    </div>
  );
}
