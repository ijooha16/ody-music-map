"use client";

import { Client, type IMessage } from "@stomp/stompjs";
import { REALTIME, STORAGE_KEYS, wsOrigin } from "@/constants";
import { readStorage } from "@/lib/storage";
import type { RealtimeMessage, RealtimeMessageType } from "@/types";

type Listener = (msg: RealtimeMessage<unknown>) => void;

type ConnectListener = (connected: boolean) => void;

let client: Client | null = null;
let connected = false;

let connectedWith: string | null = null;

let lastSeq = 0;

const listeners = new Set<Listener>();
const connectListeners = new Set<ConnectListener>();

const pending = new Map<string, ReturnType<typeof setTimeout>>();

function token(): string | null {
  return readStorage<string>(STORAGE_KEYS.accessToken) ?? null;
}

function resetForNewConnection() {
  lastSeq = 0;
  for (const timer of pending.values()) clearTimeout(timer);
  pending.clear();
}

function handleFrame(frame: IMessage) {
  let msg: RealtimeMessage<unknown>;
  try {
    msg = JSON.parse(frame.body) as RealtimeMessage<unknown>;
  } catch {
    return;
  }

  if (typeof msg.seq === "number" && msg.seq > 0) {
    if (msg.seq <= lastSeq) return;
    lastSeq = msg.seq;
  }
  for (const listen of listeners) listen(msg);
}

function ensureClient(): Client | null {
  const auth = token();
  if (!auth) return null;

  if (client && connectedWith && connectedWith !== auth) {
    void disconnect();
  }
  if (client) return client;

  const origin = wsOrigin();
  if (!origin) return null;

  connectedWith = auth;
  client = new Client({
    brokerURL: `${origin}${REALTIME.ws.path}`,
    connectHeaders: { Authorization: `Bearer ${auth}` },
    reconnectDelay: REALTIME.reconnectDelayMs,

    heartbeatIncoming: 0,
    heartbeatOutgoing: 0,
    onConnect: () => {
      resetForNewConnection();
      client?.subscribe(REALTIME.queue.presence, handleFrame);
      client?.subscribe(REALTIME.queue.errors, handleFrame);
      connected = true;

      for (const listen of connectListeners) listen(true);
    },
    onWebSocketClose: () => {
      if (!connected) return;
      connected = false;
      for (const listen of connectListeners) listen(false);
    },
  });
  client.activate();
  return client;
}

export function connect(): void {
  ensureClient();
}

export async function disconnect(): Promise<void> {
  const old = client;
  client = null;
  connected = false;
  connectedWith = null;
  resetForNewConnection();
  await old?.deactivate();
}

export function isConnected(): boolean {
  return connected;
}

let lastReconnectAt = 0;

export async function reconnect(): Promise<void> {
  const now = Date.now();

  if (now - lastReconnectAt < REALTIME.reconnectDelayMs) return;
  lastReconnectAt = now;
  await disconnect();
  connect();
}

export function subscribe(listen: Listener): () => void {
  listeners.add(listen);
  return () => listeners.delete(listen);
}

export function onConnectionChange(listen: ConnectListener): () => void {
  connectListeners.add(listen);
  if (connected) listen(true);
  return () => connectListeners.delete(listen);
}

export function send(destination: string, body?: unknown): boolean {
  if (!connected || !client) return false;
  client.publish({ destination, body: body === undefined ? "" : JSON.stringify(body) });
  return true;
}

export function expect(key: string, onTimeout: () => void): void {
  settle(key);
  pending.set(
    key,
    setTimeout(() => {
      pending.delete(key);
      onTimeout();
    }, REALTIME.requestTimeoutMs),
  );
}

export function settle(key: string): void {
  const timer = pending.get(key);
  if (timer) {
    clearTimeout(timer);
    pending.delete(key);
  }
}

export function onType<T>(types: readonly RealtimeMessageType[], handle: (payload: T, msg: RealtimeMessage<T>) => void): () => void {
  return subscribe((msg) => {
    if (types.includes(msg.type)) handle(msg.payload as T, msg as RealtimeMessage<T>);
  });
}
