"use client";

import { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import type { QAItem } from "./interview-data";
import { LEVEL_CONFIG } from "./interview-data";
import { useLanguage } from "../context/language-context";
import { formatQuestion, formatAnswer } from "./qa-card";

interface FlashcardViewProps {
  data: QAItem[];
  searchQuery?: string;
  bookmarks: Set<number>;
  learned: Set<number>;
  onToggleBookmark: (id: number) => void;
  onToggleLearned: (id: number) => void;
}

export function FlashcardView({
  data,
  searchQuery,
  bookmarks,
  learned,
  onToggleBookmark,
  onToggleLearned,
}: FlashcardViewProps) {
  const { locale } = useLanguage();
  const [index, setIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Reset index when data changes
  useEffect(() => {
    setIndex(0);
    setIsFlipped(false);
  }, [data]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if typing in an input
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      )
        return;

      if (e.code === "Space" || e.code === "Enter") {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (e.code === "ArrowRight" || e.code === "KeyD") {
        e.preventDefault();
        if (index < data.length - 1) {
          setIndex((i) => i + 1);
          setIsFlipped(false);
        }
      } else if (e.code === "ArrowLeft" || e.code === "KeyA") {
        e.preventDefault();
        if (index > 0) {
          setIndex((i) => i - 1);
          setIsFlipped(false);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [index, data.length]);

  if (data.length === 0) {
    return (
      <div className="iv-empty">
        <p>
          {locale === "en"
            ? "No questions found."
            : "Không tìm thấy câu hỏi nào."}
        </p>
      </div>
    );
  }

  const item = data[index];
  const levelStyle = LEVEL_CONFIG[item.level];
  const question = locale === "en" && item.q_en ? item.q_en : item.q;
  const answer = locale === "en" && item.a_en ? item.a_en : item.a;
  const isBookmarked = bookmarks.has(item.id);
  const isLearned = learned.has(item.id);

  const highlightedQuestion = formatQuestion(question, searchQuery);

  return (
    <div className="iv-flashcard-container">
      <div className="iv-flashcard-progress">
        <span>
          {index + 1} / {data.length}
        </span>
      </div>

      <div
        className={`iv-flashcard ${isFlipped ? "flipped" : ""}`}
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <div className="iv-flashcard-inner">
          <div className="iv-flashcard-front">
            <div className="iv-flashcard-meta">
              <span
                className="qa-level"
                style={{ background: levelStyle.bg, color: levelStyle.color }}
              >
                {locale === "en" ? levelStyle.label_en : levelStyle.label}
              </span>
              <span className="qa-num">#{index + 1}</span>
            </div>
            <div
              className="iv-flashcard-content"
              dangerouslySetInnerHTML={{ __html: highlightedQuestion }}
            />
            <div className="iv-flashcard-hint">
              {locale === "en"
                ? "Click or press Space to flip"
                : "Nhấn vào đây hoặc phím Space để lật"}
            </div>
          </div>

          <div className="iv-flashcard-back">
            <div className="iv-flashcard-meta">
              <span
                className="qa-level"
                style={{ background: levelStyle.bg, color: levelStyle.color }}
              >
                {locale === "en" ? levelStyle.label_en : levelStyle.label}
              </span>
              <div className="qa-actions" onClick={(e) => e.stopPropagation()}>
                <button
                  className={`qa-action-btn ${isBookmarked ? "active" : ""}`}
                  onClick={() => onToggleBookmark(item.id)}
                  title={locale === "en" ? "Save" : "Lưu"}
                >
                  <svg
                    width="18"
                    height="18"
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
                    if (!isLearned) {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const x =
                        (rect.left + rect.width / 2) / window.innerWidth;
                      const y =
                        (rect.top + rect.height / 2) / window.innerHeight;
                      confetti({
                        particleCount: 80,
                        spread: 60,
                        origin: { x, y },
                      });
                    }
                    onToggleLearned(item.id);
                  }}
                  title={locale === "en" ? "Learned" : "Đã học"}
                >
                  <svg
                    width="18"
                    height="18"
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
            <div className="iv-flashcard-content qa-answer">
              {answer ? (
                <span
                  dangerouslySetInnerHTML={{ __html: formatAnswer(answer) }}
                />
              ) : (
                <em style={{ color: "var(--ink-faint)" }}>
                  {locale === "en"
                    ? "Answer coming soon..."
                    : "Đang cập nhật đáp án..."}
                </em>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="iv-flashcard-controls">
        <button
          className="iv-flashcard-nav-btn"
          disabled={index === 0}
          onClick={() => {
            setIndex((i) => i - 1);
            setIsFlipped(false);
          }}
          title={
            locale === "en"
              ? "Previous (Left Arrow)"
              : "Câu trước (Mũi tên trái)"
          }
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          className="iv-flashcard-nav-btn"
          disabled={index === data.length - 1}
          onClick={() => {
            setIndex((i) => i + 1);
            setIsFlipped(false);
          }}
          title={
            locale === "en" ? "Next (Right Arrow)" : "Câu tiếp (Mũi tên phải)"
          }
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
