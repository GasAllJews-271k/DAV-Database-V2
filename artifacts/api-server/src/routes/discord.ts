import { Router, type IRouter } from "express";

const router: IRouter = Router();

router.get("/discord/check-member", async (req, res) => {
  const username = ((req.query.username as string) || "").trim();

  if (!username) {
    res.status(400).json({ found: false, error: "USERNAME_REQUIRED" });
    return;
  }

  const token = process.env.DISCORD_BOT_TOKEN;
  const guildId = process.env.DISCORD_GUILD_ID;

  if (!token || !guildId) {
    req.log.error("Discord credentials not configured");
    res.status(503).json({ found: false, error: "DISCORD_NOT_CONFIGURED" });
    return;
  }

  try {
    const response = await fetch(
      `https://discord.com/api/v10/guilds/${guildId}/members/search?query=${encodeURIComponent(username)}&limit=10`,
      {
        headers: {
          Authorization: `Bot ${token}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      const err = await response.json();
      req.log.error({ status: response.status, err }, "Discord API error");
      res.status(502).json({ found: false, error: "DISCORD_API_ERROR" });
      return;
    }

    const members = (await response.json()) as Array<{
      user?: {
        username: string;
        global_name?: string | null;
        id: string;
      };
      nick?: string | null;
    }>;

    const query = username.toLowerCase().replace(/#\d{4}$/, "");

    const match = members.find((m) => {
      const uname = (m.user?.username ?? "").toLowerCase();
      const nick = (m.nick ?? "").toLowerCase();
      const global = (m.user?.global_name ?? "").toLowerCase();
      return uname === query || nick === query || global === query;
    });

    if (match) {
      res.json({
        found: true,
        username: match.user?.username,
        displayName:
          match.user?.global_name || match.nick || match.user?.username,
      });
    } else {
      res.json({ found: false });
    }
  } catch (err) {
    req.log.error({ err }, "Discord member check failed");
    res.status(500).json({ found: false, error: "INTERNAL_ERROR" });
  }
});

export default router;
