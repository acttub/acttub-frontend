import { describe, expect, it, vi } from "vitest"

import { compressVideoForUpload } from "./video-compression"

describe("compressVideoForUpload", () => {
  it("returns the compressed file when it is smaller than the original", async () => {
    const original = new File(["original video bytes"], "scene.mp4", {
      type: "video/mp4",
    })
    const compressed = new File(["small"], "scene.webm", {
      type: "video/webm",
    })

    await expect(
      compressVideoForUpload(original, {
        encoder: vi.fn().mockResolvedValue(compressed),
      })
    ).resolves.toBe(compressed)
  })

  it("keeps the original file when compression makes the file larger", async () => {
    const original = new File(["small"], "scene.mp4", {
      type: "video/mp4",
    })
    const larger = new File(["larger compressed bytes"], "scene.webm", {
      type: "video/webm",
    })

    await expect(
      compressVideoForUpload(original, {
        encoder: vi.fn().mockResolvedValue(larger),
      })
    ).resolves.toBe(original)
  })

  it("keeps the original file when browser compression is unavailable", async () => {
    const original = new File(["original video bytes"], "scene.mp4", {
      type: "video/mp4",
    })

    await expect(compressVideoForUpload(original)).resolves.toBe(original)
  })
})
