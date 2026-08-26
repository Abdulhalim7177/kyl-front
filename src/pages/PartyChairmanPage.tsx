import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { partyService } from '@/services/parties'
import { ArrowLeft, Trash2 } from 'lucide-react'

interface PartyChairman {
  id: number
  userId?: string
  fullName?: string
  avatarUrl?: string | null
  status?: string
  termStart?: string
  endDate?: string
  addedBy?: string
  termLimit?: string
  period?: string
  duration?: string
}

interface PartyChairmanResponse {
  partyName?: string
  currentChairman?: PartyChairman
}

function formatDate(value?: string) {
  if (!value) return 'N/A'

  const trimmed = value.trim()
  if (!trimmed) return 'N/A'

  const slashMatch = trimmed.match(/^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})$/)
  const date = slashMatch
    ? new Date(Number(slashMatch[1]), Number(slashMatch[2]) - 1, Number(slashMatch[3]))
    : new Date(trimmed)

  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })
}

export default function PartyChairmanPage() {
  const { partyId } = useParams<{ partyId: string }>()
  const navigate = useNavigate()
  const [data, setData] = useState<PartyChairmanResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!partyId) {
      setError('Invalid party ID.')
      setLoading(false)
      return
    }

    const loadChairmanData = async () => {
      try {
        setLoading(true)
        const currentChairmanResult = await partyService.getPartyChairman(partyId)
        setData(currentChairmanResult)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unable to load party chairman data.'
        setError(message)
      } finally {
        setLoading(false)
      }
    }

    loadChairmanData()
  }, [partyId])

  const currentChairman = data?.currentChairman
  const startDate = currentChairman?.termStart || (currentChairman as any)?.startDate || ''
  const endDate = (currentChairman as any)?.endDate || ''
  const termLimitValue = (currentChairman as any)?.termLimit || ''

  const handleDeleteChairman = async () => {
    if (!currentChairman?.id || !partyId) return

    const confirmDelete = window.confirm(
      `Are you sure you want to remove ${currentChairman.fullName || 'this chairman'} from the party?`
    )

    if (!confirmDelete) return

    setDeleting(true)
    setError(null)

    try {
      await partyService.deletePartyChairman(currentChairman.id)
      // Navigate back to party profile after successful deletion
      navigate(`/k8s9d7f3-parties/${partyId}`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete party chairman'
      setError(message)
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-center">
        <p className="text-sm text-red-600">{error}</p>
        <Button variant="outline" onClick={() => navigate(`/k8s9d7f3-parties/${partyId}`)}>
          Back to Party Profile
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Party Chairman</h1>
            {currentChairman?.status && (
              <Badge variant={currentChairman.status.toLowerCase() === 'active' ? 'secondary' : 'outline'}>
                {currentChairman.status}
              </Badge>
            )}
          </div>
          <p className="max-w-2xl text-sm text-slate-500">
            View and manage the current chairman for this party.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => navigate(`/k8s9d7f3-parties/${partyId}`)}>
            <ArrowLeft className="w-4 h-4" /> Back to Profile
          </Button>
        </div>
      </div>

      <Card className="border-0 bg-white">
        <CardHeader>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-lg">Current Chairman</CardTitle>
              <CardDescription>
                Current party chairman and leadership information
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {currentChairman?.status && (
                <Badge variant="outline">{currentChairman.status}</Badge>
              )}
              {currentChairman && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDeleteChairman}
                  disabled={deleting}
                  className="h-8 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  {deleting ? 'Deleting...' : 'Remove'}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <Avatar className="h-24 w-24 rounded-[1.5rem] border border-slate-200 bg-slate-100">
            {currentChairman?.avatarUrl ? (
              <img src={currentChairman.avatarUrl} alt={currentChairman.fullName ?? 'Chairman'} className="h-full w-full object-cover" />
            ) : (
              <AvatarFallback className="text-2xl font-semibold text-slate-700">
                {currentChairman?.fullName?.slice(0, 2).toUpperCase() || 'NA'}
              </AvatarFallback>
            )}
          </Avatar>

          <div className="flex-1 space-y-3">
            <div className="space-y-1">
              <p className="text-lg font-semibold text-slate-900">{currentChairman?.fullName || 'No chairman assigned'}</p>
              <p className="text-sm text-slate-500">
                {currentChairman?.period ? `Period ${currentChairman.period}` : startDate ? `Start date ${formatDate(startDate)}` : 'Start date not available'}
              </p>
              {currentChairman?.duration ? (
                <p className="text-sm text-slate-500">Duration {currentChairman.duration}</p>
              ) : null}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Added by</p>
                <p className="mt-2 text-sm font-semibold text-slate-900">{currentChairman?.addedBy || 'N/A'}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Term limit</p>
                {termLimitValue ? (
                  <p className="mt-2 text-sm font-semibold text-slate-900">{formatDate(termLimitValue)}</p>
                ) : (
                  <p className="mt-2 text-sm font-semibold text-slate-900">No term limit set</p>
                )}
                {!termLimitValue && endDate ? (
                  <p className="mt-1 text-xs text-slate-500">End date: {formatDate(endDate)}</p>
                ) : null}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

