import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import axios from "axios";
import BuyActionWindow from "../components/BuyActionWindow";
import GeneralContext from "../components/GeneralContext";

describe("Dashboard BuyActionWindow & Order Interaction Suite", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("blocks order submission when target segment kill switch is disabled", async () => {
    vi.spyOn(axios, "get").mockResolvedValue({ data: { equity: { availableMargin: "50,000.00" } } });
    const postSpy = vi.spyOn(axios, "post");
    const showToast = vi.fn();

    render(
      <MemoryRouter>
        <GeneralContext.Provider
          value={{
            closeBuyWindow: vi.fn(),
            currentUser: { userId: "ZU1001" },
            showToast,
            refreshPortfolio: vi.fn(),
            openDepthModal: vi.fn(),
            userSegments: { equity: { name: "NSE Equity", active: false } },
            openSegmentModal: vi.fn(),
          }}
        >
          <BuyActionWindow uid="INFY" initialMode="BUY" initialPrice={1500} />
        </GeneralContext.Provider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalled();
    });

    const submitBtn = screen.getByRole("button", { name: /^Buy$/ });
    expect(submitBtn).toBeDisabled();
    expect(screen.getByText(/Segment Deactivated/i)).toBeInTheDocument();
    expect(screen.getByText(/disabled under your Kill Switch risk settings/i)).toBeInTheDocument();
    expect(postSpy).not.toHaveBeenCalled();
  });

  it("submits BUY order when segment is active and refreshes portfolio on success", async () => {
    vi.spyOn(axios, "get").mockResolvedValue({ data: { equity: { availableMargin: "50,000.00" } } });
    const postSpy = vi.spyOn(axios, "post").mockResolvedValue({
      data: { success: true, message: "Order executed" },
    });
    const closeBuyWindow = vi.fn();
    const refreshPortfolio = vi.fn();
    const showToast = vi.fn();

    render(
      <MemoryRouter>
        <GeneralContext.Provider
          value={{
            closeBuyWindow,
            currentUser: { userId: "ZU1001" },
            showToast,
            refreshPortfolio,
            openDepthModal: vi.fn(),
            userSegments: { equity: { name: "NSE Equity", active: true } },
            openSegmentModal: vi.fn(),
          }}
        >
          <BuyActionWindow uid="INFY" initialMode="BUY" initialPrice={1500} />
        </GeneralContext.Provider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalled();
    });

    fireEvent.click(screen.getByRole("button", { name: /^Buy$/ }));

    await waitFor(() => {
      expect(postSpy).toHaveBeenCalledTimes(1);
    });
    expect(refreshPortfolio).toHaveBeenCalled();
    expect(closeBuyWindow).toHaveBeenCalled();
  });
});
