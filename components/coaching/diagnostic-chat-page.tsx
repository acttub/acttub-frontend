"use client"

import {
  AlertCircle,
  ArrowUp,
  Bot,
  CheckCircle2,
  ClipboardList,
  Loader2,
  MessageCircle,
  UploadCloud,
} from "lucide-react"
import Link from "next/link"
import { useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  coachingGenres,
  submitCoachingAndWait,
  type CoachingGenre,
  type CoachingRequest,
  type CoachingResponse,
} from "@/lib/coaching-api"
import { cn } from "@/lib/utils"
import { isSupportedVideoFile } from "@/lib/video-file"
import { useMutation } from "@tanstack/react-query"

const allowedVideoTypes = new Set(["video/mp4", "video/quicktime", "video/webm"])
const acceptedVideoInputTypes = "video/*,.mp4,.m4v,.mov,.webm"
const maxVideoSize = 100 * 1024 * 1024

type DiagnosticThemeId = "karrot" | "toss"

type DiagnosticTheme = {
  id: DiagnosticThemeId
  eyebrow: string
  title: string
  badge: string
  intro: string
  page: string
  shell: string
  surface: string
  subtleSurface: string
  border: string
  titleText: string
  mutedText: string
  accentText: string
  accentSoft: string
  assistantBubble: string
  userBubble: string
  input: string
  primaryButton: string
  secondaryButton: string
  chip: string
  chipActive: string
  toggle: string
  toggleActive: string
  toggleInactive: string
  upload: string
}

const themes: Record<DiagnosticThemeId, DiagnosticTheme> = {
  karrot: {
    id: "karrot",
    eyebrow: "acttub 진단 채팅",
    title: "오늘 장면을 같이 정리해볼게요",
    badge: "따뜻한 진단 코치",
    intro:
      "정답을 맞히는 평가가 아니라, 장면 의도와 인물의 상태를 함께 정리하는 진단 과정입니다.",
    page: "bg-white text-[#1a1c20]",
    shell: "max-w-[760px]",
    surface:
      "rounded-xl border border-black/10 bg-white p-4 shadow-[0_2px_10px_rgba(0,0,0,0.08)] sm:p-5",
    subtleSurface: "rounded-xl bg-[#f7f8f9] p-4",
    border: "border-black/10",
    titleText: "text-[#1a1c20]",
    mutedText: "text-[#555d6d]",
    accentText: "text-[#ff6600]",
    accentSoft: "bg-[#fff2ec] text-[#e14d00]",
    assistantBubble: "bg-[#f7f8f9] text-[#1a1c20]",
    userBubble: "bg-[#ff6600] text-white",
    input:
      "rounded-xl border-[#dcdee3] bg-[#f7f8f9] px-4 py-3 text-[15px] focus:border-[#5e98fe] focus:ring-[#5e98fe]/20",
    primaryButton:
      "h-[52px] rounded-xl bg-[#ff6600] text-base font-bold text-white hover:bg-[#e14d00]",
    secondaryButton:
      "rounded-lg bg-[#f3f4f5] text-[#1a1c20] hover:bg-[#eeeff1]",
    chip: "border-transparent bg-[#f3f4f5] text-[#1a1c20] hover:bg-[#eeeff1]",
    chipActive: "border-[#1a1c20] bg-[#1a1c20] text-white",
    toggle: "bg-[#f3f4f5]",
    toggleActive: "bg-[#ff6600] text-white shadow-[0_1px_4px_rgba(0,0,0,0.08)]",
    toggleInactive: "text-[#555d6d] hover:bg-white",
    upload:
      "rounded-xl border border-dashed border-[#ff6600]/45 bg-[#fff2ec] text-[#e14d00]",
  },
  toss: {
    id: "toss",
    eyebrow: "Acting Diagnosis",
    title: "연기 의도를 먼저 정리해요",
    badge: "명확한 진단 설계",
    intro:
      "몇 가지 질문에 답하면 영상 진단에 필요한 기준을 정리하고, 그 기준으로 현재 연기의 경향을 보여줍니다.",
    page: "bg-[#f2f4f6] text-[#191f28]",
    shell: "max-w-[800px]",
    surface: "rounded-2xl border border-[#e5e8eb] bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.06)]",
    subtleSurface: "rounded-2xl bg-[#f2f4f6] p-4",
    border: "border-[#e5e8eb]",
    titleText: "text-[#191f28]",
    mutedText: "text-[#6b7684]",
    accentText: "text-[#2272eb]",
    accentSoft: "bg-[#e8f3ff] text-[#1b64da]",
    assistantBubble: "bg-white text-[#191f28] shadow-[0_1px_3px_rgba(0,0,0,0.05)]",
    userBubble: "bg-[#3182f6] text-white",
    input:
      "rounded-2xl border-[#e5e8eb] bg-white px-4 py-3 text-[16px] focus:border-[#3182f6] focus:ring-[#3182f6]/20",
    primaryButton:
      "h-14 rounded-2xl bg-[#3182f6] text-[17px] font-semibold text-white hover:bg-[#2272eb]",
    secondaryButton:
      "rounded-2xl bg-[rgba(100,168,255,0.15)] text-[#2272eb] hover:bg-[#dbeeff]",
    chip: "border-[#e5e8eb] bg-white text-[#4e5968] hover:bg-[#f2f4f6]",
    chipActive: "border-[#3182f6] bg-[#e8f3ff] text-[#1b64da]",
    toggle: "bg-[#e5e8eb]",
    toggleActive: "bg-[#3182f6] text-white shadow-[0_1px_3px_rgba(0,0,0,0.06)]",
    toggleInactive: "text-[#4e5968] hover:bg-white",
    upload:
      "rounded-2xl border border-dashed border-[#3182f6]/45 bg-[#e8f3ff] text-[#1b64da]",
  },
}

