export type VideoCompressor = (file: File) => Promise<File>

type VideoEncoder = (
  file: File,
  options: RequiredVideoCompressionOptions
) => Promise<File>

export type VideoCompressionOptions = {
  maxWidth?: number
  maxHeight?: number
  frameRate?: number
  videoBitsPerSecond?: number
  mimeTypes?: string[]
  encoder?: VideoEncoder
}

type RequiredVideoCompressionOptions = Required<
  Omit<VideoCompressionOptions, "encoder">
>

const defaultOptions: RequiredVideoCompressionOptions = {
  maxWidth: 1280,
  maxHeight: 720,
  frameRate: 24,
  videoBitsPerSecond: 1_500_000,
  mimeTypes: ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"],
}

export async function compressVideoForUpload(
  file: File,
  options: VideoCompressionOptions = {}
) {
  if (!file.type.startsWith("video/")) {
    return file
  }

  const resolvedOptions = {
    ...defaultOptions,
    ...options,
  }
  const encoder = options.encoder ?? encodeVideoWithBrowserApis

  try {
    const compressed = await encoder(file, resolvedOptions)

    if (compressed.size > 0 && compressed.size < file.size) {
      return compressed
    }
  } catch {
    return file
  }

  return file
}

async function encodeVideoWithBrowserApis(
  file: File,
  options: RequiredVideoCompressionOptions
) {
  if (
    typeof document === "undefined" ||
    typeof MediaRecorder === "undefined" ||
    typeof MediaStream === "undefined" ||
    typeof URL === "undefined" ||
    typeof URL.createObjectURL !== "function"
  ) {
    throw new Error("Video compression is not supported in this browser.")
  }

  const mimeType = selectMimeType(options.mimeTypes)
  if (!mimeType) {
    throw new Error("No supported video encoder is available.")
  }

  const video = document.createElement("video")
  const canvas = document.createElement("canvas")
  const canvasStream = canvas.captureStream?.(options.frameRate)
  const context = canvas.getContext("2d")
  if (!canvasStream || !context) {
    throw new Error("Canvas capture is not supported.")
  }

  const objectUrl = URL.createObjectURL(file)
  let animationFrame = 0
  let audioGraph: AudioGraph | null = null

  try {
    video.preload = "metadata"
    video.playsInline = true
    video.src = objectUrl

    await waitForMediaEvent(video, "loadedmetadata")
    const dimensions = fitDimensions(
      video.videoWidth,
      video.videoHeight,
      options.maxWidth,
      options.maxHeight
    )
    canvas.width = dimensions.width
    canvas.height = dimensions.height

    audioGraph = await createAudioGraph(video)
    const outputStream = new MediaStream([
      ...canvasStream.getVideoTracks(),
      ...audioGraph.destination.stream.getAudioTracks(),
    ])
    const chunks: BlobPart[] = []
    const recorder = new MediaRecorder(outputStream, {
      mimeType,
      videoBitsPerSecond: options.videoBitsPerSecond,
    })
    const stopped = waitForRecorderStop(recorder, chunks, mimeType)

    recorder.start()
    await audioGraph.context.resume()
    await video.play()

    const drawFrame = () => {
      context.drawImage(video, 0, 0, dimensions.width, dimensions.height)

      if (!video.ended) {
        animationFrame = requestAnimationFrame(drawFrame)
      }
    }
    drawFrame()

    await waitForMediaEvent(video, "ended")
    if (recorder.state !== "inactive") {
      recorder.stop()
    }

    const blob = await stopped
    return new File([blob], getCompressedFileName(file.name), {
      type: mimeType,
    })
  } finally {
    if (animationFrame) {
      cancelAnimationFrame(animationFrame)
    }
    canvasStream.getTracks().forEach((track) => track.stop())
    audioGraph?.destination.stream.getTracks().forEach((track) => track.stop())
    await audioGraph?.context.close().catch(() => undefined)
    video.removeAttribute("src")
    video.load()
    URL.revokeObjectURL(objectUrl)
  }
}

function selectMimeType(mimeTypes: string[]) {
  return mimeTypes.find((mimeType) => MediaRecorder.isTypeSupported(mimeType))
}

function fitDimensions(
  sourceWidth: number,
  sourceHeight: number,
  maxWidth: number,
  maxHeight: number
) {
  if (sourceWidth <= 0 || sourceHeight <= 0) {
    return {
      width: maxWidth,
      height: maxHeight,
    }
  }

  const scale = Math.min(maxWidth / sourceWidth, maxHeight / sourceHeight, 1)

  return {
    width: Math.round(sourceWidth * scale),
    height: Math.round(sourceHeight * scale),
  }
}

type AudioGraph = {
  context: AudioContext
  source: MediaElementAudioSourceNode
  destination: MediaStreamAudioDestinationNode
}

async function createAudioGraph(video: HTMLVideoElement): Promise<AudioGraph> {
  const AudioContextConstructor =
    globalThis.AudioContext ??
    (
      globalThis as typeof globalThis & {
        webkitAudioContext?: typeof AudioContext
      }
    ).webkitAudioContext

  if (!AudioContextConstructor) {
    throw new Error("Audio compression is not supported in this browser.")
  }

  const context = new AudioContextConstructor()
  const source = context.createMediaElementSource(video)
  const destination = context.createMediaStreamDestination()
  source.connect(destination)

  return {
    context,
    source,
    destination,
  }
}

function waitForMediaEvent(
  element: HTMLMediaElement,
  eventName: "loadedmetadata" | "ended"
) {
  return new Promise<void>((resolve, reject) => {
    const handleEvent = () => {
      cleanup()
      resolve()
    }
    const handleError = () => {
      cleanup()
      reject(new Error("Unable to read video file."))
    }
    const cleanup = () => {
      element.removeEventListener(eventName, handleEvent)
      element.removeEventListener("error", handleError)
    }

    element.addEventListener(eventName, handleEvent, { once: true })
    element.addEventListener("error", handleError, { once: true })
  })
}

function waitForRecorderStop(
  recorder: MediaRecorder,
  chunks: BlobPart[],
  mimeType: string
) {
  return new Promise<Blob>((resolve, reject) => {
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data)
      }
    }
    recorder.onerror = () => {
      reject(new Error("Unable to compress video."))
    }
    recorder.onstop = () => {
      resolve(new Blob(chunks, { type: mimeType }))
    }
  })
}

function getCompressedFileName(fileName: string) {
  return fileName.replace(/\.[^/.]+$/, "") + ".webm"
}
