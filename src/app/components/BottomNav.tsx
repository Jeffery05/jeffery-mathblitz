'use client'

type Tab = 'play' | 'groups'

interface Props {
  tab: Tab
  onTabChange: (t: Tab) => void
}

const TABS: { key: Tab; icon: string; label: string }[] = [
  { key: 'play',   icon: '🎮', label: 'Play' },
  { key: 'groups', icon: '👥', label: 'Groups' },
]

export default function BottomNav({ tab, onTabChange }: Props) {
  return (
    <div className="fixed bottom-0 inset-x-0 z-50 bg-slate-900 border-t border-slate-800">
      <div className="flex max-w-sm mx-auto">
        {TABS.map(({ key, icon, label }) => (
          <button
            key={key}
            onClick={() => onTabChange(key)}
            className={[
              'flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors',
              tab === key ? 'text-indigo-400' : 'text-slate-600 hover:text-slate-400',
            ].join(' ')}
          >
            <span className="text-xl leading-none">{icon}</span>
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
