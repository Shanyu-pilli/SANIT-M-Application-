import { useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Users, BookOpen, ClipboardCheck, User } from "lucide-react";

export default function FacultyDashboard() {
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      setProfile(data);
    }
  };

  return (
    <ProtectedRoute allowedRoles={["faculty"]}>
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <Navigation />
        <div className="container mx-auto px-4 pt-24 pb-12">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              Faculty Dashboard
            </h1>
            <p className="text-muted-foreground">Welcome, Professor {profile?.name}!</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <User className="w-8 h-8 text-primary mb-2" />
                <CardTitle>Profile Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p><strong>Name:</strong> {profile?.name}</p>
                <p><strong>Faculty ID:</strong> {profile?.faculty_id}</p>
                <p><strong>Department:</strong> {profile?.department}</p>
                <p><strong>Email:</strong> {profile?.email}</p>
              </CardContent>
            </Card>

            <Card className="shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <Users className="w-8 h-8 text-primary mb-2" />
                <CardTitle>Students</CardTitle>
                <CardDescription>Manage your students</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Student management coming soon.</p>
              </CardContent>
            </Card>

            <Card className="shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <BookOpen className="w-8 h-8 text-primary mb-2" />
                <CardTitle>Courses</CardTitle>
                <CardDescription>Manage your courses</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Course management coming soon.</p>
              </CardContent>
            </Card>

            <Card className="shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <ClipboardCheck className="w-8 h-8 text-primary mb-2" />
                <CardTitle>Attendance</CardTitle>
                <CardDescription>Mark student attendance</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Attendance marking coming soon.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
