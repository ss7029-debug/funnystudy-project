import type { SupabaseClient } from "@supabase/supabase-js";
import type { Tables } from "@/types/supabase";

export type StudyParticipation = Tables<"study_participations">;

export function isStudyCompleted(participation?: StudyParticipation | null) {
  return Boolean(participation?.started_at && participation.ended_at);
}

export type StudyStatus = "Completed" | "Missed" | "Upcoming" | "Active";

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
