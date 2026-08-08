import type { Metadata } from 'next'
import { fetchArtisanById } from '@/lib/api'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  try {
    const artisan = await fetchArtisanById(id)
    const title = `${artisan.name} — ${artisan.profession}`
    const description =
      (artisan.bio || '').slice(0, 155) ||
      `${artisan.name} in ${artisan.city || 'Nigeria'} — rated ${artisan.rating} stars. Book ${artisan.profession} services on NaijaHandy.`
    return {
      title,
      description,
      alternates: { canonical: `/artisans/${id}` },
      openGraph: {
        title: `${title} | NaijaHandy`,
        description,
        type: 'profile',
      },
    }
  } catch {
    return {
      title: 'Artisan Profile',
      description: 'View this artisan profile on NaijaHandy.',
    }
  }
}

export default function ArtisanProfileLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
