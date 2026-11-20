interface EmptyStateProps {
  message: string;
}

export default function EmptyState({ message }: EmptyStateProps) {
  return (
    <p className="rounded-[15px] border border-dashed border-line px-2.5 py-[22px] text-center text-xs leading-relaxed text-ink-3">
      {message}
    </p>
  );
}
