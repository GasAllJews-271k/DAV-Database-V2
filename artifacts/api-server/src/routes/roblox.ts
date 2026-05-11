import { Router, type IRouter } from "express";

const router: IRouter = Router();

const PLACE_ID = "10899299831";
let cachedUniverseId: string | null = null;
let cachedStats: Record<string, unknown> | null = null;
let cacheExpiry = 0;

async function getUniverseId(): Promise<string> {
  if (cachedUniverseId) return cachedUniverseId;
  const res = await fetch(
    `https://apis.roblox.com/universes/v1/places/${PLACE_ID}/universe`,
  );
  if (!res.ok) throw new Error("Failed to get universe ID");
  const data = (await res.json()) as { universeId: number };
  cachedUniverseId = String(data.universeId);
  return cachedUniverseId;
}

router.get("/roblox/stats", async (req, res) => {
  if (cachedStats && Date.now() < cacheExpiry) {
    res.json(cachedStats);
    return;
  }
  try {
    const universeId = await getUniverseId();
    const r = await fetch(
      `https://games.roblox.com/v1/games?universeIds=${universeId}`,
    );
    if (!r.ok) throw new Error("Roblox API error");
    const data = (await r.json()) as {
      data: Array<{
        playing: number;
        visits: number;
        maxPlayers: number;
        name: string;
      }>;
    };
    const game = data.data[0];
    if (!game) throw new Error("No game data");
    cachedStats = {
      playing: game.playing,
      visits: game.visits,
      maxPlayers: game.maxPlayers,
      name: game.name,
    };
    cacheExpiry = Date.now() + 60_000;
    res.json(cachedStats);
  } catch (err) {
    req.log.error({ err }, "Roblox stats fetch failed");
    res.status(502).json({ error: "ROBLOX_UNAVAILABLE" });
  }
});

export default router;
