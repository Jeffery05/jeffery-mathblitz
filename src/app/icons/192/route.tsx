import { ImageResponse } from 'next/og'

export function GET() {
  return new ImageResponse(
    <div
      style={{
        background: '#020617',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 110,
      }}
    >
      🧮
    </div>,
    { width: 192, height: 192 },
  )
}
