import { MapTestWrapper } from './MapTestWrapper'

// Force dynamic rendering - never prerender this page
export const dynamic = 'force-dynamic'

export default function MapTestPage() {
  return <MapTestWrapper />
}
