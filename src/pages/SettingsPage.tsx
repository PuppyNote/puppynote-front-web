import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { CustomAlert } from '@/components/common'
import AlertSettingModal from '@/components/setting/AlertSettingModal'
import UserProfileModal from '@/components/setting/UserProfileModal'
import { useAlert } from '@/hooks/useAlert'
import { useAuth } from '@/services/auth/AuthContext'
import { ROUTES } from '@/routes/paths'

interface MenuItem {
  id: string
  title: string
  icon: string
  onPress: () => void
}

/** 설정 화면. 네이티브 `src/screens/setting/SettingScreen.tsx` 이식. */
export default function SettingsPage() {
  const navigate = useNavigate()
  const { user, logout, refreshProfile } = useAuth()
  const { alert, showAlert, hideAlert } = useAlert()
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [isAlertSettingOpen, setIsAlertSettingOpen] = useState(false)

  const menuItems: MenuItem[] = [
    { id: 'profile', title: '내 프로필 수정', icon: '👤', onPress: () => setIsProfileModalOpen(true) },
    { id: 'myPosts', title: '내 게시물', icon: '📝', onPress: () => navigate(ROUTES.COMMUNITY_MY) },
    { id: 'family', title: '가족 관리', icon: '👨‍👩‍👧‍👦', onPress: () => navigate(ROUTES.FAMILY_MANAGEMENT) },
    { id: 'notification', title: '알림 설정', icon: '🔔', onPress: () => setIsAlertSettingOpen(true) },
  ]

  const handleLogout = () => {
    showAlert({
      title: '로그아웃',
      message: '정말 로그아웃 하시겠습니까?',
      confirmText: '로그아웃',
      cancelText: '취소',
      onConfirm: () => {
        hideAlert()
        logout()
        navigate(ROUTES.LOGIN, { replace: true })
      },
      onCancel: hideAlert,
    })
  }

  return (
    <div className="flex flex-col px-2xl pt-lg pb-4xl">
      <div className="mb-2xl flex flex-col items-center">
        <div className="relative mb-lg">
          {user?.profileUrl ? (
            <img src={user.profileUrl} alt="" className="size-[100px] rounded-full object-cover" />
          ) : (
            <div className="flex size-[100px] items-center justify-center rounded-full bg-ink-200">
              <span aria-hidden className="text-[40px] leading-none">
                👤
              </span>
            </div>
          )}
          <button
            type="button"
            onClick={() => setIsProfileModalOpen(true)}
            aria-label="프로필 수정"
            className="absolute right-0 bottom-0 flex size-8 items-center justify-center rounded-full bg-white shadow-card"
          >
            <span aria-hidden className="text-body">
              ⚙️
            </span>
          </button>
        </div>
        <p className="mb-xs text-heading font-bold text-ink-900">{user?.nickName || '집사님'}</p>
        <p className="text-body text-ink-500">{user?.email || 'puppynote@example.com'}</p>
      </div>

      <div className="divide-y divide-ink-100 rounded-2xl bg-white py-sm shadow-card">
        {menuItems.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={item.onPress}
            className="flex w-full items-center justify-between px-xl py-lg"
          >
            <span className="flex items-center gap-lg">
              <span className="flex size-10 items-center justify-center rounded-md bg-ink-50 text-title-sm">
                {item.icon}
              </span>
              <span className="text-body-lg font-semibold text-ink-700">{item.title}</span>
            </span>
            <span aria-hidden className="text-heading text-ink-300">
              ›
            </span>
          </button>
        ))}
      </div>

      <div className="mt-2xl flex justify-center">
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-full border border-error-border bg-error-bg px-2xl py-sm text-caption font-bold text-error"
        >
          로그아웃
        </button>
      </div>

      <UserProfileModal
        open={isProfileModalOpen}
        initialData={user ? { userId: user.userId ?? 0, email: user.email, nickName: user.nickName ?? '', profileUrl: user.profileUrl } : null}
        onClose={() => setIsProfileModalOpen(false)}
        onSuccess={() => {
          setIsProfileModalOpen(false)
          void refreshProfile()
        }}
      />

      <AlertSettingModal open={isAlertSettingOpen} onClose={() => setIsAlertSettingOpen(false)} />

      <CustomAlert alert={alert} onClose={hideAlert} />
    </div>
  )
}
