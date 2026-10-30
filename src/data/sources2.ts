import type { EvidenceRef, Source } from "../types";

/** Second batch of sources. Each was opened and its abstract/summary read; numbers are copied from it. */
export const MORE_SOURCES: Source[] = [
  {
    id: "brynjolfsson-support",
    title: "Generative AI at Work",
    authors: "Brynjolfsson, Li, Raymond",
    venue: "NBER WP 31161; Quarterly Journal of Economics 2025",
    year: 2023,
    url: "https://www.nber.org/papers/w31161",
    finding:
      "Staggered rollout of an AI conversational assistant to 5,179 customer support agents. Issues resolved per hour rose 14% on average, and 34% for novice and low-skilled workers, with minimal impact on experienced and highly skilled workers. Customer sentiment and employee retention also improved.",
    caveat:
      "One company and one tool. It measures productivity of agents who kept their jobs, not headcount, so it does not show whether fewer agents are hired.",
  },
  {
    id: "noy-zhang",
    title: "Experimental evidence on the productivity effects of generative artificial intelligence",
    authors: "Noy, Zhang",
    venue: "Science 381(6654), 2023",
    year: 2023,
    url: "https://pubmed.ncbi.nlm.nih.gov/37440646/",
    finding:
      "Preregistered experiment with 453 college-educated professionals on occupation-specific writing tasks. With ChatGPT, average time taken fell 40% and output quality rose 18%. Inequality between workers decreased.",
    caveat: "Short, incentivized online writing tasks, not whole jobs. It shows speed and quality on tasks, not that roles disappear.",
  },
  {
    id: "radiology-nber",
    title: "Combining Human Expertise with Artificial Intelligence: Experimental Evidence from Radiology",
    authors: "Agarwal, Moehring, Rajpurkar, Salz",
    venue: "NBER WP 31422 (revised Aug 2026)",
    year: 2023,
    url: "https://www.nber.org/papers/w31422",
    finding:
      "Information experiment with professional radiologists: providing AI predictions did not improve performance on average, while contextual information did. Radiologists underweight AI predictions. The authors conclude the optimal design delegates cases either to humans or to AI, but rarely to AI-assisted humans.",
    caveat:
      "A controlled experiment, not a study of radiologists' jobs or hiring. It says nothing about how many radiologists will be needed.",
  },
  {
    id: "ayers-chatbot",
    title: "Comparing Physician and AI Chatbot Responses to Patient Questions Posted to a Public Social Media Forum",
    authors: "Ayers et al.",
    venue: "JAMA Internal Medicine 183(6), 2023",
    year: 2023,
    url: "https://pubmed.ncbi.nlm.nih.gov/37115527/",
    finding:
      "195 questions from Reddit's r/AskDocs. Licensed professionals preferred the chatbot's answer in 78.6% of 585 evaluations. Responses rated empathetic or very empathetic: 45.1% for the chatbot vs 4.6% for physicians.",
    caveat:
      "Written text on a public forum, rated by evaluators. Physician answers were much shorter (52 vs 211 words). It does not test real bedside care, trust over time, or accountability. The authors suggest AI drafts that physicians review.",
  },
  {
    id: "deming-social",
    title: "The Growing Importance of Social Skills in the Labor Market",
    authors: "Deming",
    venue: "NBER WP 21473; Quarterly Journal of Economics 2017",
    year: 2015,
    url: "https://www.nber.org/papers/w21473",
    finding:
      "Between 1980 and 2012, jobs requiring high levels of social interaction grew by nearly 12 percentage points as a share of the US labor force. Math-intensive but less social jobs shrank by 3.3 percentage points. Growth was strongest for jobs needing both math and social skill.",
    caveat:
      "Historical data that ends in 2012, before generative AI. It shows social skills were rewarded before AI. It does not show AI cannot do them.",
  },
  {
    id: "canaries",
    title: "Canaries in the Coal Mine? Six Facts about the Recent Employment Effects of Artificial Intelligence",
    authors: "Brynjolfsson, Chandar, Chen (Stanford Digital Economy Lab)",
    venue: "Working paper, revised August 2026",
    year: 2026,
    url: "https://digitaleconomy.stanford.edu/publications/canaries-in-the-coal-mine/",
    finding:
      "ADP payroll data on millions of US workers through June 2026: no evidence of widespread, economy-wide job displacement. But employment of workers aged 22-25 in AI-exposed occupations is 19% below where it would be had it kept pace with less-exposed peers; experienced workers show no comparable gap. It operates mainly through reduced hiring rather than layoffs. Where AI primarily complements workers, employment is flat or rising.",
    caveat:
      "The authors call these early, descriptive indicators, not causal estimates. The pattern weakens when controlling for education and some divergent trends predate generative AI.",
  },
  {
    id: "bls-ooh-aerospace",
    title: "Occupational Outlook Handbook: Aerospace Engineers",
    authors: "US Bureau of Labor Statistics",
    venue: "BLS OOH, last modified 27 Aug 2026",
    year: 2026,
    url: "https://www.bls.gov/ooh/architecture-and-engineering/aerospace-engineers.htm",
    finding:
      "68,700 aerospace engineers in 2025; employment projected to grow 8% from 2025 to 2035 (all occupations: 3%), about 5,700 more jobs. 15% worked in the federal government. The handbook says they design aircraft, spacecraft, satellites and missiles, and that national-defense work may need a security clearance.",
    caveat:
      "A government projection method, not a view on AI: the handbook's outlook text names fuel efficiency, cheaper satellite launches and drones as drivers and does not discuss AI. Projections can be wrong. It covers one occupation, not the other military roles on the map.",
  },
  {
    id: "icrc-aws",
    title: "ICRC position on autonomous weapon systems",
    authors: "International Committee of the Red Cross",
    venue: "ICRC position paper, 12 May 2021",
    year: 2021,
    url: "https://www.icrc.org/en/document/icrc-position-autonomous-weapon-systems",
    finding:
      "Defines autonomous weapon systems as ones that select and apply force to targets without human intervention. Recommends that States adopt new legally binding rules: rule out unpredictable systems, rule out systems that apply force against persons, and regulate the rest with limits on targets, duration, scale and situations of use, plus requirements for effective human supervision and timely intervention.",
    caveat:
      "An advocacy position from a humanitarian organization, not law and not a forecast of what militaries will field. It shows what a major actor argues should be required. It also implies the systems it worries about are technically possible.",
  },
  {
    id: "wiki-laws",
    title: "Lethal autonomous weapon (encyclopedia article)",
    authors: "Wikipedia contributors",
    venue: "Wikipedia, read Oct 2026",
    year: 2026,
    url: "https://en.wikipedia.org/wiki/Lethal_autonomous_weapon",
    finding:
      "Summarizes US Department of Defense Directive 3000.09, which requires autonomous and semi-autonomous weapon systems to allow \"appropriate levels of human judgment over the use of force\". Reports that most military drones still require human control, and that some reports of autonomous use in Ukraine are described as yet to be proven.",
    caveat:
      "A tertiary, editable source. We could not open the directive itself (the PDF host blocked us), so check the primary text before relying on the wording. \"Appropriate levels\" is flexible and is not a ban on autonomy. Policy can be revised.",
  },
];

