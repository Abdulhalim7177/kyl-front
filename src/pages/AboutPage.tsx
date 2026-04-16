import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Target, ShieldCheck, Users, Scale, BookOpen } from 'lucide-react'

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
                  <Target className="w-5 h-5 text-primary" />
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
                    <ShieldCheck className="w-5 h-5 text-primary" />
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
                    <Users className="w-5 h-5 text-primary" />
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
                    <Scale className="w-5 h-5 text-primary" />
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
                    <BookOpen className="w-5 h-5 text-primary" />
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
