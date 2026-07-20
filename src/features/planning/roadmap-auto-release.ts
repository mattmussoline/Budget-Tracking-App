import type { createSupabaseAdminClient } from "@/lib/supabase/admin";

type SupabaseAdminClient = NonNullable<ReturnType<typeof createSupabaseAdminClient>>;

export function getTodayKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export async function releaseDueScheduledRoadmapItems(admin: SupabaseAdminClient, fiscalYearId: string, todayKey = getTodayKey()) {
  const { error } = await admin
    .from("roadmap_items")
    .update({ status: "released" })
    .eq("fiscal_year_id", fiscalYearId)
    .eq("status", "scheduled")
    .like("release_month", "____-__-__")
    .lte("release_month", todayKey);

  if (error) {
    throw new Error(error.message);
  }
}

type FormedSearchMatch = {
  title: string;
  url: string;
};

type FormedLinkSuggestion = {
  formedUrl: string | null;
  candidateUrl: string | null;
};

export async function syncReleasedRoadmapFormedLinks(
  admin: SupabaseAdminClient,
  fiscalYearId: string,
  findFormedLink = findFormedLinkSuggestion
) {
  const { data, error } = await admin
    .from("roadmap_items")
    .select("id,title")
    .eq("fiscal_year_id", fiscalYearId)
    .eq("status", "released")
    .is("formed_url", null)
    .is("formed_url_candidate", null)
    .limit(10);

  if (error) {
    throw new Error(error.message);
  }

  for (const item of data ?? []) {
    const suggestion = await findFormedLink(item.title);
    if (!suggestion.formedUrl && !suggestion.candidateUrl) continue;

    const { error: updateError } = await admin
      .from("roadmap_items")
      .update({
        formed_url: suggestion.formedUrl,
        formed_url_candidate: suggestion.formedUrl ? null : suggestion.candidateUrl
      })
      .eq("id", item.id)
      .eq("fiscal_year_id", fiscalYearId)
      .is("formed_url", null)
      .is("formed_url_candidate", null);

    if (updateError) {
      throw new Error(updateError.message);
    }
  }
}

export async function findExactFormedLink(title: string) {
  return (await findFormedLinkSuggestion(title)).formedUrl;
}

export async function findFormedLinkSuggestion(title: string): Promise<FormedLinkSuggestion> {
  const matches = await searchFormed(title);
  const exactMatches = matches.filter((match) => normalizeTitle(match.title) === normalizeTitle(title));
  const uniqueUrls = new Set(exactMatches.map((match) => match.url));

  if (uniqueUrls.size === 1) {
    return { formedUrl: exactMatches[0]?.url ?? null, candidateUrl: null };
  }

  const candidateUrl = uniqueUrls.size > 1
    ? exactMatches[0]?.url ?? null
    : await findLikelyFormedSlugCandidate(title);

  return {
    formedUrl: null,
    candidateUrl
  };
}

async function findLikelyFormedSlugCandidate(title: string) {
  const url = `https://watch.formed.org/${slugifyTitle(title)}`;

  try {
    const response = await fetch(url, { cache: "no-store", redirect: "manual" });
    return response.status === 200 ? url : null;
  } catch {
    return null;
  }
}

async function searchFormed(query: string): Promise<FormedSearchMatch[]> {
  try {
    const response = await fetch(`https://watch.formed.org/search?q=${encodeURIComponent(query)}`, {
      cache: "no-store"
    });

    if (!response.ok) {
      return [];
    }

    return extractFormedMatches(await response.text());
  } catch {
    return [];
  }
}

export function extractFormedMatches(html: string): FormedSearchMatch[] {
  const matches: FormedSearchMatch[] = [];
  const anchorPattern = /<a\b[^>]*href=(["'])(.*?)\1[^>]*>([\s\S]*?)<\/a>/gi;
  let anchorMatch: RegExpExecArray | null;

  while ((anchorMatch = anchorPattern.exec(html)) !== null) {
    const href = anchorMatch[2];
    const title = cleanHtmlText(anchorMatch[3]);
    const url = normalizeFormedUrl(href);

    if (!url || !title || isNavigationTitle(title)) continue;
    matches.push({ title, url });
  }

  return matches;
}

function normalizeFormedUrl(href: string) {
  if (href.startsWith("https://watch.formed.org/")) {
    return href.split("#")[0];
  }

  if (href.startsWith("/") && !href.startsWith("/search")) {
    return `https://watch.formed.org${href}`.split("#")[0];
  }

  return null;
}

function cleanHtmlText(value: string) {
  return value
    .replace(/<script\b[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, "\"")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeTitle(title: string) {
  return title.trim().toLowerCase().replace(/\s+/g, " ");
}

function slugifyTitle(title: string) {
  return title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function isNavigationTitle(title: string) {
  return ["browse", "cookies", "home", "sign in", "help", "terms", "privacy", "search", "start free trial"].includes(normalizeTitle(title));
}
