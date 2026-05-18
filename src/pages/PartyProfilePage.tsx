import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { partyService, Party } from '@/services/parties'
import { ArrowLeft, Globe } from 'lucide-react' 
import UploadPartyLogoDialog from '@/components/UploadPartyLogoDialog'
import AddChairmanDialog from '@/components/AddChairmanDialog'
import { getLogoUrl } from '@/lib/utils'

function toAbbreviation(name: string) {
  return name
    .split(' ')
    .map((word) => word[0] ?? '')
    .join('')
    .slice(0, 4)
    .toUpperCase()
}

function formatWebsite(name: string) {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '')
  return `https://www.${slug}.com.ng`
}

interface PartyChairmanRecord {
  id: number
  userId?: string
  fullName?: string
  avatarUrl?: string | null
  status?: string
  termStart?: string
  addedBy?: string
  termLimit?: string
  period?: string
  duration?: string
}

interface PartyChairmanData {
  partyName?: string
  currentChairman?: PartyChairmanRecord
  formerChairmen?: PartyChairmanRecord[]
}

function deriveStats(id: number) {
  return {
    totalUsers: 12 + ((id * 7) % 18),
    electedOfficials: 72 + ((id * 11) % 42),
    activeCandidates: 20 + ((id * 5) % 34),
  }
}

function formatChairmanDate(value?: string) {
  if (!value) return 'N/A'
  const date = new Date(value)
  return isNaN(date.getTime()) ? value : date.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })
}

