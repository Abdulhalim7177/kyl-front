import { Link } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function AccessDeniedPage() {
  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <div className="max-w-md mx-auto">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
          <ShieldAlert className="h-8 w-8 text-red-500" aria-hidden="true" />
        </div>
        <div className="text-5xl font-bold text-primary mb-4">403</div>
        <h1 className="text-2xl font-bold mb-2">Access denied</h1>
        <p className="text-muted-foreground mb-6">
          You do not have permission to view this page. If you believe this is a mistake, contact an administrator.
        </p>
        <Button asChild className="bg-primary hover:bg-primary/90">
          <Link to="/k8s9d7f3-admin-panel">Go to dashboard</Link>
        </Button>
      </div>
    </div>
  )
}
