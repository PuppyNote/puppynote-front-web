import { useNavigate } from 'react-router-dom'

import { PagedList } from '@/components/common'
import { PostCard } from '@/components/community'
import TopBar from '@/components/layout/TopBar'
import { communityApi, type Post, type PostListResponse } from '@/services/api/endpoints/community'
import { communityDetailPath, ROUTES } from '@/routes/paths'

/** 내 게시물 목록. 네이티브 `src/screens/community/MyPostsScreen.tsx` 이식. */
export default function MyPostsPage() {
  const navigate = useNavigate()

  const fetchPage = async (page: number): Promise<{ content: Post[]; totalPage: number }> => {
    const result: PostListResponse = await communityApi.getMyPosts(page - 1, 10)
    return { content: result.posts, totalPage: result.totalPages }
  }

  return (
    <div className="flex h-full flex-col">
      <TopBar title="내 게시물" onBack={() => navigate(-1)} />

      <PagedList
        fetchPage={fetchPage}
        renderItem={(post) => (
          <PostCard
            post={post}
            onPress={() => navigate(communityDetailPath(post.postId))}
            onHashtagPress={(tag) => navigate(ROUTES.COMMUNITY, { state: { searchTag: tag } })}
          />
        )}
        keyExtractor={(post) => post.postId}
        emptyText="작성한 게시물이 없습니다."
        className="flex-1 overflow-y-auto"
        listClassName="px-2xl pt-lg pb-3xl"
      />
    </div>
  )
}
