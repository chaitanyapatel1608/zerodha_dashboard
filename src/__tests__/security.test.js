import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import axios from "axios";
import { API_BASE, AUTH_PORTAL_URL, WS_URL } from "../config/api";
import Holdings from "../components/Holdings";
import GeneralContext from "../components/GeneralContext";
import { MarketFeedProvider } from "../context/MarketFeedContext";
import SupportModal from "../components/overlays/SupportModal";

describe("Dashboard Security & UI Regression Suite", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("config/api resolves service URLs cleanly, enables credentials, and attaches X-CSRF-Token on state-changing requests", async () => {
    expect(API_BASE).toMatch(/^https?:\/\//);
    expect(AUTH_PORTAL_URL).toMatch(/^https?:\/\//);
    expect(WS_URL).toMatch(/^wss?:\/\//);
    expect(axios.defaults.withCredentials).toBe(true);

    document.cookie = "zerodha_csrf=csrf-secret-123; path=/";
    const handlers = axios.interceptors.request.handlers;
    expect(handlers.length).toBeGreaterThan(0);

    const reqConfig = await handlers[0].fulfilled({ method: "post", headers: {} });
    expect(reqConfig.headers["X-CSRF-Token"]).toBe("csrf-secret-123");
    expect(reqConfig.headers.Authorization).toBeUndefined();
  });

  it("SupportModal avoids hardcoded user IDs/personal emails and submits support tickets cleanly", async () => {
    vi.spyOn(axios, "get").mockResolvedValue({ data: { success: true, tickets: [] } });
    const postSpy = vi.spyOn(axios, "post").mockResolvedValue({
      data: {
        success: true,
        ticket: {
          ticketId: "TK-900123",
          category: "ORDERS",
          subject: "Order margin sync check",
          status: "OPEN",
        },
      },
    });

    render(
      <SupportModal
        isOpen={true}
        onClose={() => {}}
        currentUser={null}
        showToast={vi.fn()}
      />
    );

    fireEvent.change(screen.getByPlaceholderText(/Brief summary of the issue/i), {
      target: { value: "Order margin sync check" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Explain the problem in detail/i), {
      target: { value: "Please inspect order margin sync details." },
    });
    fireEvent.click(screen.getByRole("button", { name: /Submit Ticket/i }));

    await waitFor(() => {
      expect(screen.getByText(/Support Ticket Registered!/i)).toBeInTheDocument();
    });

    const submittedPayload = postSpy.mock.calls[0][1];
    expect(submittedPayload.userId).toBe("");
    expect(submittedPayload.userEmail).toBe("");
    expect(submittedPayload.userEmail).not.toContain("chaitanya.expound");
  });

  it("Holdings renders curated mutual fund plans safely as plain text", async () => {
    vi.spyOn(axios, "get").mockResolvedValue({ data: [] });

    render(
      <MemoryRouter>
        <MarketFeedProvider>
          <GeneralContext.Provider
            value={{
              portfolioTrigger: 0,
              currentUser: { userId: "ZU1001", email: "trader@example.com" },
              openBuyWindow: vi.fn(),
              openDepthModal: vi.fn(),
              openGttModal: vi.fn(),
              showToast: vi.fn(),
            }}
          >
            <Holdings />
          </GeneralContext.Provider>
        </MarketFeedProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.queryByText(/Loading holdings/i)).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /Mutual funds/i }));
    expect(screen.getAllByText(/Direct Plan • Growth/i).length).toBeGreaterThan(0);
  });
});
