import "dotenv/config";
import {
  Client,
  GatewayIntentBits,
  Events,
  ModalBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
} from "discord.js";
import { templates } from "./templates.js";
import { renderField, readField } from "./fields.js";

const { DISCORD_TOKEN } = process.env;
if (!DISCORD_TOKEN) throw new Error("Missing DISCORD_TOKEN in .env");

// Only Guilds intent is needed — we never read message content, only
// respond to slash commands and modal submits.
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const MODAL_PREFIX = "template";
const SESSION_TTL_MS = 10 * 60 * 1000; // abandon a half-filled flow after 10 min

// In-memory per-user progress through a multi-step template.
// Key: `${userId}:${commandName}` -> collected field values so far.
const sessions = new Map<string, { values: Record<string, string>; timeout: NodeJS.Timeout }>();

function sessionKey(userId: string, commandName: string) {
  return `${userId}:${commandName}`;
}

client.once(Events.ClientReady, (c) => {
  console.log(`Logged in as ${c.user.tag}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  // Step 1: slash command typed -> show the first modal (step 0)
  if (interaction.isChatInputCommand()) {
    const template = templates.find((t) => t.commandName === interaction.commandName);
    if (!template) return;

    const key = sessionKey(interaction.user.id, template.commandName);
    const existing = sessions.get(key);
    if (existing) clearTimeout(existing.timeout);
    sessions.set(key, {
      values: {},
      timeout: setTimeout(() => sessions.delete(key), SESSION_TTL_MS),
    });

    await interaction.showModal(buildModalForStep(template.commandName, 0));
    return;
  }

  // Step 2: a step's modal was submitted -> save values, then either show
  // the next step's modal or (on the last step) format + post the result.
  if (interaction.isModalSubmit()) {
    const parsed = parseCustomId(interaction.customId);
    if (!parsed) return;

    const template = templates.find((t) => t.commandName === parsed.commandName);
    if (!template) return;

    const key = sessionKey(interaction.user.id, template.commandName);
    const session = sessions.get(key);
    if (!session) {
      await interaction.reply({
        content: "This form expired (10 min limit) — run the command again to start over.",
        ephemeral: true,
      });
      return;
    }

    const step = template.steps[parsed.stepIndex];
    for (const field of step) {
      session.values[field.id] = readField(interaction, field);
    }

    const nextStepIndex = parsed.stepIndex + 1;
    if (nextStepIndex < template.steps.length) {
      // Discord doesn't allow responding to a modal submit with another modal directly —
      // it needs a component interaction (button/select) in between. So we reply with a
      // small ephemeral "Continue" button that opens the next step's modal.
      const continueButton = new ButtonBuilder()
        .setCustomId(`${MODAL_PREFIX}-next:${template.commandName}:${nextStepIndex}`)
        .setLabel(`Continue — Step ${nextStepIndex + 1}/${template.steps.length}`)
        .setStyle(ButtonStyle.Primary);

      await interaction.reply({
        content: `Step ${parsed.stepIndex + 1}/${template.steps.length} saved.`,
        components: [new ActionRowBuilder<ButtonBuilder>().addComponents(continueButton)],
        ephemeral: true,
      });
      return;
    }

    // Final step — build and post the embed.
    clearTimeout(session.timeout);
    sessions.delete(key);

    const embed = new EmbedBuilder()
      .setTitle(template.embedTitle)
      .setDescription(template.format(session.values).slice(0, 4096))
      .setColor(template.color)
      .setFooter({
        text: interaction.member && "displayName" in interaction.member
          ? String((interaction.member as any).displayName)
          : interaction.user.username,
        iconURL: interaction.user.displayAvatarURL(),
      })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
    return;
  }

  // Step 3: "Continue" button clicked -> show the next step's modal
  if (interaction.isButton()) {
    const [prefix, commandName, stepIndexStr] = interaction.customId.split(":");
    if (prefix !== `${MODAL_PREFIX}-next`) return;

    const stepIndex = Number(stepIndexStr);
    if (Number.isNaN(stepIndex)) return;

    const key = sessionKey(interaction.user.id, commandName);
    if (!sessions.has(key)) {
      await interaction.reply({ content: "This form expired — run the command again.", ephemeral: true });
      return;
    }

    await interaction.showModal(buildModalForStep(commandName, stepIndex));
  }
});

function buildModalForStep(commandName: string, stepIndex: number): ModalBuilder {
  const template = templates.find((t) => t.commandName === commandName)!;
  const totalSteps = template.steps.length;
  const step = template.steps[stepIndex];

  const modal = new ModalBuilder()
    .setCustomId(`${MODAL_PREFIX}:${commandName}:${stepIndex}`)
    .setTitle(
      totalSteps > 1
        ? `${template.embedTitle.replace(/^[^\w]+\s*/, "")} (Step ${stepIndex + 1}/${totalSteps})`.slice(0, 45)
        : template.embedTitle.replace(/^[^\w]+\s*/, "").slice(0, 45)
    );

  for (const field of step) {
    modal.addLabelComponents(...renderField(field));
  }

  return modal;
}

function parseCustomId(customId: string): { commandName: string; stepIndex: number } | null {
  const [prefix, commandName, stepIndexStr] = customId.split(":");
  if (prefix !== MODAL_PREFIX) return null;
  const stepIndex = Number(stepIndexStr);
  if (Number.isNaN(stepIndex)) return null;
  return { commandName, stepIndex };
}

client.login(DISCORD_TOKEN);
