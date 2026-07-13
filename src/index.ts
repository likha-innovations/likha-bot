import "dotenv/config";
import { Client, GatewayIntentBits, Events, ModalBuilder } from "discord.js";
import { templates } from "./templates.js";
import { renderField, readField } from "./fields.js";

const { DISCORD_TOKEN } = process.env;
if (!DISCORD_TOKEN) throw new Error("Missing DISCORD_TOKEN in .env");

// Only Guilds intent is needed — we never read message content, only
// respond to slash commands and modal submits.
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const MODAL_PREFIX = "template";

client.once(Events.ClientReady, (c) => {
  console.log(`Logged in as ${c.user.tag}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  try {
    // Slash command typed -> show that template's single modal.
    if (interaction.isChatInputCommand()) {
      const template = templates.find((t) => t.commandName === interaction.commandName);
      if (!template) return;

      await interaction.showModal(buildModal(template.commandName));
      return;
    }

    // Modal submitted -> read every field, format, and post as a plain chat message.
    if (interaction.isModalSubmit()) {
      const commandName = parseCustomId(interaction.customId);
      if (!commandName) return;

      const template = templates.find((t) => t.commandName === commandName);
      if (!template) return;

      const values: Record<string, string> = {};
      for (const field of template.fields) {
        values[field.id] = readField(interaction, field);
      }

      // Discord chat messages cap out at 2000 characters (embeds get 4096,
      // but we're posting plain content now).
      const content = template.format(values).slice(0, 2000);

      await interaction.reply({ content });
      return;
    }
  } catch (err) {
    // Without this, a bug in a template (e.g. a modal label over Discord's
    // 45-character limit) throws before any response is sent, and Discord
    // just shows "The application did not respond" with no clue why.
    console.error("Interaction failed:", err);
    if (interaction.isRepliable() && !interaction.replied && !interaction.deferred) {
      await interaction
        .reply({ content: "Something went wrong handling that. Check the bot logs for details.", ephemeral: true })
        .catch(() => {});
    }
  }
});

function buildModal(commandName: string): ModalBuilder {
  const template = templates.find((t) => t.commandName === commandName)!;

  const modal = new ModalBuilder()
    .setCustomId(`${MODAL_PREFIX}:${commandName}`)
    .setTitle(template.modalTitle.slice(0, 45));

  for (const field of template.fields) {
    modal.addLabelComponents(renderField(field));
  }

  return modal;
}

function parseCustomId(customId: string): string | null {
  const [prefix, commandName] = customId.split(":");
  if (prefix !== MODAL_PREFIX) return null;
  return commandName;
}

client.login(DISCORD_TOKEN);