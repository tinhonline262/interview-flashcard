"use client";

import { useState } from "react";
import type {
  SpacedRepetitionData,
  SpacedRepetitionStats,
} from "./spaced-repetition";
import { getDifficultyLevel, formatNextReviewDate } from "./spaced-repetition";
import { useLanguage } from "../context/language-context";

interface SpacedRepetitionStatsProps {
  stats: SpacedRepetitionStats;
  onResetClick?: () => void;
  onExportClick?: () => void;
}

const translations = {
  en: {
    statistics: "Learning Statistics",
    itemsTracked: "Items Tracked",
    dueTodayLeft: "Due Today",
    mastered: "Mastered",
    newItems: "New Items",
    avgEaseFactor: "Avg. Ease Factor",
    totalReviews: "Total Reviews",
    daysSinceReview: "Days Since Review",
    today: "Today",
    reset: "Reset Progress",
    export: "Export Data",
    confirmReset: "Reset all progress? This cannot be undone.",
  },
  vi: {
    statistics: "Thống Kê Học Tập",
    itemsTracked: "Mục Được Theo Dõi",
    dueTodayLeft: "Đến Hạn Hôm Nay",
    mastered: "Đã Thành Thạo",
    newItems: "Mục Mới",
    avgEaseFactor: "Hệ Số Dễ Trung Bình",
    totalReviews: "Tổng Lần Ôn Tập",
    daysSinceReview: "Ngày Kể Từ Ôn Tập",
    today: "Hôm nay",
    reset: "Đặt Lại Tiến Độ",
    export: "Xuất Dữ Liệu",
    confirmReset: "Đặt lại tất cả tiến độ? Hành động này không thể hoàn tác.",
  },
};

export function SpacedRepetitionStats({
  stats,
  onResetClick,
  onExportClick,
}: SpacedRepetitionStatsProps) {
  const { locale } = useLanguage();
  const t = translations[locale === "en" ? "en" : "vi"];
  const [showReset, setShowReset] = useState(false);

  const handleReset = () => {
    if (confirm(t.confirmReset)) {
      onResetClick?.();
      setShowReset(false);
    }
  };

  return (
    <div className="sr-stats-container">
      <h3>{t.statistics}</h3>
      <div className="sr-stats-grid">
        <div className="sr-stat-item">
          <div className="sr-stat-value">{stats.totalItemsTracked}</div>
          <div className="sr-stat-label">{t.itemsTracked}</div>
        </div>
        <div className="sr-stat-item highlight">
          <div className="sr-stat-value">{stats.itemsDueForReview}</div>
          <div className="sr-stat-label">{t.dueTodayLeft}</div>
        </div>
        <div className="sr-stat-item">
          <div className="sr-stat-value">{stats.itemsMastered}</div>
          <div className="sr-stat-label">{t.mastered}</div>
        </div>
        <div className="sr-stat-item">
          <div className="sr-stat-value">{stats.newItems}</div>
          <div className="sr-stat-label">{t.newItems}</div>
        </div>
        <div className="sr-stat-item">
          <div className="sr-stat-value">
            {stats.averageEaseFactor.toFixed(2)}
          </div>
          <div className="sr-stat-label">{t.avgEaseFactor}</div>
        </div>
        <div className="sr-stat-item">
          <div className="sr-stat-value">{stats.totalReviewsCompleted}</div>
          <div className="sr-stat-label">{t.totalReviews}</div>
        </div>
        <div className="sr-stat-item">
          <div className="sr-stat-value">
            {stats.daysSinceLastReview === null
              ? t.today
              : stats.daysSinceLastReview}
          </div>
          <div className="sr-stat-label">{t.daysSinceReview}</div>
        </div>
      </div>

      <div className="sr-stats-actions">
        {onExportClick && (
          <button onClick={onExportClick} className="sr-btn sr-btn-secondary">
            {t.export}
          </button>
        )}
        {onResetClick && (
          <button onClick={handleReset} className="sr-btn sr-btn-danger">
            {t.reset}
          </button>
        )}
      </div>
    </div>
  );
}

