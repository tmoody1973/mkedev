import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HomeCard } from "@/components/copilot/HomeCard";
import { HomesListCard } from "@/components/copilot/HomesListCard";

/**
 * HomeCard and HomesListCard UI Component Tests
 *
 * Tests for Task Group 4: UI Components for Homes MKE Integration
 */

// Mock window.open for external URL tests
const mockWindowOpen = vi.fn();
Object.defineProperty(window, "open", {
  writable: true,
  value: mockWindowOpen,
});

describe("HomeCard", () => {
  const mockHome = {
    address: "123 Main St",
    neighborhood: "Bay View",
    coordinates: [-87.9065, 43.0389] as [number, number],
    bedrooms: 3,
    fullBaths: 2,
    halfBaths: 1,
    buildingSqFt: 1500,
    yearBuilt: 1925,
    narrative: "Beautiful historic home with modern updates.",
    listingUrl: "https://example.com/listing/123",
    status: "complete" as const,
  };

  beforeEach(() => {
    mockWindowOpen.mockClear();
  });

  describe("Rendering", () => {
    it("renders all property fields correctly", () => {
      const onFlyTo = vi.fn();
      render(<HomeCard {...mockHome} onFlyTo={onFlyTo} />);

      // Check address and neighborhood
      expect(screen.getByText("123 Main St")).toBeInTheDocument();
      expect(screen.getByText("Bay View")).toBeInTheDocument();

      // Check property details
      expect(screen.getByText("3")).toBeInTheDocument(); // bedrooms
      expect(screen.getByText("2.5")).toBeInTheDocument(); // baths (2 full + 0.5 half)
      expect(screen.getByText("1,500")).toBeInTheDocument(); // sqft
      expect(screen.getByText("1925")).toBeInTheDocument(); // year built

      // Check narrative
      expect(
        screen.getByText("Beautiful historic home with modern updates.")
      ).toBeInTheDocument();
    });

    it("shows loading state with skeleton UI", () => {
      const onFlyTo = vi.fn();
      render(<HomeCard {...mockHome} status="inProgress" onFlyTo={onFlyTo} />);

      // Loading skeleton should have animate-pulse class
      const loadingContainer = screen.getByTestId("homecard-loading");
      expect(loadingContainer).toHaveClass("animate-pulse");
    });
  });

  describe("Actions", () => {
    it("opens listingUrl in new tab when View Listing is clicked", async () => {
      const user = userEvent.setup();
      const onFlyTo = vi.fn();
      render(<HomeCard {...mockHome} onFlyTo={onFlyTo} />);

      const viewListingButton = screen.getByRole("button", {
        name: /view listing/i,
      });
      await user.click(viewListingButton);

      expect(mockWindowOpen).toHaveBeenCalledWith(
        "https://example.com/listing/123",
        "_blank",
        "noopener,noreferrer"
      );
    });

    it("hides View Listing button when listingUrl is not provided", () => {
      const onFlyTo = vi.fn();
      const { listingUrl, ...homeWithoutUrl } = mockHome;
      render(<HomeCard {...homeWithoutUrl} onFlyTo={onFlyTo} />);

      expect(
        screen.queryByRole("button", { name: /view listing/i })
      ).not.toBeInTheDocument();
    });

    it("calls onFlyTo with coordinates when Fly to Location is clicked", async () => {
      const user = userEvent.setup();
      const onFlyTo = vi.fn();
      render(<HomeCard {...mockHome} onFlyTo={onFlyTo} />);

      const flyToButton = screen.getByRole("button", {
        name: /fly to location/i,
      });
      await user.click(flyToButton);

      expect(onFlyTo).toHaveBeenCalledWith([-87.9065, 43.0389]);
    });
  });
});

describe("HomesListCard", () => {
  const mockHomes = [
    {
      id: "home1",
      address: "123 Main St",
      neighborhood: "Bay View",
      coordinates: [-87.9065, 43.0389] as [number, number],
      bedrooms: 3,
      fullBaths: 2,
      halfBaths: 1,
    },
    {
      id: "home2",
      address: "456 Oak Ave",
      neighborhood: "Riverwest",
      coordinates: [-87.9165, 43.0489] as [number, number],
      bedrooms: 4,
      fullBaths: 3,
      halfBaths: 0,
    },
  ];

  describe("Rendering", () => {
    it("renders list of homes with correct count", () => {
      const onHomeSelect = vi.fn();
      render(
        <HomesListCard
          homes={mockHomes}
          onHomeSelect={onHomeSelect}
          status="complete"
        />
      );

      // Check header shows count
      expect(screen.getByText(/found 2 homes for sale/i)).toBeInTheDocument();

      // Check both homes are rendered
      expect(screen.getByText("123 Main St")).toBeInTheDocument();
      expect(screen.getByText("456 Oak Ave")).toBeInTheDocument();
    });

    it("renders condensed home details", () => {
      const onHomeSelect = vi.fn();
      render(
        <HomesListCard
          homes={mockHomes}
          onHomeSelect={onHomeSelect}
          status="complete"
        />
      );

      // Check beds/baths displayed for first home
      expect(screen.getByText("Bay View")).toBeInTheDocument();
      expect(screen.getByText("Riverwest")).toBeInTheDocument();
    });
  });

  describe("Interaction", () => {
    it("calls onHomeSelect with correct home when item is clicked", async () => {
      const user = userEvent.setup();
      const onHomeSelect = vi.fn();
      render(
        <HomesListCard
          homes={mockHomes}
          onHomeSelect={onHomeSelect}
          status="complete"
        />
      );

      // Click on first home
      const firstHomeItem = screen.getByText("123 Main St").closest("button");
      expect(firstHomeItem).toBeInTheDocument();
      await user.click(firstHomeItem!);

      expect(onHomeSelect).toHaveBeenCalledWith(mockHomes[0]);
    });
  });

  describe("Loading State", () => {
    it("shows loading state when status is loading", () => {
      const onHomeSelect = vi.fn();
      render(
        <HomesListCard
          homes={[]}
          onHomeSelect={onHomeSelect}
          status="loading"
        />
      );

      const loadingContainer = screen.getByTestId("homeslist-loading");
      expect(loadingContainer).toHaveClass("animate-pulse");
    });
  });
});
