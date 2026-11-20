export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const PASSWORD_RE = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

export const PASSWORD_MAX_BYTES = 72;
export const NICKNAME_MIN = 2;
export const NICKNAME_MAX = 20;

export function emailError(value: string): string | null {
  const v = value.trim();
  if (!v) return "이메일을 입력해주세요.";
  return EMAIL_RE.test(v) ? null : "이메일 형식이 아니에요.";
}

export function loginPasswordError(value: string): string | null {
  return value ? null : "비밀번호를 입력해주세요.";
}

export function passwordError(value: string): string | null {
  if (!value) return "비밀번호를 입력해주세요.";
  if (new TextEncoder().encode(value).length > PASSWORD_MAX_BYTES) return "비밀번호가 너무 길어요 (72바이트 이하).";
  return PASSWORD_RE.test(value) ? null : "영문과 숫자를 포함해 8자 이상이어야 해요.";
}

export function nicknameError(value: string): string | null {
  const v = value.trim();
  if (!v) return "닉네임을 입력해주세요.";
  if (v.length < NICKNAME_MIN) return `${NICKNAME_MIN}자 이상 입력해주세요.`;
  if (v.length > NICKNAME_MAX) return `${NICKNAME_MAX}자까지 쓸 수 있어요.`;
  return null;
}
