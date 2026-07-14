import { bulletList, formatNow } from "./utils.js";

// ---------------------------------------------------------------------------
// Field kinds
// ---------------------------------------------------------------------------
// short     -> single-line text input
// paragraph -> multi-line text input (use with bulletList() in `format` for
//              fields where the user should be able to enter several entries)
// select    -> single-choice dropdown (StringSelectMenu); `options` sets the
//              choices, and the chosen `value` comes back as the field's value
//
// Discord modals cap out at 5 top-level components, so every template's
// `fields` array must have length <= 5.
// ---------------------------------------------------------------------------

export type FieldSpec =
  | {
      kind: "short";
      id: string;
      label: string;
      placeholder?: string;
      required?: boolean;
    }
  | {
      kind: "paragraph";
      id: string;
      label: string;
      placeholder?: string;
      required?: boolean;
    }
  | {
      kind: "select";
      id: string;
      label: string;
      options: { label: string; value: string }[];
      required?: boolean;
    };

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
// Shared footer appended to every template's message except scrum-ytb.
// Edit this one line to change the notice everywhere at once.
// ---------------------------------------------------------------------------
const NOTICE = `> :warning: **Notice:** Once you have seen this, kindly react to it.`;
const TASK_NOTICE = `> :warning: **Notice:** Once you are done with the task, kindly react :white_check_mark: to this.`;

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
      {
        kind: "short",
        id: "title",
        label: "Announcement Title",
        required: true,
      },
      {
        kind: "paragraph",
        id: "what",
        label: "WHAT? (What is the announcement about)",
        placeholder: "Freely type your announcement",
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
      `**WHAT:**\n${v.what}\n\n` +
      `**WHO:**\n${bulletList(v.who)}\n\n` +
      `**WHEN:**\n${v.when}\n\n` +
      `**WHERE:**\n${bulletList(v.where)}\n\n` +
      NOTICE,
  },

  {
    commandName: "gen-task",
    description: "Post a task assignment",
    modalTitle: "Task Assignment",
    fields: [
      { kind: "short", id: "taskName", label: "Task Name", required: true },
      {
        kind: "paragraph",
        id: "description",
        label: "Description",
        required: true,
      },
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
      `### :pencil: TASK ASSIGNMENT: ${v.taskName}\n` +
      `**Description:**\n* ${v.description}\n\n` +
      `**Assigned To:**\n${bulletList(v.assignedTo)}\n\n` +
      `**Deadline:**\n* ${v.deadline}\n\n` +
      TASK_NOTICE,
  },

  {
    commandName: "meet-ann",
    description: "Post a meeting notice",
    modalTitle: "Meeting Notice",
    fields: [
      {
        kind: "select",
        id: "topic",
        label: "Meeting Topic",
        required: true,
        options: [
          { label: "Daily Scrum", value: "Daily Scrum" },
          { label: "Weekly Meeting", value: "Weekly Meeting" },
          { label: "Realignment", value: "Realignment" },
          { label: "Emergency", value: "Emergency" },
          { label: "Scrum Retrospective", value: "Scrum Retrospective" },
          { label: "Scrum Planning", value: "Scrum Planning" },
        ],
      },
      {
        kind: "short",
        id: "date",
        label: "Date",
        placeholder: "Day, Month 00, Year",
        required: true,
      },
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
      `**Schedule:**\n* **Date:** ${v.date}\n\n` +
      `**Time Allocation**\n* ${v.timeAllocation}\n\n` +
      `**Meeting Agenda:**\n${bulletList(v.agenda)}\n\n` +
      `**Reminders:**\n${bulletList(v.reminders)}\n\n` +
      NOTICE,
  },

  {
    commandName: "scrum-plan",
    description: "Post a new sprint plan",
    modalTitle: "New Sprint Plan",
    fields: [
      {
        kind: "short",
        id: "sprintNumber",
        label: "Sprint Number",
        placeholder: "e.g. 1",
        required: true,
      },
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
      `**Sprint Number:** Sprint ${v.sprintNumber}\n\n` +
      `**Duration:** ${v.duration}\n\n` +
      `**Sprint Goal:**\n${bulletList(v.sprintGoals)}\n\n` +
      NOTICE,
  },

  {
    commandName: "scrum-ytb",
    description: "Post your Yesterday/Today/Blockers scrum update",
    modalTitle: "Scrum YTB",
    fields: [
      {
        kind: "short",
        id: "name",
        label: "Name",
        placeholder: "@Name",
        required: true,
      },
      {
        kind: "paragraph",
        id: "yesterday",
        label: "Yesterday",
        placeholder: "One item per line",
        required: true,
      },
      {
        kind: "paragraph",
        id: "today",
        label: "Today",
        placeholder: "One item per line",
        required: true,
      },
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
      `**Y (Yesterday):**\n${bulletList(v.yesterday)}\n\n` +
      `**T (Today):**\n${bulletList(v.today)}\n\n` +
      `**B (Blockers):**\n${bulletList(v.blockers)}`,
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
      {
        kind: "select",
        id: "meetingType",
        label: "Meeting Type",
        required: true,
        options: [
          { label: "Scrum Planning", value: "Scrum Planning" },
          { label: "Daily Scrum", value: "Daily Scrum" },
          { label: "Scrum Retrospective", value: "Scrum Retrospective" },
          { label: "Weekly Meeting", value: "Weekly Meeting" },
          { label: "Realignment", value: "Realignment" },
          { label: "Emergency", value: "Emergency" },
        ],
      },
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
      `**Date & Time:** ${formatNow()}\n` +
      `**Attendees:**\n${bulletList(v.attendees)}\n` +
      `**Meeting Type:** ${v.meetingType}\n\n` +
      `---\n\n` +
      `**Key Discussion Points**\n${bulletList(v.keyPoints)}\n\n` +
      `---\n\n` +
      `**Action Items**\n${bulletList(v.actionItems)}\n\n` +
      `---\n\n` +
      `> :pencil2: **Minutes prepared by:** ${v.author}` +
      NOTICE,
  },

  {
    commandName: "scrum-retro",
    description: "Post a sprint retrospective",
    modalTitle: "Sprint Retrospective",
    fields: [
      {
        kind: "short",
        id: "sprintNumber",
        label: "Sprint Number",
        required: true,
      },
      {
        kind: "paragraph",
        id: "wentWell",
        label: "What went well?",
        required: true,
      },
      {
        kind: "paragraph",
        id: "didntGoWell",
        label: "What didn't go well?",
        required: true,
      },
      {
        kind: "paragraph",
        id: "improve",
        label: "What can we improve?",
        required: true,
      },
    ],
    format: (v) =>
      `### :rocket: SPRINT RETROSPECTIVE: ${v.sprintNumber}\n\n` +
      `**WHAT WENT WELL?**\n* ${v.wentWell}\n\n` +
      `**WHAT DIDN'T GO WELL?**\n* ${v.didntGoWell}\n\n` +
      `**WHAT CAN WE IMPROVE?**\n* ${v.improve}\n\n` +
      NOTICE,
  },
];