export default function PartyProfilePage() {
  const { partyId } = useParams()
  const navigate = useNavigate()
  const [party, setParty] = useState<Party | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [chairmanData, setChairmanData] = useState<PartyChairmanData | null>(null)
  const [chairmanLoading, setChairmanLoading] = useState(true)
  const [selectedFormerChairmen, setSelectedFormerChairmen] = useState<Set<number>>(new Set())

  const [activeTab, setActiveTab] = useState('Overview')

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    slogan: '',
    philosophy: '',
    address: '',
    registrationYear: '',
  })

  useEffect(() => {
    const id = Number(partyId)
    if (!partyId || Number.isNaN(id)) {
      setError('Invalid party ID.')
      setLoading(false)
      return
    }

    const loadParty = async () => {
      try {
        setLoading(true)
        const data = await partyService.getPartyById(id)
        setParty(data)
        setFormData({
          name: data.name || '',
          description: data.description || '',
          slogan: data.slogan || '',
          philosophy: data.philosophy || '',
          address: data.address || '',
          registrationYear: data.registrationYear ?? '',
        })
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unable to load party profile.'
        setError(message)
      } finally {
        setLoading(false)
      }
    }

    const loadChairmen = async () => {
      try {
        setChairmanLoading(true)
        const chairmanResult = await partyService.getPartyChairman(String(id))
        setChairmanData(chairmanResult)
      } catch (err) {
        console.error('Unable to load party chairmen:', err)
        // Mock data for demonstration
        const mockData = {
          partyName: party?.name,
          currentChairman: {
            id: 1,
            fullName: 'John Doe',
            status: 'active',
            termStart: '2023-01-01',
            addedBy: 'Admin',
            period: '2023-2026',
          },
          formerChairmen: [
            {
              id: 2,
              fullName: 'Jane Smith',
              status: 'former',
              period: '2020-2023',
            },
            {
              id: 3,
              fullName: 'Bob Johnson',
              status: 'former',
              period: '2017-2020',
            },
          ],
        }
        setChairmanData(mockData)
      } finally {
        setChairmanLoading(false)
      }
    }

    loadParty()
    loadChairmen()
  }, [partyId])

  const formerChairmen = chairmanData?.formerChairmen ?? []
  const allFormerSelected = formerChairmen.length > 0 && formerChairmen.every((chairman) => selectedFormerChairmen.has(chairman.id))

  const toggleSelectAllFormerChairmen = () => {
    if (formerChairmen.length === 0) return

    if (allFormerSelected) {
      setSelectedFormerChairmen(new Set())
      return
    }

    setSelectedFormerChairmen(new Set(formerChairmen.map((chairman) => chairman.id)))
  }

  const toggleSelectFormerChairman = (id: number) => {
    setSelectedFormerChairmen((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleDeleteSelectedFormerChairmen = async () => {
    if (selectedFormerChairmen.size === 0) return

    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${selectedFormerChairmen.size} former chairman${selectedFormerChairmen.size > 1 ? 's' : ''}?`
    )

    if (!confirmDelete) return

    try {
      await Promise.all(
        Array.from(selectedFormerChairmen).map((id) => partyService.deletePartyChairman(id))
      )

      // Update the chairman data by removing deleted chairmen
      setChairmanData((prev) => {
        if (!prev?.formerChairmen) return prev
        return {
          ...prev,
          formerChairmen: prev.formerChairmen.filter((chairman) => !selectedFormerChairmen.has(chairman.id)),
        }
      })

      setSelectedFormerChairmen(new Set())
    } catch (err) {
      console.error('Failed to delete selected former chairmen:', err)
      // You might want to show an error message to the user here
    }
  }

  const stats = useMemo(() => {
    if (!party) return null
    return deriveStats(party.id)
  }, [party])

  const handleFormChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setFormError(null)
    setSuccess(null)
  }

  const handleSave = async () => {
    if (!party) return
    setFormError(null)
    setSuccess(null)

    const payload = {
      name: formData.name,
      description: formData.description,
      slogan: formData.slogan,
      philosophy: formData.philosophy,
      address: formData.address,
      registrationYear: String(formData.registrationYear),
    }

    try {
      setSaving(true)
      const updated = await partyService.updateParty(party.id, payload)
      setParty(updated)
      setFormData({
        name: updated.name || '',
        description: updated.description || '',
        slogan: updated.slogan || '',
        philosophy: updated.philosophy || '',
        address: updated.address || '',
        registrationYear: updated.registrationYear ?? '',
      })
      setSuccess('Party details updated successfully.')
      setIsEditDialogOpen(false)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to save party details.')
    } finally {
      setSaving(false)
    }
  }

  const handleCancelEdit = () => {
    if (!party) return
    setFormData({
      name: party.name || '',
      description: party.description || '',
      slogan: party.slogan || '',
      philosophy: party.philosophy || '',
      address: party.address || '',
      registrationYear: party.registrationYear ?? '',
    })
    setFormError(null)
    setSuccess(null)
    setIsEditDialogOpen(false)
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
      </div>
    )
  }

  if (error || !party) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-center">
        <p className="text-sm text-red-600">{error || 'Party profile not found.'}</p>
        <Button variant="outline" onClick={() => navigate('/k8s9d7f3-parties')}>
          Back to Parties
        </Button>
      </div>
    )
  }

  const abbreviation = toAbbreviation(party.name)
  const website = formatWebsite(party.name)

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="flex items-start gap-4">
          <div className="w-20 h-20 rounded-3xl bg-slate-100 border border-gray-200 overflow-hidden flex items-center justify-center">
            {party.logopath && getLogoUrl(party.logopath) ? (
              <img src={getLogoUrl(party.logopath) || ''} alt={`${party.name} logo`} className="h-full w-full object-contain" />
            ) : (
              <span className="text-3xl font-semibold text-slate-600">{abbreviation}</span>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{party.name}</h1>
              <Badge variant="secondary">{Boolean(party.status) ? 'Active' : 'Inactive'}</Badge>
            </div>
            <p className="max-w-2xl text-sm text-slate-500">{party.description}</p>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span>Founded {party.registrationYear || 'N/A'}</span>
              <span className="hidden sm:block">•</span>
              <span>{abbreviation}</span>
              <span className="hidden sm:block">•</span>
              <span>{party.philosophy}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => navigate('/k8s9d7f3-parties')}>
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
          <UploadPartyLogoDialog 
            partyId={party.id} 
            onUploadSuccess={async () => {
              const updated = await partyService.getPartyById(party.id)
              setParty(updated)
            }} 
          />
          {activeTab === 'Party Chairman' ? (
            partyId ? (
              <AddChairmanDialog
                partyId={partyId}
                partyName={party.name}
                onChairmanAssigned={async () => {
                  // Refresh chairman data after assignment
                  const chairmanResult = await partyService.getPartyChairman(partyId)
                  setChairmanData(chairmanResult)
                }}
              />
            ) : (
              <Button disabled>Add Chairman</Button>
            )
          ) : (
            <Button variant={isEditDialogOpen ? 'secondary' : 'default'} onClick={() => setIsEditDialogOpen(true)}>
              {isEditDialogOpen ? 'Cancel Edit' : 'Edit Details'}
            </Button>
          )}
        </div>
      </div>

      {success && (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {success}
        </div>
      )}

      {/* Edit Form Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Party Details</DialogTitle>
            <DialogDescription>
              Update the fields below and save to persist changes.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {formError && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {formError}
              </div>
            )}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Party Name</label>
                <Input value={formData.name} onChange={(e) => handleFormChange('name', e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Slogan</label>
                <Input value={formData.slogan} onChange={(e) => handleFormChange('slogan', e.target.value)} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-slate-700">Description</label>
                <Textarea value={formData.description} onChange={(e) => handleFormChange('description', e.target.value)} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-slate-700">Philosophy</label>
                <Textarea value={formData.philosophy} onChange={(e) => handleFormChange('philosophy', e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Address</label>
                <Input value={formData.address} onChange={(e) => handleFormChange('address', e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Registered Year</label>
                <Input type="number" value={formData.registrationYear} onChange={(e) => handleFormChange('registrationYear', e.target.value)} />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCancelEdit}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tabs */}
      <div className="flex flex-col gap-4">
        <div className="flex gap-4 border-b border-slate-200">
          {['Overview', 'Party Chairman'].map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`
                  relative px-4 py-3 text-sm font-bold transition-all duration-200
                  ${isActive ? 'text-emerald-700' : 'text-slate-500'}
                  hover:text-emerald-600 hover:bg-emerald-50 rounded-t-lg
                  ${isActive 
                    ? 'after:absolute after:bottom-0 after:left-0 after:h-[3px] after:w-full after:bg-emerald-600 after:rounded-t-full' 
                    : 'after:absolute after:bottom-0 after:left-0 after:h-[3px] after:w-0 after:bg-transparent transition-all'
                  }
                `}
              >
                {tab}
              </button>
            )
          })}
        </div>
      </div>

      {/* Party Chairman Section */}
      {activeTab === 'Party Chairman' && (
        <>
          <Card className="border-0">
            <CardHeader>
              <CardTitle className="text-lg">Current Chairman</CardTitle>
              <CardDescription>Most recent party chairman and leadership details.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-6 sm:flex-row sm:items-start">
              <Avatar className="h-24 w-24 rounded-[1.5rem] border border-slate-200 bg-slate-100">
                <AvatarFallback className="text-2xl font-semibold text-slate-700">
                  {party.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex flex-1 flex-col gap-4 sm:flex-row sm:justify-between sm:items-start">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <p className="text-lg font-semibold text-slate-900">
                      {chairmanData?.currentChairman?.fullName || 'No chairman assigned'}
                    </p>
                    {chairmanData?.currentChairman?.status && (
                      <Badge variant={chairmanData.currentChairman.status.toLowerCase() === 'active' ? 'secondary' : 'outline'} className="border-emerald-200 text-emerald-600 bg-emerald-50 h-6">
                        {chairmanData.currentChairman.status}
                      </Badge>
                    )}
                  </div>
                  {chairmanData?.currentChairman && (
                    <>
                      <p className="text-sm text-slate-500">
                        {chairmanData.currentChairman.termStart ? `Assumed position ${formatChairmanDate(chairmanData.currentChairman.termStart)}` : 'Assumption date not available'}
                      </p>
                      <p className="text-sm text-slate-500">
                        {chairmanData.currentChairman.addedBy ? `Added by ${chairmanData.currentChairman.addedBy}` : 'Added by N/A'}
                      </p>
                    </>
                  )}
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="rounded-full bg-slate-100 px-3 py-1">Nationwide</span>
                    <span className="rounded-full bg-slate-100 px-3 py-1">Party Chairman</span>
                  </div>
                </div>

                <div className="flex items-center sm:pt-0.5">
                  <Button
                    variant="outline"
                    onClick={() => navigate(`/k8s9d7f3-parties/${partyId}/chairman`)}
                    className="w-full sm:w-auto"
                  >
                    View Full Profile
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0">
            <CardHeader>
              <CardTitle className="text-lg">Former Chairmen</CardTitle>
              <CardDescription>Previous chairmen records for this party.</CardDescription>
            </CardHeader>
            <CardContent>
              {selectedFormerChairmen.size > 0 && (
                <div className="mb-4 flex items-center justify-between bg-red-50 border border-red-100 rounded-lg px-4 py-3">
                  <p className="text-sm text-red-700">
                    {selectedFormerChairmen.size} former chairman{selectedFormerChairmen.size > 1 ? 's' : ''} selected
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedFormerChairmen(new Set())}
                      className="text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                    >
                      Clear Selection
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleDeleteSelectedFormerChairmen}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Delete Selected
                    </Button>
                  </div>
                </div>
              )}
              {chairmanLoading ? (
                <p className="text-sm text-slate-500">Loading chairmen…</p>
              ) : chairmanData?.formerChairmen?.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="px-4 py-3 text-left">
                          <input
                            type="checkbox"
                            checked={allFormerSelected}
                            onChange={toggleSelectAllFormerChairmen}
                            className="rounded border-slate-300"
                          />
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Full Name</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Period</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Duration</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {chairmanData.formerChairmen.map((chairman) => (
                        <tr key={chairman.id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={selectedFormerChairmen.has(chairman.id)}
                              onChange={() => toggleSelectFormerChairman(chairman.id)}
                              className="rounded border-slate-300"
                            />
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-slate-900">{chairman.fullName || 'Unknown'}</td>
                          <td className="px-4 py-3 text-sm text-slate-600">{chairman.period || 'N/A'}</td>
                          <td className="px-4 py-3 text-sm text-slate-600">{chairman.duration || 'N/A'}</td>
                          <td className="px-4 py-3">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/k8s9d7f3-parties/${partyId}/chairman`)}
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            >
                              View
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-slate-500">No former chairmen available.</p>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Stats and Contact Section (Example for Overview tab) */}
      {activeTab === 'Overview' && (
        <div className="grid xl:grid-cols-2 gap-4">
          <Card className="border-0">
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Party Statistics</CardTitle>
              <CardDescription className="text-xs">
                Key membership and participation metrics for this party.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-white p-1.5">
                  <p className="text-[10px] uppercase tracking-wider text-slate-400">Total users</p>
                  <p className="mt-1 text-xl font-semibold text-slate-900">{stats?.totalUsers ?? 0}</p>
                </div>
                <div className="bg-white p-1.5">
                  <p className="text-[10px] uppercase tracking-wider text-slate-400">Elected officials</p>
                  <p className="mt-1 text-xl font-semibold text-slate-900">{stats?.electedOfficials ?? 0}</p>
                </div>
                <div className="bg-white p-1.5">
                  <p className="text-[10px] uppercase tracking-wider text-slate-400">Active candidates</p>
                  <p className="mt-1 text-xl font-semibold text-slate-900">{stats?.activeCandidates ?? 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0">
            <CardHeader>
              <CardTitle className="text-lg">Contact Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 py-0">
              <div className="bg-white p-2">
                <p className="text-sm font-medium text-slate-700">Address</p>
                <p className="mt-2 text-sm text-slate-500">{party.address || 'No address available'}</p>
              </div>
              <div className="bg-white p-2">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-700"><Globe className="w-4 h-4" /> Website</div>
                <a href={website} target="_blank" rel="noreferrer" className="mt-2 block text-sm text-primary hover:underline">{website}</a>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}