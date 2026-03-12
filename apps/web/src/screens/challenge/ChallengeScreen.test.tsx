import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Challenge } from "@css-mountain/core";
import { ChallengeScreen } from "./ChallengeScreen";

// ── Mock zustand/vanilla to fix module resolution for @css-mountain/core ──
vi.mock("zustand/vanilla", () => ({
  createStore: () => (fn: (...args: unknown[]) => unknown) => {
    const state = fn(
      (partial: Record<string, unknown>) => {
        Object.assign(state, partial);
      },
      () => state,
    );
    return {
      getState: () => state,
      setState: (partial: Record<string, unknown>) => Object.assign(state, partial),
      subscribe: vi.fn(() => vi.fn()),
      getInitialState: () => state,
    };
  },
}));

vi.mock("zustand", () => ({
  useStore: (store: { getState: () => unknown }, selector?: (s: unknown) => unknown) => {
    const state = store.getState();
    return selector ? selector(state) : state;
  },
}));

// Mock CodeMirror since it needs a real DOM
vi.mock("@codemirror/view", () => ({
  EditorView: Object.assign(
    vi.fn().mockImplementation(() => ({
      state: { doc: { toString: () => "" } },
      dispatch: vi.fn(),
      destroy: vi.fn(),
      focus: vi.fn(),
    })),
    {
      theme: vi.fn().mockReturnValue([]),
      updateListener: { of: vi.fn().mockReturnValue([]) },
      lineWrapping: [],
    },
  ),
  keymap: { of: vi.fn().mockReturnValue([]) },
  lineNumbers: vi.fn().mockReturnValue([]),
  highlightActiveLine: vi.fn().mockReturnValue([]),
}));

vi.mock("@codemirror/state", () => ({
  EditorState: {
    create: vi.fn().mockReturnValue({
      doc: { toString: () => "" },
    }),
    readOnly: { of: vi.fn().mockReturnValue([]) },
  },
}));

vi.mock("@codemirror/lang-css", () => ({
  css: vi.fn().mockReturnValue([]),
}));

vi.mock("@codemirror/autocomplete", () => ({
  autocompletion: vi.fn().mockReturnValue([]),
}));

vi.mock("@codemirror/language", () => ({
  syntaxHighlighting: vi.fn().mockReturnValue([]),
  HighlightStyle: { define: vi.fn().mockReturnValue({}) },
  bracketMatching: vi.fn().mockReturnValue([]),
  foldGutter: vi.fn().mockReturnValue([]),
}));

vi.mock("@codemirror/commands", () => ({
  defaultKeymap: [],
  indentWithTab: {},
}));

vi.mock("@codemirror/search", () => ({
  searchKeymap: [],
  highlightSelectionMatches: vi.fn().mockReturnValue([]),
}));

vi.mock("@lezer/highlight", () => ({
  tags: {
    keyword: "keyword",
    propertyName: "propertyName",
    string: "string",
    number: "number",
    comment: "comment",
    punctuation: "punctuation",
    operator: "operator",
    variableName: "variableName",
    className: "className",
    tagName: "tagName",
    attributeName: "attributeName",
    unit: "unit",
    atom: "atom",
    color: "color",
    bracket: "bracket",
    separator: "separator",
  },
}));

// Mock IframeSandbox
vi.mock("@css-mountain/runner-css", () => ({
  IframeSandbox: vi.fn().mockImplementation(() => ({
    create: vi.fn(),
    updateContent: vi.fn(),
    destroy: vi.fn(),
    getComputedStyle: vi.fn(),
    getBoundingRect: vi.fn(),
  })),
  LivePreviewEngine: vi.fn().mockImplementation(() => ({
    update: vi.fn(),
    forceUpdate: vi.fn(),
    destroy: vi.fn(),
  })),
  CSSRunner: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue(undefined),
    loadChallenge: vi.fn().mockResolvedValue(undefined),
    executeUserCode: vi.fn().mockResolvedValue(undefined),
    validate: vi.fn().mockResolvedValue({
      passed: true,
      score: 1000,
      stars: 3,
      ruleResults: [],
    }),
    renderPreview: vi.fn().mockResolvedValue(undefined),
    destroy: vi.fn(),
  })),
  sanitizeCSS: vi.fn().mockReturnValue({ sanitized: "", warnings: [] }),
}));

const MOCK_CHALLENGE: Challenge = {
  id: "test-1",
  slug: "test-challenge",
  title: "Center a Div",
  description: "Use flexbox to center a div inside its container.",
  type: "match",
  difficulty: "junior",
  zone: 1,
  isBoss: false,
  html: '<div class="container"><div class="box">Hello</div></div>',
  starterCss: ".container {\n  /* Your CSS here */\n}",
  referenceSolutions: [".container { display: flex; justify-content: center; align-items: center; }"],
  validationRules: [
    {
      type: "computed-style",
      selector: ".container",
      property: "display",
      expected: "flex",
      weight: 1,
      message: "Container should use flexbox",
    },
  ],
  hints: [
    { level: "nudge", text: "Think about flexbox..." },
    { level: "clue", text: "Use display: flex with centering properties" },
    { level: "solution", text: "display: flex; justify-content: center; align-items: center;", code: ".container {\n  display: flex;\n  justify-content: center;\n  align-items: center;\n}" },
  ],
  maxScore: 1000,
  metadata: {
    topics: ["flexbox", "centering"],
    estimatedMinutes: 5,
    difficulty: 2,
  },
};

