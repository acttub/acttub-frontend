import { afterEach, describe, expect, it, vi } from "vitest"

import {
  createCoachingDiagnosis,
  sendCoachingMessage,
  submitCoaching,
  submitCoachingAndWait,
  submitCoachingEvaluation,
  type CoachingRequest,
} from "./coaching-api"

function createCoachingRequest(video: File): CoachingRequest {
  return {
    video,
    genre: "영화",
    customGenre: "",
    situation: "오디션을 기다리는 상황",
    characterSetting: "긴장한 배우 지망생",
    subtext: "불안",
  }
}

describe("submitCoaching", () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it("uploads the compressed video file when compression returns a smaller file", async () => {
    const original = new File(["original video bytes"], "scene.mp4", {
      type: "video/mp4",
    })
    const compressed = new File(["small"], "scene.mp4", {
      type: "video/mp4",
    })
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          coachingId: "compressed-upload",
          status: "QUESTION_READY",
          createdAt: "2026-06-28T12:00:00+09:00",
          input: {
            genre: "영화",
            customGenre: null,
            situation: "오디션을 기다리는 상황",
            characterSetting: "긴장한 배우 지망생",
            subtext: "불안",
          },
          dialogue: {
            question: "가장 숨기고 싶은 감정은 무엇인가요?",
          },
          conversation: {
            turnIndex: 0,
            minTurns: 3,
            maxTurns: 7,
            diagnosisReady: false,
          },
        },
      }),
    })
    vi.stubGlobal("fetch", fetchMock)

    await submitCoaching(createCoachingRequest(original), {
      videoCompressor: vi.fn().mockResolvedValue(compressed),
    })

    const formData = fetchMock.mock.calls[0]?.[1]?.body as FormData
    const uploadedVideo = formData.get("video") as File
    expect(uploadedVideo.name).toBe(compressed.name)
    expect(uploadedVideo.size).toBe(compressed.size)
    expect(uploadedVideo.type).toBe(compressed.type)
  })

  it("keeps the original video when compression changes the container type", async () => {
    const original = new File(["original video bytes"], "scene.mp4", {
      type: "video/mp4",
    })
    const compressed = new File(["small"], "scene.webm", {
      type: "video/webm;codecs=vp9",
    })
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          coachingId: "compressed-upload",
          status: "QUESTION_READY",
          createdAt: "2026-06-28T12:00:00+09:00",
        },
      }),
    })
    vi.stubGlobal("fetch", fetchMock)

    await submitCoaching(createCoachingRequest(original), {
      videoCompressor: vi.fn().mockResolvedValue(compressed),
    })

    const formData = fetchMock.mock.calls[0]?.[1]?.body as FormData
    const uploadedVideo = formData.get("video") as File
    expect(uploadedVideo.name).toBe(original.name)
    expect(uploadedVideo.size).toBe(original.size)
    expect(uploadedVideo.type).toBe(original.type)
  })

  it("shows an actionable message when the backend AI analysis fails", async () => {
    const original = new File(["original video bytes"], "scene.mp4", {
      type: "video/mp4",
    })
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({
        error: {
          code: "AI_ANALYSIS_FAILED",
          message: "Coaching analysis failed.",
          details: {
            coachingId: "10",
            status: "FAILED",
          },
        },
      }),
    })
    vi.stubGlobal("fetch", fetchMock)

    await expect(
      submitCoaching(createCoachingRequest(original), {
        videoCompressor: vi.fn().mockResolvedValue(original),
      })
    ).rejects.toThrow(
      "AI 분석 서버 연결에 문제가 있어요. 잠시 후 다시 시도하거나 관리자에게 알려주세요."
    )
  })

  it("sends chatbot answers to the messages endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          coachingId: "1",
          status: "IN_CONVERSATION",
          createdAt: "2026-06-28T12:00:00+09:00",
          dialogue: {
            question: "그 감정을 숨기는 이유는 무엇인가요?",
          },
          conversation: {
            turnIndex: 1,
            minTurns: 3,
            maxTurns: 7,
            diagnosisReady: false,
          },
        },
      }),
    })
    vi.stubGlobal("fetch", fetchMock)

    const response = await sendCoachingMessage("1", {
      answer: "아직 미련이 있다는 걸 들키고 싶지 않았습니다.",
    })

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/coachings/1/messages",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answer: "아직 미련이 있다는 걸 들키고 싶지 않았습니다.",
        }),
      })
    )
    expect(response.status).toBe("IN_CONVERSATION")
    expect(response.dialogue?.question).toBe("그 감정을 숨기는 이유는 무엇인가요?")
  })

  it("creates the final diagnosis from the diagnosis endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          coachingId: "1",
          status: "COMPLETED",
          createdAt: "2026-06-28T12:00:00+09:00",
          completedAt: "2026-06-28T12:03:00+09:00",
          conversation: {
            turnIndex: 4,
            minTurns: 3,
            maxTurns: 7,
            diagnosisReady: true,
          },
          result: {
            overallStrength: {
              text: "감정을 바로 터뜨리지 않고 버티는 힘이 보여요.",
            },
            feedbackCards: [],
          },
        },
      }),
    })
    vi.stubGlobal("fetch", fetchMock)

    const response = await createCoachingDiagnosis("1")

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/coachings/1/diagnosis",
      expect.objectContaining({
        method: "POST",
      })
    )
    expect(response.status).toBe("COMPLETED")
    expect(response.result?.overallStrength.text).toBe(
      "감정을 바로 터뜨리지 않고 버티는 힘이 보여요."
    )
  })

  it("submits result evaluation to the evaluation endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          evaluationId: "1",
          coachingId: "1",
          rating: 4,
          comment: "연습 방법이 구체적이었어요.",
          createdAt: "2026-06-28T12:04:00+09:00",
        },
      }),
    })
    vi.stubGlobal("fetch", fetchMock)

    await submitCoachingEvaluation("1", {
      rating: 4,
      comment: "연습 방법이 구체적이었어요.",
    })

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/coachings/1/evaluation",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating: 4,
          comment: "연습 방법이 구체적이었어요.",
        }),
      })
    )
  })

  it("uses message turns and diagnosis creation when waiting for a prepared conversation", async () => {
    const original = new File(["video"], "scene.mp4", {
      type: "video/mp4",
    })
    const createResponse = {
      data: {
        coachingId: "prepared",
        status: "QUESTION_READY",
        createdAt: "2026-06-28T12:00:00+09:00",
        dialogue: {
          question: "첫 질문입니다.",
        },
        conversation: {
          turnIndex: 0,
          minTurns: 3,
          maxTurns: 7,
          diagnosisReady: false,
        },
      },
    }
    const secondQuestionResponse = {
      data: {
        coachingId: "prepared",
        status: "IN_CONVERSATION",
        createdAt: "2026-06-28T12:00:00+09:00",
        dialogue: {
          question: "두 번째 질문입니다.",
        },
        conversation: {
          turnIndex: 1,
          minTurns: 3,
          maxTurns: 7,
          diagnosisReady: false,
        },
      },
    }
    const thirdQuestionResponse = {
      data: {
        coachingId: "prepared",
        status: "IN_CONVERSATION",
        createdAt: "2026-06-28T12:00:00+09:00",
        dialogue: {
          question: "세 번째 질문입니다.",
        },
        conversation: {
          turnIndex: 2,
          minTurns: 3,
          maxTurns: 7,
          diagnosisReady: false,
        },
      },
    }
    const readyResponse = {
      data: {
        coachingId: "prepared",
        status: "READY_FOR_DIAGNOSIS",
        createdAt: "2026-06-28T12:00:00+09:00",
        conversation: {
          turnIndex: 3,
          minTurns: 3,
          maxTurns: 7,
          diagnosisReady: true,
        },
      },
    }
    const completedResponse = {
      data: {
        coachingId: "prepared",
        status: "COMPLETED",
        createdAt: "2026-06-28T12:00:00+09:00",
        completedAt: "2026-06-28T12:03:00+09:00",
        result: {
          overallStrength: {
            text: "대화 기준으로 진단이 생성되었습니다.",
          },
          feedbackCards: [],
        },
      },
    }
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => createResponse })
      .mockResolvedValueOnce({ ok: true, json: async () => secondQuestionResponse })
      .mockResolvedValueOnce({ ok: true, json: async () => thirdQuestionResponse })
      .mockResolvedValueOnce({ ok: true, json: async () => readyResponse })
      .mockResolvedValueOnce({ ok: true, json: async () => completedResponse })
    vi.stubGlobal("fetch", fetchMock)

    const response = await submitCoachingAndWait(createCoachingRequest(original), {
      videoCompressor: vi.fn().mockResolvedValue(original),
    })

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/coachings/prepared/messages",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ answer: "오디션을 기다리는 상황" }),
      })
    )
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/coachings/prepared/messages",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ answer: "긴장한 배우 지망생" }),
      })
    )
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/coachings/prepared/messages",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ answer: "불안" }),
      })
    )
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/coachings/prepared/diagnosis",
      expect.objectContaining({
        method: "POST",
      })
    )
    expect(response.status).toBe("COMPLETED")
  })
})
