import type { OngoingSeries, RoadmapFilter, RoadmapMonth } from "./roadmap-types";

export const roadmapFilters: RoadmapFilter[] = [
  "All",
  "Parish",
  "Adult",
  "Kids",
  "In Progress",
  "Strategic Need",
  "Needs Date",
  "In Discussion"
];

export const roadmapMonths: RoadmapMonth[] = [
  {
    id: "march-26",
    label: "March 26",
    monthStart: "2026-03-01",
    launchCount: 7,
    releases: [
      {
        id: "fasting-wcb",
        title: "Fasting | What Catholics Believe",
        audience: "Adults",
        format: "Formation Series",
        releaseDate: "3/4",
        status: "Finalized",
        genre: "Lent and Easter",
        useCase: "Parish",
        notes: "Lenten formation release for parish and adult audiences.",
        series: "What Catholics Believe"
      },
      {
        id: "almsgiving-wcb",
        title: "Almsgiving | What Catholics Believe",
        audience: "Adults",
        format: "Formation Series",
        releaseDate: "3/18",
        status: "Finalized",
        genre: "Lent and Easter",
        useCase: "Individual",
        notes: "Companion WCB episode for Lenten content planning.",
        series: "What Catholics Believe"
      },
      {
        id: "ben-cell-episodes",
        title: "Ben Cell Ep. 5 & 6",
        audience: "Kids",
        format: "Kids Show",
        releaseDate: "TBD",
        status: "Finalized",
        genre: "Kids' Christian Living",
        useCase: "Individual",
        notes: "Kids and family series launch grouping.",
        series: "Ben Cell"
      }
    ]
  },
  {
    id: "april-26",
    label: "April 26",
    monthStart: "2026-04-01",
    launchCount: 8,
    releases: [
      {
        id: "jesus-thirsts",
        title: "Jesus Thirsts Documentary",
        audience: "Adults",
        format: "Documentary",
        releaseDate: "4/1",
        status: "Finalized",
        genre: "Biography",
        useCase: "Individual",
        notes: "Documentary release with Eucharistic formation value."
      },
      {
        id: "cooperator-brother",
        title: "Cooperator Brother Videos",
        audience: "Kids",
        format: "Kids Show",
        releaseDate: "TBD",
        status: "In Discussion",
        genre: "Kids' Education",
        useCase: "Individual",
        notes: "Kids release opportunity tied to Dominican content."
      },
      {
        id: "mercy-wcb",
        title: "Mercy | What Catholics Believe",
        audience: "Adults",
        format: "Formation Series",
        releaseDate: "TBD",
        status: "In Progress",
        genre: "Sacraments of Healing",
        useCase: "Individual",
        notes: "Formation episode still moving through production.",
        series: "What Catholics Believe"
      }
    ]
  },
  {
    id: "may-26",
    label: "May 26",
    monthStart: "2026-05-01",
    launchCount: 12,
    releases: [
      {
        id: "fathers-heart",
        title: "A Father's Heart",
        audience: "Adults",
        format: "Documentary",
        releaseDate: "5/1",
        status: "Finalized",
        genre: "Biography",
        useCase: "Individual",
        notes: "Adult documentary release planned for early May."
      },
      {
        id: "dignity-work",
        title: "Dignity of Work | Into the Breach",
        audience: "Adults",
        format: "Formation Series",
        releaseDate: "TBD",
        status: "Finalized",
        genre: "Everyday Living",
        useCase: "Individual",
        notes: "Episode release for the Into the Breach track.",
        series: "Into the Breach"
      },
      {
        id: "dominic-savio",
        title: "God's Knights: Dominic Savio",
        audience: "Kids",
        format: "Kids Show",
        releaseDate: "TBD",
        status: "Finalized",
        genre: "Kids' Saints",
        useCase: "Individual",
        notes: "Kids programming with saint-focused positioning."
      },
      {
        id: "little-liturgies-launch",
        title: "Little Liturgies Launch",
        audience: "Kids",
        format: "Formation Series",
        releaseDate: "5/26",
        status: "In Progress",
        genre: "Liturgical Living",
        useCase: "Parish",
        notes: "Recurring family series launch."
      }
    ]
  },
  {
    id: "june-26",
    label: "June 26",
    monthStart: "2026-06-01",
    launchCount: 9,
    releases: [
      {
        id: "chastity-wcb",
        title: "Chastity | What Catholics Believe",
        audience: "Adults",
        format: "Formation Series",
        releaseDate: "6/3",
        status: "Finalized",
        genre: "Human Sexuality",
        useCase: "Parish",
        notes: "Parish formation launch for WCB.",
        series: "What Catholics Believe"
      },
      {
        id: "forbidden-discussions",
        title: "Forbidden Discussions",
        audience: "Teens/YA",
        format: "Conversations",
        releaseDate: "TBD",
        status: "Strategic Need",
        genre: "Everyday Living",
        useCase: "Individual",
        notes: "Launch timing is still open and needs date confirmation."
      },
      {
        id: "totally-toddlers",
        title: "Totally Toddlers: 2 Episodes",
        audience: "Kids",
        format: "Kids Show",
        releaseDate: "TBD",
        status: "Finalized",
        genre: "Kids' Christian Living",
        useCase: "Individual",
        notes: "Two kids episodes grouped for June."
      }
    ]
  },
  {
    id: "july-26",
    label: "July 26",
    monthStart: "2026-07-01",
    launchCount: 7,
    releases: [
      {
        id: "anointing-wcb",
        title: "Anointing of the Sick | WCB",
        audience: "Adults",
        format: "Formation Series",
        releaseDate: "TBD",
        status: "Finalized",
        genre: "Sacraments of Healing",
        useCase: "Individual",
        notes: "Adult catechetical release in the WCB track.",
        series: "What Catholics Believe"
      },
      {
        id: "cabrini",
        title: "Cabrini",
        audience: "Adults",
        format: "Movie",
        releaseDate: "Needs date",
        status: "Strategic Need",
        genre: "Biography",
        useCase: "Individual",
        notes: "Needs decision before the target launch window."
      },
      {
        id: "into-great-silence",
        title: "Into Great Silence",
        audience: "Adults",
        format: "Ministry Resource",
        releaseDate: "7/11",
        status: "Finalized",
        genre: "Liturgical Living",
        useCase: "Parish",
        notes: "Timing-driven planning item."
      }
    ]
  },
  {
    id: "august-26",
    label: "August 26",
    monthStart: "2026-08-01",
    launchCount: 6,
    releases: [
      {
        id: "augustine-life",
        title: "The Life and Teachings of St. Augustine",
        audience: "Adults",
        format: "Formation Series",
        releaseDate: "8/28",
        status: "Finalized",
        genre: "Church History",
        useCase: "Parish",
        notes: "Parish release connected to St. Augustine."
      },
      {
        id: "triumph-heart",
        title: "Triumph of the Heart",
        audience: "Adults",
        format: "Movie",
        releaseDate: "TBD",
        status: "Strategic Need",
        genre: "Narrative Fiction",
        useCase: "Individual",
        notes: "SVOD release needs decision and timing confirmation."
      },
      {
        id: "st-clare",
        title: "God's Princess: St. Clare",
        audience: "Kids",
        format: "Kids Show",
        releaseDate: "8/5",
        status: "Finalized",
        genre: "Kids' Saints",
        useCase: "Individual",
        notes: "Kids release with saint-focused timing."
      }
    ]
  }
];

