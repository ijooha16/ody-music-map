import { STORAGE_KEYS } from "@/constants";
import { readStorage } from "@/lib/storage";

export type AnalyticsEnvironment = "development" | "production";
export interface AnalyticsRuntimePolicy {
  environment: AnalyticsEnvironment;
  logLocal: boolean;
  sendExternal: boolean;
}

export function analyticsEnabled(): boolean {
  return readStorage<boolean>(STORAGE_KEYS.analyticsMode) !== false;
}

export function analyticsDebugEnabled(): boolean {
  return readStorage<boolean>(STORAGE_KEYS.analyticsDebug) === true;
}

const LOOPBACK_HOSTS = ["localhost", "127.0.0.1", "[::1]"];

const IPV4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;

function isPrivateIPv4(host: string): boolean {
  const parts = IPV4.exec(host);
  if (!parts) return false;
  const a = Number(parts[1]);
  const b = Number(parts[2]);
  return (
    a === 10 ||
    (a === 192 && b === 168) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 169 && b === 254)
  );
}

const PRIVATE_HOST = /^\[f[cd]|^\[fe80:|\.local$/;

export function analyticsEnvironment(hostname: string): AnalyticsEnvironment {
  const host = hostname.toLowerCase();
  if (LOOPBACK_HOSTS.includes(host)) return "development";
  return isPrivateIPv4(host) || PRIVATE_HOST.test(host) ? "development" : "production";
}

export function analyticsRuntimePolicy(
  hostname: string,
  dataSource: "live" | "mock",
  enabled: boolean,
): AnalyticsRuntimePolicy {
  const environment = analyticsEnvironment(hostname);
  return {
    environment,
    logLocal: enabled && environment === "development",
    sendExternal: enabled && dataSource === "live",
  };
}
