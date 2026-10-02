import { useEffect, useState } from 'react'
import { ArrowLeft, Loader2, MapPin } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { districtsService, District } from '@/services/districts'
import { useAuth } from '@/contexts/AuthContext'

export default function LgaDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { isAuthenticated } = useAuth()
  const [lga, setLga] = useState<District | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isAuthenticated || !id) return

    const loadLga = async () => {
      try {
        setLoading(true)
        setError('')
        setLga(await districtsService.getLgaDistrict(Number(id)))
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load LGA')
      } finally {
        setLoading(false)
      }
    }

    loadLga()
  }, [id, isAuthenticated])

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#146c4f]" />
      </div>
    )
  }

  if (error || !lga) {
    return (
      <div className="space-y-4 p-4 md:p-0">
        <Link to="/k8s9d7f3-districts/lgas" className="inline-flex items-center gap-2 text-sm font-medium text-[#146c4f] hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to LGAs
        </Link>
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            {error || 'LGA not found'}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-0">
      <Link to="/k8s9d7f3-districts/lgas" className="inline-flex items-center gap-2 text-sm font-medium text-[#146c4f] hover:underline">
        <ArrowLeft className="h-4 w-4" /> Back to LGAs
      </Link>

      <Card className="border border-gray-100 shadow-md">
        <CardContent className="p-6 md:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100">
              <MapPin className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500">LGA details</p>
              <h1 className="mt-1 text-2xl font-bold text-gray-900">{lga.name}</h1>
            </div>
          </div>

          <div className="mt-8">
            <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500">State</p>
              <p className="mt-2 font-semibold text-gray-900">{lga.state?.name || 'N/A'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}