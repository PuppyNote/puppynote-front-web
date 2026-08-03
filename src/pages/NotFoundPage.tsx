import { Link } from 'react-router-dom'

import { ROUTES } from '@/routes/paths'

export default function NotFoundPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-5">
      <p className="text-lg font-semibold text-gray-900">페이지를 찾을 수 없어요</p>
      <Link to={ROUTES.HOME} className="text-sm text-gray-500 underline">
        홈으로 가기
      </Link>
    </div>
  )
}
