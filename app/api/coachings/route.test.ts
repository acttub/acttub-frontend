import { afterEach, describe, expect, it, vi } from "vitest"

import { POST as CREATE_DIAGNOSIS } from "./[coachingId]/diagnosis/route"
import { POST as CREATE_EVALUATION } from "./[coachingId]/evaluation/route"
import { POST as CREATE_MESSAGE } from "./[coachingId]/messages/route"
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

  it("proxies coaching message requests to the backend API", async () => {
    const backendResponse = {
      data: {
        coachingId: "1",
        status: "IN_CONVERSATION",
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

    const response = await CREATE_MESSAGE(
      new Request("http://localhost:3000/api/coachings/1/messages", {
        method: "POST",
        body: JSON.stringify({ answer: "아직 미련이 있습니다." }),
      }),
      {
        params: Promise.resolve({ coachingId: "1" }),
      }
    )

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8080/api/v1/coachings/1/messages",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer: "아직 미련이 있습니다." }),
      })
    )
    expect(response.status).toBe(201)
    expect(response.headers.get("content-type")).toContain("application/json")
    await expect(response.json()).resolves.toEqual(backendResponse)
  })

  it("proxies diagnosis creation requests to the backend API", async () => {
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

    const response = await CREATE_DIAGNOSIS(
      new Request("http://localhost:3000/api/coachings/1/diagnosis", {
        method: "POST",
      }),
      {
        params: Promise.resolve({ coachingId: "1" }),
      }
    )

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8080/api/v1/coachings/1/diagnosis",
      expect.objectContaining({
        method: "POST",
      })
    )
    expect(response.status).toBe(201)
    expect(response.headers.get("content-type")).toContain("application/json")
    await expect(response.json()).resolves.toEqual(backendResponse)
  })

  it("proxies evaluation requests to the backend API", async () => {
    const backendResponse = {
      data: {
        evaluationId: "1",
        coachingId: "1",
        rating: 5,
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

    const response = await CREATE_EVALUATION(
      new Request("http://localhost:3000/api/coachings/1/evaluation", {
        method: "POST",
        body: JSON.stringify({ rating: 5, comment: "도움됐어요." }),
      }),
      {
        params: Promise.resolve({ coachingId: "1" }),
      }
    )

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8080/api/v1/coachings/1/evaluation",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: 5, comment: "도움됐어요." }),
      })
    )
    expect(response.status).toBe(201)
    expect(response.headers.get("content-type")).toContain("application/json")
    await expect(response.json()).resolves.toEqual(backendResponse)
  })
})
