/**
 * 이미지 선택 공통 유틸.
 *
 * 앱 WebView 안에서는 브릿지의 `PICK_IMAGE`를, 일반 브라우저에서는 `<input type="file">`을
 * 씁니다. 두 경로의 반환 형태를 `PickedWebImage`로 통일해서, 호출부(커뮤니티 글쓰기,
 * 용품 등록 등)가 실행 환경을 신경 쓰지 않도록 합니다.
 *
 * 왜 base64(dataUrl)인가:
 *   앱이 돌려주는 `file://` uri는 웹에서 fetch/XHR로 읽을 수 없어 업로드에 쓸 수 없습니다.
 *   그래서 규약상 기본이 base64입니다. (앱 규약 v1.0.0 §PICK_IMAGE)
 *
 * 추후 확장:
 *   사진 용량이 커서 base64가 부담이 되면, 앱이 직접 업로드하고 URL만 돌려주는
 *   `UPLOAD_IMAGE` 액션이 추가될 수 있습니다. 그때는 `PickedWebImage.url`만 채워지고
 *   `src`가 그 URL을 가리키게 되므로, 이 모듈을 쓰는 화면 코드는 바뀌지 않습니다.
 */
import { BridgeError, isActionSupported, isInApp, requestBridge } from '@/bridge/bridge'
import {
  BridgeAction,
  BridgeErrorCode,
  type PickImageData,
  type PickImagePayload,
} from '@/bridge/protocol'

export interface PickedWebImage {
  /** 목록 key로 쓸 수 있는 안정 식별자 */
  id: string
  /** `<img src>`와 업로드에 그대로 쓰는 값. base64 dataUrl 또는 원격 URL */
  src: string
  /** 앱이 직접 업로드해 URL만 내려준 경우에만 채워집니다 (현재 규약에서는 항상 undefined) */
  url?: string
  fileName: string
  mimeType: string
  /** byte. 알 수 없으면 null */
  fileSize: number | null
  width?: number
  height?: number
}

export interface PickImagesOptions {
  /** 이번 호출에서 고를 수 있는 최대 장수. 기본 1 */
  max?: number
  /** 앱 경로에서 쓰는 압축 품질 (0~1). 기본 0.8 */
  quality?: number
  /**
   * 브라우저 폴백에서 캔버스로 줄일 최대 변 길이(px). 기본 1600.
   * 0 이하면 원본 그대로 사용합니다.
   *
   * 앱 경로에는 적용하지 않습니다. 이미 큰 base64를 메모리에 올린 뒤에 다시 줄이면
   * 메모리 절감 효과가 없어서, 그쪽은 앱이 압축해 내려주는 것을 전제로 합니다.
   */
  maxDimension?: number
}

/** 브릿지 대신 파일 입력으로 폴백해야 하는 에러인지 */
const FALLBACK_ERROR_CODES: string[] = [
  BridgeErrorCode.NO_BRIDGE,
  BridgeErrorCode.UNSUPPORTED_ACTION,
  BridgeErrorCode.NOT_AVAILABLE,
]

/**
 * 이미지를 선택합니다. 사용자가 취소하면 빈 배열을 돌려줍니다(에러가 아닙니다).
 *
 * 권한 거부처럼 사용자에게 알려야 하는 실패는 `BridgeError`로 그대로 던집니다.
 */
export async function pickImages(options: PickImagesOptions = {}): Promise<PickedWebImage[]> {
  const { max = 1, quality = 0.8, maxDimension = 1600 } = options
  if (max <= 0) return []

  if (isInApp() && isActionSupported(BridgeAction.PICK_IMAGE)) {
    try {
      return await pickViaBridge(max, quality)
    } catch (error) {
      const code = error instanceof BridgeError ? error.code : null
      if (code === BridgeErrorCode.USER_CANCELLED) return []
      // 구버전 앱 등 브릿지가 처리 못 하는 경우에만 웹 폴백으로 내려갑니다.
      if (code && FALLBACK_ERROR_CODES.includes(code)) {
        return pickViaFileInput(max, quality, maxDimension)
      }
      throw error
    }
  }

  return pickViaFileInput(max, quality, maxDimension)
}

// ---------------------------------------------------------------------------
// 앱 경로
// ---------------------------------------------------------------------------

