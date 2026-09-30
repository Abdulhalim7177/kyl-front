export default function PublicElectionsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Elections</h1>
      <p className="text-muted-foreground mb-8">Discover ongoing elections, candidates, and timetables.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Placeholder for elections */}
        <div className="border rounded-lg p-6 shadow-sm">
          <div className="inline-block px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold mb-3">Active</div>
          <h2 className="text-xl font-semibold mb-2">2027 General Elections</h2>
          <p className="text-sm text-muted-foreground mb-4">Presidential & National Assembly</p>
          <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium">View Timetable</button>
        </div>
      </div>
    </div>
  )
}
