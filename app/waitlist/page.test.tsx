import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import Waitlist from "./page"

function renderWaitlist() {
  return render(<Waitlist />)
}

describe("Waitlist", () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it("renders the current acttub waitlist form", () => {
    renderWaitlist()

    expect(screen.getByRole("main")).toHaveClass("bg-[#f2f4f6]", "text-[#191f28]")
    expect(screen.getByText("acttub")).toHaveClass(
      "text-2xl",
      "font-black",
      "text-[#2272eb]"
    )
    expect(screen.queryByText("acttub diagnosis")).not.toBeInTheDocument()
    expect(
      screen.getByRole("heading", {
        name: "대사 밑에 숨은 마음을, AI 질문으로 찾아보세요",
      })
    ).toBeInTheDocument()
    expect(screen.getByText("정식 오픈 전 · 비공개 테스트")).toBeInTheDocument()
    expect(screen.getByLabelText("이메일 (필수)")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "연기 입시 준비 중" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "인물의 목적 찾기" })).toBeInTheDocument()
    expect(
      screen.getByLabelText(/테스트 안내 메일 발송을 위해 이메일을 수집/)
    ).toBeInTheDocument()
    expect(screen.getByLabelText("website")).toHaveAttribute("aria-hidden", "true")
    expect(screen.getByRole("button", { name: "테스트 오픈 알림 받기" })).toBeDisabled()
  })

  it("enables submit after valid email and consent, then sends selected chips", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          accepted: true,
          waitlistId: "1",
          email: "actor@example.com",
          actorStatus: "배우 지망생",
          helpTopic: "서브텍스트 정리",
          createdAt: "2026-06-28T12:00:00+09:00",
        },
      }),
    })
    vi.stubGlobal("fetch", fetchMock)
    const user = userEvent.setup()
    renderWaitlist()

    await user.type(screen.getByLabelText("이메일 (필수)"), "actor@example.com")
    await user.click(screen.getByRole("button", { name: "배우 지망생" }))
    await user.click(screen.getByRole("button", { name: "서브텍스트 정리" }))
    await user.click(
      screen.getByLabelText(/테스트 안내 메일 발송을 위해 이메일을 수집/)
    )

    expect(screen.getByRole("button", { name: "배우 지망생" })).toHaveAttribute(
      "aria-pressed",
      "true"
    )
    expect(screen.getByRole("button", { name: "배우 지망생" })).toHaveClass(
      "border-[#3182f6]",
      "bg-[#e8f3ff]",
      "text-[#1b64da]"
    )
    expect(screen.getByRole("button", { name: "서브텍스트 정리" })).toHaveAttribute(
      "aria-pressed",
      "true"
    )
    expect(screen.getByRole("button", { name: "테스트 오픈 알림 받기" })).toBeEnabled()
    expect(screen.getByRole("button", { name: "테스트 오픈 알림 받기" })).toHaveClass(
      "bg-[#3182f6]",
      "hover:bg-[#2272eb]"
    )

    await user.click(screen.getByRole("button", { name: "테스트 오픈 알림 받기" }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/waitlist",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "actor@example.com",
            actorStatus: "배우 지망생",
            helpTopic: "서브텍스트 정리",
            consent: true,
            website: "",
          }),
        })
      )
    })
    expect(
      await screen.findByRole("heading", { name: "신청이 완료되었습니다" })
    ).toBeInTheDocument()
    expect(screen.getByRole("main")).toHaveClass("bg-[#f2f4f6]", "text-[#191f28]")
    expect(screen.getByRole("link", { name: "acttub 둘러보기" })).toHaveAttribute(
      "href",
      "/"
    )
  })

  it("shows a duplicate notice without leaving the form", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({
          error: {
            code: "WAITLIST_ALREADY_REGISTERED",
            message: "이미 신청된 이메일입니다.",
            details: {},
          },
        }),
      })
    )
    const user = userEvent.setup()
    renderWaitlist()

    await user.type(screen.getByLabelText("이메일 (필수)"), "actor@example.com")
    await user.click(
      screen.getByLabelText(/테스트 안내 메일 발송을 위해 이메일을 수집/)
    )
    await user.click(screen.getByRole("button", { name: "테스트 오픈 알림 받기" }))

    expect(await screen.findByRole("status")).toHaveTextContent("이미 신청된 이메일입니다.")
    expect(
      screen.queryByRole("heading", { name: "신청이 완료되었습니다" })
    ).not.toBeInTheDocument()
  })

  it("shows an alert when submission fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network")))
    const user = userEvent.setup()
    renderWaitlist()

    await user.type(screen.getByLabelText("이메일 (필수)"), "actor@example.com")
    await user.click(
      screen.getByLabelText(/테스트 안내 메일 발송을 위해 이메일을 수집/)
    )
    await user.click(screen.getByRole("button", { name: "테스트 오픈 알림 받기" }))

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "네트워크 오류로 접수하지 못했어요. 잠시 후 다시 시도해 주세요."
    )
  })
})
