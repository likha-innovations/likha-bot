# scrum-bot

Slash command → modal popup(s) → formatted embed posted to channel.

## Commands
`/gen-ann` `/gen-task` `/meet-ann` `/scrum-plan` `/scrum-ytb` `/scrum-mom` `/scrum-retro`

Add a new one by adding an object to `src/templates.ts` — nothing else needs to change.

## Local setup

```bash
npm install
cp .env.example .env   # fill in DISCORD_TOKEN, CLIENT_ID, GUILD_ID
npm run deploy-commands # registers all 7 slash commands
npm run dev              # runs the bot with auto-reload
```

Where to get the values:
- **DISCORD_TOKEN**: Developer Portal → your app → **Bot** tab → Reset/Copy Token
- **CLIENT_ID**: Developer Portal → your app → **General Information** → Application ID
- **GUILD_ID**: enable Developer Mode (User Settings → Advanced), then right-click your server icon → Copy Server ID

Invite the bot with both `bot` and `applications.commands` scopes:
`https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&scope=bot%20applications.commands&permissions=2048`

## How the multi-step forms work

Discord modals cap out at **5 fields per popup**. Several of your templates (announcement, task, meeting notice) need more inputs than that, so those commands walk you through **multiple popups in sequence**, e.g. "TASK ASSIGNMENT (Step 1/2)" → fill in → an ephemeral **Continue** button appears → click it → "Step 2/2" opens → submit → the final formatted message posts.

This isn't a workaround bolted on for style — it's a real Discord constraint: a modal submission can't directly trigger another modal, it has to go through a button click first. That's why you'll see a small "Continue" button between steps instead of the popups just chaining automatically.

## About the date/time "pickers"

Worth knowing upfront: **Discord doesn't have a native calendar or clock picker inside modals.** It's been a frequently requested feature for years and still isn't shipped. What Discord *does* support (added fairly recently) is dropdown **select menus** inside modals, so that's what's built here:

- **Date fields** → Month dropdown + Year dropdown + a small "Day (1–31)" text box (a day-of-month select would need 31 options, over Discord's 25-option cap per dropdown, so day stays a validated text field)
- **Time fields** → Hour+AM/PM dropdown (12 AM–11 PM) + Minute dropdown (00/15/30/45)

This is the closest thing to a real "picker" Discord currently offers — genuine tap-to-select dropdowns, not free typing. It relies on a component type (`Label` + `StringSelect` in modals) that only landed in discord.js fairly recently, so the project pins `discord.js@14.26.5`. If you ever see errors specifically on a date/time step after a `npm update`, check the discord.js changelog for breaking changes to modal components before assuming your own code is wrong.

## Deploying on Railway

1. Push this repo to GitHub.
2. Railway → New Project → Deploy from GitHub repo.
3. Add `DISCORD_TOKEN` and `CLIENT_ID` in Railway's Variables tab. Leave `GUILD_ID` unset in production (global commands, ~1hr to propagate).
4. Build Command: `npm run build`. Start Command: `npm run start`.
5. This is a worker, not a web server — don't attach a public networking domain to it; it doesn't listen on a port.
6. Run `npm run deploy-commands` once after any change to `templates.ts` (adding/renaming a command) — this is separate from the bot process and doesn't need to re-run on every boot.
