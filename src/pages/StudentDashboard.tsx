import { useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { BookOpen, Calendar, Award, User, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function StudentDashboard() {
  const [profile, setProfile] = useState<any>(null);
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



  return (
    <ProtectedRoute allowedRoles={["student"]}>
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <Navigation />
        <div className="container mx-auto px-4 pt-24 pb-12">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              Student Dashboard
            </h1>
            <p className="text-muted-foreground">Welcome back, {profile?.name}!</p>
          </div>

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
        </div>
      </div>
    </ProtectedRoute>
  );
}
