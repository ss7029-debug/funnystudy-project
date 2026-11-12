import Link from "next/link";
import type { CSSProperties } from "react";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ClockIcon,
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

// Keep the critical category presentation on the actual rendered cells/controls.
// This also prevents an older shared stylesheet from restoring muted cell text.
const bodyCellStyle: CSSProperties = {
  color: "var(--progress-ink)",
  fontSize: "1rem",
  fontWeight: 600,
  fontStyle: "normal",
  fontVariantNumeric: "tabular-nums",
  textAlign: "center",
};
const columnHeaderStyle: CSSProperties = {
  width: "25%",
  backgroundColor: "var(--progress-table-header, #61452f)",
  color: "var(--progress-table-header-text, #fff8e8)",
  fontSize: "1.0625rem",
  fontWeight: 750,
  textAlign: "center",
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
      {visibleStudies.length === 0 ? (
        <p className="progress-empty" style={{ gridColumn: 2, minWidth: 0 }}>{emptyMessages[category]}</p>
      ) : (
        <div className="progress-table-scroll" role="region" aria-label={`${heading} table; scroll horizontally for all columns`} tabIndex={0} style={{ gridColumn: 2, minWidth: 0 }}>
          <table className="progress-table">
            <caption className="sr-only">{heading}, with availability dates and statuses</caption>
            <thead>
              <tr>
                <th scope="col" style={columnHeaderStyle}>Study #</th>
                <th scope="col" style={columnHeaderStyle}>Available From</th>
                <th scope="col" style={columnHeaderStyle}>Available Until</th>
                <th scope="col" style={columnHeaderStyle}>Status</th>
              </tr>
            </thead>
            <tbody>
              {visibleStudies.map((study, index) => {
                const canOpen = study.status === "Active" || study.status === "Completed";

                return (
                  <tr key={study.id}>
                    <th scope="row" className="progress-table-number" style={bodyCellStyle}>
                      {canOpen ? <Link href={`/study/${study.id}`} prefetch={false} className="progress-table-link" aria-label={`Open study ${index + 1}`}>{index + 1}</Link> : index + 1}
                    </th>
                    <td style={bodyCellStyle}>{study.start_datetime_utc ? <LocalDateTime value={study.start_datetime_utc} format="date" /> : "No start date"}</td>
                    <td style={bodyCellStyle}>{study.end_datetime_utc ? <LocalDateTime value={study.end_datetime_utc} format="date" /> : "No end date"}</td>
                    <td className="progress-table-status" style={bodyCellStyle}>{study.status === "Missed" ? study.pastStudyLabel ?? "Past" : categoryLabels[study.status]}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
