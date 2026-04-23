"use client";

import { useState, useEffect, useCallback } from "react";
import { QA_DATA } from "./interview-data";
import { useInterviewStore } from "./use-interview-store";
import { useDebounce } from "./use-debounce";
import { QACard } from "./qa-card";
import { ContributeForm } from "./contribute-form";
import { DonateModal } from "./donate-modal";
import { useTheme } from "../context/theme-context";
import { useLanguage } from "../context/language-context";
import { CATEGORY_GROUPS, getGroupLabel, GROUP_MAP } from "./category-groups";
import { MorphingText } from "./components/morphing-text";
import { NumberTicker } from "./components/number-ticker";
import { CURRENT_VERSION } from "../changelog/changelog-data";
import { FlashcardView } from "./flashcard-view";
import "./interview.css";

const ITEMS_PER_PAGE = 100;
const INTERVIEW_LEVELS = [
  "all",
  "beginner",
  "intermediate",
  "advanced",
] as const;
const FONT_KEY = "iv_font_size";

const FONT_DEFAULT = 16;

function loadFontSize(): number {
  if (typeof window === "undefined") return FONT_DEFAULT;
  return parseInt(localStorage.getItem(FONT_KEY) || String(FONT_DEFAULT), 10);
}

export function InterviewClient() {
  const { theme, setTheme, toggleTheme } = useTheme();
  const { locale, toggleLocale } = useLanguage();
  const store = useInterviewStore(QA_DATA);
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 300);
  const isSearching = searchInput !== debouncedSearch;
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [hasNewUpdate, setHasNewUpdate] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(true);
  const [viewMode, setViewMode] = useState<"list" | "flashcard">("list");

  useEffect(() => {
    const seen = localStorage.getItem("cl_seen_version");
    if (seen !== CURRENT_VERSION) {
      setHasNewUpdate(true);
      setBannerDismissed(false);
    }
  }, []);
  const [contributeOpen, setContributeOpen] = useState(false);
  const [donateOpen, setDonateOpen] = useState(false);
  const [fontSize, setFontSize] = useState(loadFontSize);

  // Sync debounced search to store
  useEffect(() => {
    store.setSearch(debouncedSearch);
  }, [debouncedSearch]);

  // Persist font size
  useEffect(() => {
    localStorage.setItem(FONT_KEY, String(fontSize));
  }, [fontSize]);

  // Reset visible count on filter change
  useEffect(() => {
    setVisibleCount(ITEMS_PER_PAGE);
  }, [store.activeCategory, store.activeLevel, store.search, store.showFilter]);

  // Keyboard shortcut: / or Ctrl+K/Cmd+K to focus search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Allow Ctrl+K or Cmd+K or /
      const isCmdK = (e.ctrlKey || e.metaKey) && e.key === "k";
      const isSlash = e.key === "/" && !e.ctrlKey && !e.metaKey;

      if (
        (isCmdK || isSlash) &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        document.getElementById("searchInput")?.focus();
      }
      if (e.key === "Escape") {
        (document.getElementById("searchInput") as HTMLInputElement)?.blur();
        setSidebarOpen(false);
        setSettingsOpen(false);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const loadMore = useCallback(() => {
    setVisibleCount((prev) => prev + ITEMS_PER_PAGE);
  }, []);

  const visibleData = store.filteredData.slice(0, visibleCount);
  const hasMore = visibleCount < store.filteredData.length;

  const remainingCount = store.filteredData.length - visibleCount;

  return (
    <div
      style={{ "--iv-fs": `${fontSize}px` } as React.CSSProperties}
      role="main"
    >
      {/* Hero */}
      <header className="iv-hero">
        <h1 className="sr-only">
          Luyện Phỏng Vấn IT — 1800+ Câu Hỏi Phỏng Vấn IT Có Đáp Án 2026
        </h1>
        <div className="iv-hero-actions">
          <button
            className="iv-hover-btn iv-hover-btn--donate"
            onClick={() => setDonateOpen(true)}
            title={locale === "en" ? "Support the project" : "Ủng hộ dự án"}
          >
            <span className="iv-hover-btn-dot" />
            <span className="iv-hover-btn-label">
              {locale === "en" ? "Donate" : "Ủng hộ"}
            </span>
            <span className="iv-hover-btn-reveal">
              <span>{locale === "en" ? "Donate" : "Ủng hộ"}</span>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="currentColor"
                stroke="none"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </span>
          </button>
          <button
            className="iv-hover-btn"
            onClick={() => setContributeOpen(true)}
            title={
              locale === "en" ? "Contribute" : "Đóng góp câu hỏi & tính năng"
            }
          >
            <span className="iv-hover-btn-dot" />
            <span className="iv-hover-btn-label">
              {locale === "en" ? "Contribute" : "Đóng góp"}
            </span>
            <span className="iv-hover-btn-reveal">
              <span>{locale === "en" ? "Submit" : "Góp ý"}</span>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
            </span>
          </button>
          <div className="iv-menu-wrap">
            <button
              className="iv-hero-action-btn"
              onClick={() => setMenuOpen(!menuOpen)}
              title="Menu"
              aria-label={locale === "en" ? "Menu" : "Danh mục"}
              aria-expanded={menuOpen}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
              {hasNewUpdate && <span className="iv-menu-dot" />}
            </button>
            {menuOpen && (
              <>
                <div
                  className="iv-menu-backdrop"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="iv-menu-dropdown">
                  <button
                    className="iv-menu-item"
                    onClick={() => {
                      setMenuOpen(false);
                      toggleLocale();
                    }}
                  >
                    <span style={{ fontSize: "16px", lineHeight: 1 }}>
                      {locale === "en" ? "🇻🇳" : "🇬🇧"}
                    </span>
                    {locale === "en" ? "Tiếng Việt" : "English"}
                  </button>
                  <button
                    className="iv-menu-item"
                    onClick={() => {
                      setMenuOpen(false);
                      setSettingsOpen(true);
                    }}
                  >
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <circle cx="12" cy="12" r="3" />
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                    </svg>
                    {locale === "en" ? "Settings" : "Cài đặt"}
                  </button>
                  <a href="/changelog" className="iv-menu-item">
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 8v4l3 3" />
                      <circle cx="12" cy="12" r="10" />
                    </svg>
                    {locale === "en" ? "Changelog" : "Nhật ký cập nhật"}
                    {hasNewUpdate && <span className="iv-menu-new">NEW</span>}
                  </a>
                  <a
                    href="https://t.me/+cvU8QIEmuY5iMDQ1"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="iv-menu-item"
                    onClick={() => setMenuOpen(false)}
                  >
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="#26A5E4"
                    >
                      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                    </svg>
                    {locale === "en" ? "Telegram Group" : "Nhóm Telegram"}
                  </a>
                </div>
              </>
            )}
          </div>
        </div>
        <MorphingText
          className="iv-morphing-title"
          texts={
            locale === "en"
              ? [
                  `${QA_DATA.length}+ IT Knowledge & Questions`,
                  "Learn · Share · Interview",
                  "Frontend · Backend · System Design · DevOps",
                ]
              : [
                  `${QA_DATA.length}+ Câu Hỏi & Kiến Thức IT`,
                  "Ôn Tập · Chia Sẻ · Phỏng Vấn",
                  "Frontend · Backend · System Design · DevOps",
                ]
          }
        />
        <h2 className="iv-hero-title-mobile">
          {locale === "en"
            ? `${QA_DATA.length}+ IT Knowledge & Questions`
            : `${QA_DATA.length}+ Câu Hỏi & Kiến Thức IT`}
        </h2>
        <p className="iv-hero-sub">
          Luyện phỏng vấn IT miễn phí — HTML · CSS · JS · TS · React · Next.js ·
          Node.js · Go · Java · PHP · C# · Flutter · System Design · DevOps
        </p>
        <div className="iv-hero-stats">
          <div className="iv-hero-stat">
            <div className="iv-hero-stat-num">
              <NumberTicker value={store.progress.total} />
            </div>
            <div className="iv-hero-stat-label">
              {locale === "en" ? "Questions" : "Câu Hỏi"}
            </div>
          </div>
          <div className="iv-hero-stat">
            <div className="iv-hero-stat-num">
              <NumberTicker value={store.progress.done} />
            </div>
            <div className="iv-hero-stat-label">
              {locale === "en" ? "Learned" : "Đã Học"}
            </div>
          </div>
          <div className="iv-hero-stat">
            <div className="iv-hero-stat-num">
              <NumberTicker value={store.bookmarks.size} />
            </div>
            <div className="iv-hero-stat-label">
              {locale === "en" ? "Saved" : "Đã Lưu"}
            </div>
          </div>
          <div className="iv-hero-stat">
            <div className="iv-hero-stat-num">
              <NumberTicker
                value={
                  CATEGORY_GROUPS.filter(
                    (g) => (store.groupCounts[g.label] || 0) > 0,
                  ).length
                }
              />
            </div>
            <div className="iv-hero-stat-label">
              {locale === "en" ? "Topics" : "Chủ Đề"}
            </div>
          </div>
        </div>
      </header>

      {/* Update banner */}
      {hasNewUpdate && !bannerDismissed && (
        <div className="iv-update-banner">
          <div className="iv-update-shimmer" />
          <a href="/changelog" className="iv-update-content">
            <span className="iv-update-badge">NEW</span>
            <span className="iv-update-text">
              {locale === "en"
                ? `v${CURRENT_VERSION} is here — see what's new`
                : `v${CURRENT_VERSION} vừa cập nhật — xem thay đổi mới`}
            </span>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m9 18 6-6-6-6" />
            </svg>
          </a>
          <button
            className="iv-update-close"
            onClick={(e) => {
              e.preventDefault();
              setBannerDismissed(true);
              localStorage.setItem("cl_seen_version", CURRENT_VERSION);
              setHasNewUpdate(false);
            }}
            aria-label="Dismiss"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Topbar */}
      <div className="iv-topbar">
        <button
          className="iv-menu-toggle"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Menu"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M3 12h18M3 6h18M3 18h18" />
          </svg>
        </button>
        <div className="iv-search-box">
          {isSearching ? (
            <div className="iv-search-spinner" />
          ) : (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          )}
          <input
            id="searchInput"
            type="text"
            placeholder={
              locale === "en"
                ? "Search questions... (press / or Ctrl+K)"
                : "Tìm kiếm câu hỏi... (nhấn / hoặc Ctrl+K)"
            }
            aria-label={
              locale === "en" ? "Search questions" : "Tìm kiếm câu hỏi"
            }
            autoComplete="off"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          {searchInput && (
            <button
              className="iv-search-clear"
              onClick={() => setSearchInput("")}
              aria-label="Clear search"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <div className="iv-filter-group">
          {INTERVIEW_LEVELS.map((level) => (
            <button
              key={level}
              className={`iv-filter-btn ${store.activeLevel === level ? "active" : ""}`}
              data-level={level}
              onClick={() => store.setActiveLevel(level)}
            >
              {level === "all"
                ? locale === "en"
                  ? "All"
                  : "Tất cả"
                : level === "beginner"
                  ? locale === "en"
                    ? "Basic"
                    : "Cơ bản"
                  : level === "intermediate"
                    ? locale === "en"
                      ? "Medium"
                      : "Trung bình"
                    : locale === "en"
                      ? "Advanced"
                      : "Nâng cao"}
            </button>
          ))}
          <span className="iv-filter-divider" />
          <button
            className={`iv-filter-btn ${store.activeLevel === "bookmarked" ? "active" : ""}`}
            onClick={() =>
              store.setActiveLevel(
                store.activeLevel === "bookmarked" ? "all" : "bookmarked",
              )
            }
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="currentColor"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ marginRight: 2 }}
            >
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
            {locale === "en" ? "Saved" : "Đã lưu"}
          </button>
          <button
            className={`iv-filter-btn ${store.showFilter === "learned-only" ? "active" : ""}`}
            onClick={() =>
              store.setShowFilter(
                store.showFilter === "learned-only" ? "all" : "learned-only",
              )
            }
          >
            {locale === "en" ? "✓ Learned" : "✓ Đã học"}
          </button>
          <span className="iv-filter-divider" />
          <button
            className={`iv-filter-btn ${viewMode === "flashcard" ? "active" : ""}`}
            onClick={() =>
              setViewMode(viewMode === "flashcard" ? "list" : "flashcard")
            }
            title={locale === "en" ? "Flashcard mode" : "Chế độ thẻ ghi nhớ"}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill={viewMode === "flashcard" ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ marginRight: 2 }}
            >
              <rect x="3" y="4" width="18" height="16" rx="2" ry="2"></rect>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            {locale === "en" ? "Flashcards" : "Thẻ ghi nhớ"}
          </button>
        </div>
      </div>

      {/* Settings dialog — uses contribute modal style */}
      {settingsOpen && (
        <>
          <div
            className="iv-contribute-overlay"
            onClick={() => setSettingsOpen(false)}
          />
          <div className="iv-contribute-modal iv-settings-modal">
            <div className="iv-contribute-header">
              <h3>{locale === "en" ? "Settings" : "Cài Đặt"}</h3>
              <button
                className="iv-contribute-close"
                onClick={() => setSettingsOpen(false)}
                aria-label={locale === "en" ? "Close" : "Đóng"}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="iv-settings-body">
              {/* Theme */}
              <div className="iv-settings-section">
                <span className="iv-settings-label">
                  {locale === "en" ? "Theme" : "Giao diện"}
                </span>
                <div className="iv-settings-chips">
                  {[
                    {
                      mode: "light" as const,
                      label: locale === "en" ? "Light" : "Sáng",
                      icon: (
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <circle cx="12" cy="12" r="5" />
                          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                        </svg>
                      ),
                    },
                    {
                      mode: "dark" as const,
                      label: locale === "en" ? "Dark" : "Tối",
                      icon: (
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                        </svg>
                      ),
                    },
                    {
                      mode: "system" as const,
                      label: locale === "en" ? "System" : "Hệ thống",
                      icon: (
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <rect x="2" y="3" width="20" height="14" rx="2" />
                          <path d="M8 21h8M12 17v4" />
                        </svg>
                      ),
                    },
                  ].map(({ mode, label, icon }) => (
                    <button
                      key={mode}
                      className={`iv-settings-chip ${theme === mode ? "active" : ""}`}
                      onClick={() => setTheme(mode)}
                    >
                      {icon}
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Language */}
              <div className="iv-settings-section">
                <span className="iv-settings-label">
                  {locale === "en" ? "Language" : "Ngôn ngữ"}
                </span>
                <div className="iv-settings-chips">
                  <button
                    className={`iv-settings-chip ${locale === "vi" ? "active" : ""}`}
                    onClick={() => {
                      if (locale !== "vi") toggleLocale();
                    }}
                  >
                    <span>🇻🇳</span> Tiếng Việt
                  </button>
                  <button
                    className={`iv-settings-chip ${locale === "en" ? "active" : ""}`}
                    onClick={() => {
                      if (locale !== "en") toggleLocale();
                    }}
                  >
                    <span>🇬🇧</span> English
                  </button>
                </div>
              </div>

              {/* Show all answers */}
              <div className="iv-settings-row">
                <span id="show-all-answers-label">
                  {locale === "en" ? "Show all answers" : "Hiện tất cả đáp án"}
                </span>
                <button
                  className="iv-settings-toggle"
                  data-active={store.showAll}
                  onClick={() => store.toggleAllAnswers(!store.showAll)}
                  role="switch"
                  aria-checked={store.showAll}
                  aria-labelledby="show-all-answers-label"
                >
                  <span className="iv-settings-toggle-thumb" />
                </button>
              </div>

              {/* Order */}
              <div className="iv-settings-section">
                <span className="iv-settings-label">
                  {locale === "en" ? "Order" : "Thứ tự"}
                </span>
                <div className="iv-settings-chips">
                  <button
                    className={`iv-settings-chip ${!store.shuffled ? "active" : ""}`}
                    onClick={() => {
                      if (store.shuffled) store.toggleShuffle();
                    }}
                  >
                    {locale === "en" ? "Sequential" : "Theo thứ tự"}
                  </button>
                  <button
                    className={`iv-settings-chip ${store.shuffled ? "active" : ""}`}
                    onClick={() => {
                      if (!store.shuffled) store.toggleShuffle();
                    }}
                  >
                    {locale === "en" ? "Shuffle" : "Xáo trộn"}
                  </button>
                </div>
              </div>

              {/* Font size */}
              <div className="iv-settings-section">
                <span className="iv-settings-label">
                  {locale === "en" ? "Font size" : "Cỡ chữ"}
                </span>
                <div className="iv-settings-chips">
                  {[14, 15, 16, 18, 20].map((size) => (
                    <button
                      key={size}
                      className={`iv-settings-chip iv-font-chip ${fontSize === size ? "active" : ""}`}
                      onClick={() => setFontSize(size)}
                    >
                      <span
                        style={{ fontSize: `${Math.round(size * 0.75)}px` }}
                      >
                        A
                      </span>
                      {size === FONT_DEFAULT && (
                        <span className="iv-font-chip-dot" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reset */}
              <div className="iv-settings-section">
                <span className="iv-settings-label">
                  {locale === "en" ? "Reset" : "Đặt lại"}
                </span>
                <div className="iv-settings-chips">
                  <button
                    className="iv-settings-chip"
                    onClick={() => {
                      if (
                        confirm(
                          locale === "en"
                            ? "Reset all settings to default?"
                            : "Đặt lại toàn bộ cài đặt về mặc định?",
                        )
                      ) {
                        setFontSize(FONT_DEFAULT);
                        if (store.shuffled) store.toggleShuffle();
                        store.setShowFilter("all");
                        if (store.showAll) store.toggleAllAnswers(false);
                      }
                    }}
                  >
                    {locale === "en" ? "Reset settings" : "Đặt lại cài đặt"}
                  </button>
                  <button
                    className="iv-settings-chip iv-chip-danger"
                    onClick={() => {
                      if (
                        confirm(
                          locale === "en"
                            ? "Clear all learning progress (learned, saved)?"
                            : "Xóa toàn bộ tiến độ học tập (đã học, đã lưu)?",
                        )
                      )
                        store.resetProgress();
                    }}
                  >
                    {locale === "en" ? "Reset progress" : "Đặt lại tiến độ"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Sidebar overlay */}
      {sidebarOpen && (
        <div
          className="iv-sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Layout */}
      <div className="iv-layout">
        {/* Sidebar */}
        <aside className={`iv-sidebar ${sidebarOpen ? "open" : ""}`}>
          <div className="iv-sidebar-progress">
            <div className="iv-sidebar-progress-label">
              {locale === "en" ? "Learning Progress" : "Tiến Độ Học Tập"}
            </div>
            <div className="iv-progress-bar">
              <div
                className="iv-progress-fill"
                style={{ width: `${store.progress.pct}%` }}
              />
            </div>
            <div className="iv-progress-text">
              {store.progress.done} / {store.progress.total}{" "}
              {locale === "en" ? "learned" : "đã học"} ({store.progress.pct}%)
            </div>
          </div>
          <div
            className={`iv-sidebar-item ${store.activeCategory === "all" ? "active" : ""}`}
            onClick={() => {
              store.setActiveCategory("all");
              setSidebarOpen(false);
            }}
          >
            <span>{locale === "en" ? "All" : "Tất Cả"}</span>
            <span className="iv-sidebar-count">{QA_DATA.length}</span>
          </div>
          <div className="iv-sidebar-list">
            {CATEGORY_GROUPS.map((group) => {
              const count = store.groupCounts[group.label] || 0;
              if (count === 0 && !group.comingSoon) return null;
              const isGroupActive = store.activeCategory === group.label;
              const subs = store.subCategoryCounts[group.label] || {};
              const subEntries = Object.entries(subs).sort(
                (a, b) => b[1] - a[1],
              );
              const hasMultipleSubs = subEntries.length > 1;
              // Check if a sub-category within this group is active
              const isSubActive = subEntries.some(
                ([cat]) => store.activeCategory === cat,
              );

              return (
                <div key={group.label}>
                  {group.sectionLabel && (
                    <div className="iv-sidebar-section">
                      <span className="iv-sidebar-section-label">
                        {locale === "en"
                          ? group.sectionLabel.en
                          : group.sectionLabel.vi}
                      </span>
                    </div>
                  )}
                  <div
                    className={`iv-sidebar-item iv-sidebar-group ${group.comingSoon ? "coming-soon" : ""} ${isGroupActive || isSubActive ? "active" : ""}`}
                    onClick={() => {
                      if (!group.comingSoon) {
                        store.setActiveCategory(group.label);
                        setSidebarOpen(false);
                      }
                    }}
                    style={
                      group.comingSoon
                        ? { cursor: "default", opacity: 0.7 }
                        : undefined
                    }
                  >
                    <span>
                      <img
                        className="iv-sidebar-icon"
                        src={group.icon}
                        alt=""
                        width={18}
                        height={18}
                      />{" "}
                      {group.label}{" "}
                      {group.addedDate &&
                        Date.now() - new Date(group.addedDate).getTime() <
                          30 * 86400000 && (
                          <span className="iv-sidebar-new">NEW</span>
                        )}
                    </span>
                    {group.comingSoon ? (
                      <span className="iv-sidebar-badge-soon">
                        {locale === "en" ? "Soon" : "Sắp ra mắt"}
                      </span>
                    ) : (
                      <span className="iv-sidebar-count">{count}</span>
                    )}
                  </div>
                  {/* Show sub-categories when group or sub is active */}
                  {hasMultipleSubs && (isGroupActive || isSubActive) && (
                    <div className="iv-sidebar-subs">
                      {subEntries.map(([cat, subCount]) => (
                        <div
                          key={cat}
                          className={`iv-sidebar-item iv-sidebar-sub ${store.activeCategory === cat ? "active" : ""}`}
                          onClick={() => {
                            store.setActiveCategory(cat);
                            setSidebarOpen(false);
                          }}
                        >
                          <span>{cat}</span>
                          <span className="iv-sidebar-count">{subCount}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </aside>

        {/* Content */}
        <main className="iv-content">
          <div className="iv-content-header">
            <div className="iv-content-title">
              {store.activeCategory !== "all" &&
                (() => {
                  const groupLabel = getGroupLabel(store.activeCategory);
                  const group = GROUP_MAP.get(groupLabel);
                  return group ? (
                    <img
                      src={group.icon}
                      alt=""
                      width={24}
                      height={24}
                      className="iv-content-title-icon"
                    />
                  ) : null;
                })()}
              {store.activeCategory === "all"
                ? locale === "en"
                  ? "All Questions"
                  : "Tất Cả Câu Hỏi"
                : store.activeCategory}
              <span className="iv-content-count">
                {store.filteredData.length}{" "}
                {locale === "en" ? "questions" : "câu hỏi"}
              </span>
              {store.activeCategory === "all" && (
                <span className="iv-content-count">
                  ·{" "}
                  {
                    CATEGORY_GROUPS.filter(
                      (g) => (store.groupCounts[g.label] || 0) > 0,
                    ).length
                  }{" "}
                  {locale === "en" ? "groups" : "nhóm"}
                </span>
              )}
            </div>
          </div>

          {isSearching ? (
            <div className="iv-search-loading">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="iv-skeleton-card">
                  <div className="iv-skeleton-line iv-skeleton-title" />
                  <div className="iv-skeleton-line iv-skeleton-meta" />
                </div>
              ))}
            </div>
          ) : visibleData.length === 0 ? (
            <div className="iv-empty">
              <p>
                {locale === "en"
                  ? "No questions found."
                  : "Không tìm thấy câu hỏi nào."}
              </p>
            </div>
          ) : viewMode === "flashcard" ? (
            <FlashcardView
              data={store.filteredData}
              searchQuery={debouncedSearch}
              bookmarks={store.bookmarks}
              learned={store.learned}
              onToggleBookmark={store.toggleBookmark}
              onToggleLearned={store.toggleLearned}
            />
          ) : (
            <>
              {visibleData.map((item, idx) => (
                <QACard
                  key={item.id}
                  item={item}
                  index={idx + 1}
                  searchQuery={debouncedSearch}
                  isBookmarked={store.bookmarks.has(item.id)}
                  isLearned={store.learned.has(item.id)}
                  isOpen={store.openAnswers.has(item.id)}
                  onToggleAnswer={store.toggleAnswer}
                  onToggleBookmark={store.toggleBookmark}
                  onToggleLearned={store.toggleLearned}
                />
              ))}
              {hasMore && (
                <div className="iv-load-more">
                  <button className="iv-load-more-btn" onClick={loadMore}>
                    {locale === "en"
                      ? remainingCount > ITEMS_PER_PAGE
                        ? `Load more ${ITEMS_PER_PAGE} of ${remainingCount} remaining`
                        : `Load ${remainingCount} remaining`
                      : remainingCount > ITEMS_PER_PAGE
                        ? `Xem thêm ${ITEMS_PER_PAGE} / ${remainingCount} câu còn lại`
                        : `Xem ${remainingCount} câu còn lại`}
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
      {contributeOpen && (
        <ContributeForm onClose={() => setContributeOpen(false)} />
      )}
      {donateOpen && <DonateModal onClose={() => setDonateOpen(false)} />}

      {/* Footer */}
      <footer className="iv-footer-wrap">
        <div className="iv-footer">
          <div className="iv-footer-left">
            <div className="iv-footer-brand">
              <img
                src="/icon.svg"
                alt=""
                width={24}
                height={24}
                className="iv-footer-icon"
              />
              <span className="iv-footer-logo">
                {locale === "en" ? "IT Knowledge Hub" : "Luyện Phỏng Vấn IT"}
              </span>
            </div>
            <p className="iv-footer-slogan">
              {locale === "en"
                ? "1800+ IT interview questions with detailed answers — Frontend, Backend, Java, PHP, C#, Flutter, System Design, DevOps. Built by the community, for the community."
                : "1800+ câu hỏi phỏng vấn IT kèm đáp án chi tiết — Frontend, Backend, Java, PHP, C#, Flutter, System Design, DevOps. Được xây dựng bởi cộng đồng, dành cho cộng đồng."}
            </p>
            <div className="iv-footer-links">
              <a
                href="mailto:nguyendangdinh47@gmail.com"
                className="iv-footer-link"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect width="20" height="16" x="2" y="4" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
                nguyendangdinh47@gmail.com
              </a>
              <a href="/changelog" className="iv-footer-link">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 8v4l3 3" />
                  <circle cx="12" cy="12" r="10" />
                </svg>
                Changelog
              </a>
              <button
                className="iv-footer-donate"
                onClick={() => setDonateOpen(true)}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  stroke="none"
                >
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
                Donate
              </button>
              <a
                href="https://t.me/+cvU8QIEmuY5iMDQ1"
                target="_blank"
                rel="noopener noreferrer"
                className="iv-footer-link"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                </svg>
                Telegram
              </a>
            </div>
          </div>
          <div className="iv-footer-right">
            <a
              href="https://launch.j2team.dev/products/luyen-phong-van?utm_source=badge-launched&utm_medium=badge&utm_campaign=badge-luyen-phong-van"
              target="_blank"
              rel="noopener noreferrer"
              className="iv-footer-badge"
            >
              <img
                src="https://launch.j2team.dev/badge/luyen-phong-van/light"
                alt="Luyện Phỏng Vấn - Launched on J2TEAM Launch"
                width="250"
                height="54"
                loading="lazy"
              />
            </a>
          </div>
        </div>
        <div className="iv-footer-copy">
          &copy; {new Date().getFullYear()}{" "}
          {locale === "en" ? "IT Knowledge Hub" : "Luyện Phỏng Vấn IT"} ·{" "}
          <a href="/changelog" className="iv-footer-version">
            v{CURRENT_VERSION}
          </a>
        </div>
      </footer>
    </div>
  );
}
