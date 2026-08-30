import { useCallback, useEffect, useState } from "react";
import {
  ApiError,
  completeTask,
  createTask,
  deleteTask,
  getDefaultList,
  listTasks,
  reopenTask,
  Task,
  updateTask,
} from "./api/client";
import { AddTaskInput } from "./components/AddTaskInput";
import { ErrorState } from "./components/ErrorState";
import { Filters, FilterBar } from "./components/FilterBar";
import { TaskList } from "./components/TaskList";

type LoadState = "loading" | "ready" | "error";

export default function App() {
  const [listId, setListId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filters, setFilters] = useState<Filters>({});
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadState("loading");
    try {
      const list = await getDefaultList();
      setListId(list.id);
      const today = new Date().toISOString().slice(0, 10);
      let items = await listTasks(list.id, {
        status: filters.status,
        priority: filters.priority,
        dueBefore: filters.overdue ? today : undefined,
      });
      if (filters.dueToday) {
        items = items.filter((t) => t.dueDate === today);
      }
      setTasks(items);
      setLoadState("ready");
    } catch (err) {
      setErrorMessage(err instanceof ApiError ? err.message : "network error");
      setLoadState("error");
    }
  }, [filters]);

  useEffect(() => {
    load();
  }, [load]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  async function handleAdd(title: string) {
    if (!listId) return;
    const optimistic: Task = {
      id: `optimistic-${Date.now()}`,
      listId,
      title,
      status: "open",
      priority: "medium",
      dueDate: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      completedAt: null,
    };
    setTasks((prev) => [optimistic, ...prev]);
    try {
      const created = await createTask(listId, { title });
      setTasks((prev) => prev.map((t) => (t.id === optimistic.id ? created : t)));
    } catch (err) {
      setTasks((prev) => prev.filter((t) => t.id !== optimistic.id));
      showToast(err instanceof ApiError ? err.message : "Couldn't add task");
    }
  }

  async function handleToggle(task: Task) {
    const wasDone = task.status === "done";
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: wasDone ? "open" : "done" } : t)));
    try {
      const updated = wasDone ? await reopenTask(task.id) : await completeTask(task.id);
      setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
    } catch (err) {
      await load(); // reconcile with server state on a 409/error, per SPEC-001
      showToast(err instanceof ApiError ? err.message : "Couldn't update task");
    }
  }

  async function handleUpdate(id: string, patch: Partial<Pick<Task, "title" | "priority" | "dueDate">>) {
    try {
      const updated = await updateTask(id, patch);
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Couldn't save changes");
    }
  }

  async function handleDelete(id: string) {
    const prevTasks = tasks;
    setTasks((prev) => prev.filter((t) => t.id !== id));
    try {
      await deleteTask(id);
    } catch (err) {
      setTasks(prevTasks);
      showToast(err instanceof ApiError ? err.message : "Couldn't delete task");
    }
  }

  return (
    <main className="app">
      <h1>Tasks</h1>
      <AddTaskInput onAdd={handleAdd} />
      <FilterBar filters={filters} onChange={setFilters} />
      {loadState === "error" && <ErrorState message={errorMessage} onRetry={load} />}
      {loadState !== "error" && (
        <TaskList tasks={tasks} onToggle={handleToggle} onUpdate={handleUpdate} onDelete={handleDelete} />
      )}
      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </main>
  );
}
