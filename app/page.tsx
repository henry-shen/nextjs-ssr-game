import { GameExperience } from "@/components/GameExperience";
import { toClientView } from "@/lib/client-view";
import { getSnapshot } from "@/lib/game-store";
import { getSessionPlayerId } from "@/lib/session-cookie";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const playerId = await getSessionPlayerId();
  const initialView = toClientView(getSnapshot(), playerId);
  return <GameExperience initialView={initialView} />;
}
