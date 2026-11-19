import Link from "next/link";
import type { CSSProperties } from "react";
import cardStyles from "./StudyCards.module.css";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
  MinusCircleIcon,
  PlayIcon,
} from "@heroicons/react/24/outline";
import { LocalDateTime } from "@/components/LocalDateTime";
import type { PastStudyRowLabel, StudyStatus } from "@/lib/study-participation";

type DashboardStudy = {
  id: number;
  start_datetime_utc: string | null;
  end_datetime_utc: string | null;
  status: StudyStatus;
  pastStudyLabel?: PastStudyRowLabel;
};

const categories = [
  { name: "Completed", icon: CheckCircleIcon, tone: "completed" },
  { name: "Active", icon: PlayIcon, tone: "active" },
  { name: "Missed", icon: ClockIcon, tone: "missed" },
  { name: "Upcoming", icon: CalendarDaysIcon, tone: "upcoming" },
] as const;
const emptyMessages: Record<StudyStatus, string> = {
  Completed: "Your first finish is still ahead. Start with an active study!",
  Active: "Nothing to rate just now. Check back for a fresh dose of humor.",
  Missed: "No missed studies to show yet.",
  Upcoming: "Nothing on the horizon yet. More laughs will come along.",
};

// Display copy is independent of the existing status values and category URLs.
const categoryLabels: Record<StudyStatus, string> = {
  Completed: "Completed", Active: "Active", Missed: "Missed", Upcoming: "Upcoming",
};

const statusBadges = {
  Completed: { icon: CheckCircleIcon, tone: "completed" },
  Active: { icon: PlayIcon, tone: "active" },
  Upcoming: { icon: CalendarDaysIcon, tone: "upcoming" },
  Missed: { icon: ExclamationCircleIcon, tone: "missed" },
  "Not Applicable": { icon: MinusCircleIcon, tone: "not-applicable" },
  Past: { icon: ClockIcon, tone: "past" },
} as const;

const statusGuide = [
  { label: "Missed", meaning: "Confirmed missed opportunity" },
  { label: "Past", meaning: "Eligibility uncertain" },
  { label: "Not Applicable", meaning: "Confirmed ineligible" },
] as const;

// Intrinsic icon bounds and basic containment survive even a missing CSS asset.
const iconStyle: CSSProperties = { width: 18, height: 18, minWidth: 18, maxWidth: 18, minHeight: 18, maxHeight: 18, flex: "0 0 18px", display: "block" };
const cardStyle: CSSProperties = {
  display: "block", height: "100%", minWidth: 0, padding: "1.2rem",
  border: "1px solid var(--study-card-border, var(--progress-border, #d3bd94))",
  borderRadius: "1.2rem", backgroundColor: "var(--study-card-background, var(--progress-paper, #fffcf4))",
  color: "var(--progress-ink, #34291e)", overflowWrap: "anywhere",
};

