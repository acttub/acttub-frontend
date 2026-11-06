const backendApiBaseUrl = process.env.BACKEND_API_URL ?? "http://localhost:8080"

type RouteContext = {
  params: Promise<{
    coachingId: string
  }>
}

export async function POST(request: Request, context: RouteContext) {
  const { coachingId } = await context.params
  const response = await fetch(
    `${backendApiBaseUrl}/api/v1/coachings/${encodeURIComponent(coachingId)}/evaluation`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: await request.text(),
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
