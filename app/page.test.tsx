import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import Home from "./page"

describe("Home", () => {
  it("renders the project foundation", () => {
    render(<Home />)

    expect(
      screen.getByRole("heading", { name: /acttub frontend/i })
    ).toBeInTheDocument()
    expect(screen.getByText("Next.js App Router", { selector: "dd" }))
      .toBeInTheDocument()
  })
})
