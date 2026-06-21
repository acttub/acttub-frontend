"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import {
  AlertCircle,
  CheckCircle2,
  Clapperboard,
  Loader2,
  Sparkles,
  UploadCloud,
  Video,
} from "lucide-react"
import { useMemo, useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import {
  coachingGenres,
  submitCoaching,
  type CoachingResponse,
} from "@/lib/coaching-api"
import { cn } from "@/lib/utils"

const allowedVideoTypes = new Set(["video/mp4", "video/quicktime", "video/webm"])
const maxVideoSize = 100 * 1024 * 1024

const coachingSchema = z
  .object({
    video: z.custom<File>(
      (value) =>
        typeof File !== "undefined" &&
        value instanceof File &&
        value.size > 0 &&
        value.size <= maxVideoSize &&
        allowedVideoTypes.has(value.type),
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
  resultCard: string
}

const themes: DesignTheme[] = [
  {
    id: "toss",
    name: "Toss",
    badge: "Toss 스타일",
    description: "명확한 정보 위계와 파란 CTA 중심의 신뢰감 있는 구성",
    page: "bg-[#f2f4f6] text-[#191f28]",
    shell: "max-w-[640px]",
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
    resultCard: "rounded-2xl border border-[#e5e8eb] bg-white p-5",
  },
  {
    id: "karrot",
    name: "Karrot",
    badge: "Karrot 스타일",
    description: "동네 게시판처럼 따뜻하고 빠르게 스캔되는 구성",
    page: "bg-white text-[#1a1c20]",
    shell: "max-w-[640px]",
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
    resultCard: "rounded-lg border border-black/10 bg-white p-4",
  },
  {
    id: "baemin",
    name: "Baemin",
    badge: "Baemin 스타일",
    description: "민트 CTA와 또렷한 카드 표면을 쓰는 앱형 구성",
    page: "bg-[#f8f9fa] text-[#212529]",
    shell: "max-w-[768px]",
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
    resultCard: "rounded-lg border border-[#dee2e6] bg-white p-5",
  },
]

export function CoachingPage() {
  const [activeDesign, setActiveDesign] = useState<DesignId>("toss")
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

  const mutation = useMutation({
    mutationFn: submitCoaching,
  })

  const onSubmit = handleSubmit((values) => {
    mutation.mutate(values)
  })

  return (
    <main className={cn("min-h-svh px-4 py-6 sm:px-6 sm:py-10", theme.page)}>
      <div className={cn("mx-auto flex w-full flex-col gap-4", theme.shell)}>
        <header className="flex items-center justify-between gap-3 border-b border-black/10 pb-4">
          <div>
            <p className={cn("text-sm font-bold", theme.accentText)}>acttub coach</p>
            <h1 className={cn("mt-1 text-[26px] font-bold leading-tight", theme.title)}>
              연기 연습 피드백
            </h1>
          </div>
          <span className={cn("rounded-full px-3 py-1 text-xs font-bold", theme.accentSoft)}>
            coach
          </span>
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

        <form
          className="grid gap-4"
          onSubmit={onSubmit}
        >
          <section className={cn("grid gap-4", theme.card)}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold">영상과 장면 정보</h2>
                <p className={cn("mt-1 text-sm", theme.muted)}>
                  영상, 매체, 장면 맥락을 함께 보내면 코칭 피드백을 생성합니다.
                </p>
              </div>
              <Video
                aria-hidden="true"
                className={cn("size-6 shrink-0", theme.accentText)}
              />
            </div>

            <label
              htmlFor="video"
              className={cn(
                "flex min-h-36 cursor-pointer flex-col items-center justify-center gap-3 px-4 py-6 text-center transition hover:brightness-[0.98]",
                theme.dropzone
              )}
            >
              <UploadCloud
                aria-hidden="true"
                className="size-8"
              />
              <span className="text-sm font-bold">영상 파일</span>
              <span className="text-xs opacity-80">
                {selectedVideo?.name ?? "mp4, mov, webm · 최대 100MB"}
              </span>
              <input
                id="video"
                type="file"
                accept="video/mp4,video/quicktime,video/webm"
                className="sr-only"
                aria-label="영상 파일"
                aria-invalid={Boolean(errors.video)}
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
            <FieldError message={errors.video?.message} />

            <fieldset className="grid gap-2">
              <legend className="text-sm font-bold">매체 / 장르</legend>
              <div className="flex flex-wrap gap-2">
                {coachingGenres.map((genre) => (
                  <button
                    key={genre}
                    type="button"
                    className={cn(
                      "h-9 rounded-full border px-4 text-sm font-bold transition",
                      selectedGenre === genre ? theme.chipActive : theme.chip
                    )}
                    onClick={() =>
                      setValue("genre", genre, {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    }
                  >
                    {genre}
                  </button>
                ))}
              </div>
            </fieldset>

            {selectedGenre === "기타" ? (
              <FormField
                id="customGenre"
                label="기타 장르"
                error={errors.customGenre?.message}
              >
                <input
                  id="customGenre"
                  className={cn("w-full border outline-none ring-4 ring-transparent", theme.input)}
                  placeholder="예: 웹드라마, 숏폼, 광고"
                  {...register("customGenre")}
                />
              </FormField>
            ) : null}
          </section>

          <section className={cn("grid gap-4", theme.card)}>
            <div className="flex items-start gap-3">
              <Clapperboard
                aria-hidden="true"
                className={cn("mt-1 size-5 shrink-0", theme.accentText)}
              />
              <div>
                <h2 className="text-lg font-bold">장면 입력</h2>
                <p className={cn("mt-1 text-sm", theme.muted)}>
                  연기 의도 대신 상황, 인물 설정, 서브텍스트를 기준으로 분석합니다.
                </p>
              </div>
            </div>

            <FormField
              id="situation"
              label="상황"
              error={errors.situation?.message}
              help="무슨 일이 벌어지는 장면인지 한 줄로 적어주세요."
            >
              <textarea
                id="situation"
                className={cn(
                  "min-h-24 w-full resize-y border outline-none ring-4 ring-transparent",
                  theme.input
                )}
                placeholder="예: 합격 발표를 기다리다 불합격 전화를 받는 순간"
                {...register("situation")}
              />
            </FormField>

            <FormField
              id="characterSetting"
              label="인물 설정"
              error={errors.characterSetting?.message}
              help="이 인물은 누구이고 어떤 처지인지 적어주세요."
            >
              <textarea
                id="characterSetting"
                className={cn(
                  "min-h-24 w-full resize-y border outline-none ring-4 ring-transparent",
                  theme.input
                )}
                placeholder="예: 삼수생, 마지막 기회라 절박한 상태"
                {...register("characterSetting")}
              />
            </FormField>

            <FormField
              id="subtext"
              label="서브텍스트"
              optional
              error={errors.subtext?.message}
              help="비워두면 AI가 상황과 인물 설정으로 추론합니다."
            >
              <textarea
                id="subtext"
                className={cn(
                  "min-h-24 w-full resize-y border outline-none ring-4 ring-transparent",
                  theme.input
                )}
                placeholder="예: 괜찮은 척하지만 속으론 무너지고 있다"
                {...register("subtext")}
              />
            </FormField>

            {mutation.isError ? (
              <div className="flex gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                <AlertCircle
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0"
                />
                <span>{mutation.error.message}</span>
              </div>
            ) : null}

            <Button
              type="submit"
              className={cn("w-full gap-2", theme.primaryButton)}
              disabled={mutation.isPending}
            >
              {mutation.isPending ? (
                <Loader2
                  aria-hidden="true"
                  className="size-4 animate-spin"
                />
              ) : (
                <Sparkles
                  aria-hidden="true"
                  className="size-4"
                />
              )}
              AI로 분석
            </Button>
          </section>
        </form>

        <ResultPanel
          result={mutation.data}
          theme={theme}
        />
      </div>
    </main>
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
        <label
          htmlFor={id}
          className="text-sm font-bold"
        >
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
      <FieldError message={error} />
    </div>
  )
}

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null
  }

  return (
    <p className="text-sm font-medium text-red-600">
      {message}
    </p>
  )
}

function ResultPanel({
  result,
  theme,
}: {
  result?: CoachingResponse
  theme: DesignTheme
}) {
  if (!result) {
    return (
      <section className={cn("grid gap-3", theme.card)}>
        <div className={theme.mutedCard}>
          <p className="text-sm font-bold">결과 대기 중</p>
          <p className={cn("mt-1 text-sm", theme.muted)}>
            분석이 완료되면 강점 요약과 피드백 카드가 여기에 표시됩니다.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className={cn("grid gap-4", theme.card)}>
      <div className="flex items-start gap-3">
        <CheckCircle2
          aria-hidden="true"
          className={cn("mt-0.5 size-5 shrink-0", theme.accentText)}
        />
        <div>
          <h2 className="text-lg font-bold">분석 결과</h2>
          <p className={cn("mt-1 text-sm", theme.muted)}>
            코칭 ID {result.coachingId} · {result.status}
          </p>
        </div>
      </div>

      <div className={cn("grid gap-2", theme.mutedCard)}>
        <p className="text-sm font-bold">전체 강점</p>
        <p className="text-sm leading-6">{result.result.overallStrength.text}</p>
      </div>

      <div className="grid gap-3">
        {result.result.feedbackCards.map((card) => (
          <article
            key={card.order}
            className={theme.resultCard}
          >
            <p className={cn("text-xs font-bold", theme.accentText)}>
              피드백 {card.order}
            </p>
            <h3 className="mt-2 text-base font-bold leading-6">{card.title}</h3>

            <div className="mt-4 grid gap-3">
              {card.observations.map((observation) => (
                <div
                  key={`${card.order}-${observation.timecode}`}
                  className="rounded-lg bg-black/5 px-3 py-2"
                >
                  <p className="text-xs font-bold text-black/55">
                    {observation.timecode}
                  </p>
                  <p className="mt-1 text-sm leading-6">{observation.text}</p>
                </div>
              ))}
            </div>

            <dl className="mt-4 grid gap-3 text-sm leading-6">
              <div>
                <dt className="font-bold">원인</dt>
                <dd className={theme.muted}>{card.cause}</dd>
              </div>
              <div>
                <dt className="font-bold">연습 방법</dt>
                <dd className={theme.muted}>{card.practiceSteps.join(" ")}</dd>
              </div>
              <div>
                <dt className="font-bold">기대 효과</dt>
                <dd className={theme.muted}>{card.expectedEffect}</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
    </section>
  )
}