export const ongoingSeries: OngoingSeries[] = [
  {
    id: "practicing-catholic",
    series: "Practicing Catholic",
    startDate: "September 25",
    endDate: "TBD",
    cadence: "1 per week",
    notes: "Auto-generates weekly placeholder cards"
  },
  {
    id: "mark-10-mission",
    series: "The Mark 10 Mission",
    startDate: "May 3 tentative",
    endDate: "TBD",
    cadence: "1 per week",
    notes: "Recurring kids and family track"
  },
  {
    id: "little-liturgies",
    series: "Little Liturgies",
    startDate: "May 3 tentative",
    endDate: "TBD",
    cadence: "1 per week",
    notes: "Can pause around timing-driven campaigns"
  },
  {
    id: "verbum-dei",
    series: "Verbum Dei",
    startDate: "Mid-August tentative",
    endDate: "TBD",
    cadence: "1 per week",
    notes: "Formation series timing is still tentative"
  },
  {
    id: "what-catholics-believe",
    series: "What Catholics Believe",
    startDate: "A long time ago",
    endDate: "TBD",
    cadence: "2 per month",
    notes: "Shown as recurring formation series"
  },
  {
    id: "amen-sleep-stories",
    series: "Amen Sleep Stories",
    startDate: "TBD",
    endDate: "TBD",
    cadence: "1 per month",
    notes: "Low-density ongoing track"
  },
  {
    id: "amen-prayers",
    series: "Amen Prayers",
    startDate: "TBD",
    endDate: "TBD",
    cadence: "",
    notes: ""
  }
];
