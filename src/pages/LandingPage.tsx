import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

export default function LandingPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col items-center justify-center min-h-screen space-y-8">
        <h1 className="text-4xl font-bold text-center">Know Your Leaders</h1>

        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle>Welcome to Know Your Leaders</CardTitle>
            <CardDescription>
              Empowering Nigerian citizens to make informed voting decisions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-6">
              Access comprehensive information about Nigerian politicians,
              including their backgrounds, track records, and policy positions.
              Make your voice count with knowledge.
            </p>
            <Button size="lg" className="w-full">
              Explore Politicians
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
