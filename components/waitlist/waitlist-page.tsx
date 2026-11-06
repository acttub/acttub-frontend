"use client"

import { CheckCircle2, ChevronRight, Mail, Sparkles } from "lucide-react"
import Link from "next/link"
import { type FormEvent, useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const actorStatusOptions = [
  "연기 입시 준비 중",
  "연극영화과 재학 중",
  "배우 지망생",
  "현역 배우",
  "취미로 연기 연습 중",
  "기타",
]

const helpTopicOptions = [
  "대본 분석",
  "인물의 목적 찾기",
  "이전 상황 감정 정리",
  "현재 감정선 정리",
  "서브텍스트 정리",
  "기타",
]

type SubmitMessage = {
  kind: "notice" | "error"
  text: string
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function WaitlistPage() {
  const [email, setEmail] = useState("")
  const [actorStatus, setActorStatus] = useState("")
  const [helpTopic, setHelpTopic] = useState("")
  const [consent, setConsent] = useState(false)
  const [website, setWebsite] = useState("")
  const [message, setMessage] = useState<SubmitMessage | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDone, setIsDone] = useState(false)

  const canSubmit = useMemo(
    () => isValidEmail(email.trim()) && consent && !isSubmitting,
    [consent, email, isSubmitting]
  )

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canSubmit) return

    setIsSubmitting(true)
    setMessage(null)

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          actorStatus: actorStatus || undefined,
          helpTopic: helpTopic || undefined,
          consent,
          website,
        }),
      })
      const data = await response.json().catch(() => ({}))

      if (response.ok && data.data?.accepted) {
        setIsDone(true)
        return
      }

      if (data.error?.code === "WAITLIST_ALREADY_REGISTERED") {
        setMessage({
          kind: "notice",
          text: data.error?.message || "이미 신청된 이메일입니다.",
        })
        return
      }

      setMessage({
        kind: "error",
        text:
          data.error?.message ||
          "신청을 접수하지 못했어요. 잠시 후 다시 시도해 주세요.",
      })
    } catch {
      setMessage({
        kind: "error",
        text: "네트워크 오류로 접수하지 못했어요. 잠시 후 다시 시도해 주세요.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isDone) {
    return (
      <main className="min-h-svh bg-[#f2f4f6] px-4 py-6 text-[#191f28] sm:px-6 sm:py-10">
        <div className="mx-auto grid min-h-[calc(100svh-48px)] w-full max-w-[920px] gap-4">
          <WaitlistHeader />
          <section className="flex flex-1 items-center justify-center py-12">
            <div className="w-full max-w-[560px] rounded-2xl border border-[#e5e8eb] bg-white p-6 text-center shadow-[0_2px_8px_rgba(0,0,0,0.06)] sm:p-10">
              <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-[#3182f6] text-white">
                <CheckCircle2 className="size-7" aria-hidden="true" />
              </div>
              <h1 className="mt-6 text-2xl font-bold tracking-normal sm:text-3xl">
                신청이 완료되었습니다
              </h1>
              <p className="mt-3 text-[15px] leading-7 text-[#4e5968]">
                테스트 오픈 시 가장 먼저 안내드릴게요.
              </p>
              <Link
                href="/"
                className="mt-8 inline-flex h-12 w-full items-center justify-center rounded-2xl bg-[#3182f6] px-4 text-base font-semibold text-white transition hover:bg-[#2272eb] sm:w-auto sm:px-8"
              >
                acttub 둘러보기
              </Link>
            </div>
          </section>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-svh bg-[#f2f4f6] px-4 py-6 text-[#191f28] sm:px-6 sm:py-10">
      <div className="mx-auto grid w-full max-w-[920px] gap-4">
        <section className="grid gap-4">
          <WaitlistHeader />
          <div className="rounded-2xl border border-[#e5e8eb] bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
            <span className="inline-flex items-center gap-2 rounded-full bg-[#e8f3ff] px-3 py-1.5 text-sm font-bold text-[#1b64da]">
              <Sparkles className="size-4" aria-hidden="true" />
              정식 오픈 전 · 비공개 테스트
            </span>
            <h1 className="mt-4 text-[26px] font-bold leading-tight tracking-normal sm:text-[30px]">
              대사 밑에 숨은 마음을, AI 질문으로 찾아보세요
            </h1>
            <p className="mt-2 max-w-[640px] text-sm leading-6 text-[#6b7684] sm:text-base">
              Acttub는 AI가 질문을 던지며 인물의 목적, 감정, 관계,
              서브텍스트를 함께 정리해가는 연기 준비 도구입니다.
            </p>
          </div>
          <div className="grid gap-3 text-sm text-[#6b7684] sm:grid-cols-2">
            <div className="rounded-2xl border border-[#e5e8eb] bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
              <p className="font-semibold text-[#191f28]">질문형 분석</p>
              <p className="mt-2 leading-6">
                입력을 바로 평가하지 않고, 배우의 선택을 먼저 구체화합니다.
              </p>
            </div>
            <div className="rounded-2xl border border-[#e5e8eb] bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
              <p className="font-semibold text-[#191f28]">진단 메모</p>
              <p className="mt-2 leading-6">
                최종 점수보다 다음 연습에 쓸 수 있는 관찰을 정리합니다.
              </p>
            </div>
          </div>
        </section>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-[#e5e8eb] bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
        >
          <div className="flex items-center gap-3 border-b border-[#eef0f2] pb-5">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-[#e8f3ff] text-[#1b64da]">
              <Mail className="size-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#6b7684]">사전 등록</p>
              <p className="text-lg font-bold">테스트 오픈 알림 받기</p>
            </div>
          </div>

          <div className="mt-6 space-y-7">
            <label className="block" htmlFor="waitlist-email">
              <span className="text-sm font-semibold">이메일 (필수)</span>
              <input
                id="waitlist-email"
                name="email"
                type="email"
                inputMode="email"
                placeholder="you@example.com"
                maxLength={255}
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-2 h-12 w-full rounded-[14px] border border-[#e5e8eb] bg-white px-4 text-[15px] outline-none transition focus:border-[#3182f6] focus:ring-3 focus:ring-[#3182f6]/20"
              />
            </label>

            <ChipGroup
              legend="현재 어떤 상황이세요?"
              value={actorStatus}
              options={actorStatusOptions}
              onChange={setActorStatus}
            />

            <ChipGroup
              legend="어떤 점에서 도움받고 싶으세요?"
              value={helpTopic}
              options={helpTopicOptions}
              onChange={setHelpTopic}
            />

            <label className="flex gap-3 rounded-2xl bg-[#f2f4f6] p-4 text-sm leading-6 text-[#4e5968]">
              <input
                name="consent"
                type="checkbox"
                required
                checked={consent}
                onChange={(event) => setConsent(event.target.checked)}
                className="mt-1 size-4 rounded border-[#cfd6dd] accent-[#3182f6]"
              />
              <span>
                테스트 안내 메일 발송을 위해 이메일을 수집하며, 테스트 모집
                목적 외에는 사용하지 않습니다.{" "}
                <strong className="font-semibold text-[#191f28]">(필수)</strong>
              </span>
            </label>

            <label className="sr-only" htmlFor="waitlist-website">
              website
            </label>
            <input
              id="waitlist-website"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              aria-label="website"
              value={website}
              onChange={(event) => setWebsite(event.target.value)}
              className="hidden"
            />

            {message ? (
              <p
                role={message.kind === "error" ? "alert" : "status"}
                className={cn(
                  "rounded-xl px-4 py-3 text-sm font-medium",
                  message.kind === "error"
                    ? "bg-[#fff1f0] text-[#d92d20]"
                    : "bg-[#e8f3ff] text-[#1b64da]"
                )}
              >
                {message.text}
              </p>
            ) : null}

            <Button
              type="submit"
              disabled={!canSubmit}
              className="h-14 w-full rounded-2xl bg-[#3182f6] text-[17px] font-semibold text-white hover:bg-[#2272eb]"
            >
              {isSubmitting ? "접수 중" : "테스트 오픈 알림 받기"}
              <ChevronRight className="size-4" aria-hidden="true" />
            </Button>

            <p className="text-center text-sm leading-6 text-[#6b7684]">
              아직 정식 오픈 전이에요. 이메일을 남겨주시면 테스트 오픈 시 가장
              먼저 안내드릴게요.
            </p>
          </div>
        </form>
      </div>
    </main>
  )
}

function WaitlistHeader() {
  return (
    <header className="flex flex-col gap-4 border-b border-black/10 pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-2xl font-black leading-none tracking-normal text-[#2272eb] sm:text-3xl">
          acttub
        </p>
        <Link
          href="/"
          aria-label="acttub 홈"
          className="mt-2 block text-[26px] font-bold leading-tight tracking-normal text-[#191f28] sm:text-[30px]"
        >
          사전 등록
        </Link>
        <p className="mt-2 max-w-[640px] text-sm leading-6 text-[#6b7684] sm:text-base">
          진단 경험이 정식으로 열릴 때 가장 먼저 안내받아 보세요.
        </p>
      </div>
      <span className="w-fit rounded-full bg-[#e8f3ff] px-3 py-1 text-xs font-bold text-[#1b64da]">
        사전 등록
      </span>
    </header>
  )
}

function ChipGroup({
  legend,
  value,
  options,
  onChange,
}: {
  legend: string
  value: string
  options: string[]
  onChange: (value: string) => void
}) {
  return (
    <fieldset>
      <legend className="text-sm font-semibold">
        {legend} <span className="font-normal text-[#8b95a1]">(선택)</span>
      </legend>
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((option) => {
          const selected = value === option

          return (
            <button
              key={option}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(selected ? "" : option)}
              className={cn(
                "h-9 rounded-full border px-3 text-sm font-semibold transition",
                selected
                  ? "border-[#3182f6] bg-[#e8f3ff] text-[#1b64da]"
                  : "border-[#e5e8eb] bg-white text-[#4e5968] hover:bg-[#f2f4f6]"
              )}
            >
              {option}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}
