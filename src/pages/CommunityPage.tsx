import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { FloatingActionButton, PagedList, SearchBar } from '@/components/common'
import { PostCard } from '@/components/community'
import { communityApi, type Post, type PostListResponse } from '@/services/api/endpoints/community'
import { communityDetailPath, ROUTES } from '@/routes/paths'

interface LocationState {
  /** {@link ../components/community/PostCard}의 해시태그, 또는 상세/내 게시물 화면에서 넘어올 때 */
  searchTag?: string
}

/**
 * 커뮤니티 목록 화면. 네이티브 `src/screens/community/CommunityScreen.tsx` 이식.
 *
 * 네이티브는 탭 화면이 계속 마운트된 채로 있어 `route.params.searchTag`로 검색어를 밀어 넣지만,
 * 웹은 이 라우트가 매번 새로 마운트되므로(TabLayout ↔ PlainLayout 전환) `location.state`를
 * 초기값으로만 읽으면 됩니다 — 뒤로 지우는 처리(`navigation.setParams`)가 따로 필요 없습니다.
 */
export default function CommunityPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const initialTag = (location.state as LocationState | null)?.searchTag ?? ''

  const [keyword, setKeyword] = useState(initialTag)
  const [searchQuery, setSearchQuery] = useState(initialTag)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  /** 해시태그 선택으로 인한 keyword 변경이면 자동완성 조회를 건너뜁니다. */
  const isInternalUpdate = useRef(initialTag.length > 0)

  useEffect(() => {
    if (isInternalUpdate.current) {
      isInternalUpdate.current = false
      return
    }

    const timer = window.setTimeout(() => {
      if (keyword.length === 0) {
        setSuggestions([])
        setShowSuggestions(false)
        return
      }

      void communityApi
        .getHashtags(keyword)
        .then((tags) => {
          setSuggestions(tags)
          setShowSuggestions(tags.length > 0)
        })
        .catch((error: unknown) => console.warn('해시태그를 불러오지 못했습니다.', error))
    }, 300)

    return () => window.clearTimeout(timer)
  }, [keyword])

  const selectHashtag = (tag: string) => {
    isInternalUpdate.current = true
    setKeyword(tag)
    setSearchQuery(tag)
    setShowSuggestions(false)
  }

  const handleSearch = () => {
    isInternalUpdate.current = true
    setSearchQuery(keyword.trim().replace(/^#/, ''))
    setShowSuggestions(false)
  }

  const handleClear = () => {
    setKeyword('')
    setSearchQuery('')
    setSuggestions([])
    setShowSuggestions(false)
  }

  const fetchPage = async (page: number): Promise<{ content: Post[]; totalPage: number }> => {
    const result: PostListResponse = await communityApi.getPosts(page - 1, 10, searchQuery)
    return { content: result.posts, totalPage: result.totalPages }
  }

  return (
    <div className="flex h-full flex-col">
      {/*
        네이티브는 검색 영역이 PagedFlatList 바깥의 고정 헤더라 목록과 함께 스크롤되지 않습니다.
        `PagedList`의 `header` 슬롯은 목록과 같은 스크롤 컨테이너 안에 들어가 버려서 이 요구를
        만족하지 못하므로, 여기서는 형제 엘리먼트로 따로 둡니다.
      */}
      <div className="relative shrink-0 border-b border-ink-100 bg-brand-bg px-2xl py-md">
        <SearchBar
          placeholder="해시태그를 검색해보세요"
          value={keyword}
          onChange={(value) => {
            isInternalUpdate.current = false
            setKeyword(value)
          }}
          onSearch={handleSearch}
          onClear={handleClear}
          showSearchButton={false}
        />

        {showSuggestions && (
          <div className="absolute inset-x-2xl top-[76px] z-10 max-h-[200px] overflow-y-auto rounded-lg border border-ink-100 bg-white shadow-modal">
            {suggestions.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => selectHashtag(tag)}
                className="block w-full border-b border-ink-50 px-lg py-md text-left text-body font-semibold text-brand last:border-b-0"
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
      </div>

      <PagedList
        reloadKey={searchQuery}
        fetchPage={fetchPage}
        renderItem={(post) => (
          <PostCard
            post={post}
            onPress={() => navigate(communityDetailPath(post.postId))}
            onHashtagPress={selectHashtag}
          />
        )}
        keyExtractor={(post) => post.postId}
        emptyText="게시물이 없습니다."
        className="flex-1 overflow-y-auto"
        listClassName="px-2xl pt-lg pb-[120px]"
      />

      <FloatingActionButton label="게시물 작성" onClick={() => navigate(ROUTES.COMMUNITY_ADD)} />
    </div>
  )
}
