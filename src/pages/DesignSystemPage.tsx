import { useCallback, useState } from 'react'

import {
  Badge,
  Card,
  CustomText,
  DatePickerModal,
  FloatingActionButton,
  MultiImageSelector,
  PagedList,
  PetTab,
  type PetSummary,
  ScrollableTab,
  SearchBar,
  TimePickerModal,
} from '@/components/common'
import type { PickedWebImage } from '@/services/image/imagePicker'

/**
 * 디자인 시스템 확인용 페이지 (개발 전용, `/__design`).
 *
 * 실제 서비스 화면이 아닙니다. 토큰과 공통 컴포넌트를 한 화면에 늘어놓고 눈으로 확인하려고
 * 둔 것이며, `import.meta.env.DEV`일 때만 라우터에 등록되므로 프로덕션 번들에는 들어가지 않습니다.
 */

const SAMPLE_PETS: PetSummary[] = [
  { petId: 1, petName: '뭉치', petProfileUrl: '', roleType: 'OWNER' },
  { petId: 2, petName: '보리', petProfileUrl: '', roleType: 'OWNER' },
  { petId: 3, petName: '초코', petProfileUrl: '', roleType: 'MEMBER' },
]

interface SampleRow {
  id: number
  title: string
}

export default function DesignSystemPage() {
  const [query, setQuery] = useState('')
  const [activeTab, setActiveTab] = useState<string | number>('all')
  const [selectedPetId, setSelectedPetId] = useState<number | null>(1)
  const [images, setImages] = useState<PickedWebImage[]>([])
  const [date, setDate] = useState('2026-08-03')
  const [time, setTime] = useState('09:30')
  const [isDateOpen, setDateOpen] = useState(false)
  const [isTimeOpen, setTimeOpen] = useState(false)

  // 페이지 3장짜리 가짜 목록. 실제 API 대신 지연만 흉내 냅니다.
  const fetchPage = useCallback(async (page: number) => {
    await new Promise((resolve) => setTimeout(resolve, 400))
    return {
      content: Array.from({ length: 8 }, (_, index) => ({
        id: (page - 1) * 8 + index + 1,
        title: `${page}페이지 항목 ${index + 1}`,
      })) satisfies SampleRow[],
      totalPage: 3,
    }
  }, [])

  return (
    <div className="flex flex-col gap-2xl px-2xl pt-lg pb-tab-bar">
      <Section title="타이포그래피">
        <div className="flex flex-col gap-xs">
          <CustomText as="p" variant="display" weight="bold">
            display 40
          </CustomText>
          <CustomText as="p" variant="heading" weight="bold">
            heading 24
          </CustomText>
          <CustomText as="p" variant="title" weight="bold">
            title 20
          </CustomText>
          <CustomText as="p" variant="body-lg">
            body-lg 16 — 가장 많이 쓰이는 본문
          </CustomText>
          <CustomText as="p" variant="body" className="text-ink-500">
            body 14 — 보조 본문
          </CustomText>
          <CustomText as="p" variant="caption" className="text-ink-400">
            caption 12 — 캡션
          </CustomText>
        </div>
      </Section>

      <Section title="색상">
        <div className="grid grid-cols-5 gap-sm">
          <Swatch name="brand" className="bg-brand" />
          <Swatch name="brand-bg" className="bg-brand-bg" />
          <Swatch name="ink-900" className="bg-ink-900" />
          <Swatch name="ink-500" className="bg-ink-500" />
          <Swatch name="ink-200" className="bg-ink-200" />
          <Swatch name="success" className="bg-success" />
          <Swatch name="warning" className="bg-warning" />
          <Swatch name="error" className="bg-error" />
          <Swatch name="amber-100" className="bg-amber-100" />
          <Swatch name="sky-100" className="bg-sky-100" />
        </div>
      </Section>

      <Section title="Card / Badge">
        <Card className="flex flex-col gap-md">
          <CustomText as="p" variant="body-lg" weight="bold">
            카드 제목
          </CustomText>
          <div className="flex flex-wrap gap-sm">
            <Badge label="완료" variant="success" />
            <Badge label="주의" variant="warning" />
            <Badge label="만료" variant="error" />
            <Badge label="기본" />
          </div>
        </Card>
      </Section>

      <Section title="SearchBar">
        <SearchBar
          value={query}
          onChange={setQuery}
          onSearch={(value) => console.log('search:', value)}
          onClear={() => setQuery('')}
        />
      </Section>

      <Section title="ScrollableTab / PetTab">
        <div className="-mx-2xl">
          <ScrollableTab
            tabs={[
              { id: 'all', label: '전체' },
              { id: 'food', label: '사료' },
              { id: 'snack', label: '간식' },
              { id: 'toy', label: '장난감' },
              { id: 'etc', label: '기타' },
            ]}
            activeTabId={activeTab}
            onTabPress={setActiveTab}
          />
          <PetTab
            pets={SAMPLE_PETS}
            selectedPetId={selectedPetId}
            onSelect={setSelectedPetId}
            onAdd={() => console.log('펫 등록')}
            onDelete={(pet) => console.log('삭제:', pet.petName)}
          />
        </div>
      </Section>

      <Section title="MultiImageSelector">
        <MultiImageSelector images={images} onChange={setImages} maxCount={5} onError={alert} />
      </Section>

      <Section title="DatePicker / TimePicker">
        <div className="flex gap-sm">
          <button
            type="button"
            onClick={() => setDateOpen(true)}
            className="flex-1 rounded-lg border border-ink-200 bg-white px-lg py-md text-body text-ink-800"
          >
            {date}
          </button>
          <button
            type="button"
            onClick={() => setTimeOpen(true)}
            className="flex-1 rounded-lg border border-ink-200 bg-white px-lg py-md text-body text-ink-800"
          >
            {time}
          </button>
        </div>
        <DatePickerModal
          open={isDateOpen}
          onClose={() => setDateOpen(false)}
          onConfirm={setDate}
          initialDate={date}
        />
        <TimePickerModal
          open={isTimeOpen}
          onClose={() => setTimeOpen(false)}
          onConfirm={setTime}
          initialTime={time}
        />
      </Section>

      <Section title="PagedList (무한 스크롤 · 3페이지)">
        <PagedList
          fetchPage={fetchPage}
          keyExtractor={(item) => item.id}
          listClassName="flex flex-col gap-sm"
          renderItem={(item) => (
            <Card className="text-body text-ink-700">{(item as SampleRow).title}</Card>
          )}
        />
      </Section>

      <FloatingActionButton label="추가" onClick={() => console.log('FAB')} />
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-md">
      <h2 className="text-caption font-bold tracking-[1px] text-ink-400 uppercase">{title}</h2>
      {children}
    </section>
  )
}

function Swatch({ name, className }: { name: string; className: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className={`size-10 rounded-md border border-ink-200 ${className}`} />
      <span className="text-caption-xs text-ink-400">{name}</span>
    </div>
  )
}
