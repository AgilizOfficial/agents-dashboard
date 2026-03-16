import { NextRequest, NextResponse } from "next/server";
import WebSocket from "ws";

const OPENCLAW_URL = process.env.OPENCLAW_URL ?? "ws://localhost:18789";
const OPENCLAW_TOKEN = process.env.OPENCLAW_TOKEN ?? "";

let msgId = 1;

function rpc(method: string, params: unknown): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const id = String(msgId++);
    const ws = new WebSocket(OPENCLAW_URL, {
      headers: { "X-OpenClaw-Token": OPENCLAW_TOKEN },
    });

    const timeout = setTimeout(() => {
      ws.terminate();
      reject(new Error(`Timeout calling ${method}`));
    }, 15_000);

    ws.on("open", () => {
      ws.send(JSON.stringify({ id, method, params }));
    });

    ws.on("message", (data) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.id === id) {
          clearTimeout(timeout);
          ws.close();
          if (msg.error) reject(new Error(msg.error.message ?? JSON.stringify(msg.error)));
          else resolve(msg.result);
        }
      } catch {
        // ignore non-matching messages
      }
    });

    ws.on("error", (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
}

export async function POST(req: NextRequest) {
  try {
    const { method, params } = await req.json();
    if (!method) return NextResponse.json({ error: "Missing method" }, { status: 400 });

    const result = await rpc(method, params ?? {});
    return NextResponse.json({ result });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
