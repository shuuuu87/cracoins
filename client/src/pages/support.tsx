import { MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SupportChat } from "@/components/support-chat";

export default function Support() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl gradient-primary flex items-center justify-center">
            <MessageSquare className="h-5 w-5 text-white" />
          </div>
          Support
        </h1>
        <p className="text-muted-foreground mt-1">Send questions, complaints, or feedback to the admin team.</p>
      </div>

      <Card className="glass-panel border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="font-display font-semibold text-base">Your Conversation</CardTitle>
          <CardDescription>Messages are private between you and the admin. Replies appear here.</CardDescription>
        </CardHeader>
        <CardContent>
          <SupportChat />
        </CardContent>
      </Card>
    </div>
  );
}
