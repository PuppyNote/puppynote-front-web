/**
 * 커뮤니티 게시물 엔드포인트.
 *
 * 서버/네이티브 원본: `puppynote-front-app/src/services/community/CommunityService.ts`,
 * `puppynote-front-app/src/types/Community.ts`
 */
import { apiService } from '../ApiService'
import { unwrapApiResponse } from '../types'

export interface Post {
  postId: number
  userId: number
  userNickname: string
  userProfileUrl: string
  content: string
  /** 이미지 삭제/유지 판단에 씁니다 (수정 시 `imageUrls`와 같은 순서로 1:1 대응). */
  imageKeys: string[]
  imageUrls: string[]
  hashtags: string[]
  createdDate: string
  likeCount: number
  liked: boolean
}

export interface PostListResponse {
  posts: Post[]
  currentPage: number
  totalPages: number
  totalCount: number
}

export interface CreatePostPayload {
  content: string
  hashtags?: string[]
  imageKeys?: string[]
}

export interface UpdatePostPayload {
  content: string
  hashtags?: string[]
  addImageKeys?: string[]
  deleteImageKeys?: string[]
}

export interface LikeResponse {
  liked: boolean
  likeCount: number
}

export const communityApi = {
  /** 게시물 목록 조회. `keyword`를 넘기면 해시태그 검색입니다. */
  async getPosts(page: number, size = 10, keyword?: string): Promise<PostListResponse> {
    const params: Record<string, string | number> = { page, size }
    if (keyword) params.keyword = keyword

    const response = await apiService.get<PostListResponse>('/api/v1/community/posts', { params })
    return unwrapApiResponse(response, 200, '게시물 목록을 불러오지 못했습니다.')
  },

  /** 내가 작성한 게시물 목록 */
  async getMyPosts(page: number, size = 10): Promise<PostListResponse> {
    const response = await apiService.get<PostListResponse>('/api/v1/community/posts/my', {
      params: { page, size },
    })
    return unwrapApiResponse(response, 200, '내 게시물을 불러오지 못했습니다.')
  },

  /** 게시물 단건 조회 */
  async getPostById(postId: number): Promise<Post> {
    const response = await apiService.get<Post>(`/api/v1/community/posts/${postId}`)
    return unwrapApiResponse(response, 200, '게시물을 불러오지 못했습니다.')
  },

  /** 해시태그 자동완성 */
  async getHashtags(keyword: string): Promise<string[]> {
    const response = await apiService.get<string[]>('/api/v1/community/posts/hashtags', {
      params: { keyword },
    })
    return unwrapApiResponse(response, 200, '해시태그를 불러오지 못했습니다.')
  },

  /** 게시물 등록. 새로 생긴 postId를 돌려줍니다. */
  async createPost(payload: CreatePostPayload): Promise<number> {
    const response = await apiService.post<number>('/api/v1/community/posts', payload)
    return unwrapApiResponse(response, 201, '게시물 등록에 실패했습니다.')
  },

  /** 게시물 수정 */
  async updatePost(postId: number, payload: UpdatePostPayload): Promise<void> {
    const response = await apiService.patch<null>(`/api/v1/community/posts/${postId}`, payload)
    unwrapApiResponse(response, 200, '게시물 수정에 실패했습니다.')
  },

  /** 게시물 삭제 */
  async deletePost(postId: number): Promise<void> {
    const response = await apiService.delete<null>(`/api/v1/community/posts/${postId}`)
    unwrapApiResponse(response, 200, '게시물 삭제에 실패했습니다.')
  },

  /** 좋아요 토글 */
  async toggleLike(postId: number): Promise<LikeResponse> {
    const response = await apiService.post<LikeResponse>(`/api/v1/community/posts/${postId}/like`)
    return unwrapApiResponse(response, 200, '좋아요 처리에 실패했습니다.')
  },
}
