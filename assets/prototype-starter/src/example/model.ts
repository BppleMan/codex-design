export type FeedbackStatus = "new" | "planned" | "done";
export type Availability = "ready" | "offline" | "loading" | "error";
export type Scenario = "everyday" | "empty" | "offline" | "loading" | "error";
export type Feedback = {
  id: string;
  title: string;
  project: string;
  author: string;
  body: string;
  status: FeedbackStatus;
  date: string;
};
export type MockState = {
  items: Feedback[];
  availability: Availability;
  pending: { token: string; id: string; status: FeedbackStatus } | null;
  message: string;
};
export const statusLabels: Record<FeedbackStatus, string> = {
  new: "待确认",
  planned: "已安排",
  done: "已完成",
};
export const scenarioLabels: Record<Scenario, string> = {
  everyday: "日常工作",
  empty: "首次使用",
  offline: "暂时离线",
  loading: "正在加载",
  error: "加载失败",
};
export const fixture: Feedback[] = [
  {
    id: "feedback-01",
    title: "让首页的第一句话更明确",
    project: "Morrow · 品牌网站",
    author: "林可",
    body: "现在的标题很有氛围，但第一次来的用户可能不清楚我们做什么。希望第一屏直接说明服务对象，再保留一句有温度的副标题。",
    status: "new",
    date: "今天 10:24",
  },
  {
    id: "feedback-02",
    title: "移动端卡片之间多一点呼吸感",
    project: "Morrow · 品牌网站",
    author: "陈曦",
    body: "手机上连续阅读三张服务卡片时，内容有点挤。可以比较一下间距更宽的版本，同时保留当前文字大小。",
    status: "new",
    date: "今天 09:46",
  },
  {
    id: "feedback-03",
    title: "统一付款按钮的文案",
    project: "Forma · 商店",
    author: "许言",
    body: "购物车与结算页的按钮分别写着「继续」和「确认」。这一轮先统一为明确的下一步动作。",
    status: "planned",
    date: "昨天 16:18",
  },
  {
    id: "feedback-04",
    title: "保留这版更轻的导航",
    project: "Morrow · 品牌网站",
    author: "林可",
    body: "我们已经比较过两种导航布局，这一版更清楚。按现在的方向继续，暂时不增加新的入口。",
    status: "done",
    date: "昨天 14:32",
  },
];
export function makeScenario(scenario: Scenario): MockState {
  return {
    items: scenario === "empty" ? [] : structuredClone(fixture),
    availability: ["offline", "loading", "error"].includes(scenario)
      ? (scenario as Availability)
      : "ready",
    pending: null,
    message: "",
  };
}
export type MockAction =
  | { type: "scenario"; scenario: Scenario }
  | { type: "restore"; state: MockState }
  | { type: "recover" }
  | { type: "create"; item: Feedback }
  | { type: "begin"; token: string; id: string; status: FeedbackStatus }
  | { type: "finish"; token: string }
  | { type: "cancel" };
export function mockReducer(state: MockState, action: MockAction): MockState {
  switch (action.type) {
    case "scenario":
      return makeScenario(action.scenario);
    case "restore":
      return { ...structuredClone(action.state), pending: null, message: "" };
    case "recover":
      return {
        ...state,
        availability: "ready",
        pending: null,
        message: "连接已恢复，可以继续处理反馈。",
      };
    case "create": {
      if (state.availability !== "ready")
        return { ...state, message: "当前无法保存，输入内容仍然保留。" };
      if (
        !action.item.title.trim() ||
        !action.item.body.trim() ||
        state.items.some((item) => item.id === action.item.id)
      )
        return state;
      return {
        ...state,
        items: [
          {
            ...action.item,
            title: action.item.title.trim(),
            body: action.item.body.trim(),
          },
          ...state.items,
        ],
        message: "反馈已收好，下一步可以安排到本轮。",
      };
    }
    case "begin": {
      if (
        state.availability !== "ready" ||
        state.pending ||
        !state.items.some((item) => item.id === action.id)
      )
        return state;
      return {
        ...state,
        pending: { token: action.token, id: action.id, status: action.status },
        message: "",
      };
    }
    case "finish": {
      if (
        !state.pending ||
        state.pending.token !== action.token ||
        state.availability !== "ready"
      )
        return state;
      return {
        ...state,
        items: state.items.map((item) =>
          item.id === state.pending!.id
            ? { ...item, status: state.pending!.status }
            : item,
        ),
        pending: null,
        message: "更新已保存。",
      };
    }
    case "cancel":
      return { ...state, pending: null, message: "已取消，反馈状态保持原样。" };
  }
}

// Exact project membership is independent from full-text matching.
export function filterFeedback(
  items: Feedback[],
  filters: {
    status: "all" | FeedbackStatus;
    query: string;
    project: string | null;
  },
) {
  const query = filters.query.trim().toLowerCase();
  return items.filter(
    (item) =>
      (filters.status === "all" || item.status === filters.status) &&
      (!filters.project || item.project === filters.project) &&
      `${item.title} ${item.project} ${item.body}`
        .toLowerCase()
        .includes(query),
  );
}
