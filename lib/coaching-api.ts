export const COACHING_API_URL = "http://localhost:8080/api/v1/coachings"

export const coachingGenres = ["연극", "영화", "뮤지컬", "드라마", "기타"] as const

export type CoachingGenre = (typeof coachingGenres)[number]

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
  status: "ANALYZING" | "COMPLETED" | "FAILED"
  createdAt: string
  completedAt: string | null
  input: {
    genre: CoachingGenre
    customGenre: string | null
    situation: string
    characterSetting: string
    subtext: string | null
  }
  result: {
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
  }
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

export async function submitCoaching(input: CoachingRequest) {
  const response = await fetch(COACHING_API_URL, {
    method: "POST",
    body: buildCoachingFormData(input),
  })

  const payload = (await response.json()) as SuccessEnvelope<CoachingResponse> &
    ErrorEnvelope

  if (!response.ok) {
    throw new Error(payload.error?.message ?? "코칭 요청을 처리하지 못했습니다.")
  }

  return payload.data
}
