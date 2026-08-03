interface PlaceholderPageProps {
  title: string
  /** 이 화면이 어떤 네이티브 화면을 대체하는지 (이식 티켓에서 참고) */
  nativeScreen?: string
}

/**
 * 아직 이식되지 않은 화면용 임시 본문.
 * 실제 화면은 후속 이식 티켓에서 이 컴포넌트를 걷어내고 채웁니다.
 */
export default function PlaceholderPage({ title, nativeScreen }: PlaceholderPageProps) {
  return (
    <div className="flex flex-col gap-2 p-5">
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      <p className="text-sm text-gray-500">이 화면은 후속 이식 티켓에서 구현됩니다.</p>
      {nativeScreen && <p className="text-xs text-gray-400">네이티브 원본: {nativeScreen}</p>}
    </div>
  )
}
