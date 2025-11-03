import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Navigation } from "@/components/Navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GraduationCap } from "lucide-react";

export default function Auth() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [signupData, setSignupData] = useState<any>(null);

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Signup form state
  const [role, setRole] = useState<"student" | "faculty" | "admin">("student");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [department, setDepartment] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [facultyId, setFacultyId] = useState("");
  const [adminId, setAdminId] = useState("");
  const [otpCode, setOtpCode] = useState("");

  const handleDevLogin = async () => {
    setLoading(true);
    try {
      // First try to sign in with existing credentials
  const { data: signInData, error: signInError } = await api.auth.signInWithPassword({
        email: "test.student@nitm.ac.in",
        password: "testpass123"
      });

      if (signInError) {
        // If sign in fails, create a new account
  const { data: authData, error: authError } = await api.auth.signUp({
          email: "test.student@nitm.ac.in",
          password: "testpass123"
        });

        if (authError) {
          toast.error(`Auth Error: ${authError.message}`);
          return;
        }

        if (!authData.user) {
          toast.error("Failed to create test user");
          return;
        }

        // Create or update test student profile
  const { error: profileError } = await api.from("profiles").upsert({
          id: authData.user.id,
          name: "Test Student",
          email: "test.student@nitm.ac.in",
          role: "student",
          department: "Computer Science",
          roll_number: "b22cs999",
          is_verified: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

        if (profileError) {
          toast.error(`Profile Error: ${profileError.message}`);
          return;
        }

        toast.success("Development: Created and logged in as test student");
        navigate("/student");
      } else if (signInData.user) {
        // If sign in succeeds, verify the profile exists
        const { data: profile, error: profileError } = await api
          .from("profiles")
          .select("*")
          .eq("id", signInData.user.id)
          .single();

        if (profileError || !profile) {
          // Create profile if it doesn't exist
          const { error: createProfileError } = await api.from("profiles").upsert({
            id: signInData.user.id,
            name: "Test Student",
            email: "test.student@nitm.ac.in",
            role: "student",
            department: "Computer Science",
            roll_number: "b22cs999",
            is_verified: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

          if (createProfileError) {
            toast.error(`Profile Creation Error: ${createProfileError.message}`);
            return;
          }
        }

        toast.success("Development: Logged in as test student");
        navigate("/student");
      }
    } catch (error: any) {
      toast.error(`Unexpected Error: ${error.message || "Dev login failed"}`);
      console.error("Dev Login Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
  const { data: authData, error: authError } = await api.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });

      if (authError) throw authError;

      if (authData.user) {
        const { data: profile } = await api
          .from("profiles")
          .select("*")
          .eq("id", authData.user.id)
          .single();

        if (profile) {
          toast.success("Login successful!");
          navigate(`/${profile.role}`);
        }
      }
    } catch (error: any) {
      toast.error(error.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Send OTP
  const { data, error: otpError } = await api.functions.invoke("send-otp", {
        body: { email, name },
      });

      if (otpError) throw otpError;

      setSignupData({ role, name, email, password, department, rollNumber, facultyId, adminId });
      setShowOTP(true);
      
      // Check if in dev mode (email service not configured)
      if (data?.devMode && data?.otp) {
        toast.success(`Development Mode: Your OTP is ${data.otp}`, { duration: 10000 });
      } else {
        toast.success("OTP sent to your email!");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Verify OTP
  const { error: verifyError } = await api.functions.invoke("verify-otp", {
        body: { email: signupData.email, otpCode },
      });

      if (verifyError) throw verifyError;

      // Create account
  const { data: authData, error: authError } = await api.auth.signUp({
        email: signupData.email,
        password: signupData.password,
      });

      if (authError) throw authError;

      if (authData.user) {
        // Create profile
        const profileData: any = {
          id: authData.user.id,
          name: signupData.name,
          email: signupData.email,
          role: signupData.role,
          department: signupData.department || null,
          is_verified: true,
        };

        if (signupData.role === "student") {
          profileData.roll_number = signupData.rollNumber;
        } else if (signupData.role === "faculty") {
          profileData.faculty_id = signupData.facultyId;
        } else if (signupData.role === "admin") {
          profileData.admin_id = signupData.adminId;
        }

  const { error: profileError } = await api.from("profiles").insert(profileData);

        if (profileError) throw profileError;

        toast.success("Account created successfully!");
        navigate(`/${signupData.role}`);
      }
    } catch (error: any) {
      toast.error(error.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <Navigation />
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <GraduationCap className="w-16 h-16 mx-auto mb-4 text-primary" />
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              Welcome Back
            </h1>
            <p className="text-muted-foreground">Sign in to access your portal</p>
          </div>

          {!showOTP ? (
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Authentication</CardTitle>
                <CardDescription>Login or create a new account</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="login">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="login">Login</TabsTrigger>
                    <TabsTrigger value="signup">Sign Up</TabsTrigger>
                  </TabsList>

                  <TabsContent value="login">
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="login-email">Email</Label>
                        <Input
                          id="login-email"
                          type="email"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="login-password">Password</Label>
                        <Input
                          id="login-password"
                          type="password"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          required
                        />
                      </div>
                      <Button type="submit" className="w-full bg-gradient-to-r from-primary to-primary-glow" disabled={loading}>
                        {loading ? "Logging in..." : "Login"}
                      </Button>
                    </form>
                    <div className="mt-4 text-center">
                      <Button
                        type="button"
                        variant="ghost"
                        className="text-sm text-muted-foreground hover:text-primary"
                        onClick={handleDevLogin}
                        disabled={loading}
                      >
                        [DEV] Quick Login as Student
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="signup">
                    <form onSubmit={handleSignup} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="role">Role</Label>
                        <Select value={role} onValueChange={(value: any) => setRole(value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="student">Student</SelectItem>
                            <SelectItem value="faculty">Faculty</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                          id="password"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          minLength={6}
                        />
                      </div>

                      {role !== "admin" && (
                        <div className="space-y-2">
                          <Label htmlFor="department">Department</Label>
                          <Input
                            id="department"
                            value={department}
                            onChange={(e) => setDepartment(e.target.value)}
                            required
                          />
                        </div>
                      )}

                      {role === "student" && (
                        <div className="space-y-2">
                          <Label htmlFor="rollNumber">Roll Number</Label>
                          <Input
                            id="rollNumber"
                            value={rollNumber}
                            onChange={(e) => setRollNumber(e.target.value)}
                            required
                          />
                        </div>
                      )}

                      {role === "faculty" && (
                        <div className="space-y-2">
                          <Label htmlFor="facultyId">Faculty ID</Label>
                          <Input
                            id="facultyId"
                            value={facultyId}
                            onChange={(e) => setFacultyId(e.target.value)}
                            required
                          />
                        </div>
                      )}

                      {role === "admin" && (
                        <div className="space-y-2">
                          <Label htmlFor="adminId">Admin ID</Label>
                          <Input
                            id="adminId"
                            value={adminId}
                            onChange={(e) => setAdminId(e.target.value)}
                            required
                          />
                        </div>
                      )}

                      <Button type="submit" className="w-full bg-gradient-to-r from-primary to-primary-glow" disabled={loading}>
                        {loading ? "Sending OTP..." : "Sign Up"}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ) : (
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Verify OTP</CardTitle>
                <CardDescription>Enter the 6-digit code sent to your email</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleVerifyOTP} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="otp">OTP Code</Label>
                    <Input
                      id="otp"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      maxLength={6}
                      placeholder="000000"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full bg-gradient-to-r from-primary to-primary-glow" disabled={loading}>
                    {loading ? "Verifying..." : "Verify & Create Account"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={() => setShowOTP(false)}
                  >
                    Back
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
