"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import {
  AlertCircle,
  ArrowUp,
  Bell,
  Bot,
  CheckCircle2,
  ClipboardList,
  Clapperboard,
  Loader2,
  MessageCircle,
  UploadCloud,
  Video,
} from "lucide-react"
import Link from "next/link"
import { useMemo, useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import {
  coachingGenres,
  createCoachingDiagnosis,
  sendCoachingMessage,
  submitCoaching,
  submitCoachingEvaluation,
  type CoachingResponse,
} from "@/lib/coaching-api"
import { cn } from "@/lib/utils"
import { isSupportedVideoFile } from "@/lib/video-file"

const allowedVideoTypes = new Set(["video/mp4", "video/quicktime", "video/webm"])
const acceptedVideoInputTypes = "video/*,.mp4,.m4v,.mov,.webm"
const maxVideoSize = 100 * 1024 * 1024

const coachingSchema = z
  .object({
    video: z.custom<File>(
      (value) =>
        typeof File !== "undefined" &&
        value instanceof File &&
        isSupportedVideoFile(value, allowedVideoTypes, maxVideoSize),
      "mp4, mov, webm 형식의 100MB 이하 영상을 올려주세요."
    ),
    genre: z.enum(coachingGenres),
    customGenre: z.string(),
    situation: z.string().trim().min(1, "상황을 입력해 주세요."),
    characterSetting: z.string().trim().min(1, "인물 설정을 입력해 주세요."),
    subtext: z.string(),
  })
  .superRefine((value, ctx) => {
    if (value.genre === "기타" && value.customGenre.trim().length === 0) {
      ctx.addIssue({
        code: "custom",
        message: "기타 장르를 입력해 주세요.",
        path: ["customGenre"],
      })
    }
  })

type CoachingFormFields = z.infer<typeof coachingSchema>
type DesignId = "toss" | "karrot" | "baemin"
type Stage = "intake" | "chat" | "diagnosis"
type ChatMessage = {
  id: string
  role: "assistant" | "user"
  text: string
}

type DesignTheme = {
  id: DesignId
  name: string
  badge: string
  description: string
  page: string
  shell: string
  card: string
  mutedCard: string
  title: string
  muted: string
  accent: string
  accentText: string
  accentSoft: string
  chip: string
  chipActive: string
  input: string
  primaryButton: string
  secondaryButton: string
  dropzone: string
  userBubble: string
  assistantBubble: string
  resultCard: string
}

const themes: DesignTheme[] = [
  {
    id: "toss",
    name: "Toss",
    badge: "Toss 스타일",
    description: "명확한 정보 위계와 파란 CTA 중심의 신뢰감 있는 구성",
    page: "bg-[#f2f4f6] text-[#191f28]",
    shell: "max-w-[920px]",
    card: "rounded-2xl border border-[#e5e8eb] bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.06)]",
    mutedCard: "rounded-2xl bg-[#f2f4f6] p-4",
    title: "text-[#191f28]",
    muted: "text-[#6b7684]",
    accent: "bg-[#3182f6] text-white",
    accentText: "text-[#2272eb]",
    accentSoft: "bg-[#e8f3ff] text-[#1b64da]",
    chip: "border-[#e5e8eb] bg-white text-[#4e5968] hover:bg-[#f2f4f6]",
    chipActive: "border-[#3182f6] bg-[#e8f3ff] text-[#1b64da]",
    input:
      "rounded-[14px] border-[#e5e8eb] bg-white px-4 py-3 text-[15px] focus:border-[#3182f6] focus:ring-[#3182f6]/20",
    primaryButton:
      "h-14 rounded-2xl bg-[#3182f6] text-[17px] font-semibold text-white hover:bg-[#2272eb]",
    secondaryButton:
      "rounded-2xl bg-[rgba(100,168,255,0.15)] text-[#2272eb] hover:bg-[#dbeeff]",
    dropzone:
      "rounded-2xl border border-dashed border-[#3182f6]/45 bg-[#e8f3ff] text-[#1b64da]",
    userBubble: "bg-[#3182f6] text-white",
    assistantBubble: "bg-white text-[#191f28] shadow-[0_1px_3px_rgba(0,0,0,0.05)]",
    resultCard: "rounded-2xl border border-[#e5e8eb] bg-white p-5",
  },
  {
    id: "karrot",
    name: "Karrot",
    badge: "Karrot 스타일",
    description: "동네 게시판처럼 따뜻하고 빠르게 스캔되는 구성",
    page: "bg-white text-[#1a1c20]",
    shell: "max-w-[880px]",
    card: "rounded-lg border border-black/10 bg-white p-4 shadow-[0_2px_10px_rgba(0,0,0,0.10)]",
    mutedCard: "rounded-lg bg-[#f7f8f9] p-4",
    title: "text-[#1a1c20]",
    muted: "text-[#555d6d]",
    accent: "bg-[#ff6600] text-white",
    accentText: "text-[#ff6600]",
    accentSoft: "bg-[#fff2ec] text-[#e14d00]",
    chip: "border-transparent bg-[#f3f4f5] text-[#1a1c20] hover:bg-[#eeeff1]",
    chipActive: "border-[#1a1c20] bg-[#1a1c20] text-white",
    input:
      "rounded-lg border-[#dcdee3] bg-[#f7f8f9] px-3 py-3 text-[14px] focus:border-[#5e98fe] focus:ring-[#5e98fe]/20",
    primaryButton:
      "h-[52px] rounded-xl bg-[#ff6600] text-base font-bold text-white hover:bg-[#e14d00]",
    secondaryButton:
      "rounded-lg bg-[#f3f4f5] text-[#1a1c20] hover:bg-[#eeeff1]",
    dropzone:
      "rounded-xl border border-dashed border-[#ff6600]/45 bg-[#fff2ec] text-[#e14d00]",
    userBubble: "bg-[#ff6600] text-white",
    assistantBubble: "bg-[#f7f8f9] text-[#1a1c20]",
    resultCard: "rounded-lg border border-black/10 bg-white p-4",
  },
  {
    id: "baemin",
    name: "Baemin",
    badge: "Baemin 스타일",
    description: "민트 CTA와 또렷한 카드 표면을 쓰는 앱형 구성",
    page: "bg-[#f8f9fa] text-[#212529]",
    shell: "max-w-[960px]",
    card: "rounded-lg border border-[#dee2e6] bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.08)]",
    mutedCard: "rounded-lg bg-[#f1f3f5] p-4",
    title: "text-[#212529]",
    muted: "text-[#495057]",
    accent: "bg-[#2ac1bc] text-white",
    accentText: "text-[#2ac1bc]",
    accentSoft: "bg-[#e8fbfa] text-[#159995]",
    chip: "border-transparent bg-[#f1f3f5] text-[#495057] hover:bg-[#e9ecef]",
    chipActive: "border-[#2ac1bc] bg-[#2ac1bc] text-white",
    input:
      "rounded-lg border-[#dee2e6] bg-white px-3 py-3 text-[14px] focus:border-[#2ac1bc] focus:ring-[#2ac1bc]/20",
    primaryButton:
      "h-12 rounded-lg bg-[#2ac1bc] text-base font-bold text-white hover:bg-[#20a8a4]",
    secondaryButton:
      "rounded-lg border border-[#2ac1bc] bg-white text-[#2ac1bc] hover:bg-[#2ac1bc]/10",
    dropzone:
      "rounded-lg border border-dashed border-[#2ac1bc]/55 bg-[#e8fbfa] text-[#159995]",
    userBubble: "bg-[#2ac1bc] text-white",
    assistantBubble: "bg-[#f1f3f5] text-[#212529]",
    resultCard: "rounded-lg border border-[#dee2e6] bg-white p-5",
  },
]

const diagnosisFeedbackTags = [
  "장면 이해가 정확했어요",
  "연습 방법이 도움됐어요",
  "너무 일반적이에요",
  "의도와 달랐어요",
  "말투가 딱딱했어요",
]

export function CoachingPage() {
  const [activeDesign, setActiveDesign] = useState<DesignId>("toss")
  const [stage, setStage] = useState<Stage>("intake")
  const [intakeValues, setIntakeValues] = useState<CoachingFormFields | null>(null)
  const [coachingId, setCoachingId] = useState("")
  const [diagnosisResult, setDiagnosisResult] = useState<CoachingResponse>()
  const [isStartingChat, setIsStartingChat] = useState(false)
  const [isSendingAnswer, setIsSendingAnswer] = useState(false)
  const [isDiagnosisPending, setIsDiagnosisPending] = useState(false)
  const [coachingError, setCoachingError] = useState("")
  const [chatAnswer, setChatAnswer] = useState("")
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])

  const theme = useMemo(
    () => themes.find((item) => item.id === activeDesign) ?? themes[0],
    [activeDesign]
  )

  const {
    handleSubmit,
    register,
    setValue,
    control,
    formState: { errors },
  } = useForm<CoachingFormFields>({
    resolver: zodResolver(coachingSchema),
    defaultValues: {
      genre: "연극",
      customGenre: "",
      situation: "",
      characterSetting: "",
      subtext: "",
    },
  })

  const selectedGenre = useWatch({ control, name: "genre" })
  const selectedVideo = useWatch({ control, name: "video" })

  const startChat = handleSubmit(async (values) => {
    setIsStartingChat(true)
    setCoachingError("")
    setDiagnosisResult(undefined)

    try {
      const response = await submitCoaching(values)
      setIntakeValues(values)
      setCoachingId(response.coachingId)
      setChatAnswer("")

      if (response.status === "READY_FOR_DIAGNOSIS") {
        setStage("diagnosis")
        await createDiagnosis(response.coachingId)
        return
      }

      setChatMessages([
        {
          id: "assistant-0",
          role: "assistant",
          text: response.dialogue?.question ?? "장면 의도를 조금 더 설명해 주세요.",
        },
      ])
      setStage("chat")
    } catch (error) {
      setCoachingError(
        error instanceof Error ? error.message : "코칭을 시작하지 못했습니다."
      )
    } finally {
      setIsStartingChat(false)
    }
  })

  async function createDiagnosis(targetCoachingId: string) {
    setIsDiagnosisPending(true)
    setCoachingError("")

    try {
      const response = await createCoachingDiagnosis(targetCoachingId)
      setDiagnosisResult(response)
      setStage("diagnosis")
    } catch (error) {
      setCoachingError(
        error instanceof Error ? error.message : "최종 진단을 생성하지 못했습니다."
      )
    } finally {
      setIsDiagnosisPending(false)
    }
  }

  async function submitChatAnswer(rawAnswer: string) {
    if (!coachingId) {
      return
    }

    const trimmedAnswer = rawAnswer.trim()
    if (trimmedAnswer.length === 0) {
      return
    }

    const nextMessages: ChatMessage[] = [
      ...chatMessages,
      {
        id: `user-${chatMessages.length}`,
        role: "user",
        text: trimmedAnswer,
      },
    ]
    setChatMessages(nextMessages)
    setChatAnswer("")
    setIsSendingAnswer(true)
    setCoachingError("")

    try {
      const response = await sendCoachingMessage(coachingId, {
        answer: trimmedAnswer,
      })

      if (response.status === "READY_FOR_DIAGNOSIS") {
        setChatMessages([
          ...nextMessages,
          {
            id: "assistant-ready",
            role: "assistant",
            text: "좋아요. 지금까지의 의도를 기준으로 진단 메모를 준비할게요.",
          },
        ])
        setStage("diagnosis")
        await createDiagnosis(coachingId)
        return
      }

      if (response.status === "COMPLETED") {
        setDiagnosisResult(response)
        setStage("diagnosis")
        return
      }

      setChatMessages([
        ...nextMessages,
        {
          id: `assistant-${nextMessages.length}`,
          role: "assistant",
          text: response.dialogue?.question ?? "조금 더 구체적으로 말해볼까요?",
        },
      ])
    } catch (error) {
      setCoachingError(
        error instanceof Error ? error.message : "답변을 전송하지 못했습니다."
      )
    } finally {
      setIsSendingAnswer(false)
    }
  }

  return (
    <main className={cn("min-h-svh px-4 py-6 sm:px-6 sm:py-10", theme.page)}>
      <div className={cn("mx-auto grid w-full gap-4", theme.shell)}>
        <header className="flex flex-col gap-4 border-b border-black/10 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className={cn("text-2xl font-black leading-none tracking-normal sm:text-3xl", theme.accentText)}>
              acttub
            </p>
            <h1 className={cn("mt-2 text-[26px] font-bold leading-tight sm:text-[30px]", theme.title)}>
              연기 진단을 위한 기본 정보를 알려주세요
            </h1>
            <p className={cn("mt-2 max-w-[640px] text-sm leading-6 sm:text-base", theme.muted)}>
              먼저 필요한 정보를 짧게 받고, 챗봇이 연기 의도와 숨은 감정을 더 구체화한 뒤 진단 메모를 보여줍니다.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/waitlist"
              className={cn(
                "inline-flex h-11 items-center gap-2 rounded-2xl px-4 text-base font-bold transition",
                theme.secondaryButton
              )}
            >
              <Bell aria-hidden="true" className="size-4" />
              비공개 테스트 사전 등록
            </Link>
          </div>
        </header>

        <section className={cn("flex flex-col gap-3", theme.card)}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className={cn("text-sm font-bold", theme.accentText)}>
                {theme.badge}
              </p>
              <p className={cn("mt-1 text-sm", theme.muted)}>{theme.description}</p>
            </div>
            <div className="grid grid-cols-3 gap-2 rounded-full bg-black/5 p-1">
              {themes.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={item.id === activeDesign}
                  className={cn(
                    "rounded-full px-3 py-2 text-sm font-bold transition",
                    item.id === activeDesign
                      ? theme.accent
                      : "text-black/60 hover:bg-white/70"
                  )}
                  onClick={() => setActiveDesign(item.id)}
                >
                  {item.name}
                </button>
              ))}
            </div>
          </div>
        </section>

        <StepList stage={stage} theme={theme} />

        {stage === "intake" ? (
          <IntakeForm
            errors={errors}
            register={register}
            selectedGenre={selectedGenre}
            selectedVideo={selectedVideo}
            setValue={setValue}
            startChat={startChat}
            isSubmitting={isStartingChat}
            submitError={coachingError}
            theme={theme}
          />
        ) : null}

        {stage === "chat" ? (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
            <section className={cn("grid content-start gap-4", theme.card)}>
              <div className="flex items-start gap-3">
                <Bot aria-hidden="true" className={cn("mt-1 size-5 shrink-0", theme.accentText)} />
                <div>
                  <h2 className="text-lg font-bold">챗봇과 장면 의도 구체화</h2>
                  <p className={cn("mt-1 text-sm", theme.muted)}>
                    기본 정보는 유지한 채, 연기의 속뜻과 상대에게 원하는 반응을 더 좁혀봅니다.
                  </p>
                </div>
              </div>

              <div className="grid min-h-72 content-start gap-3" aria-live="polite">
                {chatMessages.map((message) => (
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
              </div>

              {stage === "chat" ? (
                <div className="grid gap-3">
                  <form
                    className="flex gap-2"
                    onSubmit={(event) => {
                      event.preventDefault()
                      submitChatAnswer(chatAnswer)
                    }}
                  >
                    <label className="sr-only" htmlFor="chat-answer">
                      챗봇 답변
                    </label>
                    <input
                      id="chat-answer"
                      value={chatAnswer}
                      onChange={(event) => setChatAnswer(event.target.value)}
                      className={cn("min-w-0 flex-1 border outline-none ring-4 ring-transparent", theme.input)}
                      placeholder="답변을 입력해 주세요."
                    />
                    <Button
                      type="submit"
                      aria-label="답변 보내기"
                      disabled={chatAnswer.trim().length === 0 || isSendingAnswer}
                      className={cn("size-12 shrink-0", theme.primaryButton)}
                    >
                      {isSendingAnswer ? (
                        <Loader2 aria-hidden="true" className="size-5 animate-spin" />
                      ) : (
                        <ArrowUp aria-hidden="true" className="size-5" />
                      )}
                    </Button>
                  </form>
                  {coachingError ? (
                    <p role="alert" className="text-sm font-medium text-red-600">
                      {coachingError}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </section>

            <aside className="grid content-start gap-4">
              <IntakeSummary values={intakeValues} theme={theme} />
            </aside>
          </div>
        ) : null}

        {stage === "diagnosis" ? (
          <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
            <aside className="grid content-start gap-4">
              <IntakeSummary values={intakeValues} theme={theme} />
            </aside>
            <ResultPanel
              result={diagnosisResult}
              isPending={isDiagnosisPending}
              coachingId={coachingId}
              error={coachingError}
              theme={theme}
            />
          </div>
        ) : null}
      </div>
    </main>
  )
}

function IntakeForm({
  errors,
  register,
  selectedGenre,
  selectedVideo,
  setValue,
  startChat,
  isSubmitting,
  submitError,
  theme,
}: {
  errors: ReturnType<typeof useForm<CoachingFormFields>>["formState"]["errors"]
  register: ReturnType<typeof useForm<CoachingFormFields>>["register"]
  selectedGenre: CoachingFormFields["genre"]
  selectedVideo?: File
  setValue: ReturnType<typeof useForm<CoachingFormFields>>["setValue"]
  startChat: () => void
  isSubmitting: boolean
  submitError: string
  theme: DesignTheme
}) {
  return (
    <form className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]" onSubmit={startChat}>
      <section className={cn("grid content-start gap-4", theme.card)}>
        <div className="flex items-start gap-3">
          <Video aria-hidden="true" className={cn("mt-1 size-5 shrink-0", theme.accentText)} />
          <div>
            <h2 className="text-lg font-bold">영상과 매체</h2>
            <p className={cn("mt-1 text-sm", theme.muted)}>
              진단할 영상과 장르를 먼저 정리합니다.
            </p>
          </div>
        </div>

        <label
          htmlFor="video"
          className={cn(
            "relative flex min-h-36 cursor-pointer flex-col items-center justify-center gap-3 overflow-hidden px-4 py-6 text-center transition hover:brightness-[0.98] focus-within:ring-4 focus-within:ring-black/15",
            theme.dropzone
          )}
        >
          <UploadCloud aria-hidden="true" className="size-8" />
          <span className="text-sm font-bold">영상 파일</span>
          <span className="block max-w-full truncate text-xs opacity-80">
            {selectedVideo?.name ?? "mp4, mov, webm · 최대 100MB"}
          </span>
          <input
            id="video"
            type="file"
            accept={acceptedVideoInputTypes}
            className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
            aria-label="영상 파일"
            aria-invalid={Boolean(errors.video)}
            aria-describedby={errors.video ? "video-error" : undefined}
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) {
                setValue("video", file, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
            }}
          />
        </label>
        <FieldError id="video-error" message={errors.video?.message} />

        <fieldset className="grid gap-2">
          <legend className="text-sm font-bold">매체 / 장르</legend>
          <div role="radiogroup" aria-label="매체 / 장르" className="flex flex-wrap gap-2">
            {coachingGenres.map((genre) => (
              <label
                key={genre}
                className="relative inline-flex h-9 cursor-pointer items-center"
              >
                <input
                  type="radio"
                  name="genre"
                  value={genre}
                  checked={selectedGenre === genre}
                  onChange={() =>
                    setValue("genre", genre, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                  className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                />
                <span
                  className={cn(
                    "flex h-9 items-center rounded-full border px-4 text-sm font-bold transition",
                    selectedGenre === genre ? theme.chipActive : theme.chip
                  )}
                >
                  {genre}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        {selectedGenre === "기타" ? (
          <FormField id="customGenre" label="기타 장르" error={errors.customGenre?.message}>
            <input
              id="customGenre"
              className={cn("w-full border outline-none ring-4 ring-transparent", theme.input)}
              placeholder="예: 웹드라마, 숏폼, 광고"
              aria-invalid={Boolean(errors.customGenre)}
              aria-describedby={errors.customGenre ? "customGenre-error" : undefined}
              {...register("customGenre")}
            />
          </FormField>
        ) : null}
      </section>

      <section className={cn("grid content-start gap-4", theme.card)}>
        <div className="flex items-start gap-3">
          <Clapperboard aria-hidden="true" className={cn("mt-1 size-5 shrink-0", theme.accentText)} />
          <div>
            <h2 className="text-lg font-bold">장면 기본 정보</h2>
            <p className={cn("mt-1 text-sm", theme.muted)}>
              여기서는 최소한만 적고, 다음 단계에서 챗봇이 의도를 더 좁혀갑니다.
            </p>
          </div>
        </div>

        <FormField
          id="situation"
          label="장면 상황"
          error={errors.situation?.message}
          help="실제로 벌어진 사건을 한 문장으로 적어주세요."
        >
          <textarea
            id="situation"
            className={cn("min-h-24 w-full resize-y border outline-none ring-4 ring-transparent", theme.input)}
            placeholder="예: 불합격 전화를 받지만 친구 앞에서는 괜찮은 척한다"
            aria-invalid={Boolean(errors.situation)}
            aria-describedby={errors.situation ? "situation-error" : undefined}
            {...register("situation")}
          />
        </FormField>

        <FormField
          id="characterSetting"
          label="인물 설정"
          error={errors.characterSetting?.message}
          help="인물의 상황, 관계, 지금 처지를 적어주세요."
        >
          <textarea
            id="characterSetting"
            className={cn("min-h-24 w-full resize-y border outline-none ring-4 ring-transparent", theme.input)}
            placeholder="예: 마지막 기회라고 믿고 오디션을 준비한 배우 지망생"
            aria-invalid={Boolean(errors.characterSetting)}
            aria-describedby={errors.characterSetting ? "characterSetting-error" : undefined}
            {...register("characterSetting")}
          />
        </FormField>

        <FormField
          id="subtext"
          label="초기 연기 의도"
          optional
          error={errors.subtext?.message}
          help="정확하지 않아도 됩니다. 챗봇이 다음 단계에서 더 구체화합니다."
        >
          <textarea
            id="subtext"
            className={cn("min-h-20 w-full resize-y border outline-none ring-4 ring-transparent", theme.input)}
            placeholder="예: 무너지지 않은 사람처럼 보이고 싶다"
            aria-invalid={Boolean(errors.subtext)}
            aria-describedby={errors.subtext ? "subtext-error" : undefined}
            {...register("subtext")}
          />
        </FormField>

        <Button
          type="submit"
          disabled={isSubmitting}
          className={cn("w-full gap-2", theme.primaryButton)}
        >
          {isSubmitting ? (
            <Loader2 aria-hidden="true" className="size-4 animate-spin" />
          ) : (
            <MessageCircle aria-hidden="true" className="size-4" />
          )}
          {isSubmitting ? "첫 질문 준비 중" : "챗봇과 의도 구체화"}
        </Button>
        {submitError ? (
          <p role="alert" className="text-sm font-medium text-red-600">
            {submitError}
          </p>
        ) : null}
      </section>
    </form>
  )
}

function StepList({ stage, theme }: { stage: Stage; theme: DesignTheme }) {
  const steps = [
    { id: "intake", label: "1 기본 정보" },
    { id: "chat", label: "2 챗봇 구체화" },
    { id: "diagnosis", label: "3 진단 메모" },
  ] as const
  const activeIndex = steps.findIndex((step) => step.id === stage)

  return (
    <ol className={cn("grid gap-2 sm:grid-cols-3", theme.card)}>
      {steps.map((step, index) => (
        <li
          key={step.id}
          className={cn(
            "rounded-full px-3 py-2 text-center text-sm font-bold",
            index <= activeIndex ? theme.accentSoft : "bg-black/5 text-black/45"
          )}
        >
          {step.label}
        </li>
      ))}
    </ol>
  )
}

function IntakeSummary({
  values,
  theme,
}: {
  values: CoachingFormFields | null
  theme: DesignTheme
}) {
  if (!values) {
    return null
  }

  return (
    <section className={cn("grid gap-3", theme.card)}>
      <div className="flex items-center gap-2">
        <CheckCircle2 aria-hidden="true" className={cn("size-5", theme.accentText)} />
        <h2 className="text-base font-bold">입력 요약</h2>
      </div>
      <dl className="grid gap-2 text-sm leading-6">
        <div>
          <dt className={cn("font-bold", theme.muted)}>장면 상황</dt>
          <dd>{values.situation}</dd>
        </div>
        <div>
          <dt className={cn("font-bold", theme.muted)}>인물 설정</dt>
          <dd>{values.characterSetting}</dd>
        </div>
        {values.subtext.trim().length > 0 ? (
          <div>
            <dt className={cn("font-bold", theme.muted)}>초기 연기 의도</dt>
            <dd>{values.subtext}</dd>
          </div>
        ) : null}
      </dl>
    </section>
  )
}

function FormField({
  id,
  label,
  help,
  optional,
  error,
  children,
}: {
  id: string
  label: string
  help?: string
  optional?: boolean
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="grid gap-2">
      <div className="flex items-center gap-2">
        <label htmlFor={id} className="text-sm font-bold">
          {label}
        </label>
        {optional ? (
          <span className="rounded-full bg-black/5 px-2 py-0.5 text-[11px] font-bold text-black/55">
            선택
          </span>
        ) : null}
      </div>
      {help ? <p className="text-xs text-black/55">{help}</p> : null}
      {children}
      <FieldError id={`${id}-error`} message={error} />
    </div>
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

function ResultPanel({
  result,
  isPending,
  coachingId,
  error,
  theme,
}: {
  result?: CoachingResponse
  isPending: boolean
  coachingId: string
  error: string
  theme: DesignTheme
}) {
  if (isPending) {
    return (
      <section className={cn("grid gap-3", theme.card)}>
        <div className="flex items-center gap-2">
          <Loader2 aria-hidden="true" className={cn("size-5 animate-spin", theme.accentText)} />
          <h2 className="text-base font-bold">진단 준비 중</h2>
        </div>
        <p className={cn("text-sm leading-6", theme.muted)}>
          챗봇 대화를 바탕으로 진단 메모를 준비하고 있습니다.
        </p>
      </section>
    )
  }

  if (!result) {
    return (
      <section className={cn("grid gap-3", theme.card)}>
        <div className="flex items-center gap-2">
          <ClipboardList aria-hidden="true" className={cn("size-5", theme.accentText)} />
          <h2 className="text-base font-bold">진단 대기</h2>
        </div>
        <p className={cn("text-sm leading-6", theme.muted)}>
          {error || "챗봇 대화가 끝나면 이곳에 진단 메모가 표시됩니다."}
        </p>
      </section>
    )
  }

  if (result.status !== "COMPLETED" || !result.result) {
    const isFailed = result.status === "FAILED"

    return (
      <section className={cn("grid gap-3", theme.card)}>
        <div className="flex items-center gap-2">
          {isFailed ? (
            <AlertCircle aria-hidden="true" className="size-5 text-red-600" />
          ) : (
            <Loader2 aria-hidden="true" className={cn("size-5 animate-spin", theme.accentText)} />
          )}
          <h2 className="text-base font-bold">{isFailed ? "진단 실패" : "진단 준비 중"}</h2>
        </div>
        <p className={cn("text-sm leading-6", theme.muted)}>
          {isFailed
            ? `코칭 ID ${result.coachingId}의 진단이 실패했습니다. 다시 시도해 주세요.`
            : `코칭 ID ${result.coachingId}의 진단 메모를 준비하고 있습니다.`}
        </p>
      </section>
    )
  }

  return (
    <section className={cn("grid gap-4", theme.card)}>
      <div className="flex items-center gap-2">
        <ClipboardList aria-hidden="true" className={cn("size-5", theme.accentText)} />
        <h2 className="text-base font-bold">진단 메모</h2>
      </div>

      <div className={theme.mutedCard}>
        <p className="text-sm font-bold">현재 연기의 경향</p>
        <p className="mt-2 text-sm leading-6">{result.result.overallStrength.text}</p>
      </div>

      <div className="grid gap-3">
        {result.result.feedbackCards.map((card) => (
          <article key={card.order} className={theme.resultCard}>
            <p className={cn("text-xs font-bold", theme.accentText)}>
              진단 {card.order}
            </p>
            <h3 className="mt-2 text-base font-bold leading-6">{card.title}</h3>

            <div className="mt-4 grid gap-2">
              <p className="text-sm font-bold">관찰된 경향</p>
              {card.observations.map((observation) => (
                <div key={`${card.order}-${observation.timecode}`} className={theme.mutedCard}>
                  <p className="text-xs font-bold text-black/55">{observation.timecode}</p>
                  <p className="mt-1 text-sm leading-6">{observation.text}</p>
                </div>
              ))}
            </div>

            <dl className="mt-4 grid gap-3 text-sm leading-6">
              <div>
                <dt className="font-bold">가능한 원인</dt>
                <dd className={theme.muted}>{card.cause}</dd>
              </div>
              <div>
                <dt className="font-bold">연습 처방</dt>
                <dd className={theme.muted}>{card.practiceSteps.join(" ")}</dd>
              </div>
              <div>
                <dt className="font-bold">기대 변화</dt>
                <dd className={theme.muted}>{card.expectedEffect}</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>

      <WaitlistCta theme={theme} />
      <DiagnosisFeedbackCard coachingId={coachingId} theme={theme} />
    </section>
  )
}

function WaitlistCta({ theme }: { theme: DesignTheme }) {
  return (
    <section className="grid gap-3 border-t border-black/10 pt-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
      <div>
        <h3 className="text-sm font-bold">정식 오픈 소식을 받아보세요</h3>
        <p className={cn("mt-1 text-sm leading-6", theme.muted)}>
          테스트 모집이 시작되면 가장 먼저 안내해 드립니다.
        </p>
      </div>
      <Link
        href="/waitlist"
        className={cn(
          "inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold transition",
          theme.primaryButton
        )}
      >
        <Bell aria-hidden="true" className="size-4" />
        정식 오픈 알림 받기
      </Link>
    </section>
  )
}

function DiagnosisFeedbackCard({
  coachingId,
  theme,
}: {
  coachingId: string
  theme: DesignTheme
}) {
  const [rating, setRating] = useState<number | null>(null)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [comment, setComment] = useState("")
  const [isSubmitted, setIsSubmitted] = useState(false)

  function toggleTag(tag: string) {
    setSelectedTags((currentTags) =>
      currentTags.includes(tag)
        ? currentTags.filter((currentTag) => currentTag !== tag)
        : [...currentTags, tag]
    )
  }

  if (isSubmitted) {
    return (
      <section className={cn("grid gap-2", theme.mutedCard)}>
        <div className="flex items-center gap-2">
          <CheckCircle2 aria-hidden="true" className={cn("size-5", theme.accentText)} />
          <h3 className="text-sm font-bold">의견이 기록되었습니다.</h3>
        </div>
        <p className={cn("text-sm leading-6", theme.muted)}>
          남겨주신 의견은 다음 진단 경험을 다듬는 데 참고하겠습니다.
        </p>
      </section>
    )
  }

  return (
    <section className="grid gap-4 border-t border-black/10 pt-4">
      <div>
        <h3 className="text-sm font-bold">이 진단이 도움이 되었나요?</h3>
        <p className={cn("mt-1 text-sm leading-6", theme.muted)}>
          결과를 읽은 뒤 느낀 점을 짧게 남겨주세요.
        </p>
      </div>

      <div className="flex flex-wrap gap-2" aria-label="도움도 평점">
        {[1, 2, 3, 4, 5].map((score) => (
          <button
            key={score}
            type="button"
            aria-pressed={rating === score}
            className={cn(
              "h-9 rounded-full border px-4 text-sm font-bold transition",
              rating === score ? theme.chipActive : theme.chip
            )}
            onClick={() => setRating(score)}
          >
            {score}점
          </button>
        ))}
      </div>

      {rating ? (
        <>
          <div className="flex flex-wrap gap-2">
            {diagnosisFeedbackTags.map((tag) => (
              <button
                key={tag}
                type="button"
                aria-pressed={selectedTags.includes(tag)}
                className={cn(
                  "h-9 rounded-full border px-4 text-sm font-bold transition",
                  selectedTags.includes(tag) ? theme.chipActive : theme.chip
                )}
                onClick={() => toggleTag(tag)}
              >
                {tag}
              </button>
            ))}
          </div>

          <div className="grid gap-2">
            <label htmlFor="diagnosis-feedback-comment" className="text-sm font-bold">
              추가 의견
            </label>
            <textarea
              id="diagnosis-feedback-comment"
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              className={cn("min-h-24 w-full resize-y border outline-none ring-4 ring-transparent", theme.input)}
              placeholder="좋았던 점이나 아쉬웠던 점을 자유롭게 남겨주세요."
            />
          </div>

          <Button
            type="button"
            className={cn("w-full", theme.secondaryButton)}
            onClick={async () => {
              const tagComment =
                selectedTags.length > 0
                  ? `[${selectedTags.join(", ")}] ${comment}`.trim()
                  : comment
              await submitCoachingEvaluation(coachingId, {
                rating,
                comment: tagComment.trim(),
              })
              setIsSubmitted(true)
            }}
          >
            의견 남기기
          </Button>
        </>
      ) : null}
    </section>
  )
}
