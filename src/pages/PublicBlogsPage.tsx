export default function PublicBlogsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Blogs & News</h1>
      <p className="text-muted-foreground mb-8">Read the latest news and updates.</p>
      
      <div className="flex flex-col gap-6">
        {/* Placeholder for blog post */}
        <div className="border rounded-lg p-6 shadow-sm">
          <div className="text-sm text-muted-foreground mb-2">September 30, 2026</div>
          <h2 className="text-2xl font-semibold mb-3">Electoral Commission Announces New Guidelines</h2>
          <p className="text-muted-foreground mb-4">The national electoral commission has rolled out new guidelines for the upcoming elections to ensure transparency and fairness across all states...</p>
          <button className="text-primary font-medium hover:underline">Read more</button>
        </div>
      </div>
    </div>
  )
}
