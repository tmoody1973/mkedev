import { HomeWrapper } from './HomeWrapper'

// Force dynamic rendering - never prerender this page
export const dynamic = 'force-dynamic'

export default function Home() {
  return <HomeWrapper />
}
