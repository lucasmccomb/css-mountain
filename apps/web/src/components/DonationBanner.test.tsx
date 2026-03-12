import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DonationBanner } from "./DonationBanner";

// Mock localStorage
const mockStorage: Record<string, string> = {};
const localStorageMock = {
  getItem: vi.fn((key: string) => mockStorage[key] ?? null),
  setItem: vi.fn((key: string, value: string) => {
    mockStorage[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete mockStorage[key];
  }),
};
vi.stubGlobal("localStorage", localStorageMock);

describe("DonationBanner", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
  });

  it("renders the banner with sponsor and kofi links", () => {
    render(<DonationBanner />);
    expect(screen.getByTestId("donation-banner")).toBeInTheDocument();
    expect(screen.getByText("Sponsor")).toBeInTheDocument();
    expect(screen.getByText("Ko-fi")).toBeInTheDocument();
  });

  it("links to correct URLs", () => {
    render(
      <DonationBanner
        sponsorUrl="https://github.com/sponsors/test"
        kofiUrl="https://ko-fi.com/test"
      />,
    );

    const sponsorLink = screen.getByText("Sponsor");
    expect(sponsorLink.closest("a")).toHaveAttribute(
      "href",
      "https://github.com/sponsors/test",
    );

    const kofiLink = screen.getByText("Ko-fi");
    expect(kofiLink.closest("a")).toHaveAttribute(
      "href",
      "https://ko-fi.com/test",
    );
  });

  it("links open in new tab", () => {
    render(<DonationBanner />);
    const links = screen.getAllByRole("link");
    links.forEach((link) => {
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    });
  });

  it("can be dismissed", () => {
    render(<DonationBanner />);
    expect(screen.getByTestId("donation-banner")).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Dismiss donation banner"));
    expect(screen.queryByTestId("donation-banner")).not.toBeInTheDocument();
  });

  it("persists dismissal in localStorage", () => {
    render(<DonationBanner />);
    fireEvent.click(screen.getByLabelText("Dismiss donation banner"));

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      "css-mountain:donation-dismissed",
      "true",
    );
  });

  it("does not render if previously dismissed", () => {
    mockStorage["css-mountain:donation-dismissed"] = "true";
    render(<DonationBanner />);
    expect(screen.queryByTestId("donation-banner")).not.toBeInTheDocument();
  });

  it("shows heart icon", () => {
    render(<DonationBanner />);
    expect(screen.getByText("<3")).toBeInTheDocument();
  });
});