export function StudyDashboard({ studies, category = null }: { studies: DashboardStudy[]; category?: StudyStatus | null }) {
  if (!category) {
    return (
      <section aria-labelledby="my-progress-heading" className="progress-map">
        <p className="progress-eyebrow">Your little corner of the humor study</p>
        <h1 id="my-progress-heading" className="progress-title">My Progress<span aria-hidden="true" className="progress-title-dot">✦</span></h1>
        <nav aria-label="Study categories" className="progress-paths">
          {[categories.slice(0, 2), categories.slice(2)].map((row, index) => (
            <div className="progress-map-row" key={index}>
              <svg className="progress-connector" viewBox="0 0 600 60" preserveAspectRatio="none" aria-hidden="true" focusable="false">
                <path d="M300 0 V16 Q300 28 288 28 H162 Q150 28 150 40 V60 M300 16 Q300 28 312 28 H438 Q450 28 450 40 V60" />
              </svg>
              {row.map(({ name, icon: Icon, tone }) => (
                <Link key={name} href={`/?category=${tone}`} prefetch={false} className={`progress-node progress-node-${tone}`}>
                  <span className="progress-node-top"><Icon aria-hidden="true" /><ArrowRightIcon aria-hidden="true" className="progress-node-arrow" /></span>
                  <span className="progress-node-name">{categoryLabels[name]}</span>
                  <span className="progress-node-count">{studies.filter((study) => study.status === name).length}<span className="progress-node-unit">studies</span></span>
                </Link>
              ))}
            </div>
          ))}
        </nav>
      </section>
    );
  }

  const visibleStudies = studies.filter((study) => study.status === category);
  const heading = `${category} Studies`;
  return (
    <section aria-labelledby="study-category-heading" className="progress-category" style={{
      display: "grid",
      gridTemplateColumns: "minmax(0, 1fr) minmax(0, 49.5rem) minmax(0, 1fr)",
      width: "100%",
    }}>
      <Link href="/" prefetch={false} className="progress-back" style={{
        gridColumn: "1 / -1",
        justifySelf: "start",
        backgroundColor: "var(--progress-table-header, #61452f)",
        borderColor: "var(--progress-table-header, #61452f)",
        color: "var(--progress-table-header-text, #fff8e8)",
      }}><ArrowLeftIcon aria-hidden="true" />Back to My Progress</Link>
      <header className="progress-category-header" style={{ gridColumn: 2, minWidth: 0, textAlign: "center" }}>
        <h1 id="study-category-heading">{heading}</h1>
        <p className="progress-study-total">Total Studies: {visibleStudies.length}</p>
      </header>
      <aside className={cardStyles.legend} aria-labelledby="study-status-guide" style={{ gridColumn: 2, minWidth: 0 }}>
        <h2 id="study-status-guide">Possible study statuses</h2>
        <p>Guide for closed, unfinished studies. These examples are not your study results.</p>
        <dl>
          {statusGuide.map(({ label, meaning }) => {
            const { icon: Icon, tone } = statusBadges[label];
            return (
              <div key={label}>
                <dt><span className={`progress-badge progress-badge-${tone}`}>
                  <Icon aria-hidden="true" width={18} height={18} style={iconStyle} />
                  <span>{label}</span>
                </span></dt>
                <dd>{meaning}</dd>
              </div>
            );
          })}
        </dl>
      </aside>
      {visibleStudies.length === 0 ? (
        <p className="progress-empty" style={{ gridColumn: 2, minWidth: 0 }}>{emptyMessages[category]}</p>
      ) : (
        <ul className={`progress-study-list ${cardStyles.cards}`} aria-label={heading} style={{ gridColumn: 2, minWidth: 0 }}>
          {visibleStudies.map((study, index) => {
            const canOpen = study.status === "Active" || study.status === "Completed";
            const label = study.status === "Missed" ? study.pastStudyLabel ?? "Past" : study.status;
            const { icon: StatusIcon, tone } = statusBadges[label];
            const content = (
              <>
                <div className="progress-card-heading" style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: ".65rem", marginBottom: "1rem" }}>
                  <h2 style={{ display: "inline-flex", alignItems: "center", gap: ".5rem", fontSize: "1.1rem", fontWeight: 700 }}>Study {index + 1}{canOpen ? <ArrowRightIcon aria-hidden="true" className="progress-card-arrow" width={18} height={18} style={iconStyle} /> : null}</h2>
                  <span className={`progress-badge progress-badge-${tone}`} style={{ display: "inline-flex", alignItems: "center", gap: ".4rem", maxWidth: "100%", padding: ".35rem .65rem", borderRadius: ".65rem", fontSize: ".85rem", fontWeight: 650, lineHeight: 1.4 }}>
                    <StatusIcon aria-hidden="true" width={18} height={18} style={iconStyle} />
                    <span className="progress-card-status">{label}</span>
                  </span>
                </div>
                <dl className="progress-card-dates" style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "1rem", lineHeight: 1.5 }}>
                  <div>
                    <dt>Available From</dt>
                    <dd>{study.start_datetime_utc ? <LocalDateTime value={study.start_datetime_utc} format="date" /> : "No start date"}</dd>
                  </div>
                  <div>
                    <dt>Available Until</dt>
                    <dd>{study.end_datetime_utc ? <LocalDateTime value={study.end_datetime_utc} format="date" /> : "No end date"}</dd>
                  </div>
                </dl>
              </>
            );
            return (
              <li key={study.id} style={{ minWidth: 0 }}>
                {canOpen ? (
                  <Link href={`/study/${study.id}`} prefetch={false} className="progress-study-card progress-study-card-link" style={cardStyle} aria-label={`${study.status === "Completed" ? "View results for" : "Open"} study ${index + 1}`}>{content}</Link>
                ) : <div className="progress-study-card" style={cardStyle}>{content}</div>}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
