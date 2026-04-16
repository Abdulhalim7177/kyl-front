import { FileText, Clock } from 'lucide-react'

export default function PositionsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <FileText className="w-10 h-10 text-primary" />
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Political Positions
          </h1>
          
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Explore detailed information about political positions, policy stances, and key issues 
            affecting Nigerian citizens. This feature is coming soon.
          </p>
          
          <div className="inline-flex items-center gap-2 bg-accent text-accent-foreground px-4 py-2 rounded-full text-sm font-medium">
            <Clock className="w-4 h-4" />
            Coming Soon
          </div>
        </div>
      </div>
    </div>
  );
}
