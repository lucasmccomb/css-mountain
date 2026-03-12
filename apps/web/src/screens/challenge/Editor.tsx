import { useRef, useEffect, useCallback } from "react";
import { EditorState } from "@codemirror/state";
import { EditorView, keymap, lineNumbers, highlightActiveLine } from "@codemirror/view";
import { defaultKeymap, indentWithTab } from "@codemirror/commands";
import { css as cssLanguage } from "@codemirror/lang-css";
import { autocompletion } from "@codemirror/autocomplete";
import {
  syntaxHighlighting,
  HighlightStyle,
  bracketMatching,
  foldGutter,
} from "@codemirror/language";
import { tags } from "@lezer/highlight";
import { searchKeymap, highlightSelectionMatches } from "@codemirror/search";
import styles from "./Editor.module.css";

/**
 * DOS VGA color scheme for CodeMirror syntax highlighting.
 * Uses the VGA 16-color palette for an authentic retro look.
 */
const dosHighlightStyle = HighlightStyle.define([
  { tag: tags.keyword, color: "#55ffff" },          // light cyan
  { tag: tags.propertyName, color: "#55ff55" },      // light green
  { tag: tags.string, color: "#ffff55" },            // yellow
  { tag: tags.number, color: "#ff55ff" },            // light magenta
  { tag: tags.comment, color: "#555555" },           // dark gray
  { tag: tags.punctuation, color: "#aaaaaa" },       // light gray
  { tag: tags.operator, color: "#aaaaaa" },          // light gray
  { tag: tags.variableName, color: "#5555ff" },      // light blue
  { tag: tags.className, color: "#55ffff" },         // light cyan
  { tag: tags.tagName, color: "#ff5555" },           // light red
  { tag: tags.attributeName, color: "#55ff55" },     // light green
  { tag: tags.unit, color: "#ff55ff" },              // light magenta
  { tag: tags.atom, color: "#55ffff" },              // light cyan
  { tag: tags.color, color: "#ffff55" },             // yellow
  { tag: tags.bracket, color: "#aaaaaa" },           // light gray
  { tag: tags.separator, color: "#aaaaaa" },         // light gray
]);

/**
 * DOS-styled CodeMirror theme using VGA colors.
 */
const dosEditorTheme = EditorView.theme({
  "&": {
    backgroundColor: "#000000",
    color: "#aaaaaa",
    fontFamily: '"PxPlus IBM VGA8", monospace',
    fontSize: "16px",
    lineHeight: "1.25",
    height: "100%",
  },
  ".cm-content": {
    caretColor: "#55ff55",
    fontFamily: '"PxPlus IBM VGA8", monospace',
    padding: "8px 0",
  },
  ".cm-cursor": {
    borderLeftColor: "#55ff55",
    borderLeftWidth: "2px",
  },
  "&.cm-focused .cm-cursor": {
    borderLeftColor: "#55ff55",
  },
  ".cm-activeLine": {
    backgroundColor: "#111111",
  },
  ".cm-activeLineGutter": {
    backgroundColor: "#111111",
  },
  ".cm-gutters": {
    backgroundColor: "#000000",
    color: "#555555",
    borderRight: "1px solid #333333",
    fontFamily: '"PxPlus IBM VGA8", monospace',
  },
  ".cm-lineNumbers .cm-gutterElement": {
    color: "#555555",
    paddingRight: "8px",
  },
  ".cm-foldGutter": {
    color: "#555555",
  },
  "&.cm-focused .cm-selectionBackground, .cm-selectionBackground": {
    backgroundColor: "#003333",
  },
  ".cm-matchingBracket": {
    backgroundColor: "#333333",
    outline: "1px solid #55ffff",
  },
  ".cm-tooltip": {
    backgroundColor: "#000055",
    color: "#aaaaaa",
    border: "1px solid #0000aa",
    fontFamily: '"PxPlus IBM VGA8", monospace',
    fontSize: "14px",
  },
  ".cm-tooltip.cm-tooltip-autocomplete > ul > li": {
    padding: "2px 8px",
  },
  ".cm-tooltip.cm-tooltip-autocomplete > ul > li[aria-selected]": {
    backgroundColor: "#0000aa",
    color: "#ffffff",
  },
  ".cm-searchMatch": {
    backgroundColor: "#553300",
    outline: "1px solid #aa5500",
  },
  ".cm-searchMatch.cm-searchMatch-selected": {
    backgroundColor: "#335500",
  },
  ".cm-scroller": {
    overflow: "auto",
  },
  ".cm-panels": {
    backgroundColor: "#000055",
    color: "#aaaaaa",
  },
  ".cm-panel.cm-search": {
    backgroundColor: "#000033",
    "& input": {
      backgroundColor: "#000000",
      color: "#aaaaaa",
      border: "1px solid #0000aa",
      fontFamily: '"PxPlus IBM VGA8", monospace',
    },
    "& button": {
      backgroundColor: "#0000aa",
      color: "#ffffff",
      border: "none",
      fontFamily: '"PxPlus IBM VGA8", monospace',
      cursor: "pointer",
    },
  },
});

interface EditorProps {
  /** Current CSS value */
  value: string;
  /** Called when CSS changes */
  onChange: (value: string) => void;
  /** Whether the editor should be read-only */
  readOnly?: boolean;
  /** Additional CSS class for the wrapper */
  className?: string;
}

/**
 * CodeMirror 6 editor with DOS-themed CSS syntax highlighting.
 * Designed for the CSS challenge screen.
 */
export function Editor({ value, onChange, readOnly = false, className }: EditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Track whether the update is from an external value change
  const isExternalUpdate = useRef(false);

  // Create the editor on mount
  useEffect(() => {
    if (!containerRef.current) return;

    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged && !isExternalUpdate.current) {
        const newValue = update.state.doc.toString();
        onChangeRef.current(newValue);
      }
    });

    const state = EditorState.create({
      doc: value,
      extensions: [
        lineNumbers(),
        highlightActiveLine(),
        bracketMatching(),
        foldGutter(),
        highlightSelectionMatches(),
        cssLanguage(),
        autocompletion(),
        syntaxHighlighting(dosHighlightStyle),
        dosEditorTheme,
        keymap.of([...defaultKeymap, ...searchKeymap, indentWithTab]),
        updateListener,
        EditorState.readOnly.of(readOnly),
        EditorView.lineWrapping,
      ],
    });

    const view = new EditorView({
      state,
      parent: containerRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // Only run on mount/unmount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readOnly]);

  // Sync external value changes to the editor
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    const currentDoc = view.state.doc.toString();
    if (currentDoc !== value) {
      isExternalUpdate.current = true;
      view.dispatch({
        changes: {
          from: 0,
          to: currentDoc.length,
          insert: value,
        },
      });
      isExternalUpdate.current = false;
    }
  }, [value]);

  const handleContainerClick = useCallback(() => {
    viewRef.current?.focus();
  }, []);

  return (
    <div
      className={`${styles.editorWrapper} ${className ?? ""}`}
      onClick={handleContainerClick}
      data-testid="code-editor"
    >
      <div ref={containerRef} className={styles.editorContainer} />
    </div>
  );
}
