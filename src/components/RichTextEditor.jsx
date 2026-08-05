import { useCallback, useEffect, useRef, useState } from "react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Link2,
  Link2Off,
  Heading2,
  Heading3,
  Pilcrow,
  Quote,
  Undo2,
  Redo2,
  Eraser,
  Code2,
} from "lucide-react";
import {
  sanitizeHtml,
  isHtmlEmpty,
  htmlToText,
  normalizeToHtml,
} from "../utils/sanitizeHtml";

// ── Toolbar button ───────────────────────────────────────────────────────────
const ToolBtn = ({ icon: Icon, title, active, disabled, onClick }) => (
  <button
    type="button"
    title={title}
    aria-label={title}
    aria-pressed={!!active}
    disabled={disabled}
    // onMouseDown (not onClick) so the editor never loses its selection.
    onMouseDown={(e) => {
      e.preventDefault();
      if (!disabled) onClick();
    }}
    className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed
      ${active
        ? "bg-brand-500 text-white"
        : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"}`}
  >
    <Icon size={15} />
  </button>
);

const Divider = () => <span className="w-px h-5 bg-gray-200 mx-1" />;

// ── Editor ───────────────────────────────────────────────────────────────────
/**
 * Dependency-free rich text editor built on contentEditable.
 * Emits sanitized HTML through `onChange` — the same allowlist the backend
 * enforces, so the stored value renders identically on the public site.
 */
const RichTextEditor = ({
  label,
  value,
  onChange,
  placeholder = "Write here...",
  minHeight = 220,
  maxLength,
}) => {
  const editorRef = useRef(null);
  // Last HTML we pushed up, so external re-renders don't reset the caret.
  const lastEmitted = useRef(null);
  const [showSource, setShowSource] = useState(false);
  const [sourceDraft, setSourceDraft] = useState("");
  const [formats, setFormats] = useState({});

  // Enter should produce <p>, not the <div> Chrome defaults to.
  useEffect(() => {
    try {
      document.execCommand("defaultParagraphSeparator", false, "p");
    } catch {
      /* not supported everywhere — harmless */
    }
  }, []);

  // ── Sync incoming value into the DOM (only when it really differs) ────────
  // Comparing against the exact string we last emitted is what keeps the caret
  // from jumping: our own keystrokes echo back through props and are ignored.
  useEffect(() => {
    const el = editorRef.current;
    if (!el || showSource) return;

    const incoming = value || "";
    if (incoming === lastEmitted.current) return;

    const next = normalizeToHtml(incoming);
    if (el.innerHTML === next) return;

    el.innerHTML = next;
    lastEmitted.current = incoming;
  }, [value, showSource]);

  // ── Emit ─────────────────────────────────────────────────────────────────
  const emit = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    const html = isHtmlEmpty(el.innerHTML) ? "" : sanitizeHtml(el.innerHTML);
    lastEmitted.current = html;
    onChange(html);
  }, [onChange]);

  // ── Track which formats apply at the caret ───────────────────────────────
  const refreshFormats = useCallback(() => {
    const el = editorRef.current;
    if (!el || showSource) return;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || !el.contains(sel.anchorNode)) return;

    const currentBlock = () => {
      try {
        return (document.queryCommandValue("formatBlock") || "").toLowerCase();
      } catch {
        return "";
      }
    };

    const state = (cmd) => {
      try {
        return document.queryCommandState(cmd);
      } catch {
        return false;
      }
    };

    const block = currentBlock();

    setFormats({
      bold: state("bold"),
      italic: state("italic"),
      underline: state("underline"),
      strike: state("strikeThrough"),
      ul: state("insertUnorderedList"),
      ol: state("insertOrderedList"),
      h2: block === "h2",
      h3: block === "h3",
      p: block === "p" || block === "div" || block === "",
      quote: block === "blockquote",
    });
  }, [showSource]);

  useEffect(() => {
    document.addEventListener("selectionchange", refreshFormats);
    return () => document.removeEventListener("selectionchange", refreshFormats);
  }, [refreshFormats]);

  // ── Commands ─────────────────────────────────────────────────────────────
  const exec = useCallback(
    (command, arg = null) => {
      const el = editorRef.current;
      if (!el) return;
      el.focus();
      try {
        document.execCommand("styleWithCSS", false, false);
      } catch {
        /* not supported everywhere — harmless */
      }
      document.execCommand(command, false, arg);
      refreshFormats();
      emit();
    },
    [emit, refreshFormats]
  );

  const toggleBlock = useCallback(
    (tag) => {
      const isActive = formats[tag === "blockquote" ? "quote" : tag];
      exec("formatBlock", isActive ? "<p>" : `<${tag}>`);
    },
    [exec, formats]
  );

  const addLink = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) {
      window.alert("Select the text you want to link first.");
      return;
    }
    const url = window.prompt("Link URL", "https://");
    if (!url) return;
    const trimmed = url.trim();
    if (/^(javascript|vbscript|data|file):/i.test(trimmed)) {
      window.alert("That link type is not allowed.");
      return;
    }
    exec("createLink", trimmed);
  }, [exec]);

  // ── Paste: strip everything the allowlist does not cover ─────────────────
  const handlePaste = useCallback(
    (e) => {
      e.preventDefault();
      const clipboard = e.clipboardData;
      const html = clipboard?.getData("text/html");
      const text = clipboard?.getData("text/plain") || "";

      if (html) {
        const clean = sanitizeHtml(html);
        document.execCommand("insertHTML", false, clean);
      } else {
        document.execCommand("insertText", false, text);
      }
      emit();
    },
    [emit]
  );

  // ── Keyboard shortcuts ───────────────────────────────────────────────────
  const handleKeyDown = useCallback(
    (e) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      const key = e.key.toLowerCase();
      if (key === "b") { e.preventDefault(); exec("bold"); }
      else if (key === "i") { e.preventDefault(); exec("italic"); }
      else if (key === "u") { e.preventDefault(); exec("underline"); }
      else if (key === "k") { e.preventDefault(); addLink(); }
    },
    [exec, addLink]
  );

  // ── HTML source view ─────────────────────────────────────────────────────
  const openSource = () => {
    setSourceDraft(normalizeToHtml(value));
    setShowSource(true);
  };

  const applySource = () => {
    const clean = isHtmlEmpty(sourceDraft) ? "" : sanitizeHtml(sourceDraft);
    lastEmitted.current = null; // force the DOM sync effect to run
    onChange(clean);
    setShowSource(false);
  };

  const plainLength = htmlToText(value).length;
  const empty = isHtmlEmpty(value);

  return (
    <div>
      {label && (
        <label className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1.5 block">
          {label}
        </label>
      )}

      <div className="border border-gray-200 rounded-xl overflow-hidden bg-white focus-within:border-brand-500 transition-colors">
        {/* Toolbar */}
        <div className="flex items-center flex-wrap gap-0.5 px-2 py-1.5 border-b border-gray-100 bg-gray-50/60">
          <ToolBtn icon={Bold} title="Bold (Ctrl+B)" active={formats.bold} disabled={showSource} onClick={() => exec("bold")} />
          <ToolBtn icon={Italic} title="Italic (Ctrl+I)" active={formats.italic} disabled={showSource} onClick={() => exec("italic")} />
          <ToolBtn icon={Underline} title="Underline (Ctrl+U)" active={formats.underline} disabled={showSource} onClick={() => exec("underline")} />
          <ToolBtn icon={Strikethrough} title="Strikethrough" active={formats.strike} disabled={showSource} onClick={() => exec("strikeThrough")} />

          <Divider />

          <ToolBtn icon={Pilcrow} title="Paragraph" active={formats.p} disabled={showSource} onClick={() => exec("formatBlock", "<p>")} />
          <ToolBtn icon={Heading2} title="Heading 2" active={formats.h2} disabled={showSource} onClick={() => toggleBlock("h2")} />
          <ToolBtn icon={Heading3} title="Heading 3" active={formats.h3} disabled={showSource} onClick={() => toggleBlock("h3")} />
          <ToolBtn icon={Quote} title="Quote" active={formats.quote} disabled={showSource} onClick={() => toggleBlock("blockquote")} />

          <Divider />

          <ToolBtn icon={List} title="Bulleted list" active={formats.ul} disabled={showSource} onClick={() => exec("insertUnorderedList")} />
          <ToolBtn icon={ListOrdered} title="Numbered list" active={formats.ol} disabled={showSource} onClick={() => exec("insertOrderedList")} />

          <Divider />

          <ToolBtn icon={Link2} title="Add link (Ctrl+K)" disabled={showSource} onClick={addLink} />
          <ToolBtn icon={Link2Off} title="Remove link" disabled={showSource} onClick={() => exec("unlink")} />
          <ToolBtn icon={Eraser} title="Clear formatting" disabled={showSource} onClick={() => exec("removeFormat")} />

          <Divider />

          <ToolBtn icon={Undo2} title="Undo" disabled={showSource} onClick={() => exec("undo")} />
          <ToolBtn icon={Redo2} title="Redo" disabled={showSource} onClick={() => exec("redo")} />

          <div className="ml-auto flex items-center gap-1">
            {showSource ? (
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); applySource(); }}
                className="text-xs font-bold px-3 py-1.5 rounded-lg bg-brand-500 text-white hover:bg-brand-400 transition-colors"
              >
                Apply HTML
              </button>
            ) : (
              <ToolBtn icon={Code2} title="Edit HTML source" onClick={openSource} />
            )}
          </div>
        </div>

        {/* Editing surface */}
        {showSource ? (
          <textarea
            value={sourceDraft}
            onChange={(e) => setSourceDraft(e.target.value)}
            spellCheck={false}
            style={{ minHeight }}
            className="w-full px-4 py-3 text-xs font-mono text-gray-800 outline-none resize-y bg-gray-50/50"
          />
        ) : (
          <div className="relative">
            {empty && (
              <span className="absolute left-4 top-3 text-sm text-gray-400 pointer-events-none select-none">
                {placeholder}
              </span>
            )}
            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              role="textbox"
              aria-multiline="true"
              aria-label={label || "Rich text editor"}
              onInput={emit}
              onBlur={emit}
              onPaste={handlePaste}
              onKeyDown={handleKeyDown}
              onMouseUp={refreshFormats}
              onKeyUp={refreshFormats}
              style={{ minHeight }}
              className="rte-content w-full px-4 py-3 text-sm text-gray-800 outline-none overflow-y-auto"
            />
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-1.5">
        <p className="text-[11px] text-gray-400">
          Formatting is saved and shown exactly like this on the website.
        </p>
        {maxLength ? (
          <p className={`text-[11px] font-medium ${plainLength > maxLength ? "text-red-500" : "text-gray-400"}`}>
            {plainLength} / {maxLength}
          </p>
        ) : (
          <p className="text-[11px] text-gray-400">{plainLength} characters</p>
        )}
      </div>
    </div>
  );
};

export default RichTextEditor;
