export const followCode = (status: number) =>
  status === 400 ? "SELF_FOLLOW_NOT_ALLOWED" : status === 404 ? "USER_NOT_FOUND" : status === 409 ? "ALREADY_FOLLOWING" : "INTERNAL_ERROR";
