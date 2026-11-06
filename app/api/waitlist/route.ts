const backendApiBaseUrl = process.env.BACKEND_API_URL ?? "http://localhost:8080"

export async function POST(request: Request) {
  const response = await fetch(`${backendApiBaseUrl}/api/v1/waitlist`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: await request.text(),
  })
  const contentType = response.headers.get("content-type") ?? "application/json"

  return new Response(await response.text(), {
    status: response.status,
    headers: {
      "content-type": contentType,
    },
  })
}
