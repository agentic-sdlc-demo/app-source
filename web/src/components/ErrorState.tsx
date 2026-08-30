interface Props {
  message: string;
  onRetry: () => void;
}

export function ErrorState({ message, onRetry }: Props) {
  return (
    <div className="error-state" role="alert">
      <p>Couldn&rsquo;t load tasks — {message}</p>
      <button onClick={onRetry}>Retry</button>
    </div>
  );
}
