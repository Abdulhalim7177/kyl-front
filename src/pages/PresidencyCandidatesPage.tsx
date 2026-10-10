import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'

export default function PresidencyCandidatesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/k8s9d7f3-districts/presidency">
          <button className="rounded-full p-2 hover:bg-gray-100 transition-colors">
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-[#146c4f]">Manage Presidential Candidates</h1>
      </div>
      <Card>
        <CardContent className="p-6">
          <p className="text-gray-500 text-center py-10">Candidates management view will be populated here.</p>
        </CardContent>
      </Card>
    </div>
  )
}
