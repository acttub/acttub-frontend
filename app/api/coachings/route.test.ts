import { afterEach, describe, expect, it, vi } from "vitest"

import { POST } from "./route"

describe("POST /api/coachings", () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it("proxies multipart coaching requests to the backend API", async () => {
    const backendResponse = {
      data: {
        coachingId: "1",
        status: "COMPLETED",
      },
    }
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(backendResponse), {
        status: 201,
        headers: {
          "content-type": "application/json",
        },
      })
    )
    vi.stubGlobal("fetch", fetchMock)
    const formData = new FormData()
    formData.append("genre", "영화")

    const response = await POST(
      new Request("http://localhost:3000/api/coachings", {
        method: "POST",
        body: formData,
      })
    )

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8080/api/v1/coachings",
      expect.objectContaining({
        method: "POST",
        body: expect.anything(),
      })
    )
    const proxiedBody = fetchMock.mock.calls[0]?.[1]?.body as FormData
    expect(proxiedBody.get("genre")).toBe("영화")
    expect(response.status).toBe(201)
    expect(response.headers.get("content-type")).toContain("application/json")
    await expect(response.json()).resolves.toEqual(backendResponse)
  })
})
