import { useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// Note: Supabase client removed from this file per architecture change.
import { Users, BookOpen, ClipboardCheck, User } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';
import { Button } from "@/components/ui/button";

export default function FacultyDashboard() {
  const [profile, setProfile] = useState<any>(null);
    const [feedbacks, setFeedbacks] = useState<any[]>([]);
    const [groups, setGroups] = useState<Array<{ key: string; courseCode?: string; name?: string; count: number }>>([]);
    const [selectedGroupKey, setSelectedGroupKey] = useState<string | null>(null);
    const [avgPerQuestion, setAvgPerQuestion] = useState<number[] | null>(null);
    const [totalCount, setTotalCount] = useState<number>(0);
    const [showAnalysis, setShowAnalysis] = useState<boolean>(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  // Fetch profile from a backend API endpoint. The backend is responsible
  // for authenticating the request and returning the profile JSON.
  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/profile');
      if (!res.ok) {
        console.warn('failed fetching profile', res.statusText);
        return;
      }
      const data = await res.json();
      setProfile(data || null);
    } catch (err) {
      console.error('error fetching profile', err);
    }
  };

  const fetchFeedbacks = async () => {
    try {
      // Assuming profile has faculty_id
      const facultyId = profile?.faculty_id || profile?.id;
      
      if (!facultyId) {
        console.warn('No faculty ID available');
        return;
      }

      const res = await fetch('http://127.0.0.1:9001/feedback/get-feedback', {
        method: 'GET',
        headers: {
          'X-Faculty-ID': facultyId.toString(),
          'Content-Type': 'application/json',
        },
      });
      
      if (!res.ok) {
        console.warn('fetch feedbacks error', res.statusText);
        return;
      }
      
      const response = await res.json();
      
      if (response.status === 'success') {
        // Transform the decrypted feedback data for display
        const feedbackData = response.data.map((item: any) => ({
          id: item.feedback_id,
          content: item.feedback_data,
          created_at: new Date().toISOString(), // You might want to add proper timestamp
          student_id: item.student_id
        }));
        
        setFeedbacks(feedbackData);
      }
    } catch (err) {
      console.error('error fetching feedbacks', err);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  // build groups for faculty: courseCode|instructor -> count
  useEffect(() => {
    const map = new Map<string, { courseCode?: string; name?: string; count: number }>();
    for (const f of feedbacks) {
      try {
        const parsed = typeof f.content === 'string' ? JSON.parse(f.content) : f.content;
        const ins = parsed?.instructors || [];
        for (const item of ins) {
          const key = `${item.courseCode || 'unknown'}|${(item.name || '').trim()}`;
          const prev = map.get(key) || { courseCode: item.courseCode, name: item.name, count: 0 };
          prev.count += 1;
          map.set(key, prev);
        }
      } catch (err) {
        console.error('error parsing feedback content', err);
      }
    }
    const arr = Array.from(map.entries()).map(([key, v]) => ({ key, courseCode: v.courseCode, name: v.name, count: v.count }));
    setGroups(arr);
  }, [feedbacks]);

  const computeAveragesForGroup = (groupKey: string) => {
    // aggregate ratings per question across all submissions for this group
    const sums: number[] = Array(19).fill(0);
    let cnt = 0;
    for (const f of feedbacks) {
      try {
        const parsed = typeof f.content === 'string' ? JSON.parse(f.content) : f.content;
        const ins = parsed?.instructors || [];
        for (const item of ins) {
          const key = `${item.courseCode || 'unknown'}|${(item.name || '').trim()}`;
          if (key === groupKey) {
            const ratings = item.ratings || [];
            for (let i = 0; i < 19; i++) sums[i] += (ratings[i] || 0);
            cnt += 1;
          }
        }
      } catch (err) {
        console.error('error parsing feedback content while computing averages', err);
      }
    }
    if (cnt === 0) {
      setAvgPerQuestion(null);
      setTotalCount(0);
      return;
    }
    const avgs = sums.map((s) => +(s / cnt).toFixed(2));
    setAvgPerQuestion(avgs);
    setTotalCount(cnt);
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
                <BookOpen className="w-8 h-8 text-primary mb-2" />
                <CardTitle>Student Feedback Analysis</CardTitle>
                <CardDescription>View aggregated student feedback for your courses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">Click "Open Analysis" to load feedback groups (by course & instructor).</p>
                  <div className="flex gap-2">
                    <Button onClick={() => { setShowAnalysis((s) => !s); if (!showAnalysis) fetchFeedbacks(); }} size="sm">{showAnalysis ? 'Close Analysis' : 'Open Analysis'}</Button>
                  </div>
                  {showAnalysis && (
                    <div className="mt-4">
                      <div className="text-sm font-medium mb-2">Select course / instructor</div>
                      {groups.length === 0 ? <div className="text-sm text-muted-foreground">No feedback available yet.</div> : (
                        <div className="space-y-2">
                          {groups.map(g => (
                            <div key={g.key} className="flex items-center justify-between p-2 border rounded">
                              <div>
                                <div className="font-medium">{g.name || 'Instructor'}</div>
                                <div className="text-xs text-muted-foreground">{g.courseCode} — {g.count} submission{g.count>1?'s':''}</div>
                              </div>
                              <div className="flex gap-2">
                                <Button size="sm" onClick={() => { setSelectedGroupKey(g.key); computeAveragesForGroup(g.key); }}>View</Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {/* Chart area: render averages when a group is selected */}
                      {selectedGroupKey && avgPerQuestion && (
                        <div className="mt-4">
                          <div className="text-sm font-medium mb-2">Averages for selected group ({totalCount} submission{totalCount>1?'s':''})</div>
                          <div style={{ width: '100%', height: 240 }}>
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={avgPerQuestion.map((v, i) => ({ q: `Q${i + 1}`, value: v }))}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="q" />
                                <YAxis domain={[0, 5]} />
                                <Tooltip />
                                <Bar dataKey="value" fill="#f59e0b" />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

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
