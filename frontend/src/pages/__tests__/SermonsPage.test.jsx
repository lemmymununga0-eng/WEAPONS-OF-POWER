import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import SermonsPage from "../SermonsPage.jsx";
import { PlayerProvider } from "../../player/PlayerContext.jsx";
import * as client from "../../api/client.js";

vi.mock("../../api/client.js", () => ({
  getSermons: vi.fn(),
  mediaUrl: (p) => p,
}));

const SERMONS = [
  {
    id: 1,
    title: "Walking in Power",
    speaker: "Apostle Banda",
    sermon_date: "2026-09-01",
    category: "Faith",
    scripture: "Eph 6:10",
    media_path: "/uploads/a.mp3",
    external_link: "",
    notes: "",
    published: true,
  },
  {
    id: 2,
    title: "Grace Abounds",
    speaker: "Pastor X",
    sermon_date: "2026-08-01",
    category: "Grace",
    scripture: "",
    media_path: "",
    external_link: "https://youtu.be/xyz",
    notes: "",
    published: true,
  },
];

function renderPage(initialEntries = ["/sermons"]) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <PlayerProvider>
        <SermonsPage />
      </PlayerProvider>
    </MemoryRouter>
  );
}

describe("SermonsPage URL filter state", () => {
  beforeEach(() => {
    client.getSermons.mockResolvedValue(SERMONS);
  });

  it("shows all sermons with no filters", async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText("Walking in Power")).toBeInTheDocument());
    expect(screen.getByText("Grace Abounds")).toBeInTheDocument();
  });

  it("filters by kind=audio when present in the URL on load", async () => {
    renderPage(["/sermons?kind=audio"]);
    await waitFor(() => expect(screen.getByText("Walking in Power")).toBeInTheDocument());
    expect(screen.queryByText("Grace Abounds")).not.toBeInTheDocument();
  });

  it("clicking the Audio chip filters the results", async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText("Walking in Power")).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: "Audio" }));

    await waitFor(() => expect(screen.queryByText("Grace Abounds")).not.toBeInTheDocument());
    expect(screen.getByText("Walking in Power")).toBeInTheDocument();
  });

  it("typing in the search box filters by title", async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText("Walking in Power")).toBeInTheDocument());

    fireEvent.change(screen.getByPlaceholderText(/search title/i), { target: { value: "Grace" } });

    await waitFor(() => expect(screen.queryByText("Walking in Power")).not.toBeInTheDocument());
    expect(screen.getByText("Grace Abounds")).toBeInTheDocument();
  });

  it("filtering by category from the URL works", async () => {
    renderPage(["/sermons?category=Grace"]);
    await waitFor(() => expect(screen.getByText("Grace Abounds")).toBeInTheDocument());
    expect(screen.queryByText("Walking in Power")).not.toBeInTheDocument();
  });
});
