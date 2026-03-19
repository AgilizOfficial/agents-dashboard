import { NextRequest, NextResponse } from "next/server";
import WebSocket from "ws";
import { randomUUID } from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const OPENCLAW_URL = process.env.OPENCLAW_URL ?? "ws://localhost:18789";
const OPENCLAW_TOKEN = process.env.OPENCLAW_TOKEN ?? "";

function rpc(method: string, params: unknown): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const connectId = `c-${randomUUID()}`;
    const callId = `r-${randomUUID()}`;
    let settled = false;

    const ws = new WebSocket(OPENCLAW_URL);

    const timeout = setTimeout(() => {
      if (!settled) {
        settled = true;
        ws.terminate();
        reject(new Error(`Timeout calling ${method}`));
      }
    }, 15_000);

    ws.on("message", (data) => {
      if (settled) return;
      try {
        const msg = JSON.parse(data.toString());

        if (msg.type === "event" && msg.event === "connect.challenge") {
          ws.send(
            JSON.stringify({
              type: "req",
              id: connectId,
              method: "connect",
              params: {
                minProtocol: 3,
                maxProtocol: 3,
                client: {
                  id: "gateway-client",
                  version: "1.0.0",
                  platform: "darwin",
                  mode: "backend",
                },
                role: "operator",
                scopes: ["operator.admin"],
                auth: { token: OPENCLAW_TOKEN },
              },
            })
          );
          return;
        }

        if (msg.id === connectId) {
          if (msg.ok === true) {
            ws.send(
              JSON.stringify({ type: "req", id: callId, method, params })
            );
          } else {
            settled = true;
            clearTimeout(timeout);
            ws.close();
            reject(new Error(msg.error?.message ?? "Connect failed"));
          }
          return;
        }

        if (msg.id === callId) {
          settled = true;
          clearTimeout(timeout);
          ws.close();
          if (msg.ok === false)
            reject(new Error(msg.error?.message ?? JSON.stringify(msg.error)));
          else resolve(msg.payload);
        }
      } catch {
        // ignore
      }
    });

    ws.on("error", (err) => {
      if (!settled) {
        settled = true;
        clearTimeout(timeout);
        reject(err);
      }
    });
  });
}

export async function POST(req: NextRequest) {
  try {
    const { method, params } = await req.json();
    if (!method)
      return NextResponse.json({ error: "Missing method" }, { status: 400 });

    const result = await rpc(method, params ?? {});
    return NextResponse.json({ result });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
