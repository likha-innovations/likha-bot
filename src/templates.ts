import { bulletList, formatNow } from "./utils.js";

// ---------------------------------------------------------------------------
// Field kinds
// ---------------------------------------------------------------------------
// short     -> single-line text input
// paragraph -> multi-line text input (use with bulletList() in `format` for
//              fields where the user should be able to enter several entries)
//
// Discord modals cap out at 5 top-level components, so every template's
// `fields` array must have length <= 5.
// ---------------------------------------------------------------------------

export type FieldSpec =
  | { kind: "short"; id: string; label: string; placeholder?: string; required?: boolean }
  | { kind: "paragraph"; id: string; label: string; placeholder?: string; required?: boolean };

export interface Template {
  /** Becomes the slash command name, e.g. "gen-ann" -> /gen-ann */
  commandName: string;
  description: string;
  /** Modal window title (Discord caps this at 45 chars). */
  modalTitle: string;
  /** The single modal's fields — max 5. */
  fields: FieldSpec[];
  /** Turns the collected values into the plain chat message that gets posted. */
  format: (v: Record<string, string>) => string;
}

// ---------------------------------------------------------------------------
// Add new templates here. Each becomes its own slash command
// (deploy-commands.ts) and is handled automatically (index.ts) — no
// per-template code needed there. Every template is a single one-step modal
// and posts its result as a plain chat message (not an embed).
// ---------------------------------------------------------------------------
export const templates: Template[] = [
  {
    commandName: "gen-ann",
    description: "Post an official announcement (5Ws format)",
    modalTitle: "Official Announcement",
    fields: [
      { kind: "short", id: "title", label: "Announcement Title", required: true },
      {
        kind: "paragraph",
        id: "what",
        label: "WHAT? (What is the announcement about)",
        placeholder: "One point per line",
        required: true,
      },
      {
        kind: "paragraph",
        id: "who",
        label: "WHO? (Mention roles, members, or names)",
        placeholder: "One entry per line",
        required: true,
      },
      {
        kind: "short",
        id: "when",
        label: "WHEN?",
        placeholder: "Day, Month 00, Year 00:00 AM/PM - 00:00 AM/PM",
        required: true,
      },
      {
        kind: "paragraph",
        id: "where",
        label: "WHERE? (Platform or location)",
        placeholder: "One entry per line",
        required: true,
      },
    ],
    format: (v) =>
      `### :loudspeaker: OFFICIAL ANNOUNCEMENT: ${v.title}\n` +
      `**:mag: OVERVIEW (The 5Ws):**\n` +
      `:question: **WHAT:**\n${bulletList(v.what)}\n\n` +
      `:bust_in_silhouette: **WHO:**\n${bulletList(v.who)}\n\n` +
      `:date: **WHEN:**\n  * ${v.when}\n\n` +
      `:round_pushpin: **WHERE:**\n${bulletList(v.where)}`,
  },

  {
    commandName: "gen-task",
    description: "Post a task assignment",
    modalTitle: "Task Assignment",
    fields: [
      { kind: "short", id: "taskName", label: "Task Name", required: true },
      { kind: "paragraph", id: "description", label: "Description", required: true },
      {
        kind: "paragraph",
        id: "assignedTo",
        label: "Assigned To (roles, members, or names)",
        placeholder: "@Name (Role) — one per line",
        required: true,
      },
      {
        kind: "short",
        id: "deadline",
        label: "Deadline",
        placeholder: "Day, Month 00, Year 00:00 AM/PM - 00:00 AM/PM",
        required: true,
      },
    ],
    format: (v) =>
      `### :tools: TASK ASSIGNMENT: ${v.taskName}\n\n` +
      `**:pencil: Description:**\n* ${v.description}\n\n` +
      `**:busts_in_silhouette: Assigned To:**\n${bulletList(v.assignedTo)}\n\n` +
      `**:date: Deadline:**\n* ${v.deadline}`,
  },

  {
    commandName: "meet-ann",
    description: "Post a meeting notice",
    modalTitle: "Meeting Notice",
    fields: [
      { kind: "short", id: "topic", label: "Meeting Topic", required: true },
      { kind: "short", id: "date", label: "Date", placeholder: "Day, Month 00, Year", required: true },
      {
        kind: "short",
        id: "timeAllocation",
        label: "Time Allocation",
        placeholder: "00:00 AM/PM - 00:00 AM/PM",
        required: true,
      },
      {
        kind: "paragraph",
        id: "agenda",
        label: "Agendas",
        placeholder: "One agenda item per line",
        required: true,
      },
      {
        kind: "paragraph",
        id: "reminders",
        label: "Reminders",
        placeholder: "One reminder per line",
        required: false,
      },
    ],
    format: (v) =>
      `### :rotating_light: MEETING NOTICE: ${v.topic}\n\n` +
      `**:date: Schedule:**\n* **Date:** ${v.date}\n\n` +
      `**:timer: Time Allocation**\n* ${v.timeAllocation}\n\n` +
      `**:pencil: Meeting Agenda:**\n${bulletList(v.agenda)}\n\n` +
      `**:warning: Reminders:**\n${bulletList(v.reminders)}`,
  },

  {
    commandName: "scrum-plan",
    description: "Post a new sprint plan",
    modalTitle: "New Sprint Plan",
    fields: [
      { kind: "short", id: "sprintNumber", label: "Sprint Number", placeholder: "e.g. 1", required: true },
      {
        kind: "short",
        id: "duration",
        label: "Duration",
        placeholder: "Month Day - Month Day",
        required: true,
      },
      {
        kind: "paragraph",
        id: "sprintGoals",
        label: "Sprint Goals",
        placeholder: "One goal per line",
        required: true,
      },
    ],
    format: (v) =>
      `### :clipboard: NEW SPRINT PLAN\n\n` +
      `**:rocket: Sprint Number:** Sprint ${v.sprintNumber}\n\n` +
      `**:hourglass_flowing_sand: Duration:** ${v.duration}\n\n` +
      `**:dart: Sprint Goal:**\n${bulletList(v.sprintGoals)}`,
  },

  {
    commandName: "scrum-ytb",
    description: "Post your Yesterday/Today/Blockers scrum update",
    modalTitle: "Scrum YTB",
    fields: [
      { kind: "short", id: "name", label: "Name", placeholder: "@Name", required: true },
      {
        kind: "paragraph",
        id: "yesterday",
        label: "Yesterday",
        placeholder: "One item per line",
        required: true,
      },
      { kind: "paragraph", id: "today", label: "Today", placeholder: "One item per line", required: true },
      {
        kind: "paragraph",
        id: "blockers",
        label: "Blocker(s)",
        placeholder: "None / Waiting on @Name for X",
        required: false,
      },
    ],
    format: (v) =>
      `### :white_check_mark: SCRUM YTB\n\n` +
      `**Name:** ${v.name}\n` +
      `**Date:** ${formatNow()}\n\n` +
      `:rewind: **Y (Yesterday):**\n${bulletList(v.yesterday)}\n\n` +
      `:fast_forward: **T (Today):**\n${bulletList(v.today)}\n\n` +
      `:octagonal_sign: **B (Blockers):**\n${bulletList(v.blockers)}`,
  },

  {
    commandName: "scrum-mom",
    description: "Post scrum meeting minutes",
    modalTitle: "Minutes of the Meeting",
    fields: [
      {
        kind: "paragraph",
        id: "attendees",
        label: "Attendees",
        placeholder: "One name per line",
        required: true,
      },
      { kind: "paragraph", id: "topics", label: "Topic(s)", placeholder: "One topic per line", required: true },
      {
        kind: "paragraph",
        id: "keyPoints",
        label: "Key Discussion Points",
        placeholder: "One point per line",
        required: true,
      },
      {
        kind: "paragraph",
        id: "actionItems",
        label: "Action Items",
        placeholder: "One item per line",
        required: true,
      },
      {
        kind: "short",
        id: "author",
        label: "Author",
        placeholder: "Surname, First Name M.I.",
        required: true,
      },
    ],
    format: (v) =>
      `### :clipboard: MINUTES OF THE MEETING\n\n` +
      `**:date: Date & Time:** ${formatNow()}\n` +
      `**:busts_in_silhouette: Attendees:**\n${bulletList(v.attendees)}\n` +
      `**:dart: Topic(s):**\n${bulletList(v.topics)}\n` +
      `---\n` +
      `### :mag: KEY DISCUSSION POINTS\n${bulletList(v.keyPoints)}\n\n` +
      `### :white_check_mark: ACTION ITEMS\n${bulletList(v.actionItems)}\n` +
      `---\n` +
      `> :pencil2: **Minutes prepared by:** ${v.author}`,
  },

  {
    commandName: "scrum-retro",
    description: "Post a sprint retrospective",
    modalTitle: "Sprint Retrospective",
    fields: [
      { kind: "short", id: "sprintNumber", label: "Sprint Number", required: true },
      { kind: "paragraph", id: "wentWell", label: "What went well?", required: true },
      { kind: "paragraph", id: "didntGoWell", label: "What didn't go well?", required: true },
      { kind: "paragraph", id: "improve", label: "What can we improve?", required: true },
    ],
    format: (v) =>
      `### :rocket: SPRINT RETROSPECTIVE: ${v.sprintNumber}\n\n` +
      `:green_circle: **WHAT WENT WELL?**\n* ${v.wentWell}\n\n` +
      `:red_circle: **WHAT DIDN'T GO WELL?**\n* ${v.didntGoWell}\n\n` +
      `:seedling: **WHAT CAN WE IMPROVE?**\n* ${v.improve}`,
  },
];