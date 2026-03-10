import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AvatarSelector } from "@/components/avatar-selector";
import { getAvatarImage } from "@/lib/avatars";
import { UserCog } from "lucide-react";

const updateSchema = z.object({
  username: z.string().min(1, "Username is required").optional(),
  country: z.string().optional(),
  avatar: z.string().optional(),
});

export default function Profile() {
  const { user, updateProfile, isUpdatingProfile } = useAuth();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof updateSchema>>({
    resolver: zodResolver(updateSchema),
    defaultValues: {
      username: user?.username || "",
      country: user?.country || "",
      avatar: user?.avatar || "bot1",
    },
  });

  const onSubmit = async (data: z.infer<typeof updateSchema>) => {
    try {
      await updateProfile(data);
      toast({ title: "Profile Updated", description: "Identity parameters reconfigured successfully." });
    } catch (err: any) {
      toast({ title: "Update Failed", description: err.message, variant: "destructive" });
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold uppercase tracking-widest text-foreground flex items-center gap-3">
          <UserCog className="h-8 w-8 text-primary" />
          Pilot Identity
        </h1>
        <p className="text-muted-foreground mt-1">Manage your public profile settings.</p>
      </div>

      <Card className="glass-panel border-primary/20">
        <CardHeader>
          <CardTitle className="font-display tracking-widest uppercase">Configuration Matrix</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6 mb-8 p-6 bg-muted/20 rounded-xl border border-border/50">
            <Avatar className="h-24 w-24 border-2 border-primary/50 shadow-[0_0_15px_hsl(var(--primary)/0.2)]">
              <AvatarImage src={getAvatarImage(form.watch('avatar') || user.avatar) || undefined} alt={user.username} />
              <AvatarFallback>{user.username.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-2xl font-display font-bold">{user.username}</h2>
              <div className="text-sm text-muted-foreground uppercase mt-1">Status: {user.isDisqualified ? 'DISQUALIFIED' : 'ACTIVE'}</div>
              <div className="text-sm text-muted-foreground uppercase">Role: {user.role}</div>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Callsign (Username)</FormLabel>
                    <FormControl>
                      <Input {...field} className="bg-background/50 focus-visible:ring-primary" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Region / Country</FormLabel>
                      <FormControl>
                        <Input {...field} className="bg-background/50" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="avatar"
                  render={({ field }) => (
                    <FormItem>
                      <AvatarSelector value={field.value || user.avatar} onChange={field.onChange} label="Pilot Avatar" />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button type="submit" className="font-display tracking-widest w-full h-12 mt-4" disabled={isUpdatingProfile}>
                {isUpdatingProfile ? "SAVING..." : "COMMIT CHANGES"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
