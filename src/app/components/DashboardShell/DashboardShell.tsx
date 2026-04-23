"use client";

import { useEffect, useState, type CSSProperties } from "react";
import {
  dashboardMockData,
  getSpendingSeries,
  spendingMockData,
  spendingRanges,
  type SpendingRange,
} from "./spendingMockData";
import styles from "./DashboardShell.module.scss";

type InspectRow = {
  label: string;
  value: string;
  token: string | null;
};

type InspectSnapshot = {
  x: number;
  y: number;
  targetLabel: string;
  rows: InspectRow[];
};

const COLOR_TOKEN_VALUES: Array<[string, string]> = [
  ["$color-bg", "#f6f7fb"],
  ["$color-text", "#111827"],
  ["$color-subtle", "#6b7280"],
  ["$color-accent", "#2563eb"],
  ["$color-volt-100", "#e4dbff"],
  ["$color-volt-300", "#a585ff"],
  ["$color-volt-500", "#5b2bff"],
  ["$color-volt-700", "#3a17b3"],
  ["$color-ember-500", "#ff5a36"],
  ["$color-mint-500", "#00d4a8"],
  ["$color-neutral-0", "#ffffff"],
  ["$color-neutral-50", "#fafaf9"],
  ["$color-neutral-100", "#f5f5f4"],
  ["$color-neutral-200", "#e7e5e4"],
  ["$color-neutral-300", "#d6d3d1"],
  ["$color-neutral-700", "#44403c"],
  ["$color-neutral-900", "#1c1917"],
  ["$color-neutral-950", "#0c0a09"],
  ["$color-success", "#12b981"],
  ["$color-success-bg", "#d1fae5"],
  ["$color-info", "#3b82f6"],
];

const SPACING_TOKEN_BY_PX = new Map<string, string>([
  ["4px", "$space-1"],
  ["8px", "$space-2"],
  ["12px", "$space-3"],
  ["16px", "$space-4"],
  ["20px", "$space-5"],
  ["24px", "$space-6"],
  ["32px", "$space-8"],
  ["40px", "$space-10"],
  ["48px", "$space-12"],
  ["64px", "$space-16"],
]);

const RADIUS_TOKEN_BY_PX = new Map<string, string>([
  ["4px", "$radius-sm"],
  ["8px", "$radius-md"],
  ["12px", "$radius-lg"],
  ["16px", "$radius-xl"],
  ["24px", "$radius-2xl"],
  ["9999px", "$radius-full"],
]);

const SHADOW_TOKEN_BY_VALUE = new Map<string, string>([
  ["0px1px2px0pxrgba(12,10,9,0.05)", "$shadow-xs"],
  ["0px20px25px-5pxrgba(12,10,9,0.1),0px8px10px-6pxrgba(12,10,9,0.1)", "$shadow-xl"],
]);

function hexToRgbString(hex: string): string {
  const normalized = hex.replace("#", "").trim();
  if (normalized.length !== 6) {
    return hex;
  }

  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);

  return `rgb(${r},${g},${b})`;
}

function normalizeColorValue(value: string): string {
  const trimmed = value.trim().toLowerCase();
  const source = trimmed.startsWith("#") ? hexToRgbString(trimmed) : trimmed;
  const compact = source.replace(/\s+/g, "");

  const rgbaMatch = compact.match(/^rgba\((\d+),(\d+),(\d+),([^)]+)\)$/);
  if (rgbaMatch && Number.parseFloat(rgbaMatch[4]) === 1) {
    return `rgb(${rgbaMatch[1]},${rgbaMatch[2]},${rgbaMatch[3]})`;
  }

  return compact;
}

const COLOR_TOKEN_BY_VALUE = new Map(
  COLOR_TOKEN_VALUES.map(([token, value]) => [normalizeColorValue(value), token]),
);

function normalizeBoxShadowValue(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, "");
}

function matchColorToken(value: string): string | null {
  return COLOR_TOKEN_BY_VALUE.get(normalizeColorValue(value)) ?? null;
}

function matchShadowToken(value: string): string | null {
  return SHADOW_TOKEN_BY_VALUE.get(normalizeBoxShadowValue(value)) ?? null;
}

function matchCompositeToken(value: string, tokenMap: Map<string, string>): string | null {
  const parts = value
    .trim()
    .split(/\s+/)
    .map((part) => part.toLowerCase());

  if (parts.length === 0) {
    return null;
  }

  const mappedParts = parts.map((part) => tokenMap.get(part) ?? part);
  const hasMappedPart = mappedParts.some((part, index) => part !== parts[index]);

  return hasMappedPart ? mappedParts.join(" ") : null;
}

