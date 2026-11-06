import { afterEach, describe, expect, it, vi } from "vitest"

import { POST } from "./route"

describe("POST /api/waitlist", () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it("proxies waitlist registration requests to the backend API", async () => {
    const backendResponse = { data: { accepted: true, waitlistId: "1" } }
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(backendResponse), {
        status: 201,
        headers: {
          "content-type": "application/json",
        },
      })
    )
    vi.stubGlobal("fetch", fetchMock)

    const payload = {
      email: "actor@example.com",
      actorStatus: "배우 지망생",
      helpTopic: "서브텍스트 정리",
      consent: true,
      website: "",
    }
    const response = await POST(
      new Request("http://localhost:3000/api/waitlist", {
        method: "POST",
        body: JSON.stringify(payload),
      })
    )

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8080/api/v1/waitlist",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
    )
    expect(response.status).toBe(201)
    expect(response.headers.get("content-type")).toContain("application/json")
    await expect(response.json()).resolves.toEqual(backendResponse)
  })
})
