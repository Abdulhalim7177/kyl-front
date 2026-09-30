export default function PublicAboutPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">About KYL</h1>
      
      <div className="prose prose-lg dark:prose-invert">
        <p className="text-muted-foreground text-lg mb-6">
          Know Your Leaders (KYL) is a platform designed to provide transparency and information regarding elections, candidates, political parties, and polls in your region.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">Our Mission</h2>
        <p className="mb-6">
          We believe in empowering citizens with accurate, up-to-date information about their political landscape to foster a more engaged and informed electorate.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">Features</h2>
        <ul className="list-disc pl-6 mb-6 space-y-2">
          <li>Track upcoming and ongoing elections</li>
          <li>View detailed profiles of candidates and elected leaders</li>
          <li>Participate in public opinion polls</li>
          <li>Stay informed with the latest political news and updates</li>
        </ul>
      </div>
    </div>
  )
}
