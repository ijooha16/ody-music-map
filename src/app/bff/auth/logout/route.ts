import { backendProxy } from "@/lib/backend";

export const POST = (req: Request) => backendProxy(req, "/api/auth/logout");
