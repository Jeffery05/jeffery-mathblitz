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
        fontSize: 300,
      }}
    >
      🧮
    </div>,
    { width: 512, height: 512 },
  )
}
