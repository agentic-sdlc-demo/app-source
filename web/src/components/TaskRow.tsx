import { useState } from "react";
import { Priority, Task } from "../api/client";

interface Props {
  task: Task;
  onToggle: (task: Task) => void;
  onUpdate: (id: string, patch: Partial<Pick<Task, "title" | "priority" | "dueDate">>) => void;
  onDelete: (id: string) => void;
}

function dueBadgeClass(dueDate: string | null, status: string): string {
  if (!dueDate || status === "done") return "due-badge";
  const today = new Date().toISOString().slice(0, 10);
  if (dueDate < today) return "due-badge overdue";
  if (dueDate === today) return "due-badge today";
  return "due-badge";
}

export function TaskRow({ task, onToggle, onUpdate, onDelete }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  return (
    <li className="task-row">
      <div className="task-row-main">
        <input
          type="checkbox"
          checked={task.status === "done"}
          onChange={() => onToggle(task)}
          aria-label={task.status === "done" ? `Reopen ${task.title}` : `Complete ${task.title}`}
        />
        <button className="task-title" onClick={() => setExpanded((v) => !v)}>
          {task.title}
        </button>
        <span className={`priority-chip priority-${task.priority}`}>{task.priority}</span>
        {task.dueDate && <span className={dueBadgeClass(task.dueDate, task.status)}>{task.dueDate}</span>}
      </div>
      {expanded && (
        <div className="task-row-detail">
          <label>
            Priority
            <select
              value={task.priority}
              onChange={(e) => onUpdate(task.id, { priority: e.target.value as Priority })}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </label>
          <label>
            Due date
            <input
              type="date"
              value={task.dueDate ?? ""}
              onChange={(e) => onUpdate(task.id, { dueDate: e.target.value || undefined })}
            />
          </label>
          {confirmingDelete ? (
            <span className="confirm-delete">
              Delete this task?
              <button onClick={() => onDelete(task.id)}>Yes, delete</button>
              <button onClick={() => setConfirmingDelete(false)}>Cancel</button>
            </span>
          ) : (
            <button className="delete-btn" onClick={() => setConfirmingDelete(true)}>
              Delete
            </button>
          )}
        </div>
      )}
    </li>
  );
}
