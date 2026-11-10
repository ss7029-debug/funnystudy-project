import Link from "next/link";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ClockIcon,
  PlayIcon,
} from "@heroicons/react/24/outline";
import { LocalDateTime } from "@/components/LocalDateTime";
import type { StudyStatus } from "@/lib/study-participation";

type DashboardStudy = {
  id: number;
  start_datetime_utc: string | null;
  end_datetime_utc: string | null;
  status: StudyStatus;
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
  Missed: "No missed studies here. A clean slate!",
  Upcoming: "Nothing on the horizon yet. More laughs will come along.",
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
                  <span className="progress-node-name">{name}</span>
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
  return (
    <section aria-labelledby="study-category-heading" className="progress-category">
      <Link href="/" prefetch={false} className="progress-back"><ArrowLeftIcon aria-hidden="true" />Back to My Progress</Link>
      <header className="progress-category-header">
        <p className="progress-eyebrow">My Progress</p>
        <h1 id="study-category-heading">{category} Studies</h1>
        <p className="progress-study-total">{visibleStudies.length} {visibleStudies.length === 1 ? "study" : "studies"}</p>
      </header>
      {visibleStudies.length === 0 ? (
        <p className="progress-empty">{emptyMessages[category]}</p>
      ) : (
        <ul className="progress-study-list">
          {visibleStudies.map((study) => {
            const canOpen = study.status === "Active" || study.status === "Completed";
            const content = (
              <>
                <div className="progress-study-content">
                  <div className="progress-study-heading">
                    <h2>Study {study.id}</h2>
                    <span className="progress-status">{study.status}</span>
                  </div>
                  <dl className="progress-dates">
                    <dt>Start</dt>
                    <dd>{study.start_datetime_utc ? <LocalDateTime value={study.start_datetime_utc} /> : "No start date"}</dd>
                    <dt>End</dt>
                    <dd>{study.end_datetime_utc ? <LocalDateTime value={study.end_datetime_utc} /> : "No end date"}</dd>
                  </dl>
                </div>
                {canOpen ? <ArrowRightIcon aria-hidden="true" className="progress-study-arrow" /> : null}
              </>
            );
            return (
              <li key={study.id}>
                {canOpen ? (
                  <Link href={`/study/${study.id}`} prefetch={false} className="progress-study progress-study-link">{content}</Link>
                ) : <div className="progress-study">{content}</div>}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