async function pickViaBridge(max: number, quality: number): Promise<PickedWebImage[]> {
  const payload: PickImagePayload = {
    multiple: max > 1,
    max,
    quality,
    returnAs: 'base64',
  }

  const data = await requestBridge<PickImageData>(BridgeAction.PICK_IMAGE, payload)

  return (data.images ?? []).slice(0, max).map((image, index) => {
    const src = image.dataUrl ?? image.uri
    if (src.startsWith('file://')) {
      // 업로드는 물론이고 <img>로 표시도 되지 않습니다. 규약 위반이므로 눈에 띄게 남깁니다.
      console.warn(
        '[imagePicker] 앱이 dataUrl 없이 file:// uri를 돌려줬습니다. 업로드에 쓸 수 없습니다.',
        image.uri,
      )
    }
    return {
      id: createId(index),
      src,
      fileName: image.fileName,
      mimeType: image.mimeType,
      fileSize: image.fileSize,
      width: image.width,
      height: image.height,
    }
  })
}

// ---------------------------------------------------------------------------
// 브라우저 폴백
// ---------------------------------------------------------------------------

function pickViaFileInput(
  max: number,
  quality: number,
  maxDimension: number,
): Promise<PickedWebImage[]> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.multiple = max > 1
    input.style.display = 'none'

    let settled = false

    const cleanup = () => {
      input.remove()
    }

    const handleChange = () => {
      if (settled) return
      settled = true
      const files = Array.from(input.files ?? []).slice(0, max)
      cleanup()
      Promise.all(files.map((file, index) => readFile(file, index, quality, maxDimension))).then(
        resolve,
        reject,
      )
    }

    const handleCancel = () => {
      if (settled) return
      settled = true
      cleanup()
      resolve([])
    }

    input.addEventListener('change', handleChange)
    // 파일 선택 창을 닫기만 한 경우. 최신 브라우저에서 지원됩니다.
    input.addEventListener('cancel', handleCancel)

    document.body.appendChild(input)
    input.click()
  })
}

async function readFile(
  file: File,
  index: number,
  quality: number,
  maxDimension: number,
): Promise<PickedWebImage> {
  const resized = maxDimension > 0 ? await downscale(file, quality, maxDimension) : null

  return {
    id: createId(index),
    src: resized?.dataUrl ?? (await readAsDataUrl(file)),
    fileName: file.name,
    mimeType: resized?.mimeType ?? file.type,
    fileSize: resized?.fileSize ?? file.size,
    width: resized?.width,
    height: resized?.height,
  }
}

interface DownscaleResult {
  dataUrl: string
  mimeType: string
  fileSize: number
  width: number
  height: number
}

/**
 * 캔버스로 긴 변을 `maxDimension`까지 줄입니다.
 * 줄일 필요가 없거나 브라우저가 지원하지 않으면 null을 돌려주고 원본을 쓰게 합니다.
 */
async function downscale(
  file: File,
  quality: number,
  maxDimension: number,
): Promise<DownscaleResult | null> {
  if (typeof createImageBitmap !== 'function') return null

  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    return null
  }

  try {
    const longEdge = Math.max(bitmap.width, bitmap.height)
    if (longEdge <= maxDimension) return null

    const scale = maxDimension / longEdge
    const width = Math.round(bitmap.width * scale)
    const height = Math.round(bitmap.height * scale)

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d')
    if (!context) return null
    context.drawImage(bitmap, 0, 0, width, height)

    // PNG는 투명도가 있을 수 있어 그대로 두고, 나머지는 용량이 훨씬 작은 JPEG로 내보냅니다.
    const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
    const dataUrl = canvas.toDataURL(mimeType, quality)

    return { dataUrl, mimeType, fileSize: estimateDataUrlBytes(dataUrl), width, height }
  } finally {
    bitmap.close()
  }
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error ?? new Error('이미지를 읽지 못했습니다.'))
    reader.readAsDataURL(file)
  })
}

/** dataUrl의 base64 본문 길이로 원본 byte 수를 역산합니다. */
function estimateDataUrlBytes(dataUrl: string): number {
  const base64 = dataUrl.slice(dataUrl.indexOf(',') + 1)
  const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0
  return Math.max(0, Math.floor((base64.length * 3) / 4) - padding)
}

let idCounter = 0

function createId(index: number): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  idCounter += 1
  return `img-${Date.now()}-${idCounter}-${index}`
}