describe("ChallengeScreen", () => {
  beforeEach(async () => {
    // Dynamic import to get the actual mocked store
    const { gameStore } = await import("@css-mountain/core");
    gameStore.getState().clearChallenge();
    gameStore.getState().setLoading(false);
    gameStore.getState().setError(null);
  });

  it("shows empty state when no challenge is loaded", () => {
    render(<ChallengeScreen />);
    expect(screen.getByText("No challenge loaded. Select a challenge from the zone map.")).toBeInTheDocument();
  });

  it("shows loading state when loading", async () => {
    const { gameStore } = await import("@css-mountain/core");
    gameStore.getState().setLoading(true);
    render(<ChallengeScreen />);
    expect(screen.getByText(/LOADING CHALLENGE/)).toBeInTheDocument();
  });

  it("shows error state when there is an error", async () => {
    const { gameStore } = await import("@css-mountain/core");
    gameStore.getState().setError("Failed to load challenge");
    render(<ChallengeScreen />);
    expect(screen.getByText("Failed to load challenge")).toBeInTheDocument();
  });

  it("renders challenge title and description when loaded", async () => {
    const { gameStore } = await import("@css-mountain/core");
    gameStore.getState().loadChallenge(MOCK_CHALLENGE);
    render(<ChallengeScreen />);
    expect(screen.getByText("Center a Div")).toBeInTheDocument();
    expect(screen.getByText("Use flexbox to center a div inside its container.")).toBeInTheDocument();
  });

  it("renders challenge type and difficulty", async () => {
    const { gameStore } = await import("@css-mountain/core");
    gameStore.getState().loadChallenge(MOCK_CHALLENGE);
    render(<ChallengeScreen />);
    expect(screen.getByText("[MATCH]")).toBeInTheDocument();
    expect(screen.getByText("JUNIOR")).toBeInTheDocument();
  });

  it("renders submit and reset buttons", async () => {
    const { gameStore } = await import("@css-mountain/core");
    gameStore.getState().loadChallenge(MOCK_CHALLENGE);
    render(<ChallengeScreen />);
    expect(screen.getByText("SUBMIT")).toBeInTheDocument();
    expect(screen.getByText("RESET")).toBeInTheDocument();
  });

  it("renders mobile tab bar", async () => {
    const { gameStore } = await import("@css-mountain/core");
    gameStore.getState().loadChallenge(MOCK_CHALLENGE);
    render(<ChallengeScreen />);
    expect(screen.getByRole("tablist")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "EDITOR" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "PREVIEW" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "INFO" })).toBeInTheDocument();
  });

  it("switches mobile tabs on click", async () => {
    const user = userEvent.setup();
    const { gameStore } = await import("@css-mountain/core");
    gameStore.getState().loadChallenge(MOCK_CHALLENGE);
    render(<ChallengeScreen />);

    const previewTab = screen.getByRole("tab", { name: "PREVIEW" });
    await user.click(previewTab);
    expect(previewTab).toHaveAttribute("aria-selected", "true");

    const infoTab = screen.getByRole("tab", { name: "INFO" });
    await user.click(infoTab);
    expect(infoTab).toHaveAttribute("aria-selected", "true");
  });

  it("renders hint panel", async () => {
    const { gameStore } = await import("@css-mountain/core");
    gameStore.getState().loadChallenge(MOCK_CHALLENGE);
    render(<ChallengeScreen />);
    expect(screen.getByTestId("hint-panel")).toBeInTheDocument();
    expect(screen.getByText("HINTS (0/3)")).toBeInTheDocument();
  });

  it("renders challenge metadata", async () => {
    const { gameStore } = await import("@css-mountain/core");
    gameStore.getState().loadChallenge(MOCK_CHALLENGE);
    render(<ChallengeScreen />);
    expect(screen.getByText(/flexbox, centering/)).toBeInTheDocument();
    expect(screen.getByText(/5 min/)).toBeInTheDocument();
  });

  it("renders target panel", async () => {
    const { gameStore } = await import("@css-mountain/core");
    gameStore.getState().loadChallenge(MOCK_CHALLENGE);
    render(<ChallengeScreen />);
    expect(screen.getByTestId("target-panel")).toBeInTheDocument();
  });

  it("renders preview panel", async () => {
    const { gameStore } = await import("@css-mountain/core");
    gameStore.getState().loadChallenge(MOCK_CHALLENGE);
    render(<ChallengeScreen />);
    expect(screen.getByTestId("preview-panel")).toBeInTheDocument();
  });
});
