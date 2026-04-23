"use client";

import { memo, useMemo } from "react";
import confetti from "canvas-confetti";
import hljs from "highlight.js/lib/core";
import python from "highlight.js/lib/languages/python";
import javascript from "highlight.js/lib/languages/javascript";
import typescript from "highlight.js/lib/languages/typescript";
import go from "highlight.js/lib/languages/go";
import java from "highlight.js/lib/languages/java";
import php from "highlight.js/lib/languages/php";
import csharp from "highlight.js/lib/languages/csharp";
import dart from "highlight.js/lib/languages/dart";
import kotlin from "highlight.js/lib/languages/kotlin";
import sql from "highlight.js/lib/languages/sql";
import bash from "highlight.js/lib/languages/bash";
import json from "highlight.js/lib/languages/json";
import xml from "highlight.js/lib/languages/xml";
import css from "highlight.js/lib/languages/css";
import yaml from "highlight.js/lib/languages/yaml";
import type { QAItem } from "./interview-data";
import { LEVEL_CONFIG } from "./interview-data";
import { useLanguage } from "../context/language-context";

// Register languages once at module level
hljs.registerLanguage("python", python);
hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("js", javascript);
hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("ts", typescript);
hljs.registerLanguage("go", go);
hljs.registerLanguage("java", java);
hljs.registerLanguage("php", php);
hljs.registerLanguage("csharp", csharp);
hljs.registerLanguage("cs", csharp);
hljs.registerLanguage("dart", dart);
hljs.registerLanguage("kotlin", kotlin);
hljs.registerLanguage("sql", sql);
hljs.registerLanguage("bash", bash);
hljs.registerLanguage("sh", bash);
hljs.registerLanguage("shell", bash);
hljs.registerLanguage("json", json);
hljs.registerLanguage("html", xml);
hljs.registerLanguage("xml", xml);
hljs.registerLanguage("vue", xml);
hljs.registerLanguage("css", css);
hljs.registerLanguage("yaml", yaml);
hljs.registerLanguage("yml", yaml);

interface QACardProps {
  item: QAItem;
  /** 1-based display index within the current filtered list */
  index: number;
  searchQuery?: string;
  isBookmarked: boolean;
  isLearned: boolean;
  isOpen: boolean;
  onToggleAnswer: (id: number) => void;
  onToggleBookmark: (id: number) => void;
  onToggleLearned: (id: number) => void;
}

export const QACard = memo(function QACard({
  item,
  index,
  searchQuery,
  isBookmarked,
  isLearned,
  isOpen,
  onToggleAnswer,
  onToggleBookmark,
  onToggleLearned,
}: QACardProps) {
  const { locale } = useLanguage();
  const levelStyle = LEVEL_CONFIG[item.level];
  const question = locale === "en" && item.q_en ? item.q_en : item.q;
  const answer = locale === "en" && item.a_en ? item.a_en : item.a;

  const highlightedQuestion = useMemo(() => {
    return formatQuestion(question, searchQuery);
  }, [question, searchQuery]);

  return (
    <div
      className="qa-card"
      data-bookmarked={isBookmarked || undefined}
      data-learned={isLearned || undefined}
    >
      <div
        className="qa-question"
        onClick={() => onToggleAnswer(item.id)}
        role="button"
        tabIndex={0}
        aria-expanded={isOpen}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggleAnswer(item.id);
          }
        }}
      >
        <span className="qa-num">#{index}</span>
        <span
          className="qa-text"
          dangerouslySetInnerHTML={{ __html: highlightedQuestion }}
        />
        <div className="qa-meta">
          <span
            className="qa-level"
            style={{ background: levelStyle.bg, color: levelStyle.color }}
          >
            {locale === "en" ? levelStyle.label_en : levelStyle.label}
          </span>
          <div className="qa-actions">
            <button
              className={`qa-action-btn ${isBookmarked ? "active" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                onToggleBookmark(item.id);
              }}
              title={locale === "en" ? "Save" : "Lưu"}
              aria-label={locale === "en" ? "Bookmark" : "Đánh dấu"}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill={isBookmarked ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
              </svg>
            </button>
            <button
              className={`qa-action-btn ${isLearned ? "learned-active" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                if (!isLearned) {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = (rect.left + rect.width / 2) / window.innerWidth;
                  const y = (rect.top + rect.height / 2) / window.innerHeight;
                  confetti({
                    particleCount: 80,
                    spread: 60,
                    origin: { x, y },
                    colors: [
                      "#4ade80",
                      "#22c55e",
                      "#16a34a",
                      "#fbbf24",
                      "#f59e0b",
                    ],
                    ticks: 120,
                    gravity: 1.2,
                    scalar: 0.9,
                  });
                }
                onToggleLearned(item.id);
              }}
              title={locale === "en" ? "Learned" : "Đã học"}
              aria-label={
                locale === "en" ? "Mark as learned" : "Đánh dấu đã học"
              }
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={isLearned ? 3 : 2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      {isOpen && (
        <div className="qa-answer">
          {answer ? (
            <span dangerouslySetInnerHTML={{ __html: formatAnswer(answer) }} />
          ) : (
            <em style={{ color: "var(--ink-faint)" }}>
              {locale === "en"
                ? "Answer coming soon..."
                : "Đang cập nhật đáp án..."}
            </em>
          )}
        </div>
      )}
    </div>
  );
});

