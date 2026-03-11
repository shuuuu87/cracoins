import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { AvatarSelector } from "@/components/avatar-selector";
import { insertUserSchema } from "@shared/schema";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = insertUserSchema;

export default function Auth() {
  const [_, setLocation] = useLocation();
  const { login, register, isLoggingIn, isRegistering } = useAuth();
  const { toast } = useToast();
  
  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      country: "US",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      avatar: "avatar1",
      startACoins: 0,
      startCredits: 0,
    },
  });

  const onLogin = async (data: z.infer<typeof loginSchema>) => {
    try {
      await login(data);
      toast({ title: "Login successful", description: "Welcome back commander." });
      setLocation("/dashboard");
    } catch (err: any) {
      toast({ title: "Access Denied", description: err.message, variant: "destructive" });
    }
  };

  const onRegister = async (data: z.infer<typeof registerSchema>) => {
    try {
      await register(data);
      toast({ title: "Registration complete", description: "Your protocol has been initialized." });
      setLocation("/dashboard");
    } catch (err: any) {
      toast({ title: "Registration Failed", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <div className="absolute inset-0 bg-background bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-background to-background z-0" />
      
      <Card className="w-full max-w-md z-10 glass-panel border-primary/20 shadow-2xl shadow-primary/10">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-3xl font-display text-primary uppercase tracking-widest text-shadow-glow">SYSTEM ACCESS</CardTitle>
          <CardDescription>Authenticate to access the Mech Tracker network</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 bg-background/50 border border-border/50">
              <TabsTrigger value="login" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary uppercase font-display tracking-wider">Login</TabsTrigger>
              <TabsTrigger value="register" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary uppercase font-display tracking-wider">Register</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                  <FormField
                    control={loginForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter username" {...field} className="bg-background/50 focus-visible:ring-primary" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Enter password" {...field} className="bg-background/50 focus-visible:ring-primary" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full h-12 mt-6 font-display tracking-widest" disabled={isLoggingIn}>
                    {isLoggingIn ? "AUTHENTICATING..." : "LOGIN"}
                  </Button>
                </form>
              </Form>
            </TabsContent>
            
            <TabsContent value="register">
              <Form {...registerForm}>
                <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                  <FormField
                    control={registerForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pilot Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter username" {...field} className="bg-background/50" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Password" {...field} className="bg-background/50" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Country</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. US, UK, IN" {...field} className="bg-background/50" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={registerForm.control}
                    name="avatar"
                    render={({ field }) => (
                      <FormItem>
                        <AvatarSelector value={field.value} onChange={field.onChange} label="Select Your Pilot Avatar" />
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border/50">
                    <FormField
                      control={registerForm.control}
                      name="startACoins"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-accent">Current A-Coins</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : 0)} className="bg-background/50 border-accent/30" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="startCredits"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-primary">Current Credits</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : 0)} className="bg-background/50 border-primary/30" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <Button type="submit" className="w-full h-12 mt-6 font-display tracking-widest bg-gradient-to-r from-primary to-primary/80 hover:to-primary" disabled={isRegistering}>
                    {isRegistering ? "INITIALIZING..." : "REGISTER FOR CHALLENGE"}
                  </Button>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
