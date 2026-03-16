import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/use-auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { AvatarSelector } from "@/components/avatar-selector";
import { insertUserSchema } from "@shared/schema";
import { Eye, EyeOff, Coins } from "lucide-react";

const COUNTRIES = [
  "United States", "United Kingdom", "Canada", "Australia", "India", "Germany", "France", "Spain",
  "Italy", "Japan", "South Korea", "China", "Brazil", "Mexico", "Russia", "South Africa",
  "Singapore", "Malaysia", "Philippines", "Thailand", "Indonesia", "Vietnam", "Pakistan",
  "Bangladesh", "Egypt", "Nigeria", "Kenya", "Argentina", "Chile", "Colombia", "Peru",
  "Other"
];

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = insertUserSchema;

export default function Auth() {
  const [_, setLocation] = useLocation();
  const { login, register, isLoggingIn, isRegistering } = useAuth();
  const { toast } = useToast();
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [activeTab, setActiveTab] = useState("login");

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      country: "United States",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      avatar: "avatar1",
      startACoins: 0,
      startCredits: 0,
    },
  });

  const onLogin = async (data: z.infer<typeof loginSchema>) => {
    try {
      await login(data);
      toast({ title: "Welcome back!", description: "Redirecting to your dashboard." });
      setLocation("/dashboard");
    } catch (err: any) {
      toast({ title: "Login Failed", description: err.message, variant: "destructive" });
    }
  };

  const onRegister = async (data: z.infer<typeof registerSchema>) => {
    try {
      await register(data);
      toast({ title: "Account created!", description: "Welcome to the CraCoins challenge." });
      setLocation("/dashboard");
    } catch (err: any) {
      toast({ title: "Registration Failed", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel — Form */}
      <div className="flex-1 flex flex-col justify-center px-8 py-12 bg-white max-w-xl">
        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-10">
          <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center shadow-sm">
            <Coins className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-display font-bold text-foreground">CraCoins</span>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="mb-8">
            {activeTab === "login" ? (
              <>
                <h1 className="text-3xl font-display font-bold text-foreground mb-1">Welcome back</h1>
                <p className="text-muted-foreground">Sign in to your CraCoins account</p>
              </>
            ) : (
              <>
                <h1 className="text-3xl font-display font-bold text-foreground mb-1">Join the Challenge</h1>
                <p className="text-muted-foreground">Create your CraCoins account to get started</p>
              </>
            )}
          </div>

          <TabsList className="grid w-full grid-cols-2 mb-8 bg-muted/60 rounded-xl p-1">
            <TabsTrigger
              value="login"
              className="rounded-lg font-semibold data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-foreground"
            >
              Sign In
            </TabsTrigger>
            <TabsTrigger
              value="register"
              className="rounded-lg font-semibold data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-foreground"
            >
              Register
            </TabsTrigger>
          </TabsList>

          {/* Login Tab */}
          <TabsContent value="login">
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-5">
                <FormField
                  control={loginForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-foreground">Username</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Your username"
                          {...field}
                          data-testid="input-username-login"
                          className="h-11 rounded-xl border-border bg-background focus-visible:ring-primary focus-visible:border-primary"
                        />
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
                      <FormLabel className="text-sm font-semibold text-foreground">Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showLoginPassword ? "text" : "password"}
                            placeholder="Your password"
                            {...field}
                            data-testid="input-password-login"
                            className="h-11 rounded-xl border-border bg-background focus-visible:ring-primary focus-visible:border-primary pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowLoginPassword(!showLoginPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            data-testid="toggle-login-password"
                          >
                            {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  data-testid="button-login"
                  className="w-full h-11 rounded-xl font-semibold text-base mt-2"
                  disabled={isLoggingIn}
                >
                  {isLoggingIn ? "Signing in..." : "Sign In"}
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                  Don't have an account?{" "}
                  <button type="button" onClick={() => setActiveTab("register")} className="text-primary font-semibold hover:underline">
                    Register
                  </button>
                </p>
              </form>
            </Form>
          </TabsContent>

          {/* Register Tab */}
          <TabsContent value="register">
            <Form {...registerForm}>
              <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                <FormField
                  control={registerForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-foreground">Username</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Choose a username"
                          {...field}
                          data-testid="input-username-register"
                          className="h-11 rounded-xl border-border bg-background focus-visible:ring-primary"
                        />
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
                        <FormLabel className="text-sm font-semibold text-foreground">Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showRegisterPassword ? "text" : "password"}
                              placeholder="Password"
                              {...field}
                              data-testid="input-password-register"
                              className="h-11 rounded-xl border-border bg-background focus-visible:ring-primary pr-10"
                            />
                            <button
                              type="button"
                              onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                              data-testid="toggle-register-password"
                            >
                              {showRegisterPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
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
                        <FormLabel className="text-sm font-semibold text-foreground">Country</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger data-testid="select-country" className="h-11 rounded-xl border-border bg-background">
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {COUNTRIES.map((c) => (
                              <SelectItem key={c} value={c}>{c}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
                      <AvatarSelector value={field.value} onChange={field.onChange} label="Choose Your Avatar" />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-border/60">
                  <FormField
                    control={registerForm.control}
                    name="startACoins"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold text-primary">Starting A-Coins</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : 0)}
                            data-testid="input-start-acoins"
                            className="h-11 rounded-xl border-primary/30 bg-primary/5 focus-visible:ring-primary"
                          />
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
                        <FormLabel className="text-sm font-semibold text-accent">Starting Credits</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : 0)}
                            data-testid="input-start-credits"
                            className="h-11 rounded-xl border-accent/30 bg-accent/5 focus-visible:ring-accent"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button
                  type="submit"
                  data-testid="button-register"
                  className="w-full h-11 rounded-xl font-semibold text-base mt-2"
                  disabled={isRegistering}
                >
                  {isRegistering ? "Creating account..." : "Create Account"}
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <button type="button" onClick={() => setActiveTab("login")} className="text-primary font-semibold hover:underline">
                    Sign In
                  </button>
                </p>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </div>

      {/* Right Panel — Decorative */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden items-center justify-center"
        style={{
          background: "linear-gradient(135deg, #f97316 0%, #fb923c 25%, #fdba74 50%, #7c3aed 75%, #4f46e5 100%)"
        }}
      >
        <div className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, rgba(255,255,255,0.3) 0%, transparent 50%),
                              radial-gradient(circle at 80% 20%, rgba(255,255,255,0.2) 0%, transparent 40%),
                              radial-gradient(circle at 60% 80%, rgba(255,255,255,0.15) 0%, transparent 35%)`
          }}
        />
        <div className="relative z-10 text-center text-white px-12">
          <div className="h-24 w-24 rounded-3xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-8 shadow-2xl">
            <Coins className="h-12 w-12 text-white" />
          </div>
          <h2 className="text-4xl font-display font-bold mb-4 drop-shadow-lg">CraCoins</h2>
          <p className="text-lg font-medium text-white/90 max-w-xs mx-auto leading-relaxed drop-shadow">
            Track your Mech Arena resources through the ultimate 4-month no-spend challenge.
          </p>
          <div className="mt-10 grid grid-cols-3 gap-4 text-center">
            {[
              { label: "Challenge", value: "4 Months" },
              { label: "Start", value: "Apr 24" },
              { label: "End", value: "Aug 24" },
            ].map((item) => (
              <div key={item.label} className="bg-white/15 backdrop-blur-sm rounded-2xl py-4 px-3">
                <div className="text-xl font-display font-bold text-white">{item.value}</div>
                <div className="text-xs text-white/70 mt-1 font-medium">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