/** Escape HTML, format backtick `code`, then optionally highlight search matches */
export function formatQuestion(text: string, query?: string): string {
  let html = escapeHtml(text);
  // Format inline code: `code` → <code>code</code>
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
  // Highlight search matches
  if (query) {
    const escapedQuery = escapeHtml(query).replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&",
    );
    const regex = new RegExp(`(${escapedQuery})`, "gi");
    html = html.replace(regex, '<mark class="iv-highlight">$1</mark>');
  }
  return html;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function applyInlineFormat(text: string): string {
  return text
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>',
    );
}

// Split text on ". " but NOT inside backticks or after common abbreviations/decimals
function smartSentenceSplit(text: string): string[] {
  const results: string[] = [];
  let current = "";
  let inBacktick = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === "`") inBacktick = !inBacktick;

    current += ch;

    if (inBacktick) continue;

    // Split on ". " followed by uppercase or (number) or Pitfall/Ví dụ/Lưu ý
    if (ch === "." && i + 1 < text.length && text[i + 1] === " ") {
      const after = text.substring(i + 2, i + 12);
      // Don't split on decimals (0.5), version numbers (v4.16), abbreviations
      const before2 = text.substring(Math.max(0, i - 2), i);
      if (/\d$/.test(before2) && /^\d/.test(text[i + 2] || "")) continue;
      // Split if next word starts with uppercase, (, or is a known keyword
      if (
        /^[A-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠƯẠ(]/.test(after) ||
        /^(Pitfall|Ví dụ|Lưu ý|Ngoài|Trong|Với|Khi|Nên|Không|Dùng|Có|Đây|Tuy|So|Thêm|Kết|Quan|Cũng|Hiểu|Tránh)/.test(
          after,
        )
      ) {
        results.push(current.trim());
        current = "";
        i++; // skip the space
      }
    }
  }
  if (current.trim()) results.push(current.trim());
  return results;
}

// ── Code block rendering ──────────────────────────────────────────────────────

function renderCodeBlock(lang: string, code: string): string {
  const trimmed = code.trim();
  let highlighted: string;
  try {
    const language = lang && hljs.getLanguage(lang) ? lang : "plaintext";
    highlighted = hljs.highlight(trimmed, {
      language,
      ignoreIllegals: true,
    }).value;
  } catch {
    highlighted = trimmed
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }
  const langBadge = lang ? `<span class="qa-code-lang">${lang}</span>` : "";
  return `<div class="qa-code-wrap">${langBadge}<pre class="qa-code-pre"><code class="qa-code-block hljs">${highlighted}</code></pre></div>`;
}

