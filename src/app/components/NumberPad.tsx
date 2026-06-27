'use client'

interface Props {
  onKey: (key: string) => void
  disabled?: boolean
}

const ROWS = [
  ['7', '8', '9'],
  ['4', '5', '6'],
  ['1', '2', '3'],
  ['backspace', '0', 'submit'],
]

export default function NumberPad({ onKey, disabled }: Props) {
  return (
    <div className="grid grid-cols-3 gap-3 w-full max-w-xs mx-auto select-none">
      {ROWS.flat().map((key) => (
        <button
          key={key}
          onPointerDown={(e) => {
            e.preventDefault()
            if (!disabled) onKey(key)
          }}
          className={[
            'aspect-square rounded-2xl text-3xl font-bold',
            'flex items-center justify-center',
            'transition-transform duration-75 active:scale-95',
            key === 'submit'
              ? 'bg-indigo-600 text-white active:bg-indigo-700'
              : key === 'backspace'
              ? 'bg-slate-700 text-slate-300 active:bg-slate-600'
              : 'bg-slate-800 text-white active:bg-slate-700',
            disabled ? 'opacity-40 pointer-events-none' : 'cursor-pointer',
          ].join(' ')}
        >
          {key === 'submit' ? '✓' : key === 'backspace' ? '⌫' : key}
        </button>
      ))}
    </div>
  )
}
