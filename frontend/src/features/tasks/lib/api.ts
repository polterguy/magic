/*
 * The calls this feature makes to the backend. The transport they go through — base URL, token,
 * errors — is core/api.
 */
import { http, type MagicResponse, type Task } from '@core/api';

/*
 * The endpoint returns the task's properties without its name — the name is
 * the node the properties hang off, and that gets stripped on the way out —
 * so we put it back to hand callers a complete task.
 */
export async function getTask(name: string) {
  const task = await http.get<Task>('/magic/system/tasks/get?name=' + encodeURIComponent(name));
  return { ...task, id: name };
}

export function createTask(id: string, description: string, hyperlambda: string) {
  return http.post<MagicResponse>('/magic/system/tasks/create', { id, description, hyperlambda });
}

export function updateTask(id: string, description: string, hyperlambda: string) {
  return http.post<MagicResponse>('/magic/system/tasks/update', { id, description, hyperlambda });
}

export function deleteTask(id: string) {
  return http.delete<MagicResponse>('/magic/system/tasks/delete?id=' + encodeURIComponent(id));
}

export function scheduleTask(id: string, due?: string, repeats?: string) {
  const payload: { id: string; due?: string; repeats?: string } = { id };
  if (repeats) {
    payload.repeats = repeats;
  } else {
    payload.due = due;
  }
  return http.post<MagicResponse>('/magic/system/tasks/due/add', payload);
}

export function deleteSchedule(id: number) {
  return http.delete<MagicResponse>('/magic/system/tasks/due/delete?id=' + id);
}
