import express from "express";

/**
 * Minimal HTTP server with a single /ping route.
 *
 * This has nothing to do with Discord — it exists purely so Render's Web
 * Service has a port to bind to and a health-check endpoint. Discord bots
 * are normally long-running processes with no HTTP surface, but Render
 * (and most PaaS "Web Service" types) require the process to listen on
 * $PORT, and free-tier services spin down after ~15 minutes without
 * inbound HTTP traffic — an external cron/uptime pinger hitting /ping
 * keeps it alive.
 */
export function startServer(): void {
  const app = express();
  const port = Number(process.env.PORT) || 3000;

  app.get("/ping", (_req, res) => {
    res.status(200).send("pong");
  });

  app.listen(port, () => {
    console.log(`Ping server listening on port ${port}`);
  });
}
