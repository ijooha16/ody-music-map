import { publicAnalyticsConfig } from "@/lib/analytics/policy";

export const dynamic = "force-dynamic";
export function GET() {
  return Response.json(publicAnalyticsConfig(process.env), { headers: { "Cache-Control": "no-store" } });
}
