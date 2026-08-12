import { useState } from 'react'

import { Card, PhotoGallery } from '@/components/common'
import { communityApi, type Post } from '@/services/api/endpoints/community'
import { cn } from '@/utils/cn'

export interface PostCardProps {
  post: Post
  onPress: () => void
  onHashtagPress?: (tag: string) => void
}

/** 3줄(대략 60자) 넘으면 '더보기'를 보여줍니다. 네이티브와 같은 기준입니다. */
const EXPAND_THRESHOLD = 60

/**
 * 네이티브 `components/community/card/PostCard.tsx` 이식. 목록/내 게시물 화면 공용.
 *
 * 좋아요는 카드가 직접 API를 호출하고 자기 상태만 갱신합니다. 목록을 들고 있는
 * {@link ../../components/common/PagedList}가 항목을 부모에서 갈아끼울 수 있는 구조가 아니라서,
 * 여기서 각자 낙관적으로 처리하는 편이 화면(목록/내 게시물) 두 곳에 같은 배관을 반복하지 않습니다.
 * 상세 화면에서 좋아요를 누른 뒤 목록으로 돌아오면 라우트가 새로 마운트되며 서버 값으로 다시 맞춰집니다.
 */
export default function PostCard({ post, onPress, onHashtagPress }: PostCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [liked, setLiked] = useState(post.liked)
  const [likeCount, setLikeCount] = useState(post.likeCount)

  const handleLikePress = async () => {
    try {
      const result = await communityApi.toggleLike(post.postId)
      setLiked(result.liked)
      setLikeCount(result.likeCount)
    } catch (error) {
      console.warn('좋아요 처리에 실패했습니다.', error)
    }
  }

  return (
    <Card className="mb-xl rounded-2xl p-lg">
      <div className="mb-lg flex items-center justify-between">
        <div className="flex items-center">
          <img
            src={post.userProfileUrl || '/assets/puppynote-icon.png'}
            alt=""
            loading="lazy"
            decoding="async"
            className="size-10 shrink-0 rounded-full bg-ink-100 object-cover"
          />
          <div className="ml-md min-w-0">
            <p className="truncate text-body-lg font-bold text-ink-900">{post.userNickname}</p>
            <p className="mt-0.5 text-caption text-ink-400">
              {new Date(post.createdDate).toLocaleDateString()}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void handleLikePress()}
          className="flex shrink-0 items-center gap-xs rounded-md bg-ink-50 px-[10px] py-1.5"
        >
          <img
            src={liked ? '/assets/community/clicked_like.png' : '/assets/community/like.png'}
            alt=""
            className="size-[18px]"
          />
          <span className={cn('text-caption font-bold text-ink-500', liked && 'text-error')}>
            {likeCount}
          </span>
        </button>
      </div>

      {post.imageUrls.length > 0 && (
        <div className="mb-lg">
          <PhotoGallery photoUrls={post.imageUrls} square rounded onImageClick={onPress} />
        </div>
      )}

      <button type="button" onClick={() => setIsExpanded((prev) => !prev)} className="block text-left">
        <p
          className={cn(
            'mb-md text-body-lg text-ink-700',
            !isExpanded && 'line-clamp-3',
          )}
        >
          {post.content}
        </p>
        {post.content.length > EXPAND_THRESHOLD && (
          <p className="-mt-sm mb-md text-caption font-semibold text-ink-400">
            {isExpanded ? '접기' : '더보기'}
          </p>
        )}
      </button>

      {post.hashtags.length > 0 && (
        <div className="flex flex-wrap gap-sm">
          {post.hashtags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => onHashtagPress?.(tag)}
              className="text-caption font-bold text-brand"
            >
              #{tag}
            </button>
          ))}
        </div>
      )}
    </Card>
  )
}
