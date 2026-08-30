import { Task } from "../api/client";
import { EmptyState } from "./EmptyState";
import { TaskRow } from "./TaskRow";

interface Props {
  tasks: Task[];
  onToggle: (task: Task) => void;
  onUpdate: (id: string, patch: Partial<Pick<Task, "title" | "priority" | "dueDate">>) => void;
  onDelete: (id: string) => void;
}

export function TaskList({ tasks, onToggle, onUpdate, onDelete }: Props) {
  if (tasks.length === 0) return <EmptyState />;
  const open = tasks.filter((t) => t.status === "open");
  const done = tasks.filter((t) => t.status === "done");
  return (
    <div className="task-groups">
      <section>
        <h2>Open ({open.length})</h2>
        <ul>
          {open.map((t) => (
            <TaskRow key={t.id} task={t} onToggle={onToggle} onUpdate={onUpdate} onDelete={onDelete} />
          ))}
        </ul>
      </section>
      {done.length > 0 && (
        <details>
          <summary>Done ({done.length})</summary>
          <ul>
            {done.map((t) => (
              <TaskRow key={t.id} task={t} onToggle={onToggle} onUpdate={onUpdate} onDelete={onDelete} />
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
