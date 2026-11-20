export function canRideOptimistically(input: {
  ridingEmail: string | null;

  targetEmail: string;

  silent: boolean;
}): boolean {
  if (input.silent) return false;

  if (input.ridingEmail && input.ridingEmail !== input.targetEmail) return false;
  return true;
}
