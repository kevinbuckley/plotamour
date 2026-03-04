// Layer 1: Data — built-in plot template definitions

export interface TemplateBeat {
  title: string;
  description: string;
}

export interface TemplateDefinition {
  id: string;
  name: string;
  author: string;
  description: string;
  chapters: TemplateBeat[];
  plotlines: { title: string; color: string }[];
}

export const BUILT_IN_TEMPLATES: TemplateDefinition[] = [
  {
    id: "three-act",
    name: "Three-Act Structure",
    author: "Classic",
    description:
      "The foundational framework dividing a story into Setup, Confrontation, and Resolution. Works for virtually any genre.",
    plotlines: [{ title: "Main Plot", color: "#6366f1" }],
    chapters: [
      { title: "Act I — Hook", description: "Open with a compelling scene that hooks readers and establishes the world." },
      { title: "Act I — Setup", description: "Establish normal life, introduce key characters, and plant story seeds." },
      { title: "Act I — Inciting Incident", description: "Something disrupts the protagonist's world and creates a need for change." },
      { title: "Act II — Rising Action", description: "The protagonist takes action but faces escalating obstacles." },
      { title: "Act II — Midpoint", description: "A major revelation or event that raises the stakes and shifts the direction." },
      { title: "Act II — Complications", description: "Things get harder. Allies may be lost, enemies grow stronger." },
      { title: "Act II — Crisis", description: "The darkest moment. All seems lost for the protagonist." },
      { title: "Act III — Climax", description: "The final confrontation. The protagonist faces their greatest challenge." },
      { title: "Act III — Resolution", description: "Tie up loose ends and show how the world has changed." },
    ],
  },
  {
    id: "heros-journey",
    name: "Hero's Journey",
    author: "Joseph Campbell",
    description:
      "The mythological framework of a hero who ventures from the ordinary world into adventure and returns transformed.",
    plotlines: [{ title: "Hero's Arc", color: "#3b82f6" }],
    chapters: [
      { title: "Ordinary World", description: "Show the hero in their everyday life before the adventure begins." },
      { title: "Call to Adventure", description: "The hero receives a challenge, quest, or problem that disrupts their comfort." },
      { title: "Refusal of the Call", description: "The hero hesitates or refuses the call due to fear or obligation." },
      { title: "Meeting the Mentor", description: "The hero meets a guide who provides wisdom, training, or a gift." },
      { title: "Crossing the Threshold", description: "The hero commits to the adventure and enters the unfamiliar world." },
      { title: "Tests, Allies, Enemies", description: "The hero faces challenges, makes friends, and identifies foes." },
      { title: "Approach to the Inmost Cave", description: "The hero nears the central ordeal, preparing for the big challenge." },
      { title: "The Ordeal", description: "The hero faces their greatest fear or most dangerous encounter." },
      { title: "Reward", description: "Having survived, the hero claims their reward or achieves their goal." },
      { title: "The Road Back", description: "The hero begins the journey home, but danger may pursue them." },
      { title: "Resurrection", description: "A final test where the hero must use everything they've learned." },
      { title: "Return with the Elixir", description: "The hero returns to the ordinary world, transformed and bearing wisdom." },
    ],
  },
  {
    id: "save-the-cat",
    name: "Save the Cat!",
    author: "Blake Snyder",
    description:
      "A beat sheet with 15 specific story beats and their ideal placement. Popular in screenwriting and novel plotting.",
    plotlines: [{ title: "Main Plot", color: "#ef4444" }],
    chapters: [
      { title: "Opening Image", description: "A visual that represents the protagonist's world before the journey." },
      { title: "Theme Stated", description: "Someone poses a question or makes a statement hinting at the story's theme." },
      { title: "Setup", description: "Introduce the main characters, their world, and what's missing in their lives." },
      { title: "Catalyst", description: "A life-changing event that sets the story in motion." },
      { title: "Debate", description: "The protagonist wrestles with whether to accept the challenge." },
      { title: "Break into Two", description: "The protagonist makes a choice and enters a new world or situation." },
      { title: "B Story", description: "A secondary story (often a love interest) that carries the theme." },
      { title: "Fun and Games", description: "The promise of the premise. The most entertaining part of the story." },
      { title: "Midpoint", description: "Stakes are raised. A false victory or false defeat changes everything." },
      { title: "Bad Guys Close In", description: "External pressures mount and internal doubts grow." },
      { title: "All Is Lost", description: "The lowest point. Something or someone important is lost." },
      { title: "Dark Night of the Soul", description: "The protagonist processes their loss and finds inner strength." },
      { title: "Break into Three", description: "Inspired by the B Story, the protagonist finds a solution." },
      { title: "Finale", description: "The protagonist confronts the antagonist using lessons learned." },
      { title: "Final Image", description: "A mirror of the opening image showing how the world has changed." },
    ],
  },
  {
    id: "story-circle",
    name: "Story Circle",
    author: "Dan Harmon",
    description:
      "A simplified hero's journey in 8 steps that works especially well for episodic storytelling and character-driven narratives.",
    plotlines: [{ title: "Main Arc", color: "#22c55e" }],
    chapters: [
      { title: "You (Comfort Zone)", description: "Establish the character in their familiar world and comfort zone." },
      { title: "Need", description: "The character wants or needs something that disrupts their status quo." },
      { title: "Go (Unfamiliar Situation)", description: "The character enters an unfamiliar situation to pursue their goal." },
      { title: "Search (Adapt)", description: "The character struggles to adapt and searches for what they need." },
      { title: "Find (Get What They Wanted)", description: "The character finds what they were looking for." },
      { title: "Take (Pay the Price)", description: "Getting what they wanted comes at a heavy cost." },
      { title: "Return (Changed)", description: "The character returns to their familiar world, but they are different now." },
      { title: "Change (New Status Quo)", description: "The character has changed. A new normal is established." },
    ],
  },
  {
    id: "romancing-the-beat",
    name: "Romancing the Beat",
    author: "Gwen Hayes",
    description:
      "A beat sheet designed specifically for romance novels. Tracks both the external plot and the romantic relationship arc.",
    plotlines: [
      { title: "Romance Arc", color: "#ec4899" },
      { title: "External Plot", color: "#8b5cf6" },
    ],
    chapters: [
      { title: "Setup / Hook", description: "Introduce the protagonist in their ordinary world. Show what's missing romantically." },
      { title: "Meet Cute / Inciting Incident", description: "The love interests meet for the first time in a memorable way." },
      { title: "No Way / Refusal", description: "One or both characters resist the attraction for personal reasons." },
      { title: "Adhesion / Growing Closer", description: "Despite resistance, circumstances keep pushing them together." },
      { title: "Midpoint / Commitment", description: "The characters acknowledge their feelings or make a commitment to each other." },
      { title: "Deepening / Intimacy", description: "The relationship deepens. Vulnerabilities are shared." },
      { title: "Black Moment / Crisis", description: "A major conflict threatens to destroy the relationship permanently." },
      { title: "Grand Gesture / Resolution", description: "One or both characters fight for the relationship, leading to the happily-ever-after." },
    ],
  },
  {
    id: "seven-point",
    name: "7-Point Plot Structure",
    author: "Dan Wells",
    description:
      "A lean framework built around seven key story points. Great for plotters who want structure without over-planning.",
    plotlines: [{ title: "Main Plot", color: "#f97316" }],
    chapters: [
      { title: "Hook", description: "The starting state. Show the protagonist's world before change — the opposite of the Resolution." },
      { title: "Plot Turn 1", description: "An event that introduces conflict and moves the character from reaction to action." },
      { title: "Pinch Point 1", description: "Apply pressure. Show the antagonist's power or the stakes of failure." },
      { title: "Midpoint", description: "The character moves from reaction to action. They commit to solving the problem." },
      { title: "Pinch Point 2", description: "More pressure. The situation looks hopeless. Jaws of defeat." },
      { title: "Plot Turn 2", description: "The final piece of the puzzle. The character gets what they need to win." },
      { title: "Resolution", description: "The climax and resolution. The opposite state from the Hook." },
    ],
  },
  {
    id: "freytags-pyramid",
    name: "Freytag's Pyramid",
    author: "Gustav Freytag",
    description:
      "The classic five-act dramatic structure. Ideal for understanding rising and falling tension in storytelling.",
    plotlines: [{ title: "Main Plot", color: "#14b8a6" }],
    chapters: [
      { title: "Exposition", description: "Introduce the setting, characters, and initial situation." },
      { title: "Rising Action", description: "A series of events that build tension and develop conflict." },
      { title: "Climax", description: "The turning point. The moment of greatest tension or conflict." },
      { title: "Falling Action", description: "Events that unfold after the climax, leading toward resolution." },
      { title: "Denouement", description: "The final outcome. Conflicts are resolved and the story concludes." },
    ],
  },
  {
    id: "mystery-12",
    name: "12-Chapter Mystery",
    author: "Classic Mystery",
    description:
      "A genre-specific structure for mystery and detective fiction. Paces clue reveals and red herrings for maximum suspense.",
    plotlines: [
      { title: "Investigation", color: "#06b6d4" },
      { title: "Red Herrings", color: "#f43f5e" },
    ],
    chapters: [
      { title: "The Hook", description: "Open with something intriguing — a crime, a mystery, or something not right." },
      { title: "The Crime / Discovery", description: "The full scope of the crime or mystery is revealed. Stakes are established." },
      { title: "Investigation Begins", description: "The sleuth begins gathering clues and interviewing suspects." },
      { title: "First Clue & Red Herring", description: "An important clue is found, but a misleading lead complicates things." },
      { title: "Complications", description: "The investigation hits obstacles. New suspects emerge." },
      { title: "Midpoint Revelation", description: "A major discovery changes the direction of the investigation." },
      { title: "Raising Stakes", description: "Another crime, a threat, or a personal stake raises the urgency." },
      { title: "False Solution", description: "The sleuth thinks they've solved it — but they're wrong." },
      { title: "Setback", description: "The real culprit fights back or the case seems unsolvable." },
      { title: "Key Insight", description: "The sleuth has their 'aha' moment connecting all the clues." },
      { title: "Confrontation", description: "The sleuth confronts the real culprit with evidence." },
      { title: "Resolution", description: "Justice is served. Loose ends are tied up." },
    ],
  },
  {
    id: "snowflake",
    name: "Snowflake Method",
    author: "Randy Ingermanson",
    description:
      "A progressive-detail approach: start with a sentence, expand to a paragraph, then to chapters. Great for organic plot development.",
    plotlines: [{ title: "Main Plot", color: "#a855f7" }],
    chapters: [
      { title: "Setup / Normal World", description: "Introduce the protagonist and their initial situation in one compelling paragraph." },
      { title: "First Disaster", description: "Something goes wrong that the protagonist must respond to. End of Act I." },
      { title: "Response & Struggle", description: "The protagonist reacts but makes things worse through inexperience." },
      { title: "Second Disaster (Midpoint)", description: "A new disaster forces the protagonist to change their approach." },
      { title: "New Strategy", description: "The protagonist takes a new, proactive approach with what they've learned." },
      { title: "Third Disaster (Crisis)", description: "The worst disaster yet. All seems lost." },
      { title: "Climax & Resolution", description: "The protagonist uses everything they've learned to overcome the final obstacle." },
    ],
  },
  {
    id: "childrens-book",
    name: "Children's Book Formula",
    author: "Classic",
    description:
      "A simple, repeating pattern ideal for picture books and early chapter books. Features the 'rule of three' tries.",
    plotlines: [{ title: "Story", color: "#eab308" }],
    chapters: [
      { title: "Once Upon a Time", description: "Introduce the main character and their world in a vivid, relatable way." },
      { title: "The Problem", description: "Something goes wrong, or the character wants something they can't easily get." },
      { title: "First Try (Fails)", description: "The character tries to solve the problem but it doesn't work." },
      { title: "Second Try (Fails)", description: "They try a different approach, but it also fails — often in a funny way." },
      { title: "Third Try (Succeeds!)", description: "With a new idea or help from a friend, they finally solve the problem." },
      { title: "Happily Ever After", description: "The character is changed or the world is better. A satisfying ending." },
    ],
  },
];

export function getTemplateById(id: string): TemplateDefinition | undefined {
  return BUILT_IN_TEMPLATES.find((t) => t.id === id);
}
