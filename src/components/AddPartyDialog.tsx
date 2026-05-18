import { useState } from 'react'
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

      await partyService.createParty(partyData)

      setOpen(false)
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
        <form onSubmit={handleSubmit} className="space-y-3">
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