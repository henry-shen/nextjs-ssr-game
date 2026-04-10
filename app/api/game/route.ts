import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { toClientView } from "@/lib/client-view";
import * as store from "@/lib/game-store";
import { SESSION_COOKIE } from "@/lib/session-cookie";

const COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 7; // 7 days

function json(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export async function GET() {
  const jar = await cookies();
  const playerId = jar.get(SESSION_COOKIE)?.value ?? null;
  const view = toClientView(store.getSnapshot(), playerId);
  return json(view);
}

type Body =
  | { action: "join"; name: string; asHost: boolean }
  | { action: "becomeHost" }
  | { action: "start" }
  | { action: "end" }
  | { action: "createRoutes"; originId: string; destinationIds: string[] };

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const jar = await cookies();
  const cookieId = jar.get(SESSION_COOKIE)?.value ?? null;

  if (body.action === "join") {
    const playerId = cookieId ?? crypto.randomUUID();
    const result = store.joinLobby(playerId, body.name, !!body.asHost);
    if (!result.ok) {
      return json({ ok: false, error: result.error }, { status: 400 });
    }
    const response = json({ ok: true, view: toClientView(store.getSnapshot(), playerId) });
    response.cookies.set(SESSION_COOKIE, playerId, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: COOKIE_MAX_AGE_SEC,
      secure: process.env.NODE_ENV === "production",
    });
    return response;
  }

  if (!cookieId) {
    return json({ ok: false, error: "Join the lobby first." }, { status: 401 });
  }

  const playerId = cookieId;

  if (body.action === "becomeHost") {
    const result = store.becomeHost(playerId);
    if (!result.ok) {
      return json({ ok: false, error: result.error }, { status: 400 });
    }
    return json({ ok: true, view: toClientView(store.getSnapshot(), playerId) });
  }

  if (body.action === "start") {
    const result = store.startGame(playerId);
    if (!result.ok) {
      return json({ ok: false, error: result.error }, { status: 400 });
    }
    return json({ ok: true, view: toClientView(store.getSnapshot(), playerId) });
  }

  if (body.action === "end") {
    const result = store.endGame(playerId);
    if (!result.ok) {
      return json({ ok: false, error: result.error }, { status: 400 });
    }
    return json({ ok: true, view: toClientView(store.getSnapshot(), playerId) });
  }

  if (body.action === "createRoutes") {
    const result = store.createRoutesFromHub(playerId, body.originId, body.destinationIds ?? []);
    if (!result.ok) {
      return json({ ok: false, error: result.error }, { status: 400 });
    }
    return json({
      ok: true,
      added: result.added,
      view: toClientView(store.getSnapshot(), playerId),
    });
  }

  return json({ ok: false, error: "Unknown action." }, { status: 400 });
}
