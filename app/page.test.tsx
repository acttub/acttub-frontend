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

describe("Home", () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it("renders the coaching form with three design styles", () => {
    renderHome()

    expect(
      screen.getByRole("heading", { name: "연기 연습 피드백" })
    ).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Toss" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Karrot" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Baemin" })).toBeInTheDocument()
    expect(screen.getByLabelText("영상 파일")).toBeInTheDocument()
    expect(screen.getByLabelText("상황")).toBeInTheDocument()
    expect(screen.getByLabelText("인물 설정")).toBeInTheDocument()
    expect(screen.getByLabelText("서브텍스트")).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "AI로 분석" })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("radiogroup", { name: "매체 / 장르" })
    ).toBeInTheDocument()
    expect(screen.getByRole("radio", { name: "연극" })).toBeChecked()
  })

  it("switches visual style without losing the coaching form", async () => {
    const user = userEvent.setup()
    renderHome()

    await user.click(screen.getByRole("button", { name: "Karrot" }))

    expect(screen.getByText("Karrot 스타일")).toBeInTheDocument()
    expect(
      screen.getByText("동네 게시판처럼 따뜻하고 빠르게 스캔되는 구성")
    ).toBeInTheDocument()
    expect(screen.getByLabelText("상황")).toBeInTheDocument()
  })

  it("announces the selected genre to assistive technology", async () => {
    const user = userEvent.setup()
    renderHome()

    await user.click(screen.getByRole("radio", { name: "영화" }))

    expect(screen.getByRole("radio", { name: "영화" })).toBeChecked()
    expect(screen.getByRole("radio", { name: "연극" })).not.toBeChecked()
  })

  it("provides a visible keyboard focus style for video upload", async () => {
    const user = userEvent.setup()
    renderHome()

    await user.tab()
    await user.tab()
    await user.tab()
    await user.tab()

    expect(screen.getByLabelText("영상 파일")).toHaveFocus()
    expect(screen.getByLabelText("영상 파일").closest("label")).toHaveClass(
      "focus-within:ring-4"
    )
  })

  it("constrains long uploaded filenames inside the upload dropzone", async () => {
    const user = userEvent.setup()
    renderHome()
    const longFilename = `${"scene".repeat(40)}.mp4`

    await user.upload(
      screen.getByLabelText("영상 파일"),
      new File(["video"], longFilename, { type: "video/mp4" })
    )

    expect(screen.getByText(longFilename)).toHaveClass("max-w-full", "truncate")
  })

  it("posts a coaching request and renders feedback cards", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          coachingId: "1",
          status: "COMPLETED",
          createdAt: "2026-06-20T18:10:00+09:00",
          completedAt: "2026-06-20T18:10:12+09:00",
          input: {
            genre: "영화",
            customGenre: null,
            situation: "헤어진 연인을 우연히 다시 만난 상황",
            characterSetting: "감정을 쉽게 드러내지 않는 배우 지망생",
            subtext: "아직 미련이 있지만 괜찮은 척한다",
          },
          result: {
            overallStrength: {
              text: "감정을 바로 터뜨리지 않고 버티는 힘이 보여요.",
            },
            feedbackCards: [
              {
                order: 1,
                title: "도입부 긴장이 먼저 올라왔어요",
                observations: [
                  {
                    timecode: "0:00-0:15",
                    text: "첫 대사 전부터 어깨와 목소리가 굳어 있었습니다.",
                  },
                ],
                cause: "부담이 감정보다 먼저 몸을 방어 자세로 만들었어요.",
                practiceSteps: [
                  "촬영 직전 어깨를 귀까지 올렸다가 툭 떨어뜨리기 5회",
                ],
                expectedEffect: "감정이 후반까지 더 선명하게 쌓여요.",
              },
            ],
          },
        },
      }),
    })
    vi.stubGlobal("fetch", fetchMock)
    const user = userEvent.setup()
    renderHome()

    await user.upload(
      screen.getByLabelText("영상 파일"),
      new File(["video"], "scene.mp4", { type: "video/mp4" })
    )
    await user.click(screen.getByRole("radio", { name: "영화" }))
    await user.type(
      screen.getByLabelText("상황"),
      "헤어진 연인을 우연히 다시 만난 상황"
    )
    await user.type(
      screen.getByLabelText("인물 설정"),
      "감정을 쉽게 드러내지 않는 배우 지망생"
    )
    await user.type(
      screen.getByLabelText("서브텍스트"),
      "아직 미련이 있지만 괜찮은 척한다"
    )
    await user.click(screen.getByRole("button", { name: "AI로 분석" }))

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
    expect(body.get("situation")).toBe("헤어진 연인을 우연히 다시 만난 상황")
    expect(body.get("characterSetting")).toBe(
      "감정을 쉽게 드러내지 않는 배우 지망생"
    )
    expect(body.get("subtext")).toBe("아직 미련이 있지만 괜찮은 척한다")
    expect(
      await screen.findByText("감정을 바로 터뜨리지 않고 버티는 힘이 보여요.")
    ).toBeInTheDocument()
    expect(screen.getByText("도입부 긴장이 먼저 올라왔어요")).toBeInTheDocument()
  })

  it("handles pending coaching responses without feedback output", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          coachingId: "2",
          status: "ANALYZING",
          createdAt: "2026-06-20T18:10:00+09:00",
          completedAt: null,
          input: {
            genre: "영화",
            customGenre: null,
            situation: "오디션을 기다리는 상황",
            characterSetting: "긴장한 배우 지망생",
            subtext: null,
          },
          result: null,
        },
      }),
    })
    vi.stubGlobal("fetch", fetchMock)
    const user = userEvent.setup()
    renderHome()

    await user.upload(
      screen.getByLabelText("영상 파일"),
      new File(["video"], "scene.mp4", { type: "video/mp4" })
    )
    await user.click(screen.getByRole("radio", { name: "영화" }))
    await user.type(screen.getByLabelText("상황"), "오디션을 기다리는 상황")
    await user.type(screen.getByLabelText("인물 설정"), "긴장한 배우 지망생")
    await user.click(screen.getByRole("button", { name: "AI로 분석" }))

    expect(await screen.findByText("분석 중")).toBeInTheDocument()
    expect(
      screen.getByText("코칭 ID 2의 분석이 아직 진행 중입니다.")
    ).toBeInTheDocument()
  })

  it("restores stubbed globals between tests", () => {
    expect(globalThis.fetch).toBe(originalFetch)
  })
})
