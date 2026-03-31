import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col items-center space-y-8 max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center">About KYL</h1>

        <Card className="w-full">
          <CardHeader>
            <CardTitle>Our Mission</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Know Your Leaders (KYL) is dedicated to promoting informed
              democratic participation in Nigeria. We believe that every citizen
              deserves access to comprehensive, accurate information about their
              political leaders and representatives.
            </p>
            <p className="text-muted-foreground">
              Our platform helps Nigerian citizens make informed voting
              decisions by providing detailed profiles of politicians, including
              their backgrounds, track records, policy positions, and
              performance in office. We aggregate information from reliable
              sources to give you a complete picture of who your leaders are and
              what they stand for.
            </p>
            <p className="text-muted-foreground">
              By empowering citizens with knowledge, we aim to strengthen
              Nigeria's democracy and ensure that leaders are held accountable
              to the people they serve.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
