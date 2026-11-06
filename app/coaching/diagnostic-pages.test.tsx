import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import KarrotPage from "./karrot/page"
import TossPage from "./toss/page"
import { Providers } from "../providers"

function renderWithProviders(ui: React.ReactNode) {
  return render(<Providers>{ui}</Providers>)
}

describe("Diagnostic coaching pages", () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it("renders the Karrot diagnostic chat page without changing the home page", () => {
    renderWithProviders(<KarrotPage />)

    expect(
      screen.getByRole("heading", { name: "오늘 장면을 같이 정리해볼게요" })
    ).toBeInTheDocument()
    expect(screen.getByText("따뜻한 진단 코치")).toBeInTheDocument()
    expect(screen.getByLabelText("답변 입력")).toBeInTheDocument()
    expect(screen.getByLabelText("영상 파일")).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "답변 보내기" })
    ).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Karrot" })).toHaveAttribute(
      "href",
      "/coaching/karrot"
    )
    expect(screen.getByRole("link", { name: "Toss" })).toHaveAttribute(
      "href",
      "/coaching/toss"
    )
    expect(screen.getByRole("link", { name: "Karrot" })).toHaveAttribute(
      "aria-current",
      "page"
    )
  })

  it("renders the Toss diagnostic chat page as a separate route variant", () => {
    renderWithProviders(<TossPage />)

    expect(
      screen.getByRole("heading", { name: "연기 의도를 먼저 정리해요" })
    ).toBeInTheDocument()
    expect(screen.getByText("명확한 진단 설계")).toBeInTheDocument()
    expect(screen.getByLabelText("답변 입력")).toBeInTheDocument()
    expect(screen.getByLabelText("영상 파일")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Karrot" })).toHaveAttribute(
      "href",
      "/coaching/karrot"
    )
    expect(screen.getByRole("link", { name: "Toss" })).toHaveAttribute(
      "href",
      "/coaching/toss"
    )
    expect(screen.getByRole("link", { name: "Toss" })).toHaveAttribute(
      "aria-current",
      "page"
    )
  })

  it("asks follow-up questions and turns the conversation into diagnosis criteria", async () => {
    const user = userEvent.setup()
    renderWithProviders(<KarrotPage />)

    expect(
      screen.getByText("장면에서 실제로 벌어진 일을 한 문장으로 말해볼까요?")
    ).toBeInTheDocument()

    await user.type(
      screen.getByLabelText("답변 입력"),
      "불합격 전화를 받지만 친구 앞에서는 괜찮은 척한다"
    )
    await user.click(screen.getByRole("button", { name: "답변 보내기" }))

    expect(
      screen.getByText("이 인물이 장면 끝까지 얻고 싶은 것은 무엇인가요?")
    ).toBeInTheDocument()

    await user.type(screen.getByLabelText("답변 입력"), "무너지지 않은 사람처럼 보이기")
    await user.click(screen.getByRole("button", { name: "답변 보내기" }))

    expect(
      screen.getByText("겉으로 숨기고 있는 감정은 무엇에 가장 가까울까요?")
    ).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "상실감" }))

    expect(screen.getByText("정리된 진단 기준")).toBeInTheDocument()
    expect(
      screen.getAllByText("불합격 전화를 받지만 친구 앞에서는 괜찮은 척한다")
    ).toHaveLength(2)
    expect(screen.getAllByText("무너지지 않은 사람처럼 보이기")).toHaveLength(2)
    expect(screen.getAllByText("상실감")).toHaveLength(2)
  })

  it("submits collected conversation as a coaching request and renders diagnosis wording", async () => {
    const createResponse = {
      data: {
        coachingId: "SOMA-151",
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
        coachingId: "SOMA-151",
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
        coachingId: "SOMA-151",
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
        coachingId: "SOMA-151",
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
        coachingId: "SOMA-151",
        status: "COMPLETED",
        createdAt: "2026-06-28T12:00:00+09:00",
        completedAt: "2026-06-28T12:00:06+09:00",
        input: {
          genre: "영화",
          customGenre: null,
          situation: "불합격 전화를 받지만 친구 앞에서는 괜찮은 척한다",
          characterSetting: "무너지지 않은 사람처럼 보이기",
          subtext: "상실감",
        },
        result: {
          overallStrength: {
            text: "감정을 바로 터뜨리지 않고 버티는 힘이 보여요.",
          },
          feedbackCards: [
            {
              order: 1,
              title: "첫 대사 전 긴장이 먼저 올라왔어요",
              observations: [
                {
                  timecode: "0:00-0:10",
                  text: "시선이 고정되면서 호흡이 얕아졌습니다.",
                },
              ],
              cause: "인물의 목적보다 긴장이 먼저 몸을 굳게 만들었어요.",
              practiceSteps: ["첫 대사 전 숨을 한 박자 늦게 내쉬기"],
              expectedEffect: "감정이 더 자연스럽게 쌓입니다.",
            },
          ],
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
    const user = userEvent.setup()
    renderWithProviders(<TossPage />)

    await user.upload(
      screen.getByLabelText("영상 파일"),
      new File(["video"], "scene.mp4", { type: "video/mp4" })
    )
    await user.click(screen.getByRole("radio", { name: "영화" }))
    await user.type(
      screen.getByLabelText("답변 입력"),
      "불합격 전화를 받지만 친구 앞에서는 괜찮은 척한다"
    )
    await user.click(screen.getByRole("button", { name: "답변 보내기" }))
    await user.type(screen.getByLabelText("답변 입력"), "무너지지 않은 사람처럼 보이기")
    await user.click(screen.getByRole("button", { name: "답변 보내기" }))
    await user.click(screen.getByRole("button", { name: "상실감" }))
    await user.click(screen.getByRole("button", { name: "진단 시작" }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/coachings",
        expect.objectContaining({
          method: "POST",
          body: expect.any(FormData),
        })
      )
    })
    const body = fetchMock.mock.calls[0]?.[1]?.body as FormData
    expect(body.get("genre")).toBe("영화")
    expect(body.get("situation")).toBe("불합격 전화를 받지만 친구 앞에서는 괜찮은 척한다")
    expect(body.get("characterSetting")).toBe("무너지지 않은 사람처럼 보이기")
    expect(body.get("subtext")).toBe("상실감")
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/coachings/SOMA-151/messages",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          answer: "불합격 전화를 받지만 친구 앞에서는 괜찮은 척한다",
        }),
      })
    )
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/coachings/SOMA-151/messages",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ answer: "무너지지 않은 사람처럼 보이기" }),
      })
    )
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/coachings/SOMA-151/messages",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ answer: "상실감" }),
      })
    )
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/coachings/SOMA-151/diagnosis",
      expect.objectContaining({
        method: "POST",
      })
    )
    expect(await screen.findByText("진단 메모")).toBeInTheDocument()
    expect(
      screen.getByText("감정을 바로 터뜨리지 않고 버티는 힘이 보여요.")
    ).toBeInTheDocument()
    expect(screen.getByText("관찰된 경향")).toBeInTheDocument()
  })
})
