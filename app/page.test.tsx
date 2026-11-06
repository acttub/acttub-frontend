import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import Home from "./page"
import { Providers } from "./providers"

const originalFetch = globalThis.fetch

function renderHome() {
  return render(
    <Providers>
      <Home />
    </Providers>
  )
}

async function fillIntake(user: ReturnType<typeof userEvent.setup>) {
  await user.upload(
    screen.getByLabelText("영상 파일"),
    new File(["video"], "scene.mp4", { type: "video/mp4" })
  )
  await user.click(screen.getByRole("radio", { name: "영화" }))
  await user.type(
    screen.getByLabelText("장면 상황"),
    "불합격 전화를 받지만 친구 앞에서는 괜찮은 척한다"
  )
  await user.type(
    screen.getByLabelText("인물 설정"),
    "마지막 기회라고 믿고 오디션을 준비한 배우 지망생"
  )
  await user.type(
    screen.getByLabelText("초기 연기 의도"),
    "무너지지 않은 사람처럼 보이고 싶다"
  )
}

describe("Home", () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it("renders an intake-first diagnosis flow", () => {
    renderHome()

    expect(
      screen.getByRole("heading", { name: "연기 진단을 위한 기본 정보를 알려주세요" })
    ).toBeInTheDocument()
    expect(screen.getByText("acttub")).toHaveClass(
      "text-2xl",
      "font-black",
      "text-[#2272eb]"
    )
    expect(screen.queryByText("acttub diagnosis")).not.toBeInTheDocument()
    expect(screen.queryByText("diagnosis")).not.toBeInTheDocument()
    expect(screen.queryByText("AI 코칭")).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Toss" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Karrot" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Baemin" })).toBeInTheDocument()
    expect(screen.getByLabelText("영상 파일")).toBeInTheDocument()
    expect(screen.getByLabelText("영상 파일")).toHaveAttribute(
      "accept",
      "video/*,.mp4,.m4v,.mov,.webm"
    )
    expect(screen.getByLabelText("영상 파일")).toHaveClass(
      "absolute",
      "inset-0",
      "opacity-0"
    )
    expect(screen.getByLabelText("장면 상황")).toBeInTheDocument()
    expect(screen.getByLabelText("인물 설정")).toBeInTheDocument()
    expect(screen.getByLabelText("초기 연기 의도")).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "챗봇과 의도 구체화" })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("link", { name: "비공개 테스트 사전 등록" })
    ).toHaveAttribute("href", "/waitlist")
    expect(
      screen.getByRole("link", { name: "비공개 테스트 사전 등록" })
    ).toHaveClass("h-11", "px-4", "text-base")
    expect(screen.getByText("1 기본 정보")).toBeInTheDocument()
    expect(screen.getByText("2 챗봇 구체화")).toBeInTheDocument()
    expect(screen.getByText("3 진단 메모")).toBeInTheDocument()
  })

  it("uses native radio inputs for genre selection on mobile Safari", async () => {
    const user = userEvent.setup()
    renderHome()

    const movieGenre = screen.getByRole("radio", { name: "영화" })
    expect(movieGenre).toBeInstanceOf(HTMLInputElement)

    await user.click(movieGenre)

    expect(movieGenre).toBeChecked()
    expect(screen.getByRole("radio", { name: "연극" })).not.toBeChecked()
  })

  it("switches visual style without losing the intake flow", async () => {
    const user = userEvent.setup()
    renderHome()

    await user.click(screen.getByRole("button", { name: "Karrot" }))

    expect(screen.getByText("Karrot 스타일")).toBeInTheDocument()
    expect(
      screen.getByText("동네 게시판처럼 따뜻하고 빠르게 스캔되는 구성")
    ).toBeInTheDocument()
    expect(screen.getByLabelText("장면 상황")).toBeInTheDocument()
  })

  it("submits intake and renders the first backend question", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          coachingId: "server-chat",
          status: "QUESTION_READY",
          createdAt: "2026-06-28T12:00:00+09:00",
          input: {
            genre: "영화",
            customGenre: null,
            situation: "불합격 전화를 받지만 친구 앞에서는 괜찮은 척한다",
            characterSetting: "마지막 기회라고 믿고 오디션을 준비한 배우 지망생",
            subtext: "무너지지 않은 사람처럼 보이고 싶다",
          },
          dialogue: {
            question: "상대가 다시 말을 걸었을 때 가장 숨기고 싶은 감정은 무엇인가요?",
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
    const user = userEvent.setup()
    renderHome()

    await fillIntake(user)
    await user.click(screen.getByRole("button", { name: "챗봇과 의도 구체화" }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/coachings",
        expect.objectContaining({
          method: "POST",
          body: expect.any(FormData),
        })
      )
    })
    expect(
      screen.getByRole("heading", { name: "챗봇과 장면 의도 구체화" })
    ).toBeInTheDocument()
    expect(
      screen.getByText("상대가 다시 말을 걸었을 때 가장 숨기고 싶은 감정은 무엇인가요?")
    ).toBeInTheDocument()
    expect(screen.getByLabelText("챗봇 답변")).toBeInTheDocument()
    expect(screen.getByText("불합격 전화를 받지만 친구 앞에서는 괜찮은 척한다")).toBeInTheDocument()
  })

  it("shows a visible error when chatbot setup fails before the chat opens", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({
          error: {
            message: "코칭 요청을 처리하지 못했습니다.",
          },
        }),
      })
    )
    const user = userEvent.setup()
    renderHome()

    await fillIntake(user)
    await user.click(screen.getByRole("button", { name: "챗봇과 의도 구체화" }))

    expect(
      await screen.findByRole("alert", {
        name: "",
      })
    ).toHaveTextContent("코칭 요청을 처리하지 못했습니다.")
  })

  it("accepts mobile Safari video files when the browser omits the MIME type", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          coachingId: "safari-video",
          status: "QUESTION_READY",
          createdAt: "2026-06-28T12:00:00+09:00",
          dialogue: {
            question: "Safari에서 올라온 영상의 의도를 말해볼까요?",
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
    const user = userEvent.setup()
    renderHome()

    await user.upload(
      screen.getByLabelText("영상 파일"),
      new File(["video"], "ios-camera.MOV", { type: "" })
    )
    await user.click(screen.getByRole("radio", { name: "영화" }))
    await user.type(screen.getByLabelText("장면 상황"), "모바일 Safari에서 올린 영상")
    await user.type(screen.getByLabelText("인물 설정"), "휴대폰으로 촬영한 배우")
    await user.click(screen.getByRole("button", { name: "챗봇과 의도 구체화" }))

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
    expect((body.get("video") as File).type).toBe("video/quicktime")
    expect(
      await screen.findByText("Safari에서 올라온 영상의 의도를 말해볼까요?")
    ).toBeInTheDocument()
  })

  it("sends backend chat messages until diagnosis is ready and renders diagnosis wording", async () => {
    const createResponse = {
      data: {
        coachingId: "home-diagnosis",
        status: "QUESTION_READY",
        createdAt: "2026-06-28T12:00:00+09:00",
        input: {
          genre: "영화",
          customGenre: null,
          situation: "불합격 전화를 받지만 친구 앞에서는 괜찮은 척한다",
          characterSetting: "마지막 기회라고 믿고 오디션을 준비한 배우 지망생",
          subtext: "무너지지 않은 사람처럼 보이고 싶다",
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
    }
    const secondQuestionResponse = {
      data: {
        coachingId: "home-diagnosis",
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
    }
    const thirdQuestionResponse = {
      data: {
        coachingId: "home-diagnosis",
        status: "IN_CONVERSATION",
        createdAt: "2026-06-28T12:00:00+09:00",
        dialogue: {
          question: "상대에게 어떤 반응을 기대하나요?",
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
        coachingId: "home-diagnosis",
        status: "READY_FOR_DIAGNOSIS",
        createdAt: "2026-06-28T12:00:00+09:00",
        conversation: {
          turnIndex: 3,
          minTurns: 3,
          maxTurns: 7,
          diagnosisReady: true,
          summary: "상실감을 숨기고 상대가 알아봐주길 바란다는 점이 구체화되었습니다.",
        },
      },
    }
    const completedResponse = {
      data: {
        coachingId: "home-diagnosis",
        status: "COMPLETED",
        createdAt: "2026-06-28T12:00:00+09:00",
        completedAt: "2026-06-28T12:00:05+09:00",
        conversation: {
          turnIndex: 3,
          minTurns: 3,
          maxTurns: 7,
          diagnosisReady: true,
        },
        result: {
          overallStrength: {
            text: "감정을 바로 설명하지 않고 버티는 힘이 보여요.",
          },
          feedbackCards: [
            {
              order: 1,
              title: "첫 반응에서 목적이 조금 늦게 보였어요",
              observations: [
                {
                  timecode: "0:00-0:12",
                  text: "전화를 받은 직후 시선이 멈추며 호흡이 얕아졌습니다.",
                },
              ],
              cause: "숨기고 싶은 감정이 강해지며 상대에게 원하는 반응이 늦게 드러났어요.",
              practiceSteps: ["첫 대사 전 상대를 한 번 보고 숨을 내쉬기"],
              expectedEffect: "인물의 목적이 더 빨리 전달됩니다.",
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
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            evaluationId: "1",
            coachingId: "home-diagnosis",
            rating: 5,
            comment:
              "[연습 방법이 도움됐어요] 다음 연습 때 바로 적용할 수 있을 것 같아요.",
            createdAt: "2026-06-28T12:01:00+09:00",
          },
        }),
      })
    vi.stubGlobal("fetch", fetchMock)
    const user = userEvent.setup()
    renderHome()

    await fillIntake(user)
    await user.click(screen.getByRole("button", { name: "챗봇과 의도 구체화" }))
    await screen.findByText("가장 숨기고 싶은 감정은 무엇인가요?")
    await user.type(screen.getByLabelText("챗봇 답변"), "상실감")
    await user.click(screen.getByRole("button", { name: "답변 보내기" }))
    await screen.findByText("그 감정을 숨기는 이유는 무엇인가요?")
    await user.type(screen.getByLabelText("챗봇 답변"), "약해 보이고 싶지 않아서")
    await user.click(screen.getByRole("button", { name: "답변 보내기" }))
    await screen.findByText("상대에게 어떤 반응을 기대하나요?")
    await user.type(screen.getByLabelText("챗봇 답변"), "티 내지 않아도 알아봐주기")
    await user.click(screen.getByRole("button", { name: "답변 보내기" }))

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
    expect(body.get("video")).toBeInstanceOf(File)
    expect(body.get("genre")).toBe("영화")
    expect(body.get("customGenre")).toBe("")
    expect(body.get("situation")).toBe("불합격 전화를 받지만 친구 앞에서는 괜찮은 척한다")
    expect(body.get("characterSetting")).toBe(
      "마지막 기회라고 믿고 오디션을 준비한 배우 지망생"
    )
    expect(body.get("subtext")).toBe(
      "무너지지 않은 사람처럼 보이고 싶다"
    )
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/coachings/home-diagnosis/messages",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ answer: "상실감" }),
      })
    )
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/coachings/home-diagnosis/messages",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ answer: "약해 보이고 싶지 않아서" }),
      })
    )
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/coachings/home-diagnosis/diagnosis",
      expect.objectContaining({
        method: "POST",
      })
    )
    expect(
      await screen.findByRole("heading", { name: "진단 메모" })
    ).toBeInTheDocument()
    expect(
      screen.queryByRole("heading", { name: "챗봇과 장면 의도 구체화" })
    ).not.toBeInTheDocument()
    expect(
      screen.getByText("감정을 바로 설명하지 않고 버티는 힘이 보여요.")
    ).toBeInTheDocument()
    expect(screen.getByText("관찰된 경향")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "정식 오픈 알림 받기" })).toHaveAttribute(
      "href",
      "/waitlist"
    )

    await user.click(screen.getByRole("button", { name: "5점" }))
    await user.click(screen.getByRole("button", { name: "연습 방법이 도움됐어요" }))
    await user.type(
      screen.getByLabelText("추가 의견"),
      "다음 연습 때 바로 적용할 수 있을 것 같아요."
    )
    await user.click(screen.getByRole("button", { name: "의견 남기기" }))

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/coachings/home-diagnosis/evaluation",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          rating: 5,
          comment:
            "[연습 방법이 도움됐어요] 다음 연습 때 바로 적용할 수 있을 것 같아요.",
        }),
      })
    )
    expect(screen.getByText("의견이 기록되었습니다.")).toBeInTheDocument()
  })

  it("announces validation errors before opening the chatbot", async () => {
    const user = userEvent.setup()
    renderHome()

    await user.click(screen.getByRole("button", { name: "챗봇과 의도 구체화" }))

    expect(await screen.findByText("상황을 입력해 주세요.")).toHaveAttribute(
      "role",
      "alert"
    )
    expect(screen.getByLabelText("장면 상황")).toHaveAttribute(
      "aria-describedby",
      "situation-error"
    )
    expect(screen.getByLabelText("영상 파일")).toHaveAttribute(
      "aria-describedby",
      "video-error"
    )
  })

  it("calls diagnosis after the backend marks the conversation ready", async () => {
    const createResponse = {
      data: {
        coachingId: "ready-home",
        status: "QUESTION_READY",
        createdAt: "2026-06-28T12:00:00+09:00",
        input: {
          genre: "영화",
          customGenre: null,
          situation: "불합격 전화를 받지만 친구 앞에서는 괜찮은 척한다",
          characterSetting: "마지막 기회라고 믿고 오디션을 준비한 배우 지망생",
          subtext: "무너지지 않은 사람처럼 보이고 싶다",
        },
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
    const readyResponse = {
      data: {
        coachingId: "ready-home",
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
        coachingId: "ready-home",
        status: "COMPLETED",
        createdAt: "2026-06-28T12:00:00+09:00",
        completedAt: "2026-06-28T12:00:05+09:00",
        conversation: {
          turnIndex: 3,
          minTurns: 3,
          maxTurns: 7,
          diagnosisReady: true,
        },
        result: {
          overallStrength: {
            text: "긴장감을 숨기려는 선택이 인물의 상태와 잘 맞습니다.",
          },
          feedbackCards: [
            {
              order: 1,
              title: "기다리는 동안의 호흡이 진단 포인트예요",
              observations: [
                {
                  timecode: "0:00-0:08",
                  text: "시선은 안정적이지만 호흡이 빠르게 올라왔습니다.",
                },
              ],
              cause: "불안을 숨기려는 의도가 몸의 긴장으로 먼저 드러났어요.",
              practiceSteps: ["첫 대사 전 숨을 길게 내쉬기"],
              expectedEffect: "불안과 통제가 함께 보입니다.",
            },
          ],
        },
      },
    }
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => createResponse })
      .mockResolvedValueOnce({ ok: true, json: async () => readyResponse })
      .mockResolvedValueOnce({ ok: true, json: async () => completedResponse })
    vi.stubGlobal("fetch", fetchMock)
    const user = userEvent.setup()
    renderHome()

    await fillIntake(user)
    await user.click(screen.getByRole("button", { name: "챗봇과 의도 구체화" }))
    await screen.findByText("첫 질문입니다.")
    await user.type(screen.getByLabelText("챗봇 답변"), "괜찮다는 말을 듣고 싶다")
    await user.click(screen.getByRole("button", { name: "답변 보내기" }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/coachings/ready-home/diagnosis",
        expect.objectContaining({
          method: "POST",
        })
      )
    })
    expect(
      await screen.findByRole("heading", { name: "진단 메모" })
    ).toBeInTheDocument()
    expect(
      screen.queryByRole("heading", { name: "챗봇과 장면 의도 구체화" })
    ).not.toBeInTheDocument()
    expect(
      screen.getByText("긴장감을 숨기려는 선택이 인물의 상태와 잘 맞습니다.")
    ).toBeInTheDocument()
  })

  it("restores stubbed globals between tests", () => {
    expect(globalThis.fetch).toBe(originalFetch)
  })
})
