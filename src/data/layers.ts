/**
 * Copy for the two dedicated layers. Every claim here is either tied to a source id from
 * sources.ts / sources2.ts or is labelled as a reasoned argument. Nothing is quoted from memory.
 */

export interface Reason {
  title: string;
  /** "evidence" = a read source bears on it; "argument" = logic only. */
  kind: "evidence" | "argument";
  body: string;
  sourceIds?: string[];
}

export const MILITARY = {
  eyebrow: "Dedicated layer",
  title: "Military & Defense",
  lede:
    "In this field AI mostly changes how the work is done rather than who must do it. That is a claim with different levels of support depending on the role, so each reason below is labelled.",
  reasons: [
    {
      title: "Someone must answer for the use of force",
      kind: "evidence",
      body:
        "US Department of Defense Directive 3000.09, as summarized in the article we read, requires autonomous and semi-autonomous weapon systems to allow \"appropriate levels of human judgment over the use of force\". The ICRC separately recommends legally binding rules, including requirements for effective human supervision and timely intervention. These are rules and positions, not technical limits, so they can change.",
      sourceIds: ["wiki-laws", "icrc-aws"],
    },
    {
      title: "The work is adversarial",
      kind: "argument",
      body:
        "Guidance and electronic warfare are contests against an opponent who adapts to what you do. A fixed model is a fixed target. That keeps skilled people inventing, testing and updating. This is logic about the domain, not a tested result, and we found no public study that measures it.",
    },
    {
      title: "Systems must be tested, certified and trusted",
      kind: "argument",
      body:
        "Hardware that flies, fires or jams has to be verified before anyone relies on it. AI adds more things to verify (we list assurance and verification roles as growth areas). This is reasoning from how safety-critical engineering works. It is not backed by a study here.",
    },
    {
      title: "Much of it needs cleared people",
      kind: "evidence",
      body:
        "The BLS Occupational Outlook Handbook says aerospace engineers working on national-defense projects may need a security clearance, and some clearances require US citizenship. That limits who and what can be used, but it does not prevent AI tools from helping cleared staff.",
      sourceIds: ["bls-ooh-aerospace"],
    },
  ] as Reason[],
  counter: [
    "Autonomy is already part of defense. The ICRC defines autonomous weapon systems as ones that select and apply force without human intervention and asks for limits because such systems are a real concern. Concern implies capability.",
    "The article we read says most military drones still require human control, while some reports of autonomous use in Ukraine are described as yet to be proven. We cannot independently verify either.",
    "\"Appropriate levels of human judgment\" is flexible wording. A policy that allows supervised autonomy can move the human from operating a system to overseeing many. That would reduce headcount in some roles, notably drone operation and imagery analysis, even if people stay in the loop.",
    "Intelligence analysis and drone operation are the roles on this map with the highest scores in the field. We have not found public evidence for specific numbers, so those scores are editorial estimates.",
  ],
  limits: [
    "BLS industry data covers civilian employment. It does not include active-duty military personnel, so the live market signals for this field show defense contractors and government, not the services.",
    "Only one military-adjacent occupation, aerospace engineers (+8% projected 2025-35 vs 3% for all occupations, 68,700 jobs in 2025), has a government projection we have read, and that projection does not model AI.",
    "We found no public source on AI in missile guidance or electronic warfare that we could read and cite. The scores for those two roles are Editorial estimates, and we would rather say so than invent a reference.",
  ],
  roleNotes: {
    "missile-guidance": "AI speeds up simulation and design; the system's behavior still has to be proven and signed off by an engineer.",
    "ew-officer": "Adaptive tools can respond faster than a person, which shifts people toward setting objectives, limits and review.",
    "aerospace-eng": "Design copilots speed iteration. This is the one role here with a read government projection: +8% 2025-35.",
    "uas-operator": "The role most likely to move from flying one aircraft to supervising several. Headcount is the open question.",
    "intel-analyst": "Triage and summarization are the most exposed tasks. Judging what the evidence means, and owning that assessment, is not.",
    "weapons-eng": "More autonomy means more verification and validation work.",
    "combat-arms": "Decision support changes what a unit knows, not who is on the ground. Scored lowest because the work is physical, local and accountable.",
  } as Record<string, string>,
};

export interface HumanSkillCase {
  skillId: string;
  /** The strongest honest objection. */
  counter: string;
  /** Plain-language: what would have to change for the argument to fail. */
  breaks: string;
}

export const HUMAN = {
  eyebrow: "Dedicated layer",
  title: "Human skills",
  lede:
    "These are the skills we score as most resistant to automation. The reasons are logical arguments, not experiments, so each one comes with the best objection we know of and what would prove the argument wrong.",
  cases: [
    {
      skillId: "eq",
      counter:
        "In one study, licensed professionals preferred a chatbot's written answers to patient questions in 78.6% of evaluations, and rated 45.1% of its replies empathetic or very empathetic versus 4.6% for physicians. So producing caring-sounding text is not the protected part. The argument only covers being present and affected.",
      breaks:
        "If people come to accept machine care as equal to human care in settings where real stakes are involved, the argument fails. Nothing we read tests that.",
    },
    {
      skillId: "presence",
      counter:
        "Robots, telepresence and remote sensing can substitute for being there in some tasks, and hardware improves. Our argument is about unstructured, specific places, which is a claim about today's robotics that could age quickly.",
      breaks: "General-purpose robots that handle unfamiliar rooms at human cost would weaken it.",
    },
    {
      skillId: "judgment",
      counter:
        "Models already make or recommend decisions in many fields. In the radiology experiment we read, AI predictions did not help radiologists on average while contextual information did, which supports human judgment in that setting only. It is not a general proof.",
      breaks: "If systems become reliably better than people at weighing context, only the accountability part remains.",
    },
    {
      skillId: "accountability",
      counter:
        "Responsibility is a legal and institutional rule, not a law of nature. Rules can move liability to companies or insurers, and a person can sign off on work they did not really check. Defense policy as we read it asks for human judgment but is flexible.",
      breaks: "A change in law or practice that lets organizations answer for an AI system directly.",
    },
    {
      skillId: "connection",
      counter:
        "Many people already form attachments to software, and the premium on human attention is an economic prediction. Deming's evidence shows social skills were rewarded up to 2012, before generative AI, so it supports demand, not immunity.",
      breaks: "If synthetic interaction proves a satisfying substitute for most people, the premium shrinks.",
    },
  ] as HumanSkillCase[],
  closing:
    "Read this layer as: these are the parts of work where the case for people is strongest and most testable, not guarantees. A skill being hard to automate does not guarantee a job that uses it pays well or exists.",
};
