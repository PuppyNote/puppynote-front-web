import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { AddTopBar, CustomAlert, MultiImageSelector, Spinner } from '@/components/common'
import { useAlert } from '@/hooks/useAlert'
import { communityApi } from '@/services/api/endpoints/community'
import { storageApi } from '@/services/api/endpoints/storage'
import { toErrorMessage } from '@/services/api/types'
import type { PickedWebImage } from '@/services/image/imagePicker'
import { communityDetailPath, ROUTES } from '@/routes/paths'
import { cn } from '@/utils/cn'

/** 기존 이미지는 서버 키를 함께 들고 있어야 삭제/유지를 구분할 수 있습니다 (새 이미지는 없음). */
interface EditableImage extends PickedWebImage {
  existingKey?: string
}

/**
 * 게시물 작성/수정 화면. 네이티브 `src/screens/community/AddPostScreen.tsx` 이식.
 * `/community/add`(작성)와 `/community/:postId/edit`(수정) 두 라우트가 이 컴포넌트 하나를 씁니다.
 */
export default function AddPostPage() {
  const { postId } = useParams<{ postId: string }>()
  const isEditMode = postId !== undefined
  const navigate = useNavigate()
  const { alert, showSimpleAlert, hideAlert } = useAlert()

  const [content, setContent] = useState('')
  const [images, setImages] = useState<EditableImage[]>([])
  const [deletedImageKeys, setDeletedImageKeys] = useState<string[]>([])
  const [hashtags, setHashtags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  const [isDataLoading, setIsDataLoading] = useState(isEditMode)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 수정 모드: 기존 게시물을 불러와 폼을 채웁니다.
  useEffect(() => {
    if (!isEditMode || !postId) return

    void (async () => {
      try {
        const post = await communityApi.getPostById(Number(postId))
        setContent(post.content)
        setHashtags(post.hashtags)
        setImages(
          post.imageUrls.map((url, index) => ({
            id: url,
            src: url,
            fileName: '',
            mimeType: '',
            fileSize: null,
            existingKey: post.imageKeys[index],
          })),
        )
      } catch (error) {
        showSimpleAlert('오류', toErrorMessage(error, '게시물을 불러오지 못했습니다.'), () =>
          navigate(-1),
        )
      } finally {
        setIsDataLoading(false)
      }
    })()
  }, [isEditMode, postId, navigate, showSimpleAlert])

  // 해시태그 자동완성 (네이티브와 동일하게 300ms 디바운스)
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (tagInput.length === 0) {
        setSuggestions([])
        setShowSuggestions(false)
        return
      }

      void communityApi
        .getHashtags(tagInput)
        .then((tags) => {
          setSuggestions(tags)
          setShowSuggestions(tags.length > 0)
        })
        .catch((error: unknown) => console.warn('해시태그를 불러오지 못했습니다.', error))
    }, 300)

    return () => window.clearTimeout(timer)
  }, [tagInput])

  const addHashtag = (raw: string) => {
    const tag = raw.trim().replace(/^#/, '')
    if (tag && !hashtags.includes(tag)) setHashtags((prev) => [...prev, tag])
    setTagInput('')
    setSuggestions([])
    setShowSuggestions(false)
  }

  const handleTagInputChange = (text: string) => {
    if (text.endsWith(' ')) addHashtag(text)
    else setTagInput(text)
  }

  const handleImagesChange = (next: PickedWebImage[]) => {
    // 지워진 항목 중 기존(원격) 이미지가 있으면 삭제 키로 넘겨야 합니다.
    const removed = images.filter((image) => !next.some((n) => n.id === image.id))
    const removedExistingKeys = removed
      .map((image) => image.existingKey)
      .filter((key): key is string => !!key)
    if (removedExistingKeys.length > 0) {
      setDeletedImageKeys((prev) => [...prev, ...removedExistingKeys])
    }
    setImages(next as EditableImage[])
  }

  const handleSave = async () => {
    if (!content.trim()) {
      showSimpleAlert('알림', '내용을 입력해주세요.')
      return
    }

    setIsSubmitting(true)
    try {
      // 새로 고른 이미지만 업로드합니다 (기존 이미지는 이미 서버에 있습니다). 병렬 호출.
      const newImages = images.filter((image) => !image.existingKey)
      const newImageKeys = await Promise.all(
        newImages.map((image) => storageApi.uploadImage('COMMUNITY_POST', image)),
      )

      if (isEditMode && postId) {
        await communityApi.updatePost(Number(postId), {
          content: content.trim(),
          hashtags,
          addImageKeys: newImageKeys.length > 0 ? newImageKeys : undefined,
          deleteImageKeys: deletedImageKeys.length > 0 ? deletedImageKeys : undefined,
        })
        showSimpleAlert('성공', '게시물이 수정되었습니다!', () =>
          navigate(communityDetailPath(Number(postId))),
        )
      } else {
        await communityApi.createPost({
          content: content.trim(),
          hashtags: hashtags.length > 0 ? hashtags : undefined,
          imageKeys: newImageKeys.length > 0 ? newImageKeys : undefined,
        })
        showSimpleAlert('성공', '게시물이 등록되었습니다!', () => navigate(ROUTES.COMMUNITY))
      }
    } catch (error) {
      showSimpleAlert('오류', toErrorMessage(error, '요청 처리에 실패했습니다.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isDataLoading) {
    return (
      <div className="flex h-full flex-col">
        <AddTopBar title="게시물 수정" onBack={() => navigate(-1)} />
        <div className="flex flex-1 items-center justify-center">
          <Spinner className="size-9" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <AddTopBar title={isEditMode ? '게시물 수정' : '게시물 작성'} onBack={() => navigate(-1)} />

      <div className="flex-1 overflow-y-auto px-2xl pb-3xl">
        <MultiImageSelector images={images} onChange={handleImagesChange} maxCount={10} />

        <div className="mb-2xl min-h-[150px] rounded-2xl bg-white p-xl shadow-card">
          <textarea
            placeholder="우리 아이와의 소중한 일상을 들려주세요! (날씨, 산책, 간식 등 어떤 이야기든 좋아요)"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            className="h-full min-h-[110px] w-full resize-none text-body-lg text-ink-700 placeholder:text-ink-400"
          />
        </div>

        <div className="mb-2xl">
          <p className="mb-md text-body font-bold text-ink-600">해시태그</p>

          {hashtags.length > 0 && (
            <div className="mb-md flex flex-wrap gap-sm">
              {hashtags.map((tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-xs rounded-full border border-brand bg-amber-50 px-md py-xs"
                >
                  <span className="text-caption font-bold text-brand">#{tag}</span>
                  <button
                    type="button"
                    onClick={() => setHashtags((prev) => prev.filter((t) => t !== tag))}
                    className="flex size-4 items-center justify-center rounded-full bg-brand text-[10px] font-bold text-white"
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="relative">
            {showSuggestions && (
              <div className="absolute inset-x-0 bottom-full z-10 mb-sm max-h-[200px] overflow-y-auto rounded-lg border border-ink-100 bg-white p-sm shadow-modal">
                {suggestions.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => addHashtag(tag)}
                    className="block w-full rounded-sm px-md py-sm text-left text-body font-semibold text-brand"
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            )}
            <input
              type="text"
              placeholder="해시태그를 입력하세요"
              value={tagInput}
              onChange={(event) => handleTagInputChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  addHashtag(tagInput)
                }
              }}
              className="w-full rounded-lg border border-ink-100 bg-white px-lg py-md text-body text-ink-700"
            />
            <p className="mt-sm ml-xs text-caption text-ink-400">
              * 띄어쓰기를 하면 해시태그가 추가됩니다.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={isSubmitting}
          className={cn(
            'flex w-full items-center justify-center rounded-full py-lg font-bold text-ink-900 shadow-brand',
            isSubmitting ? 'bg-ink-200' : 'bg-brand',
          )}
        >
          {isSubmitting ? <Spinner className="size-6" /> : isEditMode ? '수정하기' : '등록하기'}
        </button>
      </div>

      <CustomAlert alert={alert} onClose={hideAlert} />
    </div>
  )
}
