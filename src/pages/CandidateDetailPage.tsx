/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { AlertTriangle, ArrowLeft, Award, BriefcaseBusiness, CheckCircle2, Eye, GraduationCap, Loader2, Pencil, Plus, Trash2, Upload, UserRound } from 'lucide-react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import {
  candidateService,
  CandidateAchievement,
  CandidateDetail,
  CandidateEducation,
  CandidateExperience,
} from '@/services/candidates'
import { useAuth } from '@/contexts/AuthContext'

type CandidateRecordTab = 'education' | 'achievements' | 'experience'
type CandidateDetailTab = 'profile' | CandidateRecordTab
type CandidateRecord = CandidateEducation | CandidateAchievement | CandidateExperience

const recordTypeLabel = (tab: CandidateRecordTab) => tab === 'achievements' ? 'Achievement' : tab === 'education' ? 'Education' : 'Experience'

const BACKEND_ORIGIN = 'https://kyl.aitshub.com.ng'

export default function CandidateDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [candidate, setCandidate] = useState<CandidateDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [photoUploadError, setPhotoUploadError] = useState<string | null>(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [activeTab, setActiveTab] = useState<CandidateDetailTab>('profile')
  const [educationRecords, setEducationRecords] = useState<CandidateEducation[]>([])
  const [achievementRecords, setAchievementRecords] = useState<CandidateAchievement[]>([])
  const [experienceRecords, setExperienceRecords] = useState<CandidateExperience[]>([])
  const [recordsLoading, setRecordsLoading] = useState(false)
  const [recordsError, setRecordsError] = useState<string | null>(null)
  const [createDialog, setCreateDialog] = useState<CandidateRecordTab | null>(null)
  const [editingRecordId, setEditingRecordId] = useState<number | null>(null)
  const [updatedRecordType, setUpdatedRecordType] = useState<CandidateRecordTab | null>(null)
  const [viewingRecord, setViewingRecord] = useState<{ tab: CandidateRecordTab; record: CandidateRecord } | null>(null)
  const [loadingViewedRecord, setLoadingViewedRecord] = useState(false)
  const [viewRecordError, setViewRecordError] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<{ tab: CandidateRecordTab; record: CandidateRecord } | null>(null)
  const [deletingRecord, setDeletingRecord] = useState(false)
  const [savingRecord, setSavingRecord] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [educationForm, setEducationForm] = useState({
    education_level: '',
    field_of_study: '',
    institution: '',
    country: 'Nigeria',
    start_year: '',
    graduation_year: '',
    education_certificate: '',
    description: '',
  })
  const [achievementForm, setAchievementForm] = useState({
    title: '',
    description: '',
    issuer: '',
    achievement_date: '',
  })
  const [experienceForm, setExperienceForm] = useState({
    job_title: '',
    organization: '',
    industry_type: '',
    start_date: '',
    end_date: '',
    is_current: false,
    description: '',
    responsibilities: '',
  })

  useEffect(() => {
    if (isAuthenticated && id) {
      loadCandidate()
    } else {
      setLoading(false)
      setError('You must be logged in to view candidate details.')
    }
  }, [isAuthenticated, id])

  const getImageUrl = (image: any): string => {
    if (!image) return ''
    let path = ''
    if (typeof image === 'string') {
      path = image
    } else if (typeof image === 'object') {
      const val = image.url || image.path || image.image_path || image.filePath || image.image_url || image.logo_url
      if (typeof val === 'string') {
        path = val
      }
    }
    if (!path) return ''
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('blob:')) {
      return path
    }
    const cleanPath = path.startsWith('/') ? path.slice(1) : path
    return `${BACKEND_ORIGIN}/${cleanPath}`
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!candidate) {
      console.error('Candidate not loaded yet');
      return;
    }
    if (!e.target.files || e.target.files.length === 0) {
      console.log('📸 No files selected.');
      return;
    }
    const file = e.target.files[0];
    console.log('📸 Photo upload triggered. File:', file.name, 'Size:', file.size);
    const previewUrl = URL.createObjectURL(file)
    setCandidate(prev => prev ? { ...prev, image: previewUrl } : prev)
    
    try {
      setPhotoUploadError(null)
      setUploadingPhoto(true)
      console.log('🚀 Calling candidateService.uploadCandidatePhoto...');
      const updated = await candidateService.uploadCandidatePhoto(candidate.id, file);
      console.log('✅ Photo uploaded successfully. Server response candidate:', updated);
      
      // Update state with new data from server
      setCandidate(updated);
      
      // Refresh the full candidate data to ensure the correct image URL
      console.log('🔄 Reloading candidate data...');
      await loadCandidate();
    } catch (err) {
      console.error('❌ Failed to upload photo:', err);
      setCandidate(prev => prev ? { ...prev, image: candidate.image } : prev)
      setPhotoUploadError(err instanceof Error ? err.message : 'Failed to upload photo.')
    } finally {
      URL.revokeObjectURL(previewUrl)
      setUploadingPhoto(false)
      // Reset input value so selecting the same file will trigger onChange again
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  async function loadCandidate() {
    try {
      setLoading(true);
      setError(null);
      const data = await candidateService.getCandidateById(parseInt(id!));
      setCandidate(data);
    } catch (err) {
      console.error('Failed to load candidate:', err);
      setError('Failed to load candidate details. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  async function loadCandidateRecords(tab: CandidateRecordTab, candidateId: number) {
    setRecordsLoading(true)
    setRecordsError(null)
    try {
      if (tab === 'education') {
        setEducationRecords(await candidateService.getCandidateEducation(candidateId))
      } else if (tab === 'achievements') {
        setAchievementRecords(await candidateService.getCandidateAchievements(candidateId))
      } else {
        setExperienceRecords(await candidateService.getCandidateExperiences(candidateId))
      }
    } catch (err) {
      setRecordsError(err instanceof Error ? err.message : `Failed to load candidate ${tab}.`)
    } finally {
      setRecordsLoading(false)
    }
  }

  const handleViewRecord = async (tab: CandidateRecordTab, record: CandidateRecord) => {
    setViewingRecord({ tab, record })
    setViewRecordError(null)
    if (!record.id) return

    setLoadingViewedRecord(true)
    try {
      const detail = tab === 'achievements'
        ? await candidateService.getCandidateAchievement(record.id)
        : tab === 'education'
          ? await candidateService.getCandidateEducationById(record.id)
          : await candidateService.getCandidateExperienceById(record.id)
      setViewingRecord({ tab, record: detail })
    } catch (err) {
      setViewRecordError(err instanceof Error ? err.message : `Failed to load ${tab} details.`)
    } finally {
      setLoadingViewedRecord(false)
    }
  }

  useEffect(() => {
    if (candidate && activeTab !== 'profile') void loadCandidateRecords(activeTab, candidate.id)
  }, [candidate?.id, activeTab])

  const openCreateDialog = (tab: CandidateRecordTab) => {
    setEditingRecordId(null)
    setCreateError(null)
    setCreateDialog(tab)
  }

  const openEditDialog = (tab: CandidateRecordTab, record: CandidateRecord) => {
    if (!record.id) return
    setEditingRecordId(record.id)
    setCreateError(null)
    if (tab === 'education') {
      const education = record as CandidateEducation
      setEducationForm({
        education_level: education.education_level ?? '',
        field_of_study: education.field_of_study ?? '',
        institution: education.institution ?? '',
        country: education.country ?? 'Nigeria',
        start_year: String(education.start_year ?? ''),
        graduation_year: String(education.graduation_year ?? ''),
        education_certificate: education.education_certificate ?? '',
        description: education.description ?? '',
      })
    } else if (tab === 'achievements') {
      const achievement = record as CandidateAchievement
      setAchievementForm({
        title: achievement.title ?? '',
        description: achievement.description ?? '',
        issuer: achievement.issuer ?? '',
        achievement_date: achievement.achievement_date ?? '',
      })
    } else {
      const experience = record as CandidateExperience
      setExperienceForm({
        job_title: experience.job_title ?? '',
        organization: experience.organization ?? '',
        industry_type: experience.industry_type ?? '',
        start_date: experience.start_date ?? '',
        end_date: experience.end_date ?? '',
        is_current: experience.is_current ?? false,
        description: experience.description ?? '',
        responsibilities: experience.responsibilities ?? '',
      })
    }
    setCreateDialog(tab)
  }

  const handleCreateRecord = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!candidate || !createDialog) return

    setSavingRecord(true)
    setCreateError(null)
    const wasEditing = editingRecordId !== null
    try {
      if (createDialog === 'education') {
        const payload = {
          ...educationForm,
          candidate_id: candidate.id,
          start_year: Number(educationForm.start_year),
          graduation_year: Number(educationForm.graduation_year),
        }
        if (editingRecordId) await candidateService.updateCandidateEducation(editingRecordId, payload)
        else await candidateService.createCandidateEducation(payload)
      } else if (createDialog === 'achievements') {
        const payload = {
          ...achievementForm,
          candidate_id: candidate.id,
        }
        if (editingRecordId) await candidateService.updateCandidateAchievement(editingRecordId, payload)
        else await candidateService.createCandidateAchievement(payload)
      } else {
        const payload = {
          ...experienceForm,
          candidate_id: candidate.id,
          end_date: experienceForm.is_current ? null : experienceForm.end_date,
        }
        if (editingRecordId) await candidateService.updateCandidateExperience(editingRecordId, payload)
        else await candidateService.createCandidateExperience(payload)
      }

      await loadCandidateRecords(createDialog, candidate.id)
      if (wasEditing) setUpdatedRecordType(createDialog)
      setActiveTab(createDialog)
      setCreateDialog(null)
      setEditingRecordId(null)
      setEducationForm({
        education_level: '',
        field_of_study: '',
        institution: '',
        country: 'Nigeria',
        start_year: '',
        graduation_year: '',
        education_certificate: '',
        description: '',
      })
      setAchievementForm({ title: '', description: '', issuer: '', achievement_date: '' })
      setExperienceForm({
        job_title: '',
        organization: '',
        industry_type: '',
        start_date: '',
        end_date: '',
        is_current: false,
        description: '',
        responsibilities: '',
      })
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create candidate record.')
    } finally {
      setSavingRecord(false)
    }
  }

  const handleDeleteRecord = async () => {
    const pending = pendingDelete
    const recordId = pending?.record.id
    if (!candidate || !pending || recordId === undefined) return
    setDeletingRecord(true)
    setRecordsError(null)
    try {
      const { tab } = pending
      if (tab === 'education') await candidateService.deleteCandidateEducation(recordId)
      else if (tab === 'achievements') await candidateService.deleteCandidateAchievement(recordId)
      else await candidateService.deleteCandidateExperience(recordId)
      setPendingDelete(null)
      await loadCandidateRecords(tab, candidate.id)
    } catch (err) {
      setRecordsError(err instanceof Error ? err.message : 'Failed to delete candidate record.')
    } finally {
      setDeletingRecord(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#146c4f]"></div>
      </div>
    )
  }

  if (error || !candidate) {
    return (
      <div className="text-center py-16">
        <div className="text-red-600 mb-4">
          <p className="font-medium mb-2">Error Loading Candidate</p>
          <p className="text-sm text-gray-600">{error}</p>
        </div>
        <div className="space-x-4">
          <Button onClick={loadCandidate} className="bg-[#146c4f] hover:bg-[#115a42] text-white">
            Try Again
          </Button>
          <Button variant="outline" onClick={() => navigate('/k8s9d7f3-candidates')}>
            Back to Candidates
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-gray-200 pb-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/k8s9d7f3-candidates')}
            className="h-8 w-8 shrink-0"
            aria-label="Back to candidates"
            title="Back to candidates"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Avatar className="h-24 w-24 shrink-0 rounded-md">
            {getImageUrl(candidate.image) ? (
              <AvatarImage src={getImageUrl(candidate.image)} alt={candidate.fullName} />
            ) : (
              <AvatarFallback className="rounded-md">{candidate.fullName.charAt(0).toUpperCase()}</AvatarFallback>
            )}
          </Avatar>
          <div>
            <h1 className="text-lg font-bold text-gray-900">{candidate.fullName}</h1>
            <p className="text-sm text-gray-600">Candidate Details</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="file"
            accept="image/*"
            id="photo-upload"
            className="hidden"
            ref={fileInputRef}
            onChange={handlePhotoUpload}
          />
          <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploadingPhoto}>
            <Upload className="mr-2 h-4 w-4" />
            {uploadingPhoto ? 'Uploading...' : 'Upload Photo'}
          </Button>
          <Button variant="outline" size="sm" onClick={() => openCreateDialog('education')}>
            <Plus className="mr-1 h-4 w-4" /> Education
          </Button>
          <Button variant="outline" size="sm" onClick={() => openCreateDialog('achievements')}>
            <Plus className="mr-1 h-4 w-4" /> Achievement
          </Button>
          <Button variant="outline" size="sm" onClick={() => openCreateDialog('experience')}>
            <Plus className="mr-1 h-4 w-4" /> Experience
          </Button>
        </div>
      </div>

      {photoUploadError && <p role="alert" className="text-sm text-red-600">{photoUploadError}</p>}

      <section className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <div role="tablist" aria-label="Candidate background" className="flex overflow-x-auto border-b border-gray-200 px-3 pt-2">
          {([
            { id: 'profile', label: 'View Profile', icon: UserRound },
            { id: 'education', label: 'Education', icon: GraduationCap },
            { id: 'achievements', label: 'Achievements', icon: Award },
            { id: 'experience', label: 'Experience', icon: BriefcaseBusiness },
          ] as const).map(({ id: tab, label, icon: Icon }) => (
            <button
              key={tab}
              type="button"
              role="tab"
              id={`candidate-tab-${tab}`}
              aria-controls="candidate-record-panel"
              aria-selected={activeTab === tab}
              onClick={() => setActiveTab(tab)}
              className={`flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${activeTab === tab ? 'border-[#146c4f] text-[#146c4f]' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        <div id="candidate-record-panel" role="tabpanel" aria-labelledby={`candidate-tab-${activeTab}`} className="p-4 sm:p-6">
          {activeTab === 'profile' ? (
            <div className="space-y-6">
              <div className="flex flex-col gap-2 border-b border-gray-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-base font-semibold text-gray-900">Candidate profile</h2>
                  <p className="mt-1 text-sm text-gray-500">Personal and political details</p>
                </div>
                <span className={`w-fit rounded-full px-3 py-1 text-xs font-medium ${candidate.status === 1 ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                  {candidate.status === 1 ? 'Active' : 'Inactive'}
                </span>
              </div>
              <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
                {([
                  ['Candidate code', candidate.code],
                  ['Full name', candidate.fullName],
                  ['Phone number', candidate.phoneNo],
                  ['Email address', candidate.email],
                  ['Date of birth', candidate.dob],
                  ['Gender', candidate.gender],
                  ['NIN', candidate.nin],
                  ['Religion', candidate.religion],
                  ['Political party', candidate.party?.name],
                  ['LGA / District', candidate.lga_district?.name],
                  ['State', candidate.state?.name],
                  ['Address', candidate.address],
                ] as const).map(([label, value]) => (
                  <div key={label} className="min-w-0">
                    <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</dt>
                    <dd className="mt-1 break-words text-sm font-medium text-gray-900">{value ?? '—'}</dd>
                  </div>
                ))}
                {candidate.bio && (
                  <div className="sm:col-span-2 lg:col-span-3">
                    <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Biography</dt>
                    <dd className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-gray-800">{candidate.bio}</dd>
                  </div>
                )}
              </dl>
            </div>
          ) : recordsLoading ? (
            <div className="flex items-center justify-center py-12 text-gray-500">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading {activeTab}...
            </div>
          ) : recordsError ? (
            <div className="py-8 text-center text-sm text-red-600">{recordsError}</div>
          ) : activeTab === 'education' ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Education</TableHead>
                  <TableHead>Field of study</TableHead>
                  <TableHead>Institution</TableHead>
                  <TableHead>Years</TableHead>
                  <TableHead>Certificate</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {educationRecords.length ? educationRecords.map((record, index) => (
                  <TableRow key={record.id ?? `${record.institution}-${index}`}>
                    <TableCell className="font-medium">{record.education_level || '—'}</TableCell>
                    <TableCell>{record.field_of_study || '—'}</TableCell>
                    <TableCell>{record.institution || '—'}<span className="block text-xs text-gray-500">{record.country}</span></TableCell>
                    <TableCell>{record.start_year} – {record.graduation_year}</TableCell>
                    <TableCell>{record.education_certificate || '—'}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8" aria-label="View education" title="View" onClick={() => void handleViewRecord('education', record)}><Eye className="h-4 w-4" /></Button>
                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8" aria-label="Edit education" title="Edit" disabled={!record.id} onClick={() => openEditDialog('education', record)}><Pencil className="h-4 w-4" /></Button>
                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700" aria-label="Delete education" title="Delete" disabled={!record.id} onClick={() => setPendingDelete({ tab: 'education', record })}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )) : <TableRow><TableCell colSpan={6} className="py-10 text-center text-gray-500">No education details added yet.</TableCell></TableRow>}
              </TableBody>
            </Table>
          ) : activeTab === 'achievements' ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Issuer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {achievementRecords.length ? achievementRecords.map((record, index) => (
                  <TableRow key={record.id ?? `${record.title}-${index}`}>
                    <TableCell className="font-medium">{record.title || '—'}</TableCell>
                    <TableCell>{record.issuer || '—'}</TableCell>
                    <TableCell>{record.achievement_date || '—'}</TableCell>
                    <TableCell className="max-w-xs truncate">{record.description || '—'}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8" aria-label="View achievement" title="View" onClick={() => void handleViewRecord('achievements', record)}><Eye className="h-4 w-4" /></Button>
                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8" aria-label="Edit achievement" title="Edit" disabled={!record.id} onClick={() => openEditDialog('achievements', record)}><Pencil className="h-4 w-4" /></Button>
                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700" aria-label="Delete achievement" title="Delete" disabled={!record.id} onClick={() => setPendingDelete({ tab: 'achievements', record })}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )) : <TableRow><TableCell colSpan={5} className="py-10 text-center text-gray-500">No achievement details added yet.</TableCell></TableRow>}
              </TableBody>
            </Table>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job title</TableHead>
                  <TableHead>Organization</TableHead>
                  <TableHead>Industry</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {experienceRecords.length ? experienceRecords.map((record, index) => (
                  <TableRow key={record.id ?? `${record.organization}-${record.job_title}-${index}`}>
                    <TableCell className="font-medium">{record.job_title || '—'}</TableCell>
                    <TableCell>{record.organization || '—'}</TableCell>
                    <TableCell>{record.industry_type || '—'}</TableCell>
                    <TableCell>{record.start_date || '—'} – {record.is_current ? 'Present' : record.end_date || '—'}</TableCell>
                    <TableCell>{record.is_current ? 'Current' : 'Past'}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8" aria-label="View experience" title="View" onClick={() => void handleViewRecord('experience', record)}><Eye className="h-4 w-4" /></Button>
                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8" aria-label="Edit experience" title="Edit" disabled={!record.id} onClick={() => openEditDialog('experience', record)}><Pencil className="h-4 w-4" /></Button>
                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700" aria-label="Delete experience" title="Delete" disabled={!record.id} onClick={() => setPendingDelete({ tab: 'experience', record })}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )) : <TableRow><TableCell colSpan={6} className="py-10 text-center text-gray-500">No experience details added yet.</TableCell></TableRow>}
              </TableBody>
            </Table>
          )}
        </div>
      </section>

      <Dialog open={createDialog !== null} onOpenChange={(open) => {
        if (!open && !savingRecord) {
          setCreateDialog(null)
          setCreateError(null)
          setEditingRecordId(null)
        }
      }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {editingRecordId ? 'Edit' : 'Add'} {createDialog === 'education' ? 'Education' : createDialog === 'achievements' ? 'Achievement' : 'Experience'}
            </DialogTitle>
            <DialogDescription>{editingRecordId ? 'Update the candidate record details below.' : 'Enter the candidate record details below.'}</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateRecord} className="space-y-4">
            {createDialog === 'education' && (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="space-y-1 text-sm font-medium">Education level<Input required value={educationForm.education_level} onChange={(e) => setEducationForm((form) => ({ ...form, education_level: e.target.value }))} /></label>
                  <label className="space-y-1 text-sm font-medium">Field of study<Input required value={educationForm.field_of_study} onChange={(e) => setEducationForm((form) => ({ ...form, field_of_study: e.target.value }))} /></label>
                  <label className="space-y-1 text-sm font-medium">Institution<Input required value={educationForm.institution} onChange={(e) => setEducationForm((form) => ({ ...form, institution: e.target.value }))} /></label>
                  <label className="space-y-1 text-sm font-medium">Country<Input required value={educationForm.country} onChange={(e) => setEducationForm((form) => ({ ...form, country: e.target.value }))} /></label>
                  <label className="space-y-1 text-sm font-medium">Start year<Input required type="number" min="1900" max="2100" value={educationForm.start_year} onChange={(e) => setEducationForm((form) => ({ ...form, start_year: e.target.value }))} /></label>
                  <label className="space-y-1 text-sm font-medium">Graduation year<Input required type="number" min="1900" max="2100" value={educationForm.graduation_year} onChange={(e) => setEducationForm((form) => ({ ...form, graduation_year: e.target.value }))} /></label>
                </div>
                <label className="block space-y-1 text-sm font-medium">Certificate<Input value={educationForm.education_certificate} onChange={(e) => setEducationForm((form) => ({ ...form, education_certificate: e.target.value }))} /></label>
                <label className="block space-y-1 text-sm font-medium">Description<Textarea value={educationForm.description} onChange={(e) => setEducationForm((form) => ({ ...form, description: e.target.value }))} /></label>
              </>
            )}

            {createDialog === 'achievements' && (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="space-y-1 text-sm font-medium">Title<Input required value={achievementForm.title} onChange={(e) => setAchievementForm((form) => ({ ...form, title: e.target.value }))} /></label>
                  <label className="space-y-1 text-sm font-medium">Issuer<Input required value={achievementForm.issuer} onChange={(e) => setAchievementForm((form) => ({ ...form, issuer: e.target.value }))} /></label>
                  <label className="space-y-1 text-sm font-medium sm:col-span-2">Date<Input required type="date" value={achievementForm.achievement_date} onChange={(e) => setAchievementForm((form) => ({ ...form, achievement_date: e.target.value }))} /></label>
                </div>
                <label className="block space-y-1 text-sm font-medium">Description<Textarea value={achievementForm.description} onChange={(e) => setAchievementForm((form) => ({ ...form, description: e.target.value }))} /></label>
              </>
            )}

            {createDialog === 'experience' && (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="space-y-1 text-sm font-medium">Job title<Input required value={experienceForm.job_title} onChange={(e) => setExperienceForm((form) => ({ ...form, job_title: e.target.value }))} /></label>
                  <label className="space-y-1 text-sm font-medium">Organization<Input required value={experienceForm.organization} onChange={(e) => setExperienceForm((form) => ({ ...form, organization: e.target.value }))} /></label>
                  <label className="space-y-1 text-sm font-medium sm:col-span-2">Industry type<Input required value={experienceForm.industry_type} onChange={(e) => setExperienceForm((form) => ({ ...form, industry_type: e.target.value }))} /></label>
                  <label className="space-y-1 text-sm font-medium">Start date<Input required type="date" value={experienceForm.start_date} onChange={(e) => setExperienceForm((form) => ({ ...form, start_date: e.target.value }))} /></label>
                  <label className="space-y-1 text-sm font-medium">End date<Input type="date" disabled={experienceForm.is_current} required={!experienceForm.is_current} value={experienceForm.end_date} onChange={(e) => setExperienceForm((form) => ({ ...form, end_date: e.target.value }))} /></label>
                </div>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" checked={experienceForm.is_current} onChange={(e) => setExperienceForm((form) => ({ ...form, is_current: e.target.checked, end_date: e.target.checked ? '' : form.end_date }))} />
                  This is my current role
                </label>
                <label className="block space-y-1 text-sm font-medium">Description<Textarea value={experienceForm.description} onChange={(e) => setExperienceForm((form) => ({ ...form, description: e.target.value }))} /></label>
                <label className="block space-y-1 text-sm font-medium">Responsibilities<Textarea value={experienceForm.responsibilities} onChange={(e) => setExperienceForm((form) => ({ ...form, responsibilities: e.target.value }))} /></label>
              </>
            )}

            {createError && <p role="alert" className="text-sm text-red-600">{createError}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setCreateDialog(null); setEditingRecordId(null) }} disabled={savingRecord}>Cancel</Button>
              <Button type="submit" disabled={savingRecord} className="bg-[#146c4f] text-white hover:bg-[#115a42]">
                {savingRecord && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {savingRecord ? 'Saving...' : editingRecordId ? 'Save changes' : 'Save record'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={viewingRecord !== null} onOpenChange={(open) => {
        if (!open) {
          setViewingRecord(null)
          setViewRecordError(null)
        }
      }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {viewingRecord?.tab === 'education' ? 'Education details' : viewingRecord?.tab === 'achievements' ? 'Achievement details' : 'Experience details'}
            </DialogTitle>
          </DialogHeader>
          {loadingViewedRecord ? (
            <div className="flex items-center justify-center py-8 text-sm text-gray-500">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading details...
            </div>
          ) : viewRecordError ? (
            <p role="alert" className="text-sm text-red-600">{viewRecordError}</p>
          ) : viewingRecord && (
            <dl className="grid gap-4 sm:grid-cols-2">
              {Object.entries(viewingRecord.record)
                .filter(([key]) => !['id', 'candidate_id', 'created_at', 'updated_at', 'createdAt', 'updatedAt'].includes(key)
                  && !(viewingRecord.tab === 'experience' && key === 'is_current'))
                .map(([key, value]) => (
                  <div key={key} className="min-w-0">
                    <dt className="text-xs font-medium uppercase text-gray-500">{key.replace(/_/g, ' ')}</dt>
                    <dd className="mt-1 whitespace-pre-wrap break-words text-sm text-gray-900">
                      {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value ?? '—')}
                    </dd>
                  </div>
                ))}
            </dl>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { setViewingRecord(null); setViewRecordError(null) }}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={updatedRecordType !== null} onOpenChange={(open) => !open && setUpdatedRecordType(null)}>
        <DialogContent className="sm:max-w-sm rounded-md">
          <DialogHeader className="items-center text-center">
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-md bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <DialogTitle>{updatedRecordType ? `${recordTypeLabel(updatedRecordType)} updated successfully` : 'Update successful'}</DialogTitle>
            <DialogDescription>The candidate record has been saved.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center">
            <Button type="button" onClick={() => setUpdatedRecordType(null)} className="bg-[#146c4f] text-white hover:bg-[#115a42]">Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={pendingDelete !== null} onOpenChange={(open) => !open && !deletingRecord && setPendingDelete(null)}>
        <DialogContent className="sm:max-w-md rounded-md">
          <DialogHeader>
            <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-md bg-amber-100 text-amber-700">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <DialogTitle>Warning: delete {pendingDelete ? recordTypeLabel(pendingDelete.tab).toLowerCase() : 'record'}?</DialogTitle>
            <DialogDescription>This will permanently delete this candidate record. This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setPendingDelete(null)} disabled={deletingRecord}>Cancel</Button>
            <Button type="button" variant="destructive" onClick={handleDeleteRecord} disabled={deletingRecord}>
              {deletingRecord && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {deletingRecord ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}