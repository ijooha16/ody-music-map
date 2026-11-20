import { fail, failLive, okLive } from "@/lib/api-response";
import { backendPatchForm, BackendError, callerAuth } from "@/lib/backend";

const UPSTREAM = "/api/user/image";

const MAX_BYTES = 5 * 1024 * 1024;

export async function PATCH(req: Request) {
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");

  if (!(file instanceof File) || file.size === 0) return fail("VALIDATION_ERROR", "올릴 사진을 골라 주세요.", 400);
  if (!file.type.startsWith("image/")) return fail("UNSUPPORTED_FILE_TYPE", "이미지 파일만 올릴 수 있어요.", 400);
  if (file.size > MAX_BYTES) return fail("FILE_TOO_LARGE", "사진은 5MB 까지 올릴 수 있어요.", 400);

  const upload = new FormData();
  upload.append("file", file, file.name);

  try {
    const data = await backendPatchForm<{ imageUrl: string }>(UPSTREAM, upload, { headers: callerAuth(req) });
    return okLive(data, UPSTREAM);
  } catch (e) {
    const err = e as BackendError;
    return failLive("INTERNAL_ERROR", err.message, err.status || 502, UPSTREAM);
  }
}