interface ItemDifficultyBadgeProps {
  easeFactor: number;
}

export function ItemDifficultyBadge({ easeFactor }: ItemDifficultyBadgeProps) {
  const difficulty = getDifficultyLevel(easeFactor);
  const label = {
    easy: "Easy",
    normal: "Normal",
    hard: "Hard",
    "very-hard": "Very Hard",
  }[difficulty];

  return (
    <span className={`sr-difficulty sr-difficulty-${difficulty}`}>{label}</span>
  );
}

interface ItemReviewInfoProps {
  data: SpacedRepetitionData;
}

export function ItemReviewInfo({ data }: ItemReviewInfoProps) {
  const { locale } = useLanguage();
  const t = {
    en: {
      nextReview: "Next review:",
      reviews: "Reviews:",
      interval: "Interval:",
      days: "days",
      lapses: "Lapses:",
      reps: "Reps:",
    },
    vi: {
      nextReview: "Ôn tập tiếp:",
      reviews: "Ôn tập:",
      interval: "Khoảng:",
      days: "ngày",
      lapses: "Lỗi:",
      reps: "Lần:",
    },
  }[locale === "en" ? "en" : "vi"];

  return (
    <div className="sr-review-info">
      <span className="sr-info-item">
        {t.nextReview} {formatNextReviewDate(data)}
      </span>
      <span className="sr-info-item">
        {t.reviews} {data.totalReviews}
      </span>
      {data.totalReviews > 0 && (
        <>
          <span className="sr-info-item">
            {t.interval} {data.interval} {t.days}
          </span>
          {data.lapses > 0 && (
            <span className="sr-info-item sr-info-lapses">
              {t.lapses} {data.lapses}
            </span>
          )}
        </>
      )}
    </div>
  );
}

interface ReviewQualityButtonsProps {
  onQualitySelect: (quality: 0 | 1 | 2 | 3 | 4 | 5) => void;
  disabled?: boolean;
}

/**
 * Quality rating buttons (0-5) for recording review feedback
 */
export function ReviewQualityButtons({
  onQualitySelect,
  disabled,
}: ReviewQualityButtonsProps) {
  const { locale } = useLanguage();
  const t = {
    en: {
      rating: "How well do you remember this?",
      forgotten: "Forgotten",
      hard: "Hard",
      good: "Good",
      easy: "Easy",
      perfect: "Perfect",
    },
    vi: {
      rating: "Bạn nhớ bao nhiêu?",
      forgotten: "Quên hết",
      hard: "Khó",
      good: "Tốt",
      easy: "Dễ",
      perfect: "Hoàn hảo",
    },
  }[locale === "en" ? "en" : "vi"];

  return (
    <div className="sr-quality-buttons">
      <div className="sr-quality-label">{t.rating}</div>
      <div className="sr-quality-grid">
        <button
          onClick={() => onQualitySelect(0)}
          disabled={disabled}
          className="sr-quality-btn sr-quality-0"
          title="0 - Complete blank"
        >
          {t.forgotten}
        </button>
        <button
          onClick={() => onQualitySelect(1)}
          disabled={disabled}
          className="sr-quality-btn sr-quality-1"
          title="1 - Familiar, but forgot"
        >
          {t.hard}
        </button>
        <button
          onClick={() => onQualitySelect(3)}
          disabled={disabled}
          className="sr-quality-btn sr-quality-3"
          title="3 - Correct with effort"
        >
          {t.good}
        </button>
        <button
          onClick={() => onQualitySelect(4)}
          disabled={disabled}
          className="sr-quality-btn sr-quality-4"
          title="4 - Correct, slight hesitation"
        >
          {t.easy}
        </button>
        <button
          onClick={() => onQualitySelect(5)}
          disabled={disabled}
          className="sr-quality-btn sr-quality-5"
          title="5 - Perfect, immediate recall"
        >
          {t.perfect}
        </button>
      </div>
    </div>
  );
}
