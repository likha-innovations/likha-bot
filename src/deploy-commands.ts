import "dotenv/config";
import { REST, Routes, SlashCommandBuilder } from "discord.js";
import { templates } from "./templates.js";

const { DISCORD_TOKEN, CLIENT_ID, GUILD_ID } = process.env;

if (!DISCORD_TOKEN || !CLIENT_ID) {
  throw new Error("Missing DISCORD_TOKEN or CLIENT_ID in .env");
}

const commands = templates.map((t) =>
  new SlashCommandBuilder()
    .setName(t.commandName)
    .setDescription(t.description)
    .toJSON(),
);

const rest = new REST().setToken(DISCORD_TOKEN);

async function main() {
  try {
    if (GUILD_ID) {
      // Guild commands update instantly — use this while developing.
      await rest.put(Routes.applicationGuildCommands(CLIENT_ID!, GUILD_ID), {
        body: commands,
      });
      console.log(
        `Registered ${commands.length} guild command(s) to guild ${GUILD_ID}.`,
      );
    } else {
      // Global commands can take up to an hour to propagate — use for production.
      await rest.put(Routes.applicationCommands(CLIENT_ID!), {
        body: commands,
      });
      console.log(`Registered ${commands.length} global command(s).`);
    }
    console.log(commands.map((c) => `/${c.name}`).join(", "));
  } catch (err) {
    console.error("Failed to register commands:", err);
    process.exit(1);
  }
}

main();
