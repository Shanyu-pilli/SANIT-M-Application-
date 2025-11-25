import { useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CourseRegistration } from "@/components/CourseRegistration";
import { api } from "@/lib/api";
import { BookOpen, Calendar, Award, User, MessageSquare, PlusCircle, BarChart3, GraduationCap } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function StudentDashboard() {
  const [profile, setProfile] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const { data: { user } } = await api.auth.getUser();
    if (user) {
      const { data } = await api
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      setProfile(data);
    }
  };

  const renderDashboard = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <User className="w-8 h-8 text-primary mb-2" />
                <CardTitle>Profile Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p><strong>Name:</strong> {profile?.name}</p>
                <p><strong>Roll Number:</strong> {profile?.roll_number}</p>
                <p><strong>Department:</strong> {profile?.department}</p>
                <p><strong>Email:</strong> {profile?.email}</p>
              </CardContent>
            </Card>

            {/* Feedback entry point - redirects to separate feedback page */}
            <Card className="shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <MessageSquare className="w-8 h-8 text-primary mb-2" />
                <CardTitle>Feedback</CardTitle>
                <CardDescription>Go to the dedicated feedback page to submit and view your feedback</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-center">
                <div className="space-y-2 text-center">
                  <p className="text-muted-foreground">Open the full feedback page to write, submit and view your past feedback.</p>
                  <div className="mt-2">
                    <Button onClick={() => navigate('/feedback')} className="bg-gradient-to-r from-primary to-primary-glow">Go to Feedback</Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <BookOpen className="w-8 h-8 text-primary mb-2" />
                <CardTitle>Courses</CardTitle>
                <CardDescription>Your enrolled courses</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Course information will be available soon.</p>
              </CardContent>
            </Card>

            <Card className="shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <Calendar className="w-8 h-8 text-primary mb-2" />
                <CardTitle>Attendance</CardTitle>
                <CardDescription>Track your attendance</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Attendance tracking coming soon.</p>
              </CardContent>
            </Card>

            <Card className="shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <Award className="w-8 h-8 text-primary mb-2" />
                <CardTitle>Grades</CardTitle>
                <CardDescription>View your academic performance</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Grades will be displayed here.</p>
              </CardContent>
            </Card>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return renderDashboard();
      case "registration":
        return <CourseRegistration />;
      case "feedback":
        navigate('/feedback');
        return null;
      default:
        return renderDashboard();
    }
  };

  return (
    <ProtectedRoute allowedRoles={["student"]}>
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <Navigation />
        <div className="container mx-auto px-4 pt-20">
          <div className="flex flex-col lg:flex-row gap-6">
            <aside className="lg:w-64">
              <Card>
                <CardHeader>
                  <CardTitle>Student Portal</CardTitle>
                  <CardDescription>Welcome back, {profile?.name}!</CardDescription>
                </CardHeader>
                <CardContent>
                  <nav className="space-y-2">
                    {[
                      { id: "dashboard", label: "Dashboard", icon: BarChart3 },
                      { id: "attendance", label: "Attendance", icon: Calendar },
                      { id: "grades", label: "Grades", icon: BookOpen },
                      { id: "courses", label: "My Courses", icon: GraduationCap },
                      { id: "registration", label: "Course Registration", icon: PlusCircle },
                      { id: "feedback", label: "Feedback", icon: MessageSquare },
                    ].map((item) => (
                      <Button
                        key={item.id}
                        variant={activeTab === item.id ? "default" : "ghost"}
                        className="w-full justify-start"
                        onClick={() => setActiveTab(item.id)}
                      >
                        <item.icon className="mr-2 h-4 w-4" />
                        {item.label}
                      </Button>
                    ))}
                  </nav>
                </CardContent>
              </Card>
            </aside>

            <main className="flex-1">
              <div className="mb-8">
                <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                  Student Portal
                </h1>
                <p className="text-muted-foreground">
                  {activeTab === "dashboard" ? `Welcome back, ${profile?.name}!` : 
                   activeTab === "registration" ? "Register for courses for the upcoming semester" :
                   "Navigate using the sidebar"}
                </p>
              </div>
              {renderContent()}
            </main>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