function describeElement(element: Element): string {
  const htmlElement = element as HTMLElement;
  const tag = element.tagName.toLowerCase();
  const id = htmlElement.id ? `#${htmlElement.id}` : "";
  const firstClass =
    typeof htmlElement.className === "string"
      ? htmlElement.className.split(/\s+/).filter(Boolean)[0]
      : "";

  return `${tag}${id}${firstClass ? `.${firstClass}` : ""}`;
}

function buildInspectRows(computedStyles: CSSStyleDeclaration): InspectRow[] {
  return [
    {
      label: "Text color",
      value: computedStyles.color,
      token: matchColorToken(computedStyles.color),
    },
    {
      label: "Background",
      value: computedStyles.backgroundColor,
      token: matchColorToken(computedStyles.backgroundColor),
    },
    {
      label: "Border color",
      value: computedStyles.borderTopColor,
      token: matchColorToken(computedStyles.borderTopColor),
    },
    {
      label: "Box shadow",
      value: computedStyles.boxShadow || "none",
      token: matchShadowToken(computedStyles.boxShadow),
    },
    {
      label: "Padding",
      value: computedStyles.padding,
      token: matchCompositeToken(computedStyles.padding, SPACING_TOKEN_BY_PX),
    },
    {
      label: "Margin",
      value: computedStyles.margin,
      token: matchCompositeToken(computedStyles.margin, SPACING_TOKEN_BY_PX),
    },
    {
      label: "Radius",
      value: computedStyles.borderRadius,
      token: matchCompositeToken(computedStyles.borderRadius, RADIUS_TOKEN_BY_PX),
    },
    {
      label: "Font size",
      value: computedStyles.fontSize,
      token: matchCompositeToken(computedStyles.fontSize, SPACING_TOKEN_BY_PX),
    },
  ];
}

