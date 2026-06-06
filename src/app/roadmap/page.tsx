import type { Metadata } from "next";
import { RoadmapPage } from "@/features/roadmap/components/roadmap-page";
import { requireInternalSession } from "@/lib/auth/internal-auth";

export const metadata: Metadata = {
  title: "Content Roadmap",
  description: "Monthly Formed content roadmap planning dashboard"
};

export default async function ContentRoadmapRoute() {
  await requireInternalSession();

  return <RoadmapPage />;
}
