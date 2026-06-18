import type { ContentReviewItem } from "./content-review-types";

export const initialContentReviewItems: ContentReviewItem[] = [
  {
    id: "aquinas-101",
    title: "Aquinas 101",
    provider: "Thomistic Institute",
    genre: "Scripture Study",
    format: "Formation Series",
    reviewStage: "Approved",
    contractStatus: "Contract Negotiation",
    audience: "Adults",
    releaseDate: "2026-08-12",
    summary: "Formation series opportunity",
    notes: "Strong theological alignment. Confirm rights, assets, metadata, trailer availability, and intended release path before adding to the roadmap."
  },
  {
    id: "the-rescue-project",
    title: "The Rescue Project",
    provider: "Other",
    genre: "Evangelization",
    format: "Formation Series",
    reviewStage: "Under Review",
    contractStatus: "Not Started",
    audience: "Adults",
    releaseDate: "",
    summary: "Formation series candidate",
    notes: "Review parish fit, episode count, and availability before moving into decision stage."
  },
  {
    id: "slugs-and-bugs-christmas-special",
    title: "Slugs and Bugs Christmas Special",
    provider: "Brentwood Studios",
    genre: "Kids' Music",
    format: "Kids Movie",
    reviewStage: "New Request",
    contractStatus: "Outreach Needed",
    audience: "Kids",
    releaseDate: "",
    summary: "Kids movie candidate",
    notes: "Check Advent and Christmas timing, music rights, and family audience fit."
  },
  {
    id: "jesus-thirsts",
    title: "Jesus Thirsts",
    provider: "Other",
    genre: "Sacraments of Initiation",
    format: "Documentary",
    reviewStage: "Needs Decision",
    contractStatus: "Not Started",
    audience: "Adults",
    releaseDate: "",
    summary: "Feature documentary",
    notes: "Ready for programming discussion. Confirm launch window and sacramental collection fit."
  },
  {
    id: "my-fathers-father",
    title: "My Father's Father",
    provider: "Other",
    genre: "Narrative Fiction",
    format: "Movie",
    reviewStage: "Under Review",
    contractStatus: "In Discussion",
    audience: "Adults",
    releaseDate: "",
    summary: "Narrative film",
    notes: "Needs full content review and rights path before approval."
  },
  {
    id: "guillermo-and-will",
    title: "Guillermo and Will",
    provider: "Minno",
    genre: "Kids' Christian Living",
    format: "Kids Show",
    reviewStage: "Under Review",
    contractStatus: "Not Started",
    audience: "Kids",
    releaseDate: "",
    summary: "Kids show",
    notes: "Review target age band, episode structure, and availability for kids programming."
  }
];
