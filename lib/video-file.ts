const videoMimeTypesByExtension: Record<string, string> = {
  mp4: "video/mp4",
  m4v: "video/mp4",
  mov: "video/quicktime",
  qt: "video/quicktime",
  webm: "video/webm",
}

export function getSupportedVideoMimeType(file: File) {
  if (file.type.startsWith("video/")) {
    return file.type.split(";")[0]?.trim().toLowerCase() ?? ""
  }

  const extension = file.name.split(".").pop()?.toLowerCase()
  if (!extension) {
    return ""
  }

  return videoMimeTypesByExtension[extension] ?? ""
}

export function isSupportedVideoFile(
  file: File,
  allowedVideoTypes: ReadonlySet<string>,
  maxVideoSize: number
) {
  const mimeType = getSupportedVideoMimeType(file)

  return file.size > 0 && file.size <= maxVideoSize && allowedVideoTypes.has(mimeType)
}

export function normalizeVideoFileForUpload(file: File) {
  const mimeType = getSupportedVideoMimeType(file)

  if (!mimeType || file.type === mimeType) {
    return file
  }

  return new File([file], file.name, {
    type: mimeType,
    lastModified: file.lastModified,
  })
}