export function formatAnswer(rawText: string): string {
  // Split by code blocks first so they bypass HTML escaping + sentence parsing
  const codeRe = /```(\w*)\n([\s\S]*?)```/g;
  const parts: Array<{ type: "text" | "code"; content: string; lang: string }> =
    [];
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = codeRe.exec(rawText)) !== null) {
    if (m.index > last)
      parts.push({
        type: "text",
        content: rawText.slice(last, m.index),
        lang: "",
      });
    parts.push({ type: "code", lang: m[1] ?? "", content: m[2] ?? "" });
    last = m.index + m[0].length;
  }
  if (last < rawText.length)
    parts.push({ type: "text", content: rawText.slice(last), lang: "" });

  // No code blocks → use original text-only formatter unchanged
  if (parts.length === 1 && parts[0].type === "text")
    return formatTextOnly(rawText);

  return parts
    .map((p) =>
      p.type === "code"
        ? renderCodeBlock(p.lang, p.content)
        : p.content.trim()
          ? formatTextOnly(p.content.trim())
          : "",
    )
    .join("");
}

function formatTextOnly(text: string): string {
  const escaped = escapeHtml(text);

  // Explicit newline support `\n` overrides the smart sentence split heuristic
  if (escaped.includes("\n")) {
    const blocks = escaped.split(/\n\s*\n/).filter(Boolean);
    let html = "";
    blocks.forEach((block) => {
      // If block is a list (starts with '- ')
      if (block.trim().startsWith("- ")) {
        const listItems = [];
        let currentItem = "";
        block.split("\n").forEach((line) => {
          if (line.trim().startsWith("- ")) {
            if (currentItem) listItems.push(currentItem);
            currentItem = line.trim().substring(2).trim();
          } else {
            currentItem += (currentItem ? "<br/>" : "") + line.trim();
          }
        });
        if (currentItem) listItems.push(currentItem);

        html += `<ul class="qa-points">${listItems.map((item) => `<li>${applyInlineFormat(item)}</li>`).join("")}</ul>`;
      } else {
        html += `<p class="qa-detail">${applyInlineFormat(block.replace(/\n/g, "<br/>"))}</p>`;
      }
    });
    // Give the first paragraph the summary class if it's the only one or if it makes sense
    html = html.replace(/<p class="qa-detail">/, '<p class="qa-summary">');
    return html;
  }

  // Detect numbered pattern: (1) ... (2) ... (3) ...
  const numberedPattern = /\((\d+)\)\s/g;
  const numberedMatches = [...escaped.matchAll(numberedPattern)];

  if (numberedMatches.length >= 2) {
    // Extract intro before first (1)
    const firstIdx = numberedMatches[0].index!;
    const intro = escaped.substring(0, firstIdx).trim();

    // Extract numbered items
    const items: string[] = [];
    for (let i = 0; i < numberedMatches.length; i++) {
      const start = numberedMatches[i].index! + numberedMatches[i][0].length;
      const end =
        i + 1 < numberedMatches.length
          ? numberedMatches[i + 1].index!
          : escaped.length;
      let content = escaped.substring(start, end).trim();
      // Remove trailing period if last item
      if (i === numberedMatches.length - 1)
        content = content.replace(/\.$/, "");
      items.push(content);
    }

    // Check if there's content after the last numbered item (like Pitfall, Ví dụ)
    const lastItemEnd =
      numberedMatches[numberedMatches.length - 1].index! +
      numberedMatches[numberedMatches.length - 1][0].length;
    const remaining = escaped.substring(lastItemEnd);
    // Split remaining to get post-list remarks
    const postSentences = smartSentenceSplit(remaining);
    const lastItemContent = postSentences[0]?.trim() || "";
    const postRemarks = postSentences.slice(1).filter(Boolean);

    // Update last item
    if (lastItemContent)
      items[items.length - 1] = lastItemContent.replace(/\.$/, "");

    let html = "";
    if (intro) {
      // Check if intro itself has sentences
      const introSentences = smartSentenceSplit(intro);
      html += `<p class="qa-summary">${applyInlineFormat(introSentences[0])}</p>`;
      if (introSentences.length > 1) {
        html += introSentences
          .slice(1)
          .map((s) => `<p class="qa-detail">${applyInlineFormat(s)}</p>`)
          .join("");
      }
    }

    html += '<ol class="qa-points qa-numbered">';
    items.forEach((item) => {
      html += `<li>${applyInlineFormat(item)}</li>`;
    });
    html += "</ol>";

    // Add post-list remarks (Pitfall, Ví dụ, etc.)
    if (postRemarks.length) {
      postRemarks.forEach((remark) => {
        const r = remark.trim();
        if (/^Pitfall/i.test(r)) {
          html += `<p class="qa-pitfall">${applyInlineFormat(r)}</p>`;
        } else if (/^(Ví dụ|Ví dụ thực tế)/i.test(r)) {
          html += `<p class="qa-example">${applyInlineFormat(r)}</p>`;
        } else {
          html += `<p class="qa-detail">${applyInlineFormat(r)}</p>`;
        }
      });
    }

    return html;
  }

  // Fallback: smart sentence split
  const sentences = smartSentenceSplit(escaped);
  if (sentences.length <= 1) return `<p>${applyInlineFormat(escaped)}</p>`;

  // Only 2 sentences → render as 2 paragraphs (1 summary + 1 bullet looks odd)
  if (sentences.length === 2) {
    return sentences
      .map(
        (s, i) =>
          `<p class="${i === 0 ? "qa-summary" : "qa-detail"}">${applyInlineFormat(s)}</p>`,
      )
      .join("");
  }

  // Detect if first sentence is a peer item (not a real summary).
  const first = sentences[0];
  const rest = sentences.slice(1);
  const firstIsShort = first.length < 40;
  const restAvgLen = rest.reduce((sum, s) => sum + s.length, 0) / rest.length;

  // Check if sentences follow a consistent "Label: content" pattern (e.g. "Mount: ...", "Update: ...", "Unmount: ...")
  const labelPattern =
    /^[A-Za-z\u00C0-\u1EF9][A-Za-z\u00C0-\u1EF9\s\d/\-&().#*+]{0,40}:/;
  const labelledCount = sentences.filter((s) =>
    labelPattern.test(s.trim()),
  ).length;
  const allLabelled =
    labelledCount === sentences.length && sentences.length >= 3;
  // Most sentences are labelled and first one too → all are peers
  const firstIsLabelledPeer = allLabelled && labelPattern.test(first.trim());

  // Short first sentence much shorter than the rest → likely a peer (original heuristic)
  const firstIsShortPeer =
    firstIsShort && restAvgLen > first.length * 1.2 && sentences.length <= 4;

  const firstIsPeer = firstIsLabelledPeer || firstIsShortPeer;

  let summary: string | null = null;
  let bulletSentences: string[];

  if (firstIsPeer) {
    summary = null;
    bulletSentences = sentences;
  } else {
    summary = applyInlineFormat(sentences[0]);
    bulletSentences = rest;
  }

  const points = bulletSentences
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => {
      if (/^Pitfall/i.test(s))
        return `</ul><p class="qa-pitfall">${applyInlineFormat(s)}</p><ul class="qa-points" style="display:none">`;
      if (/^(Ví dụ|Ví dụ thực tế)/i.test(s))
        return `</ul><p class="qa-example">${applyInlineFormat(s)}</p><ul class="qa-points" style="display:none">`;
      return `<li>${applyInlineFormat(s)}</li>`;
    })
    .join("");

  // Clean up empty ul tags from pitfall/example extraction
  let html =
    (summary ? `<p class="qa-summary">${summary}</p>` : "") +
    `<ul class="qa-points">${points}</ul>`;
  html = html.replace(/<ul class="qa-points" style="display:none"><\/ul>/g, "");
  html = html.replace(/<ul class="qa-points"><\/ul>/g, "");

  return html;
}
