import { describe, expect, it } from "vitest"

import {
  getSupportedVideoMimeType,
  isSupportedVideoFile,
  normalizeVideoFileForUpload,
} from "./video-file"

describe("video file helpers", () => {
  it("normalizes parameterized webm mime types to the backend-supported type", () => {
    const file = new File(["video"], "scene.webm", {
      type: "video/webm;codecs=vp9",
    })

    expect(getSupportedVideoMimeType(file)).toBe("video/webm")
    expect(
      isSupportedVideoFile(file, new Set(["video/mp4", "video/webm"]), 1024)
    ).toBe(true)

    const normalized = normalizeVideoFileForUpload(file)
    expect(normalized.name).toBe(file.name)
    expect(normalized.size).toBe(file.size)
    expect(normalized.type).toBe("video/webm")
  })
})
