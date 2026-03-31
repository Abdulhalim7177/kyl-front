import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              About Know Your Leaders
            </h1>
            <p className="text-xl text-muted-foreground">
              Building a more informed and engaged democracy in Nigeria
            </p>
          </div>

          {/* Mission Card */}
          <Card className="mb-8 border-2">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <CardTitle className="text-2xl">Our Mission</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                Know Your Leaders (KYL) is dedicated to promoting informed democratic participation 
                in Nigeria. We believe that every citizen deserves access to comprehensive, accurate 
                information about their political leaders and representatives.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Our platform helps Nigerian citizens make informed voting decisions by providing 
                detailed profiles of politicians, including their backgrounds, track records, policy 
                positions, and performance in office. We aggregate information from reliable sources 
                to give you a complete picture of who your leaders are and what they stand for.
              </p>
            </CardContent>
          </Card>

          {/* Values Grid */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <Card className="border-2">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <CardTitle>Transparency</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  We provide clear, unbiased information from verified sources to ensure 
                  citizens have access to the truth about their leaders.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <CardTitle>Accessibility</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Political information should be easy to find and understand for every 
                  Nigerian citizen, regardless of their background.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                    </svg>
                  </div>
                  <CardTitle>Accountability</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  By tracking records and promises, we help hold elected officials 
                  accountable to the people they serve.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <CardTitle>Education</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  We empower citizens with knowledge about the political process and 
                  help them understand how to participate effectively.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Vision Statement */}
          <Card className="bg-gradient-to-br from-primary/5 to-accent/50 border-2 border-primary/20">
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold text-foreground mb-4">
                Our Vision for Nigeria
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed">
                We envision a Nigeria where every citizen has the tools and information needed 
                to participate meaningfully in democracy. By empowering voters with knowledge, 
                we aim to strengthen Nigeria's democratic institutions and ensure that leaders 
                are held accountable to the people they serve.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
