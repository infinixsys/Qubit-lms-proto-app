import { api, cacheKey } from "./ui";
import type { Row } from "./ui";
export const downloads = (): Row[] => {
  try {
    return JSON.parse(localStorage.getItem(cacheKey("downloads")) || "[]");
  } catch {
    return [];
  }
};
export const queue = (): Row[] => {
  try {
    return JSON.parse(localStorage.getItem(cacheKey("queue")) || "[]");
  } catch {
    return [];
  }
};
export function saveDownload(lesson: Row) {
  const existing = downloads().filter((l) => l.id !== lesson.id);
  localStorage.setItem(
    cacheKey("downloads"),
    JSON.stringify([
      ...existing,
      {
        ...lesson,
        expires: Math.min(
          lesson.expires || Date.now() + 86400000,
          Date.now() + 86400000,
        ),
        downloaded: Date.now(),
      },
    ]),
  );
  window.dispatchEvent(new Event("qubit-cache"));
}
export function removeDownload(id: string) {
  localStorage.setItem(
    cacheKey("downloads"),
    JSON.stringify(downloads().filter((l) => l.id !== id)),
  );
  window.dispatchEvent(new Event("qubit-cache"));
}
export async function progress(
  lessonId: string,
  completed: boolean,
  position = 0,
) {
  const entry = {
    id: crypto.randomUUID(),
    path: "/lessons/" + lessonId + "/progress",
    method: "PUT",
    body: { completed, position, key: crypto.randomUUID() },
  };
  if (navigator.onLine)
    return api(entry.path, { method: "PUT", body: JSON.stringify(entry.body) });
  localStorage.setItem(cacheKey("queue"), JSON.stringify([...queue(), entry]));
  window.dispatchEvent(new Event("qubit-cache"));
  return { queued: true };
}
export async function note(lessonId: string, text: string) {
  const id = crypto.randomUUID(),
    entry = {
      id,
      path: "/me/notes/" + id,
      method: "PUT",
      body: { lessonId, text },
    };
  if (navigator.onLine)
    return api(entry.path, { method: "PUT", body: JSON.stringify(entry.body) });
  localStorage.setItem(cacheKey("queue"), JSON.stringify([...queue(), entry]));
  window.dispatchEvent(new Event("qubit-cache"));
  return { queued: true };
}
let syncing = false;
export async function sync() {
  if (syncing || !navigator.onLine) return;
  syncing = true;
  try {
    const pending = queue();
    for (const entry of pending) {
      try {
        await api(entry.path, {
          method: entry.method,
          body: JSON.stringify(entry.body),
        });
        localStorage.setItem(
          cacheKey("queue"),
          JSON.stringify(queue().filter((q) => q.id !== entry.id)),
        );
      } catch (e) {
        localStorage.setItem(
          cacheKey("queue"),
          JSON.stringify(
            queue().map((q) =>
              q.id === entry.id ? { ...q, error: (e as Error).message } : q,
            ),
          ),
        );
        break;
      }
    }
  } finally {
    syncing = false;
    window.dispatchEvent(new Event("qubit-cache"));
  }
}
export function clearPersonalCache() {
  const user = localStorage.getItem("qubit-user");
  Object.keys(localStorage)
    .filter((k) => k.startsWith("qubit:" + user + ":"))
    .forEach((k) => localStorage.removeItem(k));
  localStorage.removeItem("qubit-profile");
  localStorage.removeItem("qubit-user");
}
