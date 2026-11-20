import { getAnonymousId } from "@/lib/anonymous-id";
import { ANALYTICS } from "@/constants/analytics";
import type { AnalyticsEvent, AnalyticsEventName, AnalyticsProps } from "@/types/analytics";
import { createUuid } from "@/lib/uuid";

type Sink = (event: AnalyticsEvent) => void;
let sink: Sink | null = null;
const queue: AnalyticsEvent[] = [];
const onceKeys = new Set<string>();
let context: AnalyticsProps = {};
let visitId: string | undefined;
let beforeContext: (() => void) | undefined;

export function analyticsId(): string { return createUuid(); }
export function analyticsContext(): AnalyticsProps { return { ...context }; }
export function onAnalyticsContextChange(callback: () => void): void { beforeContext = callback; }
export function setAnalyticsContext(next: AnalyticsProps): void {
  if (Object.entries(next).every(([k, v]) => context[k] === v)) return;
  beforeContext?.();
  context = { ...context, ...next };
}

export function track(name: AnalyticsEventName, properties: AnalyticsProps = {}): void {
  if (typeof window === "undefined") return;
  try {
    visitId ??= analyticsId();
    const event: AnalyticsEvent = {
      name,
      timestamp: Date.now(),
      properties: { ...context, anonymous_id: getAnonymousId(), visit_id: visitId, event_id: analyticsId(), schema_version: ANALYTICS.schemaVersion, ...properties },
    };
    if (sink) sink(event);
    else if (queue.length < ANALYTICS.queueLimit) queue.push(event);
  } catch { /* 분석 장애가 제품 행동을 막지 않는다. */ }
}

export function trackOnce(key: string, name: AnalyticsEventName, properties: AnalyticsProps = {}): void {
  if (typeof window === "undefined" || onceKeys.has(key)) return;
  onceKeys.add(key);
  track(name, properties);
}

export function connectAnalytics(next: Sink): void {
  sink = next;
  for (const event of queue.splice(0)) next(event);
}
