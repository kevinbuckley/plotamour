// Local runtime storage; never the shared application database or browser.
import { createHash, randomUUID } from "node:crypto";
import {
  mkdir,
  readFile,
  writeFile,
  rename,
  unlink,
  chmod,
} from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

function root() {
  return join(homedir(), ".config", "plotamour", "chatgpt");
}
function path(key: string) {
  return join(root(), createHash("sha256").update(key).digest("hex") + ".json");
}
export async function readLocal<T>(key: string): Promise<T | null> {
  try {
    return JSON.parse(await readFile(path(key), "utf8")) as T;
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw e;
  }
}
export async function writeLocal<T>(key: string, value: T) {
  await mkdir(root(), { recursive: true, mode: 0o700 });
  await chmod(root(), 0o700);
  const tmp = path(key) + "." + randomUUID();
  await writeFile(tmp, JSON.stringify(value), { mode: 0o600, flag: "wx" });
  await rename(tmp, path(key));
}
export async function deleteLocal(key: string) {
  await unlink(path(key)).catch((e: NodeJS.ErrnoException) => {
    if (e.code !== "ENOENT") throw e;
  });
}
// A filesystem lock also serializes rotating refreshes across server processes.
// Fail closed on contention; never retry a possibly consumed rotating token.
export async function withLocalLock<T>(
  key: string,
  fn: () => Promise<T>,
): Promise<T> {
  await mkdir(root(), { recursive: true, mode: 0o700 });
  const lock = path(key) + ".lock";
  await mkdir(lock, { mode: 0o700 }).catch(() => {
    throw new Error("ChatGPT connection is busy. Retry shortly.");
  });
  try {
    return await fn();
  } finally {
    const { rmdir } = await import("node:fs/promises");
    await rmdir(lock);
  }
}
export async function hostId() {
  return withLocalLock("host", async () => {
    let id = await readLocal<string>("host");
    if (!id) {
      id = "urn:uuid:" + randomUUID();
      await writeLocal("host", id);
    }
    return id;
  });
}
