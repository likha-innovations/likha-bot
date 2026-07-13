// ---------------------------------------------------------------------------
// Field kinds
// ---------------------------------------------------------------------------
// short/paragraph -> a plain text input (1 modal "slot")
// date             -> Month select + Year select + Day text input (3 slots)
// time              -> Hour(+AM/PM) select + Minute select (2 slots)
//
// Discord modals cap out at 5 top-level components per modal, so a "date"
// field already eats more than half a modal's budget. Group fields into
// steps (see Template.steps) with each step's slot cost <= 5.
// ---------------------------------------------------------------------------

export type FieldSpec =
  | { kind: "short"; id: string; label: string; placeholder?: string; required?: boolean }
  | { kind: "paragraph"; id: string; label: string; placeholder?: string; required?: boolean }
  | { kind: "date"; id: string; label: string; required?: boolean }
  | { kind: "time"; id: string; label: string; required?: boolean };

/** How many modal component slots a field consumes. Must sum to <=5 per step. */
export function slotCost(field: FieldSpec): number {
  switch (field.kind) {
    case "date":
      return 3;
    case "time":
      return 2;
    default:
      return 1;
  }
}

export interface Template {
  /** Becomes the slash command name, e.g. "gen-ann" -> /gen-ann */
  commandName: string;
  description: string;
  /** Embed title when the final message is posted */
  embedTitle: string;
  color: number;
  /** Each inner array is one modal "page". Chained in order, with a step counter shown in the title. */
  steps: FieldSpec[][];
  /** Turns the collected values (already combined for date/time) into the embed description */
  format: (v: Record<string, string>) => string;
}

