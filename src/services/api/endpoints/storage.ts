/**
 * 이미지 업로드 엔드포인트.
 *
 * 서버 원본: `storage/controller/StorageController.java`, `storage/enums/BucketKind.java`
 * 업로드 응답은 CloudFront URL이 아니라 **이미지 키**(파일명)이고, 펫/용품 등록 요청에는
 * 이 키를 넣습니다. 반대로 조회 응답(`petProfileUrl` 등)은 전체 URL이라, 기존 이미지를 그대로
 * 유지할 때는 {@link extractImageKey}로 키를 되뽑아 보냅니다. (네이티브도 같은 방식입니다)
 */
import type { PickedWebImage } from '@/services/image/imagePicker'

import { apiService } from '../ApiService'
import { unwrapApiResponse } from '../types'

/** 서버 `BucketKind` enum (= S3 폴더 구분) */
export type BucketKind =
  'PUPPY_PROFILE' | 'WALK_PHOTO' | 'PET_ITEM_PHOTO' | 'USER_PROFILE' | 'COMMUNITY_POST'

export const storageApi = {
  /**
   * 선택한 이미지를 업로드하고 이미지 키를 돌려줍니다.
   *
   * {@link PickedWebImage.src}는 base64 dataUrl(앱 브릿지/브라우저 폴백 공통)이므로
   * `fetch`로 Blob을 만들어 multipart로 보냅니다.
   *
   * Content-Type을 명시적으로 넘기는 것은 axios 때문입니다. 인스턴스 기본값이
   * `application/json`이라 그대로 두면 axios가 FormData를 JSON으로 직렬화해 버립니다.
   * `multipart/form-data`로 지정하면 브라우저가 boundary를 붙여 실제 헤더를 만듭니다.
   */
  async uploadImage(bucketKind: BucketKind, image: PickedWebImage): Promise<string> {
    const blob = await fetch(image.src).then((response) => response.blob())

    const formData = new FormData()
    formData.append('file', blob, image.fileName || 'image.jpg')

    const response = await apiService.post<string>(`/api/v1/storage/${bucketKind}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return unwrapApiResponse(response, 200, '이미지 업로드에 실패했습니다.')
  },
}

/**
 * 조회 응답의 이미지 URL에서 이미지 키를 되뽑습니다.
 * `https://cdn.../puppy-profile/abc.jpg?v=1` → `abc.jpg`
 */
export function extractImageKey(url: string): string {
  return url.split('/').pop()?.split('?')[0] ?? ''
}