export const MORE_SKILL_EVIDENCE: Record<string, EvidenceRef[]> = {
  accountability: [
    {
      sourceId: "wiki-laws",
      signal: "less",
      note: "US defense policy, as summarized here, requires appropriate human judgment over the use of force. That is a rule about who must answer, not a technical limit, so it can change.",
    },
    {
      sourceId: "icrc-aws",
      signal: "less",
      note: "A major humanitarian actor argues for legally binding human-control requirements. It is an argument for a requirement, not evidence that one exists.",
    },
  ],
  eq: [
    {
      sourceId: "deming-social",
      signal: "less",
      note: "Social skills were increasingly rewarded in the labor market from 1980 to 2012. That is history: it supports demand, not that AI can't do them.",
    },
    {
      sourceId: "ayers-chatbot",
      signal: "more",
      note: "Counter-evidence: in written replies to patients, a chatbot was rated empathetic far more often than physicians. Our 'resists automation' argument is about being present and accountable, not about producing caring text.",
    },
  ],
  connection: [
    {
      sourceId: "deming-social",
      signal: "less",
      note: "Jobs with high social interaction grew as a share of US employment. Historical and pre-generative-AI.",
    },
  ],
  judgment: [
    {
      sourceId: "radiology-nber",
      signal: "less",
      note: "Radiologists' contextual information improved performance while AI predictions alone did not on average, which suggests humans hold information AI lacks in this setting.",
    },
  ],
  "scripted-support": [
    {
      sourceId: "brynjolfsson-support",
      signal: "mixed",
      note: "An AI assistant raised resolved issues per hour by 14%, and by 34% for novices. A big efficiency gain, but it measured agents who kept their jobs, not whether fewer are hired.",
    },
  ],
  copywriting: [
    {
      sourceId: "noy-zhang",
      signal: "more",
      note: "Professional writing tasks took 40% less time with ChatGPT and quality rose 18%.",
    },
  ],
  "image-analysis": [
    {
      sourceId: "radiology-nber",
      signal: "mixed",
      note: "AI predictions did not help radiologists on average, and the authors favor delegating cases to either human or AI. A mixed signal on whether AI reads images alone.",
    },
  ],
};

