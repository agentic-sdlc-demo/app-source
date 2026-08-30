export type Priority = "low" | "medium" | "high";
export type Status = "open" | "done";

export interface Task {
  id: string;
  listId: string;
  title: string;
  status: Status;
  priority: Priority;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

interface ApiErrorBody {
  error: { code: string; message: string };
}

export class ApiError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let body: ApiErrorBody | undefined;
    try {
      body = await res.json();
    } catch {
      // response had no JSON body — fall through to the generic message below
    }
    throw new ApiError(body?.error.code ?? "unknown_error", body?.error.message ?? "Something went wrong");
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export async function getDefaultList(): Promise<{ id: string; name: string }> {
  const res = await fetch("/api/lists");
  const data = await handle<{ items: { id: string; name: string }[] }>(res);
  return data.items[0];
}

export interface TaskFilters {
  status?: Status;
  priority?: Priority;
  dueBefore?: string;
}

export async function listTasks(listId: string, filters: TaskFilters = {}): Promise<Task[]> {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.priority) params.set("priority", filters.priority);
  if (filters.dueBefore) params.set("dueBefore", filters.dueBefore);
  const qs = params.toString();
  const res = await fetch(`/api/lists/${listId}/tasks${qs ? `?${qs}` : ""}`);
  const data = await handle<{ items: Task[] }>(res);
  return data.items;
}

export async function createTask(
  listId: string,
  input: { title: string; priority?: Priority; dueDate?: string },
): Promise<Task> {
  const res = await fetch(`/api/lists/${listId}/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return handle<Task>(res);
}

export async function updateTask(
  id: string,
  patch: Partial<Pick<Task, "title" | "priority" | "dueDate">>,
): Promise<Task> {
  const res = await fetch(`/api/tasks/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  return handle<Task>(res);
}

export async function completeTask(id: string): Promise<Task> {
  const res = await fetch(`/api/tasks/${id}/complete`, { method: "POST" });
  return handle<Task>(res);
}

export async function reopenTask(id: string): Promise<Task> {
  const res = await fetch(`/api/tasks/${id}/reopen`, { method: "POST" });
  return handle<Task>(res);
}

export async function deleteTask(id: string): Promise<void> {
  const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
  return handle<void>(res);
}
