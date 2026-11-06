import {
  compressVideoForUpload,
  type VideoCompressor,
} from "./video-compression"
import { getSupportedVideoMimeType, normalizeVideoFileForUpload } from "./video-file"

export const COACHING_API_URL = "/api/coachings"

export const coachingGenres = ["연극", "영화", "뮤지컬", "드라마", "기타"] as const

export type CoachingGenre = (typeof coachingGenres)[number]
export type CoachingStatus =
  | "ANALYZING"
  | "QUESTION_READY"
  | "IN_CONVERSATION"
  | "READY_FOR_DIAGNOSIS"
  | "COMPLETED"
  | "FAILED"

export type CoachingRequest = {
  video: File
  genre: CoachingGenre
  customGenre: string
  situation: string
  characterSetting: string
  subtext: string
}

export type CoachingResponse = {
  coachingId: string
  status: CoachingStatus
  createdAt: string
  completedAt?: string | null
  input?: {
    genre: CoachingGenre
    customGenre: string | null
    situation: string
    characterSetting: string
    subtext: string | null
  }
  dialogue?: {
    question: string
  }
  conversation?: {
    turnIndex: number
    minTurns: number
    maxTurns: number
    diagnosisReady: boolean
    reason?: string
    summary?: string
  }
  context?: {
    transcript?: string
    analysis?: string
    measurableSignals?: Array<{
      name: string
      value: number
      unit: string
      evidence: string
    }>
    diagnosticHypothesis?: string
  }
  refinedContext?: {
    refinedSituation: string
    refinedIntent: string
  }
  result?: {
    overallStrength: {
      text: string
    }
    feedbackCards: Array<{
      order: number
      title: string
      observations: Array<{
        timecode: string
        text: string
      }>
      cause: string
      practiceSteps: string[]
      expectedEffect: string
    }>
  } | null
}

export type CoachingMessageRequest = {
  answer: string
}

export type CoachingEvaluationRequest = {
  rating: number
  comment: string
}

export type CoachingEvaluationResponse = {
  evaluationId: string
  coachingId: string
  rating: number
  comment: string
  createdAt: string
}

type SuccessEnvelope<T> = {
  data: T
}

type ErrorEnvelope = {
  error?: {
    code?: string
    message?: string
    details?: unknown
  }
}

const coachingErrorMessages: Record<string, string> = {
  AI_ANALYSIS_FAILED:
    "AI 분석 서버 연결에 문제가 있어요. 잠시 후 다시 시도하거나 관리자에게 알려주세요.",
  AI_ANALYSIS_TIMEOUT:
    "AI 분석 응답이 지연되고 있어요. 잠시 후 다시 시도해주세요.",
}

type SubmitCoachingOptions = {
  videoCompressor?: VideoCompressor
}

function selectUploadVideo(originalVideo: File, compressedVideo: File) {
  const normalizedOriginal = normalizeVideoFileForUpload(originalVideo)
  const normalizedCompressed = normalizeVideoFileForUpload(compressedVideo)

  if (
    getSupportedVideoMimeType(normalizedOriginal) !==
    getSupportedVideoMimeType(normalizedCompressed)
  ) {
    return normalizedOriginal
  }

  return normalizedCompressed
}

export function buildCoachingFormData(input: CoachingRequest) {
  const formData = new FormData()

  formData.append("video", input.video)
  formData.append("genre", input.genre)
  formData.append("customGenre", input.genre === "기타" ? input.customGenre.trim() : "")
  formData.append("situation", input.situation.trim())
  formData.append("characterSetting", input.characterSetting.trim())
  formData.append("subtext", input.subtext.trim())

  return formData
}

function coachingErrorMessage(payload: ErrorEnvelope, fallbackMessage: string) {
  const code = payload.error?.code

  if (code && coachingErrorMessages[code]) {
    return coachingErrorMessages[code]
  }

  return payload.error?.message ?? fallbackMessage
}

export async function submitCoaching(
  input: CoachingRequest,
  options: SubmitCoachingOptions = {}
) {
  const videoCompressor = options.videoCompressor ?? compressVideoForUpload
  const normalizedVideo = normalizeVideoFileForUpload(input.video)
  const uploadInput = {
    ...input,
    video: selectUploadVideo(normalizedVideo, await videoCompressor(normalizedVideo)),
  }
  const response = await fetch(COACHING_API_URL, {
    method: "POST",
    body: buildCoachingFormData(uploadInput),
  })

  const payload = (await response.json()) as SuccessEnvelope<CoachingResponse> &
    ErrorEnvelope

  if (!response.ok) {
    throw new Error(coachingErrorMessage(payload, "코칭 요청을 처리하지 못했습니다."))
  }

  return payload.data
}

export async function sendCoachingMessage(
  coachingId: string,
  input: CoachingMessageRequest
) {
  const response = await fetch(
    `${COACHING_API_URL}/${encodeURIComponent(coachingId)}/messages`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    }
  )
  const payload = (await response.json()) as SuccessEnvelope<CoachingResponse> &
    ErrorEnvelope

  if (!response.ok) {
    throw new Error(payload.error?.message ?? "답변을 전송하지 못했습니다.")
  }

  return payload.data
}

export async function createCoachingDiagnosis(coachingId: string) {
  const response = await fetch(
    `${COACHING_API_URL}/${encodeURIComponent(coachingId)}/diagnosis`,
    {
      method: "POST",
    }
  )
  const payload = (await response.json()) as SuccessEnvelope<CoachingResponse> &
    ErrorEnvelope

  if (!response.ok) {
    throw new Error(payload.error?.message ?? "최종 진단을 생성하지 못했습니다.")
  }

  return payload.data
}

export async function submitCoachingEvaluation(
  coachingId: string,
  input: CoachingEvaluationRequest
) {
  const response = await fetch(
    `${COACHING_API_URL}/${encodeURIComponent(coachingId)}/evaluation`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    }
  )
  const payload = (await response.json()) as SuccessEnvelope<CoachingEvaluationResponse> &
    ErrorEnvelope

  if (!response.ok) {
    throw new Error(payload.error?.message ?? "의견을 등록하지 못했습니다.")
  }

  return payload.data
}

export async function submitCoachingAndWait(
  input: CoachingRequest,
  options: SubmitCoachingOptions = {}
) {
  let current = await submitCoaching(input, {
    videoCompressor: options.videoCompressor,
  })

  if (current.status === "COMPLETED") {
    return current
  }

  const preparedAnswers = [
    input.situation,
    input.characterSetting,
    input.subtext,
  ]
    .map((answer) => answer.trim())
    .filter(Boolean)

  for (const answer of preparedAnswers) {
    if (current.status === "READY_FOR_DIAGNOSIS") {
      break
    }

    if (
      current.status !== "QUESTION_READY" &&
      current.status !== "IN_CONVERSATION"
    ) {
      break
    }

    current = await sendCoachingMessage(current.coachingId, { answer })

    if (current.status === "COMPLETED") {
      return current
    }
  }

  if (current.status === "READY_FOR_DIAGNOSIS") {
    return createCoachingDiagnosis(current.coachingId)
  }

  return current
}