// ---------------------------------------------------------------------------
// Add new templates here. Each becomes its own slash command (deploy-commands.ts)
// and is handled automatically (index.ts) — no per-template code needed there.
// ---------------------------------------------------------------------------
export const templates: Template[] = [
  {
    commandName: "gen-ann",
    description: "Post an official announcement (5Ws format)",
    embedTitle: ":loudspeaker: OFFICIAL ANNOUNCEMENT",
    color: 0x5865f2,
    steps: [
      [
        { kind: "short", id: "title", label: "Title", placeholder: "Brief, descriptive title", required: true },
        { kind: "paragraph", id: "what", label: "WHAT (summary)", required: true },
        { kind: "paragraph", id: "who", label: "WHO (who this impacts)", required: true },
      ],
      [
        { kind: "date", id: "whenDate", label: "WHEN — Date", required: true },
        { kind: "time", id: "whenTime", label: "WHEN — Time", required: true },
      ],
      [
        { kind: "short", id: "where", label: "WHERE (location/platform)", required: true },
        { kind: "paragraph", id: "why", label: "WHY (reason/rationale)", required: true },
      ],
    ],
    format: (v) =>
      `### :loudspeaker: OFFICIAL ANNOUNCEMENT: ${v.title}\n` +
      `**:mag: OVERVIEW (The 5Ws):**\n` +
      `:question: **WHAT:**\n  * ${v.what}\n` +
      `:bust_in_silhouette: **WHO:**\n  * ${v.who}\n` +
      `:date: **WHEN:**\n  * ${v.whenDate} at ${v.whenTime}\n` +
      `:round_pushpin: **WHERE:**\n  * ${v.where}\n` +
      `:bulb: **WHY:**\n  * ${v.why}`,
  },

  {
    commandName: "gen-task",
    description: "Post a task assignment",
    embedTitle: ":tools: TASK ASSIGNMENT",
    color: 0xeb459e,
    steps: [
      [
        { kind: "short", id: "sprintName", label: "Sprint # / Feature Name", required: true },
        { kind: "paragraph", id: "description", label: "Description", required: true },
        { kind: "paragraph", id: "assignedTo", label: "Assigned To (@Name (Role), one per line)", required: true },
      ],
      [
        { kind: "date", id: "deadlineDate", label: "Deadline — Date", required: true },
        { kind: "time", id: "deadlineTime", label: "Deadline — Time", required: true },
      ],
    ],
    format: (v) =>
      `### :tools: TASK ASSIGNMENT: ${v.sprintName}\n` +
      `**:pencil: Description:**\n* ${v.description}\n` +
      `**:busts_in_silhouette: Assigned To:**\n${v.assignedTo
        .split("\n")
        .filter(Boolean)
        .map((line) => `* ${line}`)
        .join("\n")}\n` +
      `**:date: Deadline:**\n* ${v.deadlineDate} at ${v.deadlineTime}`,
  },

  {
    commandName: "meet-ann",
    description: "Post a meeting notice",
    embedTitle: ":rotating_light: MEETING NOTICE",
    color: 0xed4245,
    steps: [
      [
        { kind: "short", id: "urgency", label: "Urgent or Reminder?", placeholder: "Urgent / Reminder", required: true },
        { kind: "short", id: "topic", label: "Brief Topic Title", required: true },
        { kind: "date", id: "date", label: "Date", required: true },
      ],
      [
        { kind: "time", id: "startTime", label: "Start Time", required: true },
        { kind: "time", id: "endTime", label: "End Time", required: true },
      ],
      [
        { kind: "paragraph", id: "agenda", label: "Meeting Agenda (one item per line)", required: true },
        { kind: "paragraph", id: "reminders", label: "Reminders (one item per line)", required: false },
      ],
    ],
    format: (v) => {
      const bullets = (text: string) =>
        text
          .split("\n")
          .filter(Boolean)
          .map((line) => `* ${line}`)
          .join("\n") || "* None";
      return (
        `### :rotating_light: MEETING NOTICE: ${v.urgency} - ${v.topic}\n` +
        `**:date: Schedule & Location:**\n* **Date:** ${v.date}\n` +
        `**:timer: Time Allocation**\n* ${v.startTime} - ${v.endTime}\n` +
        `**:pencil: Meeting Agenda:**\n${bullets(v.agenda)}\n` +
        `**:warning: Reminders:**\n${bullets(v.reminders)}`
      );
    },
  },

  {
    commandName: "scrum-plan",
    description: "Post a new sprint plan",
    embedTitle: ":clipboard: NEW SPRINT PLAN",
    color: 0x57f287,
    steps: [
      [
        { kind: "short", id: "sprintNumber", label: "Sprint Number", placeholder: "e.g. Sprint 1", required: true },
        { kind: "paragraph", id: "sprintGoal", label: "Sprint Goal", required: true },
      ],
      [{ kind: "date", id: "startDate", label: "Start Date", required: true }],
      [{ kind: "date", id: "endDate", label: "End Date", required: true }],
    ],
    format: (v) =>
      `### :clipboard: NEW SPRINT PLAN\n` +
      `**Sprint Number:** ${v.sprintNumber}\n` +
      `**Duration:** ${v.startDate} - ${v.endDate}\n` +
      `**Sprint Goal:**\n* ${v.sprintGoal}`,
  },

  {
    commandName: "scrum-ytb",
    description: "Post your Yesterday/Today/Blockers scrum update",
    embedTitle: ":white_check_mark: SCRUM YTB",
    color: 0x5865f2,
    steps: [
      [
        { kind: "short", id: "name", label: "Name", placeholder: "@Name", required: true },
        { kind: "date", id: "date", label: "Date", required: true },
      ],
      [
        { kind: "paragraph", id: "yesterday", label: "Y — Yesterday (one item per line)", required: true },
        { kind: "paragraph", id: "today", label: "T — Today (one item per line)", required: true },
        { kind: "paragraph", id: "blockers", label: "B — Blockers", placeholder: "None / waiting on @Name for X", required: false },
      ],
    ],
    format: (v) => {
      const bullets = (text: string) =>
        text
          .split("\n")
          .filter(Boolean)
          .map((line) => `* ${line}`)
          .join("\n");
      return (
        `### :white_check_mark: SCRUM YTB\n` +
        `**Name:** ${v.name}\n` +
        `**Date:** ${v.date}\n` +
        `:rewind: **Y (Yesterday):**\n${bullets(v.yesterday)}\n` +
        `:fast_forward: **T (Today):**\n${bullets(v.today)}\n` +
        `:octagonal_sign: **B (Blockers):**\n* ${v.blockers || "None"}`
      );
    },
  },

  {
    commandName: "scrum-mom",
    description: "Post scrum meeting minutes",
    embedTitle: ":clipboard: MINUTES OF THE MEETING",
    color: 0xfee75c,
    steps: [
      [
        { kind: "date", id: "date", label: "Date", required: true },
        { kind: "time", id: "time", label: "Time", required: true },
      ],
      [
        { kind: "paragraph", id: "attendees", label: "Attendees (@Name, comma separated)", required: true },
        { kind: "short", id: "objective", label: "Meeting Objective", required: true },
        { kind: "paragraph", id: "keyPoints", label: "Key Discussion Points (one per line)", required: true },
        { kind: "short", id: "recordingLink", label: "Recording/Deck Link (optional)", required: false },
      ],
    ],
    format: (v) => {
      const points = v.keyPoints
        .split("\n")
        .filter(Boolean)
        .map((line, i) => `${i + 1}. ${line}`)
        .join("\n");
      return (
        `### :clipboard: MINUTES OF THE MEETING\n` +
        `**:date: Date & Time:** ${v.date} | ${v.time}\n` +
        `**:busts_in_silhouette: Attendees:** ${v.attendees}\n` +
        `**:dart: Meeting Objective:** ${v.objective}\n` +
        `---\n### :mag: KEY DISCUSSION POINTS\n${points}\n---\n` +
        `> :file_folder: *Meeting recording/deck link (if applicable): ${v.recordingLink || "N/A"}*`
      );
    },
  },

  {
    commandName: "scrum-retro",
    description: "Post a sprint retrospective",
    embedTitle: ":rocket: SPRINT RETROSPECTIVE",
    color: 0x57f287,
    steps: [
      [
        { kind: "short", id: "sprintNumber", label: "Sprint #", required: true },
        { kind: "paragraph", id: "wentWell", label: "What went well?", required: true },
        { kind: "paragraph", id: "didntGoWell", label: "What didn't go well?", required: true },
        { kind: "paragraph", id: "improve", label: "What can we improve?", required: true },
      ],
    ],
    format: (v) =>
      `### :rocket: SPRINT RETROSPECTIVE: ${v.sprintNumber}\n` +
      `:green_circle: **WHAT WENT WELL?**\n* ${v.wentWell}\n` +
      `:red_circle: **WHAT DIDN'T GO WELL?**\n* ${v.didntGoWell}\n` +
      `:seedling: **WHAT CAN WE IMPROVE?**\n* ${v.improve}`,
  },
];

// ---------------------------------------------------------------------------
// Date/time option data, shared by every date/time field
// ---------------------------------------------------------------------------
export const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function yearOptions(): string[] {
  const current = new Date().getFullYear();
  return [current - 1, current, current + 1, current + 2].map(String);
}

export const HOUR_PERIOD_OPTIONS: string[] = (() => {
  const hours = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  return [...hours.map((h) => `${h} AM`), ...hours.map((h) => `${h} PM`)];
})();

export const MINUTE_OPTIONS = ["00", "15", "30", "45"];
