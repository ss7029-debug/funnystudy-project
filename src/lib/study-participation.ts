import type { SupabaseClient } from "@supabase/supabase-js";
import type { Tables } from "@/types/supabase";

export type StudyParticipation = Tables<"study_participations">;

export function isStudyCompleted(participation?: StudyParticipation | null) {
  return Boolean(participation?.started_at && participation.ended_at);
}

export type StudyStatus = "Completed" | "Missed" | "Upcoming" | "Active";

export type PastStudyRowLabel = "Not Applicable" | "Missed" | "Past";

// This is a table label only. It does not change study categories or counts.
export function getPastStudyRowLabel(
  study: { id: number; start_datetime_utc: string | null; end_datetime_utc: string | null },
  participation: StudyParticipation | null | undefined,
  profileId: string,
  now = new Date()
): PastStudyRowLabel {
  const end = study.end_datetime_utc ? Date.parse(study.end_datetime_utc) : NaN;
  const start = study.start_datetime_utc === null ? -Infinity : Date.parse(study.start_datetime_utc);
  const currentTime = now.getTime();
  if (!Number.isFinite(end) || !Number.isFinite(currentTime) || end >= currentTime ||
      Number.isNaN(start) || start > end) return "Past";

  // There is no verified Funnystudy enrollment timestamp or complete historical
  // eligibility audit in the current data. "Not Applicable" cannot safely be
  // established. Auth/profile creation dates and missing rows are not evidence.
  if (!participation || !profileId || participation.profile_id !== profileId ||
      participation.study_id !== study.id || participation.ended_at !== null ||
      participation.completion_stats !== null) return "Past";

  // A matching, unfinished start inside the availability window is positive
  // evidence of access: the start RPC/RLS enforces that window on insertion.
  const started = Date.parse(participation.started_at);
  if (!Number.isFinite(started) || started < start || started > end) return "Past";
  return "Missed";
}

export function getStudyStatus(
  study: { start_datetime_utc: string | null; end_datetime_utc: string | null },
  participation?: StudyParticipation | null,
  now = new Date()
): StudyStatus {
  if (isStudyCompleted(participation)) return "Completed";
  if (study.end_datetime_utc && new Date(study.end_datetime_utc).getTime() < now.getTime()) return "Missed";
  if (study.start_datetime_utc && new Date(study.start_datetime_utc).getTime() > now.getTime()) return "Upcoming";
  return "Active";
}

export async function fetchStudyParticipations(
  supabase: SupabaseClient,
  profileId: string,
  studyIds: number[]
) {
  if (studyIds.length === 0) return { participations: [], error: null };

  const participations: StudyParticipation[] = [];
  // Bound requests and stay below the API row limit for large dashboards.
  for (let offset = 0; offset < studyIds.length; offset += 200) {
    const { data, error } = await supabase
      .from("study_participations")
      .select("profile_id, study_id, started_at, ended_at, completion_stats")
      .eq("profile_id", profileId)
      .in("study_id", studyIds.slice(offset, offset + 200));
    if (error) return { participations: [], error };
    participations.push(...((data ?? []) as StudyParticipation[]));
  }
  return { participations, error: null };
}
