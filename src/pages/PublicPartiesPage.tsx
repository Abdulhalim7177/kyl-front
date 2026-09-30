export default function PublicPartiesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Political Parties</h1>
      <p className="text-muted-foreground mb-8">Explore political parties, their manifestos, and leaders.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {/* Placeholder for parties */}
        <div className="border rounded-lg p-6 shadow-sm flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4 text-xl font-bold">PTY</div>
          <h2 className="text-lg font-semibold">Sample Party</h2>
          <p className="text-sm text-muted-foreground mt-2">Leading the nation forward</p>
        </div>
      </div>
    </div>
  )
}
