import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Upload, X } from 'lucide-react'
import { useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { partyService } from '@/services/parties'
import { Plus } from 'lucide-react'

interface AddPartyDialogProps {
  onPartyAdded: () => void
}

export default function AddPartyDialog({ onPartyAdded }: AddPartyDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    slogan: '',
    philosophy: '',
    address: '',
    registrationYear: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Party name is required'
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required'
    }

    if (formData.registrationYear && isNaN(Number(formData.registrationYear))) {
      newErrors.registrationYear = 'Registration year must be a valid number'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, logo: 'Logo must be less than 2MB' }))
        return
      }
      setLogoFile(file)
      setLogoPreview(URL.createObjectURL(file))
      setErrors(prev => ({ ...prev, logo: '' }))
    }
  }

  const removeLogo = () => {
    setLogoFile(null)
    setLogoPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setLoading(true)
    try {
      const partyData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        slogan: formData.slogan.trim() || undefined,
        philosophy: formData.philosophy.trim() || undefined,
        address: formData.address.trim() || undefined,
        registrationYear: formData.registrationYear ? Number(formData.registrationYear) : undefined,
      }

            const createdParty = await partyService.createParty(partyData)

      if (logoFile && createdParty && createdParty.id) {
        try {
          await partyService.uploadPartyLogo(createdParty.id, logoFile)
        } catch (logoError) {
          console.error('Failed to upload logo:', logoError)
          // We don't block the dialog closing, but we could show a toast
        }
      }

      setOpen(false)
      setLogoFile(null)
      setLogoPreview(null)
      setFormData({
        name: '',
        description: '',
        slogan: '',
        philosophy: '',
        address: '',
        registrationYear: '',
      })
      onPartyAdded()
    } catch (error) {
      console.error('Failed to create party:', error)
      // You might want to show a toast or error message here
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-green-700 hover:bg-green-800 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Add Party
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <DialogHeader className="pb-3">
          <DialogTitle>Add New Party</DialogTitle>
          <DialogDescription>
            Create a new political party with the required information.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="flex flex-col items-center justify-center space-y-2 mb-2">
            <div className="relative">
              {logoPreview ? (
                <div className="relative w-24 h-24 rounded-full border-2 border-gray-200 overflow-hidden group">
                  <img src={logoPreview} alt="Logo preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <button type="button" onClick={removeLogo} className="text-white hover:text-red-400 p-1">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-24 h-24 rounded-full border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-500 hover:border-[#146c4f] hover:text-[#146c4f] hover:bg-green-50 transition-colors"
                >
                  <Upload className="w-6 h-6 mb-1" />
                  <span className="text-[10px] font-medium">Upload Logo</span>
                </button>
              )}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleLogoChange}
                accept="image/*"
                className="hidden"
              />
            </div>
            {errors.logo && <p className="text-xs text-red-500">{errors.logo}</p>}
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-0.5">
              Party Name *
            </label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter party name"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-0.5">
              Description *
            </label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Enter party description"
              rows={2}
              className={errors.description ? 'border-red-500' : ''}
            />
            {errors.description && <p className="text-sm text-red-600 mt-1">{errors.description}</p>}
          </div>

          <div>
            <label htmlFor="slogan" className="block text-sm font-medium text-gray-700 mb-0.5">
              Slogan
            </label>
            <Input
              id="slogan"
              value={formData.slogan}
              onChange={(e) => handleInputChange('slogan', e.target.value)}
              placeholder="Enter party slogan"
            />
          </div>

          <div>
            <label htmlFor="philosophy" className="block text-sm font-medium text-gray-700 mb-0.5">
              Philosophy
            </label>
            <Textarea
              id="philosophy"
              value={formData.philosophy}
              onChange={(e) => handleInputChange('philosophy', e.target.value)}
              placeholder="Enter party philosophy"
              rows={2}
            />
          </div>

          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-0.5">
              Address
            </label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder="Enter party address"
            />
          </div>

          <div>
            <label htmlFor="registrationYear" className="block text-sm font-medium text-gray-700 mb-0.5">
              Registration Year
            </label>
            <Input
              id="registrationYear"
              type="number"
              value={formData.registrationYear}
              onChange={(e) => handleInputChange('registrationYear', e.target.value)}
              placeholder="Enter registration year"
              className={errors.registrationYear ? 'border-red-500' : ''}
            />
            {errors.registrationYear && <p className="text-sm text-red-600 mt-1">{errors.registrationYear}</p>}
          </div>

          <DialogFooter className="pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-green-700 hover:bg-green-800">
              {loading ? 'Creating...' : 'Create Party'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
