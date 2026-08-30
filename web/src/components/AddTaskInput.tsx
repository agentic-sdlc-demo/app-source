import { FormEvent, useState } from "react";

interface Props {
  onAdd: (title: string) => Promise<void>;
}

export function AddTaskInput({ onAdd }: Props) {
  const [title, setTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);
    try {
      await onAdd(trimmed);
      setTitle("");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="add-task" onSubmit={handleSubmit}>
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Add a task and press Enter"
        aria-label="New task title"
        disabled={submitting}
        autoFocus
      />
      <button type="submit" disabled={!title.trim() || submitting}>
        Add task
      </button>
    </form>
  );
}
