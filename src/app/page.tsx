import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { AccountMenu } from "@/components/AccountMenu";
import { StudyDashboard } from "@/components/StudyDashboard";
import { SubmitButton } from "@/components/SubmitButton";
import { ThemeMenu } from "@/components/theme/ThemeMenu";
import { buildDemographicsPath, hasPendingDemographicQuestions } from "@/lib/demographics";
import { DEMOGRAPHIC_SKIPS_COOKIE, readDemographicSkips } from "@/lib/demographic-skips";
import { buildNotificationPreferencesPath, fetchNotificationPreferences, NOTIFICATION_SKIPS_COOKIE, readNotificationSkips } from "@/lib/notification-preferences";
import { fetchPublicStudyIdentities } from "@/lib/studies";
import { createClient } from "@/lib/supabase/server";
import { fetchStudyParticipations, getPastStudyRowLabel, getStudyStatus } from "@/lib/study-participation";
import type { StudyStatus } from "@/lib/study-participation";
import type { TablesUpdate } from "@/types/supabase";

type Profile = {
  first_name: string | null;
  last_name: string | null;
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function Home({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const resolvedParams = (await searchParams) ?? {};
  const categoryNames: Record<string, StudyStatus> = {
    completed: "Completed", active: "Active", missed: "Missed", upcoming: "Upcoming",
  };
  const categoryParam = resolvedParams.category;
  const category = typeof categoryParam === "string" && Object.hasOwn(categoryNames, categoryParam)
    ? categoryNames[categoryParam] : null;
  const messageRaw = resolvedParams.message;
  const message = Array.isArray(messageRaw) ? messageRaw[0] : messageRaw;

  const supabase = await createClient();
  const studyNow = new Date();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const cookieStore = await cookies();
  const skippedNotifications = readNotificationSkips(cookieStore.get(NOTIFICATION_SKIPS_COOKIE)?.value, user.id);
  if ((await fetchNotificationPreferences(supabase, user.id, skippedNotifications)).pending.length) {
    redirect(buildNotificationPreferencesPath("/"));
  }

  const skippedQuestionIds = readDemographicSkips(
    cookieStore.get(DEMOGRAPHIC_SKIPS_COOKIE)?.value,
    user.id
  );

  if (await hasPendingDemographicQuestions(supabase, user.id, skippedQuestionIds)) {
    redirect(buildDemographicsPath({ next: "/", skippedQuestionIds }));
  }

  const [
    { data: profileData },
    { studies: studyIdentities, error: studyIdentitiesError },
  ] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("first_name, last_name")
        .eq("id", user.id)
        .single(),
      fetchPublicStudyIdentities(supabase),
    ]);

  const profile = profileData as Profile | null;

  const fullName = [profile?.first_name, profile?.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();
  const displayName = fullName || user.email || "your account";

  if (!profile?.first_name || !profile?.last_name) {
    return (
      <CompleteProfileForm
        userEmail={user.email}
        initialFirst={profile?.first_name ?? ""}
        initialLast={profile?.last_name ?? ""}
        message={message}
      />
    );
  }

  if (studyIdentitiesError) {
    console.error("[Home] load study identities failed", studyIdentitiesError);
  }

  const { participations, error: participationError } = await fetchStudyParticipations(
    supabase, user.id, studyIdentities.map((study) => study.id)
  );
  const participationByStudy = new Map(participations.map((row) => [row.study_id, row]));
  if (participationError) {
    console.error("[Home] load study participation failed", participationError);
  }

  return (
    <div
      id="home-root"
      className="progress-page"
    >
      <main
        id="home-content"
        key={category ?? "map"}
        className="progress-scroll"
        style={category ? { scrollbarGutter: "stable" } : undefined}
      >
        <div className="progress-content" style={category ? {
          width: "100%",
          paddingTop: "24px",
          paddingInline: "clamp(24px, 2vw, 32px)",
        } : undefined}>
          {studyIdentitiesError ? (
            <div className="glass-panel rounded-2xl p-6 text-center sm:p-8">
              <h1 className="text-2xl font-bold text-[var(--error-text)]">
                We couldn&apos;t load studies
              </h1>
              <p className="mt-3 text-sm text-[var(--muted)]">
                Please refresh and try again.
              </p>
            </div>
          ) : participationError ? (
            <p role="alert" className="glass-panel rounded-2xl p-6 text-[var(--error-text)]">
              We couldn&apos;t load your study completion status. Please refresh to try again.
            </p>
          ) : (
            <StudyDashboard category={category} studies={studyIdentities.map((study) => {
              const participation = participationByStudy.get(study.id);
              const status = getStudyStatus(study, participation, studyNow);
              return {
                id: study.id,
                start_datetime_utc: study.start_datetime_utc,
                end_datetime_utc: study.end_datetime_utc,
                status,
                pastStudyLabel: status === "Missed"
                  ? getPastStudyRowLabel(study, participation, user.id, studyNow)
                  : undefined,
              };
            })} />
          )}
        </div>
      </main>
      <AccountMenu displayName={displayName} email={user.email} signOutAction={signOut} />
    </div>
  );
}

function CompleteProfileForm({
  userEmail,
  initialFirst,
  initialLast,
  message,
}: {
  userEmail: string | undefined | null;
  initialFirst: string;
  initialLast: string;
  message?: string | null;
}) {
  return (
    <div
      id="profile-complete-root"
      className="relative flex h-[100svh] min-h-[100svh] items-start justify-center overflow-hidden px-4 py-10 text-[var(--foreground)] sm:items-center sm:px-6 sm:py-16"
    >
      <div
        id="profile-bg-shell"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div
          id="profile-bg-orb-1"
          className="absolute -left-16 top-10 h-64 w-64 rounded-full bg-amber-500/25 blur-[110px] animate-orb"
        />
        <div
          id="profile-bg-orb-2"
          className="absolute bottom-6 right-8 h-56 w-56 rounded-full bg-yellow-300/20 blur-[110px] animate-orb-reverse"
        />
        <div
          id="profile-bg-orb-3"
          className="absolute left-12 top-1/2 h-60 w-60 -translate-y-1/2 rounded-full bg-amber-300/20 blur-[100px] animate-orb-sway"
        />
        <div
          id="profile-bg-grid"
          className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(251,191,36,0.12),transparent_42%),radial-gradient(circle_at_80%_12%,rgba(253,224,71,0.12),transparent_35%)] animate-grid-drift"
        />
      </div>

      <div
        id="profile-complete-card"
        className="relative w-full max-w-2xl rounded-3xl border border-[var(--panel-border)] bg-[var(--card-surface)] p-8 shadow-[var(--panel-shadow)] backdrop-blur-sm animate-card-rise sm:p-10 max-h-[calc(100svh-4rem)] overflow-y-auto sm:max-h-none"
      >
        <div
          id="profile-card-topline"
          className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[var(--accent)] via-[var(--accent-strong)] to-[var(--accent)] animate-shine"
        />
        <div
          id="profile-card-topglow"
          className="absolute -left-16 top-0 h-28 w-28 rounded-full bg-amber-500/15 blur-3xl"
        />
        <div id="profile-card-body" className="space-y-7 relative">
          <header className="space-y-2">
            <p className="text-sm uppercase tracking-[0.2em] text-[var(--soft)]">
              Welcome
            </p>
            <h1 className="text-3xl font-extrabold leading-tight sm:text-4xl">
              <span className="bg-gradient-to-r from-amber-100 via-amber-300 to-yellow-200 bg-clip-text text-transparent animate-text-shimmer">
                Tell us who you are
              </span>
            </h1>
            <p className="text-sm text-[var(--muted)] sm:text-base">
              We need your first and last name before you can enter. You&apos;re
              signed in as {userEmail ?? "your account"}.
            </p>
            {message ? (
              <p className="rounded-xl bg-[color-mix(in_srgb,_var(--accent)_12%,_transparent)] px-4 py-3 text-sm font-medium text-[var(--foreground)] ring-1 ring-[color-mix(in_srgb,_var(--accent)_35%,_transparent)]">
                {message}
              </p>
            ) : null}
          </header>

          <form id="profile-name-form" action={updateProfileName} className="space-y-4">
            <div id="profile-name-grid" className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-semibold text-[var(--foreground)]">
                First name
                <input
                  name="first_name"
                  defaultValue={initialFirst}
                  required
                  minLength={2}
                  className="mt-2 w-full rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-4 py-3 text-base text-[var(--foreground)] shadow-inner outline-none ring-1 ring-[var(--input-border)] transition focus:ring-2 focus:ring-[var(--input-ring)]"
                  placeholder="Jane"
                />
              </label>
              <label className="block text-sm font-semibold text-[var(--foreground)]">
                Last name
                <input
                  name="last_name"
                  defaultValue={initialLast}
                  required
                  minLength={2}
                  className="mt-2 w-full rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-4 py-3 text-base text-[var(--foreground)] shadow-inner outline-none ring-1 ring-[var(--input-border)] transition focus:ring-2 focus:ring-[var(--input-ring)]"
                  placeholder="Doe"
                />
              </label>
            </div>
            <div
              id="profile-action-row"
              className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end"
            >
              <SubmitButton
                formAction={updateProfileName}
                pendingLabel="Saving…"
                className="w-full rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-[var(--accent-contrast)] shadow-lg shadow-[0_15px_40px_-20px_rgba(245,158,11,0.55)] transition hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-strong)] sm:w-auto"
              >
                Save and continue
              </SubmitButton>
              <SubmitButton
                pendingLabel="Signing out…"
                formAction={signOut}
                formNoValidate
                className="w-full rounded-xl border border-[var(--panel-border)] bg-[var(--surface-muted)] px-5 py-3 text-sm font-semibold text-[var(--foreground)] shadow-inner shadow-black/40 transition hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--panel-border)] sm:w-auto"
              >
                Log out
              </SubmitButton>
            </div>
          </form>
        </div>
      </div>
      <ThemeMenu />
    </div>
  );
}

async function signOut() {
  "use server";

  const supabase = await createClient({ allowCookieWrite: true });
  await supabase.auth.signOut({ scope: "local" });
  redirect("/login");
}

async function updateProfileName(formData: FormData) {
  "use server";

  const supabase = await createClient({ allowCookieWrite: true });
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const first = formData.get("first_name")?.toString().trim() ?? "";
  const last = formData.get("last_name")?.toString().trim() ?? "";

  if (first.length < 2 || last.length < 2) {
    redirect(
      "/?message=" + encodeURIComponent("Please enter a valid first and last name.")
    );
  }

  const updatePayload: TablesUpdate<"profiles"> = {
    first_name: first,
    last_name: last,
    modified_by_user_id: user.id,
  };
  const { error } = await supabase
    .from("profiles")
    .update(updatePayload)
    .eq("id", user.id);

  if (error) {
    redirect(
      "/?message=" +
        encodeURIComponent("We could not save your name. Please try again.")
    );
  }

  redirect("/");
}