type PromptKey = "situation" | "characterSetting" | "subtext"
type ConversationPrompt = {
  key: PromptKey
  question: string
  placeholder: string
  quickReplies?: readonly string[]
}

const prompts: readonly ConversationPrompt[] = [
  {
    key: "situation",
    question: "장면에서 실제로 벌어진 일을 한 문장으로 말해볼까요?",
    placeholder: "예: 불합격 전화를 받지만 친구 앞에서는 괜찮은 척한다",
  },
  {
    key: "characterSetting",
    question: "이 인물이 장면 끝까지 얻고 싶은 것은 무엇인가요?",
    placeholder: "예: 무너지지 않은 사람처럼 보이기",
  },
  {
    key: "subtext",
    question: "겉으로 숨기고 있는 감정은 무엇에 가장 가까울까요?",
    placeholder: "예: 상실감, 분노, 미련, 불안",
    quickReplies: ["상실감", "분노", "미련", "불안"],
  },
] as const
type Answers = Record<PromptKey, string>
type ChatMessage = {
  id: string
  role: "assistant" | "user"
  text: string
}

const emptyAnswers: Answers = {
  situation: "",
  characterSetting: "",
  subtext: "",
}

export function DiagnosticChatPage({ themeId }: { themeId: DiagnosticThemeId }) {
  const theme = themes[themeId]
  const [stepIndex, setStepIndex] = useState(0)
  const [answerText, setAnswerText] = useState("")
  const [answers, setAnswers] = useState<Answers>(emptyAnswers)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "assistant-0",
      role: "assistant",
      text: prompts[0].question,
    },
  ])
  const [genre, setGenre] = useState<CoachingGenre>("연극")
  const [customGenre, setCustomGenre] = useState("")
  const [video, setVideo] = useState<File | null>(null)
  const [videoError, setVideoError] = useState("")

  const mutation = useMutation<CoachingResponse, Error, CoachingRequest>({
    mutationFn: (input) => submitCoachingAndWait(input),
  })

  const currentPrompt = prompts[stepIndex]
  const isConversationComplete = stepIndex >= prompts.length
  const canSubmit =
    isConversationComplete &&
    Boolean(video) &&
    answers.situation.length > 0 &&
    answers.characterSetting.length > 0

  const summaryItems = useMemo(
    () => [
      ["사건", answers.situation],
      ["인물 목표", answers.characterSetting],
      ["숨은 감정", answers.subtext],
    ],
    [answers]
  )

  function addAnswer(rawAnswer: string) {
    if (isConversationComplete || !currentPrompt) {
      return
    }

    const nextAnswer = rawAnswer.trim()
    if (nextAnswer.length === 0) {
      return
    }

    const nextAnswers = {
      ...answers,
      [currentPrompt.key]: nextAnswer,
    }
    const nextStepIndex = stepIndex + 1
    const nextMessages: ChatMessage[] = [
      ...messages,
      {
        id: `user-${stepIndex}`,
        role: "user",
        text: nextAnswer,
      },
    ]

    if (nextStepIndex < prompts.length) {
      nextMessages.push({
        id: `assistant-${nextStepIndex}`,
        role: "assistant",
        text: prompts[nextStepIndex].question,
      })
    }

    setAnswers(nextAnswers)
    setMessages(nextMessages)
    setStepIndex(nextStepIndex)
    setAnswerText("")
  }

  function handleVideoChange(file: File | undefined) {
    if (!file) {
      return
    }

    if (!isSupportedVideoFile(file, allowedVideoTypes, maxVideoSize)) {
      setVideo(null)
      setVideoError("mp4, mov, webm 형식의 100MB 이하 영상을 올려주세요.")
      return
    }

    setVideo(file)
    setVideoError("")
  }

  function submitDiagnosis() {
    if (!video) {
      setVideoError("진단할 영상을 먼저 올려주세요.")
      return
    }

    mutation.mutate({
      video,
      genre,
      customGenre,
      situation: answers.situation,
      characterSetting: answers.characterSetting,
      subtext: answers.subtext,
    })
  }

  return (
    <main className={cn("min-h-svh px-4 py-6 sm:px-6 sm:py-10", theme.page)}>
      <div className={cn("mx-auto grid w-full gap-4", theme.shell)}>
        <header className={cn("flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-end sm:justify-between", theme.border)}>
          <div>
            <p className={cn("text-sm font-bold", theme.accentText)}>{theme.eyebrow}</p>
            <h1 className={cn("mt-2 text-[26px] font-bold leading-tight sm:text-[30px]", theme.titleText)}>
              {theme.title}
            </h1>
            <p className={cn("mt-2 max-w-[620px] text-sm leading-6 sm:text-base", theme.mutedText)}>
              {theme.intro}
            </p>
          </div>
          <div className="flex flex-col items-start gap-3 sm:items-end">
            <span className={cn("w-fit rounded-full px-3 py-1 text-xs font-bold", theme.accentSoft)}>
              {theme.badge}
            </span>
            <StyleToggle theme={theme} />
          </div>
        </header>

        <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className={cn("grid min-h-[560px] grid-rows-[auto_1fr_auto] gap-4", theme.surface)}>
            <div className="flex items-center gap-2">
              <Bot aria-hidden="true" className={cn("size-5", theme.accentText)} />
              <h2 className="text-base font-bold">대화로 기준 만들기</h2>
            </div>

            <div className="grid content-start gap-3" aria-live="polite">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "max-w-[86%] rounded-2xl px-4 py-3 text-sm leading-6",
                    message.role === "assistant"
                      ? cn("justify-self-start", theme.assistantBubble)
                      : cn("justify-self-end", theme.userBubble)
                  )}
                >
                  {message.text}
                </div>
              ))}

              {isConversationComplete ? (
                <div className={cn("mt-2 grid gap-3", theme.subtleSurface)}>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 aria-hidden="true" className={cn("size-5", theme.accentText)} />
                    <p className="font-bold">정리된 진단 기준</p>
                  </div>
                  <dl className="grid gap-2 text-sm">
                    {summaryItems.map(([label, value]) => (
                      <div key={label} className="grid gap-1">
                        <dt className={cn("text-xs font-bold", theme.mutedText)}>{label}</dt>
                        <dd className="leading-6">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ) : null}
            </div>

            <div className="grid gap-3">
              {!isConversationComplete && currentPrompt.quickReplies ? (
                <div className="flex flex-wrap gap-2">
                  {currentPrompt.quickReplies.map((reply) => (
                    <button
                      key={reply}
                      type="button"
                      className={cn("h-9 rounded-full border px-4 text-sm font-bold transition", theme.chip)}
                      onClick={() => addAnswer(reply)}
                    >
                      {reply}
                    </button>
                  ))}
                </div>
              ) : null}

              <form
                className="flex gap-2"
                onSubmit={(event) => {
                  event.preventDefault()
                  addAnswer(answerText)
                }}
              >
                <label className="sr-only" htmlFor={`${theme.id}-chat-answer`}>
                  답변 입력
                </label>
                <input
                  id={`${theme.id}-chat-answer`}
                  value={answerText}
                  onChange={(event) => setAnswerText(event.target.value)}
                  disabled={isConversationComplete}
                  className={cn("min-w-0 flex-1 border outline-none ring-4 ring-transparent disabled:opacity-60", theme.input)}
                  placeholder={
                    isConversationComplete
                      ? "진단 기준이 정리되었습니다"
                      : currentPrompt.placeholder
                  }
                />
                <Button
                  type="submit"
                  aria-label="답변 보내기"
                  disabled={isConversationComplete || answerText.trim().length === 0}
                  className={cn("size-12 shrink-0", theme.primaryButton)}
                >
                  <ArrowUp aria-hidden="true" className="size-5" />
                </Button>
              </form>
            </div>
          </div>

          <aside className="grid content-start gap-4">
            <section className={cn("grid gap-4", theme.surface)}>
              <div className="flex items-center gap-2">
                <UploadCloud aria-hidden="true" className={cn("size-5", theme.accentText)} />
                <h2 className="text-base font-bold">영상과 매체</h2>
              </div>

              <label
                htmlFor={`${theme.id}-video`}
                className={cn(
                  "relative flex min-h-32 cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden px-4 py-5 text-center transition focus-within:ring-4 focus-within:ring-black/15",
                  theme.upload
                )}
              >
                <UploadCloud aria-hidden="true" className="size-7" />
                <span className="text-sm font-bold">영상 파일</span>
                <span className="block max-w-full truncate text-xs opacity-80">
                  {video?.name ?? "mp4, mov, webm · 최대 100MB"}
                </span>
                <input
                  id={`${theme.id}-video`}
                  type="file"
                  accept={acceptedVideoInputTypes}
                  className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                  aria-label="영상 파일"
                  aria-invalid={Boolean(videoError)}
                  aria-describedby={videoError ? `${theme.id}-video-error` : undefined}
                  onChange={(event) => handleVideoChange(event.target.files?.[0])}
                />
              </label>
              <FieldError id={`${theme.id}-video-error`} message={videoError} />

              <fieldset className="grid gap-2">
                <legend className="text-sm font-bold">매체 / 장르</legend>
                <div role="radiogroup" aria-label="매체 / 장르" className="flex flex-wrap gap-2">
                  {coachingGenres.map((item) => (
                    <label
                      key={item}
                      className="relative inline-flex h-9 cursor-pointer items-center"
                    >
                      <input
                        type="radio"
                        name={`${theme.id}-genre`}
                        value={item}
                        checked={genre === item}
                        onChange={() => setGenre(item)}
                        className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                      />
                      <span
                        className={cn(
                          "flex h-9 items-center rounded-full border px-4 text-sm font-bold transition",
                          genre === item ? theme.chipActive : theme.chip
                        )}
                      >
                        {item}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>

              {genre === "기타" ? (
                <div className="grid gap-2">
                  <label htmlFor={`${theme.id}-custom-genre`} className="text-sm font-bold">
                    기타 장르
                  </label>
                  <input
                    id={`${theme.id}-custom-genre`}
                    value={customGenre}
                    onChange={(event) => setCustomGenre(event.target.value)}
                    className={cn("border outline-none ring-4 ring-transparent", theme.input)}
                    placeholder="예: 웹드라마, 광고, 숏폼"
                  />
                </div>
              ) : null}

              {mutation.isError ? (
                <div className="flex gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                  <span>{mutation.error.message}</span>
                </div>
              ) : null}

              <Button
                type="button"
                disabled={!canSubmit || mutation.isPending}
                className={cn("w-full gap-2", theme.primaryButton)}
                onClick={submitDiagnosis}
              >
                {mutation.isPending ? (
                  <Loader2 aria-hidden="true" className="size-4 animate-spin" />
                ) : (
                  <ClipboardList aria-hidden="true" className="size-4" />
                )}
                {theme.id === "toss" ? "진단 시작" : "영상과 함께 최종 진단 받기"}
              </Button>
            </section>

            <DiagnosisResult result={mutation.data} theme={theme} />
          </aside>
        </section>
      </div>
    </main>
  )
}

function StyleToggle({ theme }: { theme: DiagnosticTheme }) {
  const styles: Array<{
    id: DiagnosticThemeId
    label: string
    href: string
  }> = [
    {
      id: "karrot",
      label: "Karrot",
      href: "/coaching/karrot",
    },
    {
      id: "toss",
      label: "Toss",
      href: "/coaching/toss",
    },
  ]

  return (
    <nav aria-label="디자인 스타일" className={cn("grid grid-cols-2 gap-1 rounded-full p-1", theme.toggle)}>
      {styles.map((style) => {
        const isActive = style.id === theme.id

        return (
          <Link
            key={style.id}
            href={style.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex h-9 min-w-20 items-center justify-center rounded-full px-4 text-sm font-bold transition focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
              isActive ? theme.toggleActive : theme.toggleInactive
            )}
          >
            {style.label}
          </Link>
        )
      })}
    </nav>
  )
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) {
    return null
  }

  return (
    <p id={id} role="alert" className="text-sm font-medium text-red-600">
      {message}
    </p>
  )
}

function DiagnosisResult({
  result,
  theme,
}: {
  result?: CoachingResponse
  theme: DiagnosticTheme
}) {
  if (!result) {
    return (
      <section className={cn("grid gap-3", theme.surface)}>
        <div className="flex items-center gap-2">
          <MessageCircle aria-hidden="true" className={cn("size-5", theme.accentText)} />
          <h2 className="text-base font-bold">진단 대기</h2>
        </div>
        <p className={cn("text-sm leading-6", theme.mutedText)}>
          대화로 기준을 정리하고 영상을 올리면 현재 연기의 경향과 다음 연습 제안을 보여줍니다.
        </p>
      </section>
    )
  }

  if (result.status !== "COMPLETED" || !result.result) {
    return (
      <section className={cn("grid gap-3", theme.surface)}>
        <div className="flex items-center gap-2">
          <Loader2 aria-hidden="true" className={cn("size-5 animate-spin", theme.accentText)} />
          <h2 className="text-base font-bold">진단 준비 중</h2>
        </div>
        <p className={cn("text-sm leading-6", theme.mutedText)}>
          코칭 ID {result.coachingId}의 진단 메모를 준비하고 있습니다.
        </p>
      </section>
    )
  }

  return (
    <section className={cn("grid gap-4", theme.surface)}>
      <div className="flex items-center gap-2">
        <ClipboardList aria-hidden="true" className={cn("size-5", theme.accentText)} />
        <h2 className="text-base font-bold">진단 메모</h2>
      </div>

      <div className={theme.subtleSurface}>
        <p className="text-sm font-bold">현재 연기의 경향</p>
        <p className="mt-2 text-sm leading-6">{result.result.overallStrength.text}</p>
      </div>

      <div className="grid gap-3">
        {result.result.feedbackCards.map((card) => (
          <article key={card.order} className={cn("grid gap-3 border-t pt-4", theme.border)}>
            <div>
              <p className={cn("text-xs font-bold", theme.accentText)}>진단 {card.order}</p>
              <h3 className="mt-1 text-base font-bold leading-6">{card.title}</h3>
            </div>

            <div className="grid gap-2">
              <p className="text-sm font-bold">관찰된 경향</p>
              {card.observations.map((observation) => (
                <div key={observation.timecode} className={theme.subtleSurface}>
                  <p className={cn("text-xs font-bold", theme.mutedText)}>{observation.timecode}</p>
                  <p className="mt-1 text-sm leading-6">{observation.text}</p>
                </div>
              ))}
            </div>

            <dl className="grid gap-3 text-sm leading-6">
              <div>
                <dt className="font-bold">가능한 원인</dt>
                <dd className={theme.mutedText}>{card.cause}</dd>
              </div>
              <div>
                <dt className="font-bold">연습 처방</dt>
                <dd className={theme.mutedText}>{card.practiceSteps.join(" ")}</dd>
              </div>
              <div>
                <dt className="font-bold">기대 변화</dt>
                <dd className={theme.mutedText}>{card.expectedEffect}</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
    </section>
  )
}
