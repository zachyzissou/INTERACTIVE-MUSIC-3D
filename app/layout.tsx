import type { Metadata, Viewport } from 'next'
import '../src/styles/globals.css'
import ui from '../src/styles/ui.module.css'
import ClientLayout from './ClientLayout'

export const metadata: Metadata = {
  title: 'Interactive Music 3D',
  description: 'Create music by interacting with 3D shapes in an immersive environment',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.svg',
    apple: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2NCA2NCI+PHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIlMjMxMTEiLz48cGF0aCBkPSJNMzIgMTZ2MzJNMTYgMzJoMzIiIHN0cm9rZT0iJTIzNGZhM2ZmIiBzdHJva2Utd2lkdGg9IjgiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPjwvc3ZnPgo=',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#111111',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full w-full">
      <body className={`${ui.root} h-full w-full relative`}>
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  )
}
