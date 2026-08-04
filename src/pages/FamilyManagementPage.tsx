import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Badge, CustomAlert, Spinner } from '@/components/common'
import TopBar from '@/components/layout/TopBar'
import PetTabBar from '@/components/pet/PetTabBar'
import { useAlert } from '@/hooks/useAlert'
import {
  familyMemberApi,
  type FamilyMember,
  type SearchedUser,
} from '@/services/api/endpoints/familyMember'
import { toErrorMessage } from '@/services/api/types'
import { useAuth } from '@/services/auth/AuthContext'
import { usePet } from '@/services/pet/PetContext'
import { ROUTES } from '@/routes/paths'

/**
 * 가족 관리 화면. 네이티브 `src/screens/setting/FamilyManagementScreen.tsx` 이식.
 *
 * 네이티브는 설정 탭에서 스택으로 밀어 넣는 화면이라 하단 탭 없이 전용 헤더("가족 관리")만
 * 뜨고, 펫 탭은 켭니다. `PlainLayout` 아래 두고 그 조합(헤더 + 펫 탭, 하단 탭 없음)을 직접
 * 그립니다 — `PET_TAB_ROUTES`(TabLayout 전용)에는 기대지 않습니다.
 */
export default function FamilyManagementPage() {
  const navigate = useNavigate()
  const { selectedPet, refreshPets, updateSelectedPet } = usePet()
  const { user } = useAuth()
  const { alert, showAlert, showSimpleAlert, hideAlert, showConfirmAlert } = useAlert()

  const [members, setMembers] = useState<FamilyMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchEmail, setSearchEmail] = useState('')
  const [searchedUsers, setSearchedUsers] = useState<SearchedUser[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const loadMembers = useCallback(async (petId: number) => {
    setIsLoading(true)
    try {
      setMembers(await familyMemberApi.getFamilyMembers(petId))
    } catch (error) {
      console.error('가족 목록 조회 실패', error)
      showSimpleAlert('오류', '데이터를 불러오는데 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    void (async () => {
      if (!selectedPet) {
        setMembers([])
        setIsLoading(false)
        return
      }
      await loadMembers(selectedPet.id)
    })()
  }, [selectedPet, loadMembers])

  const handleSearch = async () => {
    if (!searchEmail.trim()) {
      showSimpleAlert('알림', '검색할 이메일을 입력해주세요.')
      return
    }
    setIsSearching(true)
    try {
      const users = await familyMemberApi.searchUsers(searchEmail.trim())
      setSearchedUsers(users)
      if (users.length === 0) showSimpleAlert('알림', '검색된 유저가 없습니다.')
    } catch {
      showSimpleAlert('오류', '유저 검색에 실패했습니다.')
    } finally {
      setIsSearching(false)
    }
  }

  const handleInvite = (target: SearchedUser) => {
    if (!selectedPet) return
    showAlert({
      title: '가족 초대',
      message: `${selectedPet.name}의 가족으로 ${target.nickName}님을 초대하시겠습니까?`,
      confirmText: '초대하기',
      cancelText: '취소',
      onConfirm: () => {
        hideAlert()
        void (async () => {
          try {
            await familyMemberApi.inviteFamilyMember(target.userId, selectedPet.id)
            showSimpleAlert('성공', '초대를 보냈습니다. 상대방이 수락하면 가족으로 등록됩니다.')
            setSearchedUsers([])
            setSearchEmail('')
            void loadMembers(selectedPet.id)
          } catch {
            showSimpleAlert('오류', '초대 발송에 실패했습니다.')
          }
        })()
      },
      onCancel: hideAlert,
    })
  }

  const handleDelete = (member: FamilyMember) => {
    if (!selectedPet) return

    if (member.userId === user?.userId) {
      showSimpleAlert('알림', '본인은 삭제할 수 없습니다. 서비스 탈퇴는 설정 메뉴를 이용해주세요.')
      return
    }

    const message =
      member.role === 'OWNER'
        ? `정말로 ${member.nickName}님과의 가족 관계를 끊으시겠습니까?\n이 ${selectedPet.name}에 대한 연결이 모두 끊기게 됩니다.`
        : `정말로 ${member.nickName}님을 가족에서 제외하시겠습니까?\n해당 유저는 ${selectedPet.name}의 정보에 접근할 수 없게 됩니다.`

    showConfirmAlert('가족 관계 삭제', message, () => {
      void (async () => {
        setIsProcessing(true)
        try {
          await familyMemberApi.deleteFamilyMember(member.userId, selectedPet.id)
          showSimpleAlert('성공', '가족 관계가 삭제되었습니다.')

          const updatedPets = await refreshPets()
          const stillSelected = updatedPets.find((pet) => pet.petId === selectedPet.id)
          await updateSelectedPet(stillSelected ?? updatedPets[0] ?? null)
          if (stillSelected) void loadMembers(selectedPet.id)
        } catch (error) {
          showSimpleAlert('오류', toErrorMessage(error, '가족 삭제에 실패했습니다.'))
        } finally {
          setIsProcessing(false)
        }
      })()
    })
  }

  return (
    <div className="flex h-full flex-col">
      <TopBar
        title="가족 관리"
        onBack={() => navigate(-1)}
        onNotificationClick={() => navigate(ROUTES.ALERT_HISTORY)}
      />
      <PetTabBar />

      <div className="flex-1 overflow-y-auto px-2xl pt-lg pb-4xl">
        <section className="mb-3xl">
          <h2 className="mb-lg text-title-sm font-bold text-ink-900">새로운 가족 초대 📩</h2>
          <div className="flex gap-md">
            <input
              type="email"
              placeholder="이메일로 유저 검색"
              value={searchEmail}
              onChange={(event) => setSearchEmail(event.target.value)}
              autoCapitalize="none"
              className="flex-1 rounded-lg border border-ink-200 bg-white px-lg py-md text-body-lg text-ink-900"
            />
            <button
              type="button"
              onClick={() => void handleSearch()}
              disabled={isSearching}
              className="flex shrink-0 items-center justify-center rounded-lg bg-ink-900 px-xl font-bold text-white disabled:opacity-60"
            >
              {isSearching ? <Spinner className="size-5 text-white" /> : '검색'}
            </button>
          </div>

          {searchedUsers.length > 0 && (
            <div className="mt-md rounded-xl border border-ink-100 bg-white p-sm shadow-card">
              {searchedUsers.map((searched) => (
                <button
                  key={searched.userId}
                  type="button"
                  onClick={() => handleInvite(searched)}
                  className="flex w-full items-center border-b border-ink-50 p-md text-left last:border-b-0"
                >
                  {searched.profileUrl ? (
                    <img
                      src={searched.profileUrl}
                      alt=""
                      className="size-11 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-ink-100 text-title-sm">
                      👤
                    </span>
                  )}
                  <span className="ml-md min-w-0 flex-1">
                    <span className="block truncate text-body-lg font-bold text-ink-700">
                      {searched.nickName}
                    </span>
                    <span className="block truncate text-caption text-ink-400">
                      {searched.email}
                    </span>
                  </span>
                  <span className="shrink-0 rounded-sm bg-brand px-md py-xs text-caption font-bold text-ink-900">
                    초대
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-lg text-title-sm font-bold text-ink-900">함께하는 가족 👨‍👩‍👧‍👦</h2>
          {isLoading ? (
            <div className="mt-4xl flex justify-center">
              <Spinner className="size-9" />
            </div>
          ) : members.length === 0 ? (
            <div className="mt-4xl flex justify-center">
              <p className="text-body-lg text-ink-400">등록된 가족이 없습니다.</p>
            </div>
          ) : (
            members.map((member) => {
              const isMe = member.userId === user?.userId
              return (
                <div
                  key={member.userId}
                  className="mb-md flex items-center rounded-2xl border border-ink-100 bg-white p-lg shadow-card"
                >
                  {member.profileUrl ? (
                    <img
                      src={member.profileUrl}
                      alt=""
                      className="size-14 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-ink-100 text-title">
                      👤
                    </span>
                  )}
                  <div className="ml-lg min-w-0 flex-1">
                    <div className="mb-xs flex items-center gap-sm">
                      <span className="truncate text-body-lg font-bold text-ink-900">
                        {member.nickName}
                        {isMe ? ' (나)' : ''}
                      </span>
                      <Badge
                        label={member.role === 'OWNER' ? '주인' : '가족'}
                        variant={member.role === 'OWNER' ? 'warning' : 'neutral'}
                      />
                    </div>
                    <p className="text-caption text-ink-500">
                      {member.status === 'DONE' ? '등록 완료' : '수락 대기 중'}
                    </p>
                  </div>
                  {!isMe && (
                    <button
                      type="button"
                      onClick={() => handleDelete(member)}
                      disabled={isProcessing}
                      aria-label={`${member.nickName} 삭제`}
                      className="ml-sm p-sm text-title-sm font-bold text-ink-300"
                    >
                      ✕
                    </button>
                  )}
                </div>
              )
            })
          )}
        </section>
      </div>

      <CustomAlert alert={alert} onClose={hideAlert} />
    </div>
  )
}