export function DashboardShell() {
  const [activeRange, setActiveRange] = useState<SpendingRange>("months");
  const [isDevMode, setIsDevMode] = useState(false);
  const [inspectSnapshot, setInspectSnapshot] = useState<InspectSnapshot | null>(null);
  const series = getSpendingSeries(activeRange);
  const ctrBars = spendingMockData.months.bars.map((bar, index) => ({
    ...bar,
    comparePercent: Math.max(12, bar.heightPercent - 14 - (index % 3)),
  }));

  useEffect(() => {
    if (!isDevMode) {
      setInspectSnapshot(null);
      return;
    }

    let frameId = 0;

    const onMouseMove = (event: MouseEvent) => {
      const { clientX, clientY } = event;

      cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(() => {
        const hoveredElement = document.elementFromPoint(clientX, clientY);
        if (!hoveredElement) {
          return;
        }

        const computedStyles = window.getComputedStyle(hoveredElement);
        const tooltipWidth = 320;
        const tooltipHeight = 260;
        const nextX = Math.max(12, Math.min(clientX + 18, window.innerWidth - tooltipWidth));
        const nextY = Math.max(12, Math.min(clientY + 18, window.innerHeight - tooltipHeight));

        setInspectSnapshot({
          x: nextX,
          y: nextY,
          targetLabel: describeElement(hoveredElement),
          rows: buildInspectRows(computedStyles),
        });
      });
    };

    const onWindowMouseOut = (event: MouseEvent) => {
      if (!event.relatedTarget) {
        setInspectSnapshot(null);
      }
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("mouseout", onWindowMouseOut);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseout", onWindowMouseOut);
    };
  }, [isDevMode]);

  return (
    <section className={styles.shell}>
      <div className={styles.frame}>
        <aside className={styles.sidebar}>
          <div>
            <p className={styles.brand}>{dashboardMockData.appName}</p>
            <nav className={styles.navGroup}>
              {dashboardMockData.sidebarPrimary.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`${styles.navItem} ${item.isActive ? styles.navItemActive : ""}`}
                >
                  <span className={styles.navIcon}>{item.icon}</span>
                  <span>{item.label}</span>
                  {item.badgeCount ? (
                    <span className={styles.navBadge}>{item.badgeCount}</span>
                  ) : null}
                </button>
              ))}
            </nav>
          </div>

          <div className={styles.sidebarBottom}>
            <button
              type="button"
              className={styles.devToggle}
              onClick={() => setIsDevMode((value) => !value)}
              aria-pressed={isDevMode}
            >
              <span>{dashboardMockData.devTools.toggleLabel}</span>
              <span
                className={`${styles.devToggleTrack} ${isDevMode ? styles.devToggleTrackOn : ""}`}
              >
                <span className={styles.devToggleThumb} />
              </span>
            </button>
            <p className={styles.devToggleDescription}>
              {dashboardMockData.devTools.toggleDescription}
            </p>

            <nav className={styles.navGroup}>
              {dashboardMockData.sidebarSecondary.map((item) => (
                <button key={item.id} type="button" className={styles.navItem}>
                  <span className={styles.navIcon}>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </aside>

        <main className={styles.main}>
          <header className={styles.topBar}>
            <div className={styles.searchBox}>Search</div>
            <div className={styles.topActions}>
              <button type="button" className={styles.actionChip}>
                Dashboard
              </button>
              <button type="button" className={styles.avatar}>
                DF
              </button>
            </div>
          </header>

          <div className={styles.dashboardGrid}>
            <div className={styles.mainColumn}>
              <div className={styles.statsRow}>
                {dashboardMockData.kpis.slice(0, 2).map((kpi) => (
                  <article key={kpi.id} className={styles.statCard}>
                    <p className={styles.statLabel}>{kpi.label}</p>
                    <div className={styles.statValueRow}>
                      <p className={styles.statValue}>{kpi.value}</p>
                      <span className={styles.statDelta}>{kpi.delta}</span>
                    </div>
                  </article>
                ))}
              </div>

              <article className={styles.ctrCard}>
                <div className={styles.cardHeadingRow}>
                  <p className={styles.cardTitle}>{dashboardMockData.kpis[2].label}</p>
                  <span className={styles.moreButton}>...</span>
                </div>
                <div className={styles.statValueRow}>
                  <p className={styles.statValue}>{dashboardMockData.kpis[2].value}</p>
                  <span className={styles.statDelta}>{dashboardMockData.kpis[2].delta}</span>
                </div>
                <div className={styles.miniBars}>
                  {ctrBars.map((bar) => (
                    <div key={bar.label} className={styles.miniBarGroup}>
                      <div className={styles.miniBarTrack}>
                        <span
                          className={styles.miniBarBack}
                          style={{ "--bar-height": `${bar.heightPercent}%` } as CSSProperties}
                        />
                        <span
                          className={styles.miniBarFront}
                          style={{ "--bar-height": `${bar.comparePercent}%` } as CSSProperties}
                        />
                      </div>
                      <span className={styles.miniBarLabel}>{bar.label}</span>
                    </div>
                  ))}
                </div>
              </article>

              <article className={styles.panelCard}>
                <div className={styles.cardHeadingRow}>
                  <p className={styles.cardTitle}>Upcoming payments</p>
                </div>
                <div className={styles.paymentGrid}>
                  {dashboardMockData.paymentCards.map((payment) => (
                    <div key={payment.id} className={styles.paymentCard}>
                      <span className={styles.paymentIcon}>$</span>
                      <p className={styles.paymentTitle}>{payment.title}</p>
                      <p className={styles.paymentSub}>{payment.subtitle}</p>
                      <p className={styles.paymentAmount}>{payment.amount}</p>
                    </div>
                  ))}
                </div>
              </article>

              <article className={styles.panelCard}>
                <div className={styles.cardHeadingRow}>
                  <p className={styles.cardTitle}>Recent transactions</p>
                  <button type="button" className={styles.sortButton}>
                    Sort by
                  </button>
                </div>
                <div className={styles.transactionList}>
                  {dashboardMockData.transactions.map((item) => (
                    <div key={item.id} className={styles.transactionRow}>
                      <p className={styles.transactionCategory}>{item.category}</p>
                      <p className={styles.transactionDate}>{item.dateTime}</p>
                      <p className={styles.transactionAmount}>{item.amount}</p>
                    </div>
                  ))}
                </div>
              </article>

            </div>

            <aside className={styles.rightRail}>
              <article className={styles.panelCard}>
                <div className={styles.cardHeadingRow}>
                  <p className={styles.cardTitle}>{series.unitLabel}</p>
                  <div className={styles.rangeButtons}>
                    {spendingRanges.map((range) => (
                      <button
                        key={range}
                        type="button"
                        className={`${styles.rangeButton} ${
                          activeRange === range ? styles.rangeButtonActive : ""
                        }`}
                        onClick={() => setActiveRange(range)}
                      >
                        {range}
                      </button>
                    ))}
                  </div>
                </div>
                <p className={styles.spendingTotal}>{series.totalLabel}</p>
                <div className={styles.chartBars}>
                  {series.bars.map((bar) => (
                    <div key={bar.label} className={styles.barItem}>
                      <div className={styles.barTrack}>
                        <div
                          className={styles.barFill}
                          style={{ "--bar-height": `${bar.heightPercent}%` } as CSSProperties}
                        />
                      </div>
                      <span className={styles.barLabel}>{bar.label}</span>
                    </div>
                  ))}
                </div>
              </article>

              <article className={styles.panelCard}>
                <div className={styles.cardHeadingRow}>
                  <p className={styles.cardTitle}>Sentiment analysis</p>
                  <span className={styles.moreButton}>...</span>
                </div>
                <div className={styles.sentimentWrap}>
                  <p className={styles.sentimentScore}>{dashboardMockData.sentimentScore}</p>
                  <span className={styles.sentimentBadge}>{dashboardMockData.sentimentLabel}</span>
                </div>
              </article>

              <article className={styles.panelCard}>
                <div className={styles.cardHeadingRow}>
                  <p className={styles.cardTitle}>Total customers</p>
                  <span className={styles.moreButton}>...</span>
                </div>
                <div className={styles.statValueRow}>
                  <p className={styles.statValue}>{dashboardMockData.totalCustomers}</p>
                  <span className={styles.statDelta}>{dashboardMockData.customersDelta}</span>
                </div>
                <div className={styles.avatarGroup}>
                  {dashboardMockData.customerInitials.map((initials) => (
                    <span key={initials} className={styles.customerAvatar}>
                      {initials}
                    </span>
                  ))}
                </div>
              </article>

              <article className={`${styles.panelCard} ${styles.audienceCard}`}>
                <div className={styles.cardHeadingRow}>
                  <p className={styles.cardTitle}>Audience Growth</p>
                  <div className={styles.audienceFilters}>
                    {dashboardMockData.audienceGrowth.filters.map((filter) => (
                      <button
                        key={filter}
                        type="button"
                        className={`${styles.audienceFilterButton} ${
                          filter === dashboardMockData.audienceGrowth.activeFilter
                            ? styles.audienceFilterButtonActive
                            : ""
                        }`}
                      >
                        {filter}
                      </button>
                    ))}
                  </div>
                </div>

                <div className={styles.audienceChart}>
                  <div className={styles.audienceYAxis}>
                    {dashboardMockData.audienceGrowth.yAxisLabels.map((label) => (
                      <span key={label}>{label}</span>
                    ))}
                  </div>

                  <div className={styles.audiencePlotWrap}>
                    <svg
                      className={styles.audienceSvg}
                      viewBox="0 0 520 220"
                      role="img"
                      aria-label="Audience growth line chart"
                    >
                      <defs>
                        <linearGradient id="audienceAreaGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="rgb(91 43 255 / 25%)" />
                          <stop offset="100%" stopColor="rgb(91 43 255 / 0%)" />
                        </linearGradient>
                      </defs>
                      <path
                        d="M12 188 L70 176 C90 172, 110 174, 130 160 C156 136, 170 92, 196 82 C218 73, 240 90, 264 86 C286 82, 302 70, 328 78 C350 84, 368 68, 392 82 C418 98, 438 110, 456 90 C472 72, 488 46, 508 34"
                        fill="none"
                        className={styles.audienceLine}
                      />
                      <path
                        d="M12 188 L70 176 C90 172, 110 174, 130 160 C156 136, 170 92, 196 82 C218 73, 240 90, 264 86 C286 82, 302 70, 328 78 C350 84, 368 68, 392 82 C418 98, 438 110, 456 90 C472 72, 488 46, 508 34 L508 212 L12 212 Z"
                        className={styles.audienceArea}
                      />
                      <line x1="196" y1="212" x2="196" y2="82" className={styles.audienceGuideLine} />
                      <circle cx="196" cy="82" r="4.5" className={styles.audiencePoint} />
                    </svg>
                    <span className={styles.audienceTooltip}>
                      {dashboardMockData.audienceGrowth.highlightedPointLabel}
                    </span>
                  </div>
                </div>

                <div className={styles.audienceXAxis}>
                  {dashboardMockData.audienceGrowth.xAxisLabels.map((label) => (
                    <span key={label}>{label}</span>
                  ))}
                </div>
              </article>
            </aside>
          </div>
        </main>
      </div>

      {isDevMode && inspectSnapshot ? (
        <div className={styles.devInspectLayer} aria-hidden="true">
          <div
            className={styles.devInspectTooltip}
            style={{ left: inspectSnapshot.x, top: inspectSnapshot.y } as CSSProperties}
          >
            <p className={styles.devInspectTitle}>{dashboardMockData.devTools.inspectorTitle}</p>
            <p className={styles.devInspectTarget}>{inspectSnapshot.targetLabel}</p>
            <div className={styles.devInspectRows}>
              {inspectSnapshot.rows.map((row) => (
                <div key={row.label} className={styles.devInspectRow}>
                  <span className={styles.devInspectKey}>{row.label}</span>
                  <span className={styles.devInspectMeta}>
                    <span className={styles.devInspectValue}>{row.value}</span>
                    <span
                      className={`${styles.devInspectToken} ${
                        row.token ? styles.devInspectTokenMatched : styles.devInspectTokenRaw
                      }`}
                    >
                      {row.token ?? "unmatched"}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
