import type { ConfirmRequest } from "@/stores/use-confirm-store";

export const DEMO = true;

export const skipConfirm = (req: ConfirmRequest) => req.onConfirm();
