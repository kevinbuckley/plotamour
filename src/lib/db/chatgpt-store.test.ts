// @vitest-environment node
import { afterAll, expect, it, vi } from "vitest";
import { mkdtemp, readdir, stat, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
const temp = await mkdtemp(join(tmpdir(), "plotamour-store-test-"));
vi.mock("node:os", async (importOriginal) => ({
  ...(await importOriginal<typeof import("node:os")>()),
  homedir: () => temp,
}));
const { writeLocal, readLocal, withLocalLock, hostId } = await import(
  "./chatgpt-store"
);
afterAll(async () => {
  await rm(temp, { recursive: true, force: true });
});
it("uses private files, hashes user identifiers, and preserves a stable host ID", async () => {
  await writeLocal("user/synthetic@example.invalid", { secret: "synthetic" });
  expect(await readLocal("user/synthetic@example.invalid")).toEqual({
    secret: "synthetic",
  });
  expect(await readLocal("another-user")).toBeNull();
  const root = join(temp, ".config/plotamour/chatgpt");
  expect((await stat(root)).mode & 0o777).toBe(0o700);
  for (const file of await readdir(root)) {
    expect(file).toMatch(/^[a-f0-9]{64}\.json$/);
    expect((await stat(join(root, file))).mode & 0o777).toBe(0o600);
  }
  expect(await hostId()).toBe(await hostId());
});
it("fails closed on concurrent token refresh and releases locks on failure", async () => {
  await withLocalLock("session", async () => {
    await expect(withLocalLock("session", async () => true)).rejects.toThrow(
      /busy/,
    );
  });
  await expect(
    withLocalLock("session", async () => {
      throw new Error("synthetic failure");
    }),
  ).rejects.toThrow();
  expect(await withLocalLock("session", async () => true)).toBe(true);
});
