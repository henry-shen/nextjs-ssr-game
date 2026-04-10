import { cookies } from "next/headers";

export const SESSION_COOKIE = "game_player_id";

export async function getSessionPlayerId(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(SESSION_COOKIE)?.value ?? null;
}
