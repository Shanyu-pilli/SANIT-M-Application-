import { useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { Users, Settings, BarChart, User, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function AdminDashboard() {
  const [profile, setProfile] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProfile();
    fetchAllUsers();
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

  const fetchAllUsers = async () => {
    const { data } = await api
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) {
      setUsers(data);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;

    setLoading(true);
    try {
      const { error } = await api
        .from("profiles")
        .eq("id", userId)
        .delete();

      if (error) throw error;

      toast.success("User deleted successfully");
      fetchAllUsers();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete user");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <Navigation />
        <div className="container mx-auto px-4 pt-24 pb-12">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground">System administration panel</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="shadow-lg">
              <CardHeader>
                <Users className="w-8 h-8 text-primary mb-2" />
                <CardTitle>Total Users</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{users.length}</p>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader>
                <User className="w-8 h-8 text-primary mb-2" />
                <CardTitle>Students</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  {users.filter((u) => u.role === "student").length}
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader>
                <User className="w-8 h-8 text-primary mb-2" />
                <CardTitle>Faculty</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  {users.filter((u) => u.role === "faculty").length}
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader>
                <Settings className="w-8 h-8 text-primary mb-2" />
                <CardTitle>Admins</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  {users.filter((u) => u.role === "admin").length}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Manage all system users</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        Role: {user.role} | Department: {user.department || "N/A"}
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteUser(user.id)}
                      disabled={loading || user.id === profile?.id}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}
