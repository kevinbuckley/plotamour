// Reusable Supabase mock utilities for all service tests

import { vi } from "vitest";

/**
 * Creates a chainable query builder that resolves to { data, error, count }
 * when awaited. Every chainable method returns `this`.
 */
export function mockQueryBuilder(
  data: unknown = null,
  error: unknown = null,
  count: number | null = null
) {
  const response = { data, error, count };
  const builder: Record<string, unknown> = {};

  const methods = [
    "select",
    "insert",
    "update",
    "delete",
    "upsert",
    "eq",
    "neq",
    "is",
    "in",
    "order",
    "limit",
    "single",
    "maybeSingle",
  ];

  for (const method of methods) {
    builder[method] = vi.fn().mockReturnValue(builder);
  }

  // Make it thenable so `await supabase.from(...).select(...)` resolves
  builder.then = (
    resolve: (value: typeof response) => void,
    reject?: (reason: unknown) => void
  ) => Promise.resolve(response).then(resolve, reject);

  return builder;
}

/**
 * Creates a mock Supabase client with a `from()` method.
 * Use `client.from.mockReturnValueOnce(mockQueryBuilder(...))` to set up
 * sequential call responses.
 */
export function createMockClient() {
  const client = {
    from: vi.fn().mockReturnValue(mockQueryBuilder()),
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "test-user-id" } },
        error: null,
      }),
    },
  };
  return client;
}

/**
 * Helper to build the mock factory object for `vi.mock("@/lib/db/server", ...)`.
 * Usage in test files:
 *
 *   const mockClient = createMockClient();
 *   vi.mock("@/lib/db/server", () => ({
 *     createClient: vi.fn().mockResolvedValue(mockClient),
 *   }));
 *
 * NOTE: Do NOT place vi.mock() in this shared file — vitest hoists all
 * vi.mock calls to the top of the importing file, which breaks when the
 * factory references local variables that haven't been initialised yet.
 */
