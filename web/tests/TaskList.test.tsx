import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Task } from "../src/api/client";
import { TaskList } from "../src/components/TaskList";

const baseTask: Task = {
  id: "1",
  listId: "l1",
  title: "Buy milk",
  status: "open",
  priority: "medium",
  dueDate: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  completedAt: null,
};

describe("TaskList", () => {
  it("shows the empty state when there are no tasks", () => {
    render(<TaskList tasks={[]} onToggle={vi.fn()} onUpdate={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText(/No tasks yet/)).toBeInTheDocument();
  });

  it("groups tasks into Open and Done sections", () => {
    const tasks: Task[] = [baseTask, { ...baseTask, id: "2", title: "Done thing", status: "done" }];
    render(<TaskList tasks={tasks} onToggle={vi.fn()} onUpdate={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText("Open (1)")).toBeInTheDocument();
    expect(screen.getByText("Done (1)")).toBeInTheDocument();
  });

  it("does not render a Done section when nothing is done", () => {
    render(<TaskList tasks={[baseTask]} onToggle={vi.fn()} onUpdate={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.queryByText(/^Done/)).not.toBeInTheDocument();
  });
});
