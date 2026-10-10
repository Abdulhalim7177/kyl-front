import { useEffect, useState } from 'react'
import { ArrowLeft, MapPin } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Link } from 'react-router-dom'

export default function PresidencyPage() {
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // In a full implementation, fetch active presidency candidates and elected leaders here
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/k8s9d7f3-districts">
          <button className="rounded-full p-2 hover:bg-gray-100 transition-colors">
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#146c4f] flex items-center gap-2">
            <MapPin className="h-6 w-6" />
            Presidency (National)
          </h1>
          <p className="text-sm text-gray-500">Manage national presidency elections, candidates, and leaders.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-2">Presidential Candidates</h2>
            <p className="text-gray-500 mb-4">View and manage candidates running for Presidency in active elections.</p>
            <Link to="/k8s9d7f3-districts/presidency/candidates">
              <button className="w-full bg-[#146c4f] text-white py-2 rounded-md hover:bg-[#10563f] transition-colors">
                Manage Candidates
              </button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-2">Elected Presidency</h2>
            <p className="text-gray-500 mb-4">Manage the currently elected President and Vice President.</p>
            <Link to="/k8s9d7f3-districts/presidency/elected">
              <button className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors">
                Manage Elected Leaders
              </button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
