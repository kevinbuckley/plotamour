import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { AiConnection } from "./ai-connection";
const status = {
  enabled: true,
  connected: false,
  planUsage: false,
  models: [],
};
beforeEach(() => {
  vi.mocked(fetch).mockReset();
});
it("requests identity without plan permission unless the user selects separate consent", async () => {
  vi.mocked(fetch).mockResolvedValue(
    Response.json({ error: "Synthetic declined connection" }, { status: 400 }),
  );
  render(<AiConnection status={status} />);
  expect(screen.getByRole("checkbox")).not.toBeChecked();
  fireEvent.click(
    screen.getByRole("button", { name: "Continue with ChatGPT" }),
  );
  await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
  expect(JSON.parse(vi.mocked(fetch).mock.calls[0][1]!.body as string)).toEqual(
    { planConsent: false },
  );
  await screen.findByRole("alert");
  fireEvent.click(screen.getByRole("checkbox"));
  fireEvent.click(
    screen.getByRole("button", { name: "Continue with ChatGPT" }),
  );
  await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
  expect(JSON.parse(vi.mocked(fetch).mock.calls[1][1]!.body as string)).toEqual(
    { planConsent: true },
  );
});
it("keeps the hosted connection unavailable", () => {
  render(<AiConnection status={{ ...status, enabled: false }} />);
  expect(
    screen.queryByRole("button", { name: "Continue with ChatGPT" }),
  ).not.toBeInTheDocument();
  expect(screen.getByText(/Hosted access is pending/)).toBeInTheDocument();
});