export const MORE_JOB_EVIDENCE: Record<string, EvidenceRef[]> = {
  "aerospace-eng": [
    {
      sourceId: "bls-ooh-aerospace",
      signal: "less",
      note: "The only occupation-level government projection we have read for this field: +8% jobs 2025-35 vs 3% for all occupations. It does not model AI, so it neither confirms nor rules out AI effects.",
    },
  ],
  "weapons-eng": [
    {
      sourceId: "wiki-laws",
      signal: "less",
      note: "Policy summarized here requires appropriate human judgment over force, which creates assurance and verification work for people. A policy can change.",
    },
  ],
  "uas-operator": [
    {
      sourceId: "wiki-laws",
      signal: "mixed",
      note: "Most military drones are reported to still need human control, but some reports of autonomous use are described as unproven. This role is the one most likely to shift toward supervision.",
    },
    {
      sourceId: "icrc-aws",
      signal: "mixed",
      note: "The ICRC calls for binding limits because autonomy in targeting is technically possible. Whether those limits arrive is unknown.",
    },
  ],
  "cs-rep": [
    {
      sourceId: "brynjolfsson-support",
      signal: "mixed",
      note: "AI assistance made support agents 14% more productive, and novices 34%. That could mean fewer agents are needed, or the same agents handle more. The study cannot say which.",
    },
    {
      sourceId: "canaries",
      signal: "more",
      note: "Hiring of workers aged 22-25 in AI-exposed occupations is down, which matters for entry-level roles like this one. The authors call it descriptive, not causal.",
    },
  ],
  radiologist: [
    {
      sourceId: "radiology-nber",
      signal: "mixed",
      note: "In a controlled experiment, AI predictions did not improve radiologists on average. That is why this role is scored 'moderate', not 'severe'. It says nothing about future hiring.",
    },
  ],
  physician: [
    {
      sourceId: "ayers-chatbot",
      signal: "more",
      note: "A chatbot's written answers were preferred in 78.6% of evaluations. That is about drafting replies, not diagnosing or taking responsibility for care.",
    },
  ],
  copywriter: [
    {
      sourceId: "noy-zhang",
      signal: "more",
      note: "Writing tasks took 40% less time with AI and quality rose 18%. A strong signal that routine writing is highly exposed.",
    },
  ],
  "software-dev": [
    {
      sourceId: "canaries",
      signal: "more",
      note: "Young workers in AI-exposed occupations show weaker hiring, while experienced workers show no comparable gap. The authors say this is descriptive, not causal.",
    },
  ],
};

/** Live feeds the backend actually fetches. */
export const LIVE_SOURCES = [
  {
    name: "US Bureau of Labor Statistics: Current Employment Statistics",
    url: "https://www.bls.gov/ces/",
    used: "Industry-level employment (e.g. legal services, call centers) and 12-month change, via the public BLS API.",
    limit: "Whole-industry totals, not job titles, and not AI-specific.",
  },
  {
    name: "Indeed Hiring Lab: Job Postings Index (CC-BY-4.0)",
    url: "https://github.com/hiring-lab/job_postings_tracker",
    used: "Postings by sector, indexed to 1 Feb 2020 = 100, with change vs one year earlier.",
    limit: "Broad Indeed categories. Postings also move with interest rates and seasons.",
  },
  {
    name: "Google News search (or NewsAPI.org when a key is set)",
    url: "https://news.google.com/",
    used: "Recent headlines per role.",
    limit: "Search results, not verified claims. Some headlines are opinion.",
  },
];
