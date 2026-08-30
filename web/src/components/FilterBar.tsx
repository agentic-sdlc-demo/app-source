import { Priority, Status } from "../api/client";

export interface Filters {
  status?: Status;
  priority?: Priority;
  dueToday?: boolean;
  overdue?: boolean;
}

interface Props {
  filters: Filters;
  onChange: (f: Filters) => void;
}

const priorities: Priority[] = ["low", "medium", "high"];

export function FilterBar({ filters, onChange }: Props) {
  return (
    <div className="filter-bar" role="group" aria-label="Filter tasks">
      <button
        className={filters.status === "open" ? "chip active" : "chip"}
        onClick={() => onChange({ ...filters, status: filters.status === "open" ? undefined : "open" })}
      >
        Open
      </button>
      <button
        className={filters.status === "done" ? "chip active" : "chip"}
        onClick={() => onChange({ ...filters, status: filters.status === "done" ? undefined : "done" })}
      >
        Done
      </button>
      {priorities.map((p) => (
        <button
          key={p}
          className={filters.priority === p ? "chip active" : "chip"}
          onClick={() => onChange({ ...filters, priority: filters.priority === p ? undefined : p })}
        >
          {p}
        </button>
      ))}
      <button
        className={filters.overdue ? "chip active" : "chip"}
        onClick={() => onChange({ ...filters, overdue: !filters.overdue, dueToday: false })}
      >
        Overdue
      </button>
      <button
        className={filters.dueToday ? "chip active" : "chip"}
        onClick={() => onChange({ ...filters, dueToday: !filters.dueToday, overdue: false })}
      >
        Due today
      </button>
    </div>
  );
}
