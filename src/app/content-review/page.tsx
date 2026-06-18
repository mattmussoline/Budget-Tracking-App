import type { Metadata } from "next";
import { ContentReviewDashboard } from "@/features/content-review/components/content-review-dashboard";
import { requireInternalSession } from "@/lib/auth/internal-auth";

export const metadata: Metadata = {
  title: "Content Review Dashboard",
  description: "Formed content review queue before roadmap and contract tracking"
};

export default async function ContentReviewRoute() {
  await requireInternalSession();

  return <ContentReviewDashboard />;
}
