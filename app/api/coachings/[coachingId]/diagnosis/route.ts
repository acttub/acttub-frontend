const backendApiBaseUrl = process.env.BACKEND_API_URL ?? "http://localhost:8080"

type RouteContext = {
  params: Promise<{
    coachingId: string
  }>
}

export async function POST(_request: Request, context: RouteContext) {
  const { coachingId } = await context.params
  const response = await fetch(
    `${backendApiBaseUrl}/api/v1/coachings/${encodeURIComponent(coachingId)}/diagnosis`,
    {
      method: "POST",
    }
  )
  const contentType = response.headers.get("content-type") ?? "application/json"

  return new Response(await response.text(), {
    status: response.status,
    headers: {
      "content-type": contentType,
    },
  })
}
