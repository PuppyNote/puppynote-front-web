import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { AddTopBar, CustomAlert, PhotoGallery, Spinner } from '@/components/common'
import { useAlert } from '@/hooks/useAlert'
import { communityApi, type Post } from '@/services/api/endpoints/community'
import { toErrorMessage } from '@/services/api/types'
import { useAuth } from '@/services/auth/AuthContext'
import { communityEditPath, ROUTES } from '@/routes/paths'

/** 커뮤니티 게시물 상세. 네이티브 `src/screens/community/CommunityDetailScreen.tsx` 이식. */
export default function CommunityDetailPage() {
  const { postId } = useParams<{ postId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { alert, showSimpleAlert, showConfirmAlert, hideAlert } = useAlert()

  const [post, setPost] = useState<Post | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!postId) return

    void (async () => {
      try {
        setPost(await communityApi.getPostById(Number(postId)))
      } catch (error) {
        showSimpleAlert('오류', toErrorMessage(error, '게시물을 불러오는데 실패했습니다.'), () =>
          navigate(-1),
        )
      } finally {
        setIsLoading(false)
      }
    })()
  }, [postId, navigate, showSimpleAlert])

  const handleLikeToggle = async () => {
    if (!post) return
    try {
      const result = await communityApi.toggleLike(post.postId)
      setPost({ ...post, liked: result.liked, likeCount: result.likeCount })
    } catch (error) {
      console.warn('좋아요 처리에 실패했습니다.', error)
    }
  }

  const handleDelete = () => {
    if (!post) return
    showConfirmAlert('게시물 삭제', '정말로 이 게시물을 삭제하시겠습니까?', () => {
      void (async () => {
        try {
          await communityApi.deletePost(post.postId)
          showSimpleAlert('성공', '게시물이 삭제되었습니다.', () => navigate(ROUTES.COMMUNITY))
        } catch (error) {
          showSimpleAlert('오류', toErrorMessage(error, '삭제에 실패했습니다.'))
        }
      })()
    })
  }

  const handleHashtagPress = (tag: string) => {
    navigate(ROUTES.COMMUNITY, { state: { searchTag: tag } })
  }

  if (isLoading) {
    return (
      <div className="flex h-full flex-col">
        <AddTopBar title="게시물" onBack={() => navigate(-1)} />
        <div className="flex flex-1 items-center justify-center">
          <Spinner className="size-9" />
        </div>
      </div>
    )
  }

  if (!post) return null

  const isOwner = user?.userId === post.userId

  return (
    <div className="flex h-full flex-col">
      <AddTopBar
        title="게시물"
        onBack={() => navigate(-1)}
        right={
          isOwner && (
            <div className="flex gap-sm">
              <button
                type="button"
                onClick={() => navigate(communityEditPath(post.postId))}
                className="rounded-sm border border-ink-100 bg-white px-md py-xs text-caption font-semibold text-ink-500"
              >
                수정
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="rounded-sm border border-ink-100 bg-white px-md py-xs text-caption font-semibold text-error"
              >
                삭제
              </button>
            </div>
          )
        }
      />

      <div className="flex-1 overflow-y-auto">
        <div className="flex items-center p-2xl">
          <img
            src={post.userProfileUrl || '/assets/puppynote-icon.png'}
            alt=""
            className="size-12 shrink-0 rounded-full bg-ink-100 object-cover"
          />
          <div className="ml-lg min-w-0">
            <p className="truncate text-body-lg font-bold text-ink-900">{post.userNickname}</p>
            <p className="mt-xs text-caption text-ink-400">
              {new Date(post.createdDate).toLocaleString()}
            </p>
          </div>
        </div>

        {post.imageUrls.length > 0 && (
          <PhotoGallery photoUrls={post.imageUrls} square rounded={false} />
        )}

        <div className="p-2xl">
          <p className="mb-xl text-body-lg text-ink-700">{post.content}</p>

          {post.hashtags.length > 0 && (
            <div className="flex flex-wrap gap-lg">
              {post.hashtags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleHashtagPress(tag)}
                  className="text-body font-semibold text-brand"
                >
                  #{tag}
                </button>
              ))}
            </div>
          )}

          <div className="mt-2xl border-t border-ink-100 pt-lg">
            <button
              type="button"
              onClick={() => void handleLikeToggle()}
              className="flex items-center gap-sm"
            >
              <img
                src={post.liked ? '/assets/community/clicked_like.png' : '/assets/community/like.png'}
                alt=""
                className="size-6"
              />
              <span className={`text-body font-semibold ${post.liked ? 'text-error' : 'text-ink-500'}`}>
                좋아요 {post.likeCount}개
              </span>
            </button>
          </div>
        </div>
      </div>

      <CustomAlert alert={alert} onClose={hideAlert} />
    </div>
  )
}
