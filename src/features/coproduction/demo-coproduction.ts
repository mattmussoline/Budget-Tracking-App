import type { CoproductionOpportunity } from "./coproduction-types";

/**
 * Public sample slate. Titles, partners, prices, and grades are invented, and
 * the key art is placeholder, so the demo can show the whole evaluation
 * workflow without exposing a real partner or a real number.
 */
export const demoCoproductionOpportunities: CoproductionOpportunity[] = [
  {
    id: "demo-copro-the-well",
    title: "The Well",
    partner: "Northlight Pictures",
    format: "Docu-Series",
    genre: "Scripture",
    episodes: "8 × 26 min",
    askCents: 45000000,
    likelihood: 72,
    likelihoodRationale: "They already conceded on price and folded in the Spanish dub. What is left is the rights term, and legal has a fallback we can live with.",
    stage: "negotiating",
    art: { from: "#0e3b4a", to: "#14607a", motif: "ripples" },
    scores: {
      mission: { value: 97, rationale: "The only Scripture project on the slate, and Scripture is our thinnest pillar this year." },
      audience: { value: 94, rationale: "Scripture series are our strongest format on both first-week views and completion." },
      economics: { value: 90, rationale: "$130K per finished hour, right at the $125K benchmark — and Northlight carries 40% of the negative cost." },
      partner: { value: 94, rationale: "Northlight delivered two series for us on time, and their own post house absorbs finishing cost." },
      delivery: { value: 88, rationale: "Two blocks shoot in Jordan and the second block has no permit yet." }
    },
    gradedBy: "Sample Reviewer",
    gradedAt: "Aug 27, 2026",
    updatedAt: "2026-09-01T15:00:00.000Z",
    notes: [
      {
        kind: "paragraph",
        lead: "The strongest thing on the slate.",
        body: "Eight episodes walking the wells of Scripture — Jacob, Moses, the Samaritan woman — shot on location. It is the only inbound project that lands squarely on the pillar we are thinnest on."
      },
      {
        kind: "paragraph",
        body: "Northlight is bringing 40% of the negative cost and their own post house, which is what holds the economics score up despite the size of the ask. We hold worldwide streaming rights for seven years with a Spanish dub included in delivery."
      },
      {
        kind: "bullets",
        items: [
          "Deliverability is the one soft spot: two shooting blocks are in Jordan and the second has no permit yet.",
          "Their director wants an on-camera host. We should push for our own host to keep brand continuity."
        ]
      }
    ],
    metadata: [
      { label: "Budget source", value: "Co-Production (sample year)" },
      { label: "Our share", value: "60% of negative cost" },
      { label: "Rights", value: "Worldwide streaming, 7 years" },
      { label: "Territory", value: "Global, English + Spanish" },
      { label: "Delivery window", value: "Q3 (Feb – Apr 2027)" },
      { label: "Decision due", value: "Sep 18, 2026" },
      { label: "Comparable", value: "Illustrated Scripture companion series" },
      { label: "Screener", value: "Sample link withheld in demo" }
    ],
    updates: [
      {
        id: "demo-copro-well-4",
        opportunityId: "demo-copro-the-well",
        kind: "note",
        body: "Northlight came back at $450K flat with the Spanish dub folded in. That is a real concession — previously $475K plus dub at cost.",
        fromStage: null,
        toStage: null,
        authorEmail: "reviewer@example.com",
        createdAt: "2026-09-01T15:00:00.000Z"
      },
      {
        id: "demo-copro-well-3",
        opportunityId: "demo-copro-the-well",
        kind: "stage_change",
        body: null,
        fromStage: "in_review",
        toStage: "negotiating",
        authorEmail: "reviewer@example.com",
        createdAt: "2026-08-28T16:30:00.000Z"
      },
      {
        id: "demo-copro-well-2",
        opportunityId: "demo-copro-the-well",
        kind: "note",
        body: "Legal flagged the 7-year term as long for a co-production. Asked for 5 years with an option to extend.",
        fromStage: null,
        toStage: null,
        authorEmail: "reviewer@example.com",
        createdAt: "2026-08-22T14:10:00.000Z"
      },
      {
        id: "demo-copro-well-1",
        opportunityId: "demo-copro-the-well",
        kind: "created",
        body: null,
        fromStage: null,
        toStage: null,
        authorEmail: "reviewer@example.com",
        createdAt: "2026-08-21T09:00:00.000Z"
      }
    ]
  },
  {
    id: "demo-copro-ember-and-ash",
    title: "Ember & Ash",
    partner: "Cana Film Co.",
    format: "Movie",
    genre: "Saints",
    episodes: "1 × 104 min",
    askCents: 120000000,
    likelihood: 38,
    likelihoodRationale: "We are not far apart on the film, we are far apart on the money. This only moves if Cana lands a third equity partner.",
    stage: "in_review",
    art: { from: "#3a1a2b", to: "#7c3b2c", motif: "flame" },
    scores: {
      mission: { value: 96, rationale: "A feature on a young saint's conversion. Saints are a proven pillar and this is the best script we have read this year." },
      audience: { value: 93, rationale: "Saint biopics are second only to Scripture for us, and a name director widens the reach." },
      economics: { value: 72, rationale: "Features do not price per hour. The problem is $1.2M for a 35% minority position, with theatrical deferring our window 15 months." },
      partner: { value: 88, rationale: "Cana is an established shop with good references, but this would be our first project together." },
      delivery: { value: 78, rationale: "Financing is not closed, so the schedule is real but not yet locked." }
    },
    gradedBy: "Sample Reviewer",
    gradedAt: "Aug 24, 2026",
    updatedAt: "2026-08-29T13:00:00.000Z",
    notes: [
      {
        kind: "paragraph",
        lead: "The best script on the slate and the hardest number to justify.",
        body: "A feature written to travel a festival circuit before it reaches us. Cana has a name director attached."
      },
      {
        kind: "paragraph",
        body: "At $1.2M for a 35% position this is nearly a third of the co-production line for one title, and the theatrical hold means it does not appear on the platform for at least fifteen months. That is the whole story of the economics score."
      },
      {
        kind: "paragraph",
        body: "Recommendation: keep it warm, do not commit. If Cana closes another equity partner the ask drops and this becomes a very different conversation."
      }
    ],
    metadata: [
      { label: "Budget source", value: "Co-Production (sample year)" },
      { label: "Our share", value: "35% of negative cost" },
      { label: "Rights", value: "Streaming after 90-day theatrical" },
      { label: "Territory", value: "North America" },
      { label: "Delivery window", value: "Q1, following year" },
      { label: "Decision due", value: "Oct 2, 2026" },
      { label: "Comparable", value: "Feature-length saint biopic, festival route" },
      { label: "Screener", value: "Sample link withheld in demo" }
    ],
    updates: [
      {
        id: "demo-copro-ember-3",
        opportunityId: "demo-copro-ember-and-ash",
        kind: "note",
        body: "Cana is still hunting a third equity partner. Our exposure drops to roughly $780K if they land it.",
        fromStage: null,
        toStage: null,
        authorEmail: "reviewer@example.com",
        createdAt: "2026-08-29T13:00:00.000Z"
      },
      {
        id: "demo-copro-ember-2",
        opportunityId: "demo-copro-ember-and-ash",
        kind: "stage_change",
        body: null,
        fromStage: "inbound",
        toStage: "in_review",
        authorEmail: "reviewer@example.com",
        createdAt: "2026-08-24T11:00:00.000Z"
      },
      {
        id: "demo-copro-ember-1",
        opportunityId: "demo-copro-ember-and-ash",
        kind: "created",
        body: null,
        fromStage: null,
        toStage: null,
        authorEmail: "reviewer@example.com",
        createdAt: "2026-08-19T10:00:00.000Z"
      }
    ]
  },
  {
    id: "demo-copro-table-of-kings",
    title: "Table of Kings",
    partner: "Sycamore Studios",
    format: "Formation Series",
    genre: "Sacraments",
    episodes: "6 × 22 min",
    askCents: 26000000,
    likelihood: 61,
    likelihoodRationale: "No open issues on our side. We are waiting on their board to approve the even split.",
    stage: "in_review",
    art: { from: "#1e2a5c", to: "#2f4c92", motif: "table" },
    scores: {
      mission: { value: 93, rationale: "Sacraments content built for parish small groups, with a leader guide and workbook already drafted." },
      audience: { value: 88, rationale: "Catechetical series index lower on first-week views than saints or Scripture, but completion rates stay high." },
      economics: { value: 92, rationale: "$118K per finished hour, inside the $125K benchmark, for perpetual worldwide rights. Best value on the slate." },
      partner: { value: 90, rationale: "Sycamore has delivered twice for us on schedule, and their paperwork is always clean." },
      delivery: { value: 90, rationale: "Two weeks on one stage with no location risk." }
    },
    gradedBy: "Sample Reviewer",
    gradedAt: "Aug 29, 2026",
    updatedAt: "2026-09-02T17:20:00.000Z",
    notes: [
      {
        kind: "paragraph",
        lead: "The efficient one.",
        body: "Six episodes built for parish small groups, with a leader guide and a workbook already drafted. Perpetual worldwide rights at $260K is the best price per finished hour on the slate."
      },
      {
        kind: "paragraph",
        body: "Sycamore delivered on time twice before, and the whole shoot is two weeks on one stage — which is why deliverability grades at 90."
      },
      {
        kind: "paragraph",
        body: "The only reason this is not graded higher is audience: catechetical series index lower on first-week views than saints or Scripture, even when completion rates are strong."
      }
    ],
    metadata: [
      { label: "Budget source", value: "Co-Production (sample year)" },
      { label: "Our share", value: "50% of negative cost" },
      { label: "Rights", value: "Worldwide, perpetual" },
      { label: "Territory", value: "Global, English" },
      { label: "Delivery window", value: "Q2 (Nov 2026 – Jan 2027)" },
      { label: "Decision due", value: "Sep 30, 2026" },
      { label: "Comparable", value: "Small-group sacramental study" },
      { label: "Screener", value: "Sample link withheld in demo" }
    ],
    updates: [
      {
        id: "demo-copro-table-3",
        opportunityId: "demo-copro-table-of-kings",
        kind: "note",
        body: "Workbook draft came in. Genuinely good — this could anchor a parish push next Lent.",
        fromStage: null,
        toStage: null,
        authorEmail: "reviewer@example.com",
        createdAt: "2026-09-02T17:20:00.000Z"
      },
      {
        id: "demo-copro-table-2",
        opportunityId: "demo-copro-table-of-kings",
        kind: "stage_change",
        body: null,
        fromStage: "inbound",
        toStage: "in_review",
        authorEmail: "reviewer@example.com",
        createdAt: "2026-08-30T12:00:00.000Z"
      },
      {
        id: "demo-copro-table-1",
        opportunityId: "demo-copro-table-of-kings",
        kind: "created",
        body: null,
        fromStage: null,
        toStage: null,
        authorEmail: "reviewer@example.com",
        createdAt: "2026-08-25T09:30:00.000Z"
      }
    ]
  },
  {
    id: "demo-copro-advent-in-assisi",
    title: "Advent in Assisi",
    partner: "Pellegrino Media",
    format: "Reflection",
    genre: "Liturgical Seasons",
    episodes: "24 × 8 min",
    askCents: 9500000,
    likelihood: 84,
    likelihoodRationale: "Approved and in production. The only thing that could still stop it landing is the hard November delivery date.",
    stage: "greenlit",
    art: { from: "#2b1e4d", to: "#5c3d8a", motif: "rays" },
    scores: {
      mission: { value: 88, rationale: "Fills the Advent slot with new formation content instead of a re-run, though it is devotional rather than catechetical." },
      audience: { value: 74, rationale: "Daily reflections do not spike, they accumulate. We are buying a durable seasonal anchor, not a launch moment." },
      economics: { value: 95, rationale: "$30K per finished hour for 24 evergreen pieces we can re-run every Advent. Nothing else on the slate is close." },
      partner: { value: 82, rationale: "Pellegrino is small but delivered one series for us, and the Assisi access is theirs alone." },
      delivery: { value: 96, rationale: "Pilot is cut, the shoot is done, and the November date is contractual." }
    },
    gradedBy: "Sample Reviewer",
    gradedAt: "Aug 12, 2026",
    updatedAt: "2026-08-26T10:00:00.000Z",
    notes: [
      {
        kind: "paragraph",
        lead: "Approved.",
        body: "Twenty-four daily reflections shot on location, delivered as a seasonal block. Small ask, hard delivery date, already in production."
      },
      {
        kind: "paragraph",
        body: "Economics and deliverability are the two highest scores on the slate: $95K for 24 pieces of evergreen seasonal content, with the pilot already cut."
      },
      {
        kind: "paragraph",
        body: "The audience score is the honest limiter. Daily reflections do not spike, they accumulate — we are buying a durable Advent anchor."
      }
    ],
    metadata: [
      { label: "Budget source", value: "Co-Production (sample year)" },
      { label: "Our share", value: "70% of negative cost" },
      { label: "Rights", value: "Worldwide, perpetual" },
      { label: "Territory", value: "Global, English + Italian" },
      { label: "Delivery window", value: "Nov 14, 2026 (hard date)" },
      { label: "Decision due", value: "Closed — approved Aug 30" },
      { label: "Comparable", value: "Daily seasonal reflection series" },
      { label: "Screener", value: "Sample link withheld in demo" }
    ],
    updates: [
      {
        id: "demo-copro-advent-3",
        opportunityId: "demo-copro-advent-in-assisi",
        kind: "stage_change",
        body: null,
        fromStage: "negotiating",
        toStage: "greenlit",
        authorEmail: "reviewer@example.com",
        createdAt: "2026-08-26T10:00:00.000Z"
      },
      {
        id: "demo-copro-advent-2",
        opportunityId: "demo-copro-advent-in-assisi",
        kind: "note",
        body: "Approved at $95K. The November delivery is contractual — if it slips we lose the whole Advent window.",
        fromStage: null,
        toStage: null,
        authorEmail: "reviewer@example.com",
        createdAt: "2026-08-23T15:45:00.000Z"
      },
      {
        id: "demo-copro-advent-1",
        opportunityId: "demo-copro-advent-in-assisi",
        kind: "created",
        body: null,
        fromStage: null,
        toStage: null,
        authorEmail: "reviewer@example.com",
        createdAt: "2026-08-04T08:00:00.000Z"
      }
    ]
  },
  {
    id: "demo-copro-rule-of-life",
    title: "Rule of Life",
    partner: "Broadstone Collective",
    format: "Docu-Series",
    genre: "Christian Living",
    episodes: "10 × 30 min",
    askCents: 78000000,
    likelihood: 22,
    likelihoodRationale: "We are apart on both length and price, and they say the communities are already committed to a ten-part arc.",
    stage: "in_review",
    art: { from: "#20302a", to: "#3f5b4a", motif: "path" },
    scores: {
      mission: { value: 86, rationale: "Contemplative communities are genuinely on-mission, but Christian Living is our best-covered pillar already." },
      audience: { value: 72, rationale: "Monastic documentary is a niche within a niche — strong with existing subscribers, weak at acquisition." },
      economics: { value: 70, rationale: "$156K per finished hour, above benchmark, and they will not cut below eight episodes to bring it down." },
      partner: { value: 80, rationale: "Broadstone is credible and well-reviewed, but has never delivered ten episodes for anyone." },
      delivery: { value: 76, rationale: "Ten communities across three countries on an eleven-month schedule." }
    },
    gradedBy: "Sample Reviewer",
    gradedAt: "Aug 18, 2026",
    updatedAt: "2026-08-20T11:30:00.000Z",
    notes: [
      {
        kind: "paragraph",
        lead: "Good idea, wrong shape.",
        body: "Ten half-hours inside contemplative communities. The concept is strong but ten episodes at $780K for a 45% position is more series than the topic supports for us."
      },
      {
        kind: "paragraph",
        body: "Broadstone will not cut it below eight episodes, which is where the economics score sits. The likelihood is low because we are far apart on both length and price, not because the project is weak."
      },
      {
        kind: "paragraph",
        body: "If they came back at four episodes for $300K this would grade around a B+ and we would probably do it."
      }
    ],
    metadata: [
      { label: "Budget source", value: "Co-Production (sample year)" },
      { label: "Our share", value: "45% of negative cost" },
      { label: "Rights", value: "Worldwide streaming, 5 years" },
      { label: "Territory", value: "Global, English" },
      { label: "Delivery window", value: "Q4, sample year" },
      { label: "Decision due", value: "Nov 1, 2026" },
      { label: "Comparable", value: "Monastic-life documentary series" },
      { label: "Screener", value: "Sample link withheld in demo" }
    ],
    updates: [
      {
        id: "demo-copro-rule-3",
        opportunityId: "demo-copro-rule-of-life",
        kind: "note",
        body: "Floated a four-episode version at $300K. They said the communities already committed to a ten-part arc.",
        fromStage: null,
        toStage: null,
        authorEmail: "reviewer@example.com",
        createdAt: "2026-08-20T11:30:00.000Z"
      },
      {
        id: "demo-copro-rule-2",
        opportunityId: "demo-copro-rule-of-life",
        kind: "stage_change",
        body: null,
        fromStage: "inbound",
        toStage: "in_review",
        authorEmail: "reviewer@example.com",
        createdAt: "2026-08-18T09:15:00.000Z"
      },
      {
        id: "demo-copro-rule-1",
        opportunityId: "demo-copro-rule-of-life",
        kind: "created",
        body: null,
        fromStage: null,
        toStage: null,
        authorEmail: "reviewer@example.com",
        createdAt: "2026-08-14T09:00:00.000Z"
      }
    ]
  },
  {
    id: "demo-copro-little-flowers",
    title: "Little Flowers",
    partner: "Wheat & Tares Animation",
    format: "Kids Show",
    genre: "Saints",
    episodes: "13 × 11 min",
    askCents: 54000000,
    likelihood: 45,
    likelihoodRationale: "They want it and we want it. The open question is whether they can build it, which is why we are proposing a four-episode first order.",
    stage: "inbound",
    art: { from: "#7a2b4a", to: "#c2606a", motif: "bloom" },
    scores: {
      mission: { value: 90, rationale: "Kids is the single largest hole in the catalog, and child saints is the right entry point." },
      audience: { value: 86, rationale: "Kids content has no comparable in our catalog, but parent demand shows up in every survey we run." },
      economics: { value: 72, rationale: "$227K per finished hour is high, but animation always is, and the merchandising option offsets some of it." },
      partner: { value: 76, rationale: "Charming test reel from a nine-person shop that has never delivered a full season." },
      delivery: { value: 64, rationale: "Eighteen months for thirteen animated episodes is optimistic for their crew size." }
    },
    gradedBy: "Sample Reviewer",
    gradedAt: "Sep 1, 2026",
    updatedAt: "2026-08-31T14:00:00.000Z",
    notes: [
      {
        kind: "paragraph",
        lead: "The kids gap, at animation prices.",
        body: "Thirteen animated shorts on child saints. Kids is the largest hole in the catalog and the animation test reel is charming."
      },
      {
        kind: "paragraph",
        body: "Deliverability is the low score and it is the real risk: this is a nine-person shop that has never delivered thirteen episodes of anything. An eighteen-month schedule on a thirteen-episode animated order is optimistic."
      },
      {
        kind: "paragraph",
        body: "Suggest a four-episode first order with an option on the remaining nine. That converts a deliverability risk into a paced commitment."
      }
    ],
    metadata: [
      { label: "Budget source", value: "Co-Production (sample year)" },
      { label: "Our share", value: "55% of negative cost" },
      { label: "Rights", value: "Worldwide, perpetual + merch option" },
      { label: "Territory", value: "Global, English + Spanish" },
      { label: "Delivery window", value: "Q2, following year" },
      { label: "Decision due", value: "Oct 15, 2026" },
      { label: "Comparable", value: "Animated saints anthology, ages 5–9" },
      { label: "Screener", value: "Sample link withheld in demo" }
    ],
    updates: [
      {
        id: "demo-copro-flowers-2",
        opportunityId: "demo-copro-little-flowers",
        kind: "note",
        body: "Asked for their pipeline plan and crew ramp. If they cannot show thirteen episodes of capacity, we split the order.",
        fromStage: null,
        toStage: null,
        authorEmail: "reviewer@example.com",
        createdAt: "2026-08-31T14:00:00.000Z"
      },
      {
        id: "demo-copro-flowers-1",
        opportunityId: "demo-copro-little-flowers",
        kind: "created",
        body: null,
        fromStage: null,
        toStage: null,
        authorEmail: "reviewer@example.com",
        createdAt: "2026-08-30T09:00:00.000Z"
      }
    ]
  },
  {
    id: "demo-copro-the-ninth-hour",
    title: "The Ninth Hour",
    partner: "Kestrel House",
    format: "Movie",
    genre: "Fiction",
    episodes: "1 × 118 min",
    askCents: 210000000,
    likelihood: 9,
    likelihoodRationale: "Passed. Kept on the slate as the record of why.",
    stage: "passed",
    art: { from: "#181d23", to: "#3a4551", motif: "hours" },
    scores: {
      mission: { value: 82, rationale: "Well-made and faith-adjacent, but it is a drama first and formation a distant second." },
      audience: { value: 70, rationale: "Prestige drama draws press, not subscribers. No comparable in our catalog has converted." },
      economics: { value: 50, rationale: "$2.1M for a 30% position on a title we would not be able to stream for two years." },
      partner: { value: 72, rationale: "Kestrel is a serious production company, and worth staying close to for their next one." },
      delivery: { value: 60, rationale: "Financing incomplete and no cast attached." }
    },
    gradedBy: "Sample Reviewer",
    gradedAt: "Jul 30, 2026",
    updatedAt: "2026-08-13T16:00:00.000Z",
    notes: [
      {
        kind: "paragraph",
        lead: "Passed.",
        body: "A $2.1M ask for a 30% position on a prestige drama that reaches the platform two years out, behind both a theatrical and a premium rental window."
      },
      {
        kind: "paragraph",
        body: "Kept on the slate on purpose. The grade and the reasoning are the record of why we said no, and Kestrel will be back with something else."
      }
    ],
    metadata: [
      { label: "Budget source", value: "Co-Production (sample year)" },
      { label: "Our share", value: "30% of negative cost" },
      { label: "Rights", value: "Streaming after theatrical and rental" },
      { label: "Territory", value: "North America" },
      { label: "Delivery window", value: "Q3, following year" },
      { label: "Decision due", value: "Closed — passed Aug 13" },
      { label: "Comparable", value: "Faith-adjacent prestige drama" },
      { label: "Screener", value: "Sample link withheld in demo" }
    ],
    updates: [
      {
        id: "demo-copro-ninth-2",
        opportunityId: "demo-copro-the-ninth-hour",
        kind: "stage_change",
        body: null,
        fromStage: "in_review",
        toStage: "passed",
        authorEmail: "reviewer@example.com",
        createdAt: "2026-08-13T16:00:00.000Z"
      },
      {
        id: "demo-copro-ninth-1",
        opportunityId: "demo-copro-the-ninth-hour",
        kind: "created",
        body: null,
        fromStage: null,
        toStage: null,
        authorEmail: "reviewer@example.com",
        createdAt: "2026-07-30T09:00:00.000Z"
      }
    ]
  }
];
