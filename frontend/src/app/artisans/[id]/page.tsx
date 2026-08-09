import { fetchArtisanById } from '@/lib/api'
import ArtisanProfileClient from '@/components/artisan/ArtisanProfileClient'

export default async function ArtisanProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const artisan = await fetchArtisanById(id).catch(() => null)
  return <ArtisanProfileClient artisan={artisan} />
}
