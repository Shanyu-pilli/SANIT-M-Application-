import { useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { BookOpen, MessageSquare, Star } from "lucide-react";
import { toast } from "sonner";

const QUESTIONS: string[] = [
  "1. Ability to plan and organize the classroom or lab periods",
  "2. Enthusiasm in the class",
  "3. Communication ability",
  "4. Treatment of the students",
  "5. Attitude to listening or responding to student's questions and efforts to answer them completely",
  "6. Knowledge of the subject",
  "7. Efforts to make difficult ideas clear without distorting or over simplifying them",
  "8. Efforts to emphasize the importance of the course material and to make it interesting",
  "9. Efforts to encourage student participation in the class",
  "10. Fairness in evaluating student performance and awarding grades",
  "11. Ability for consultation during the hours fixed for it and by appointment",
  "12. Regularity and punctuality in attendance",
  "13. Regularity in taking analytical responses from students",
  "14. Coverage of the syllabus",
  "15. Ability to complete the course on time",
  "16. Ability for and eagerness in providing sufficient books, reference and study materials",
  "17. Enthusiasm for discussing and solving problems on a regular basis",
  "18. What is your overall rating of this instructor?",
  "19. Not considering your instructor, but only the course and course material, what is your overall rating of this course?",
];

function StarRating({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => {
        const idx = i + 1;
        return (
          <button
            key={idx}
            type="button"
            aria-label={`Rate ${idx}`}
            onClick={() => onChange(idx)}
            className="p-1 rounded hover:bg-muted/20"
          >
            <Star
              className={`w-6 h-6 ${idx <= value ? "text-yellow-400" : "text-muted-foreground"}`}
              fill={idx <= value ? 'currentColor' : 'none'}
              stroke={idx <= value ? 'none' : 'currentColor'}
              strokeWidth={idx <= value ? 0 : 1.5}
            />
          </button>
        );
      })}
    </div>
  );
}

export default function Feedback() {
  const [profile, setProfile] = useState<any>(null);
  const [programme, setProgramme] = useState<string>("B.Tech");
  const [department, setDepartment] = useState<string>("CS");
  const [semester, setSemester] = useState<string>("1st");
  const [instructors, setInstructors] = useState<Array<any>>([
    { courseCode: "", name: "", ratings: Array(QUESTIONS.length).fill(0), commentsInstructor: "", commentsCourse: "" },
  ]);
  const [missingQuestions, setMissingQuestions] = useState<Record<number, number[]>>({});
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [selectedGroupKey, setSelectedGroupKey] = useState<string | null>(null);
  const [editingFeedbackId, setEditingFeedbackId] = useState<string | null>(null);
  const [editingInstructorIndex, setEditingInstructorIndex] = useState<number | null>(null);

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    if (user) fetchFeedbacks(user.id);
  };

  const fetchFeedbacks = async (userId?: string) => {
    if (!userId && !profile) return;
    const id = userId || profile?.id;
    try {
      const { data, error } = await api
        .from("feedbacks")
        .select("*")
        .eq("user_id", id)
        .order("created_at", { ascending: false });

      if (error) {
        console.warn("Fetch feedbacks error:", error);
        return;
      }

      setFeedbacks(data || []);
    } catch (err: any) {
      console.error(err);
    }
  };

  const addInstructor = () => {
    if (instructors.length >= 7) return;
    setInstructors((p) => [...p, { courseCode: "", name: "", ratings: Array(QUESTIONS.length).fill(0), commentsInstructor: "", commentsCourse: "" }]);
    // go to the new last page
    setTimeout(() => setCurrentPage(instructors.length), 0);
  };

  const removeInstructor = (index: number) => {
    setInstructors((p) => p.filter((_, i) => i !== index));
    setCurrentPage((cur) => Math.max(0, Math.min(cur, instructors.length - 2)));
  };

  const updateInstructorField = (index: number, field: string, value: any) => {
    setInstructors((p) => {
      const next = [...p];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const updateRating = (instructorIndex: number, questionIndex: number, value: number) => {
    setInstructors((p) => {
      const next = [...p];
      const ratings = [...next[instructorIndex].ratings];
      ratings[questionIndex] = value;
      next[instructorIndex] = { ...next[instructorIndex], ratings };
      return next;
    });
    // clear missing flag for this question if set
    setMissingQuestions((prev) => {
      const copy = { ...prev };
      const arr = (copy[instructorIndex] || []).filter((i) => i !== questionIndex);
      if (arr.length) copy[instructorIndex] = arr;
      else delete copy[instructorIndex];
      return copy;
    });
  };

  const submitFeedback = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!profile) {
      toast.error("No profile available");
      return;
    }

    // basic validation: ensure at least one instructor with name and course code
    const validInstructors = instructors.filter((ins) => ins.name?.trim() && ins.courseCode?.trim());
    if (validInstructors.length === 0) {
      toast.error("Please add at least one instructor with Course Code and name.");
      return;
    }

    // validate that all questions have been answered for each instructor
    const missing: Record<number, number[]> = {};
    instructors.forEach((ins, idx) => {
      const miss: number[] = [];
      for (let qi = 0; qi < QUESTIONS.length; qi++) {
        if (!ins.ratings || !ins.ratings[qi] || ins.ratings[qi] < 1) miss.push(qi);
      }
      if (miss.length) missing[idx] = miss;
    });

    if (Object.keys(missing).length > 0) {
      setMissingQuestions(missing);
      // focus first missing instructor
      const firstIdx = Number(Object.keys(missing)[0]);
      setCurrentPage(Math.max(0, Math.min(firstIdx, instructors.length - 1)));
      toast.error("Please answer all questions for each instructor before submitting.");
      return;
    }

    try {
      const payload = {
        programme,
        department,
        semester,
        instructors,
      };

      if (editingFeedbackId) {
  const { error } = await api.from("feedbacks").update({ content: JSON.stringify(payload) }).eq("id", editingFeedbackId);
        if (error) {
          console.error("Update error:", error);
          toast.error(error.message || "Failed to update feedback");
          return;
        }
        toast.success("Feedback updated");
        setEditingFeedbackId(null);
        setEditingInstructorIndex(null);
      } else {
  const { error } = await api.from("feedbacks").insert({ user_id: profile.id, content: JSON.stringify(payload), created_at: new Date().toISOString() });
        if (error) {
          console.error("Insert error:", error);
          toast.error(error.message || "Failed to submit feedback");
          return;
        }
        toast.success("Feedback submitted");
      }

      // reset to single blank instructor
      setInstructors([{ courseCode: "", name: "", ratings: Array(QUESTIONS.length).fill(0), commentsInstructor: "", commentsCourse: "" }]);
      setMissingQuestions({});
      fetchFeedbacks(profile.id);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to submit feedback");
    }
  };

  const handleEditInstructor = (feedbackRow: any, instructorIndex: number) => {
    try {
      const parsed = typeof feedbackRow.content === 'string' ? JSON.parse(feedbackRow.content) : feedbackRow.content;
      if (parsed) {
        setProgramme(parsed.programme || 'B.Tech');
        setDepartment(parsed.department || 'CS');
        setSemester(parsed.semester || '1st');
        // Ensure ratings arrays exist
        const prepared = (parsed.instructors || []).map((ins: any) => ({
          courseCode: ins.courseCode || '',
          name: ins.name || '',
          ratings: ins.ratings && ins.ratings.length === QUESTIONS.length ? ins.ratings : Array(QUESTIONS.length).fill(0),
          commentsInstructor: ins.commentsInstructor || '',
          commentsCourse: ins.commentsCourse || '',
        }));
        setInstructors(prepared.length ? prepared : [{ courseCode: '', name: '', ratings: Array(QUESTIONS.length).fill(0), commentsInstructor: '', commentsCourse: '' }]);
        setEditingFeedbackId(feedbackRow.id);
        setEditingInstructorIndex(instructorIndex);
        setCurrentPage(instructorIndex);
        // scroll to form (optional)
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (e) {
      console.error('Failed to parse feedback for edit', e);
    }
  };

  // Flatten stored feedback rows into per-instructor entries for grouping and display
  const getInstructorEntries = () => {
    const entries: Array<any> = [];
    for (const f of feedbacks) {
      try {
        const parsed = typeof f.content === 'string' ? JSON.parse(f.content) : f.content;
        if (!parsed) continue;
        const ins = parsed.instructors || [];
        for (let i = 0; i < ins.length; i++) {
          const item = ins[i];
          const key = `${item.courseCode || 'unknown'}|${(item.name || 'Instructor').trim()}`;
          entries.push({
            groupKey: key,
            courseCode: item.courseCode,
            name: item.name,
            feedbackId: f.id,
            instructorIndex: i,
            created_at: f.created_at,
            ratings: item.ratings,
            commentsInstructor: item.commentsInstructor,
            commentsCourse: item.commentsCourse,
            rawRow: f,
          });
        }
      } catch (e) {
        // ignore parsing errors
      }
    }
    return entries;
  };

  const renderParsedContent = (f: any) => {
    try {
      const parsed = typeof f.content === 'string' ? JSON.parse(f.content) : f.content;
      // New format: parsed.instructors is an array
      if (parsed?.instructors && Array.isArray(parsed.instructors)) {
        return (
          <div className="space-y-3">
            {(parsed.instructors || []).map((ins: any, idx: number) => (
              <div key={idx} className="p-2 border rounded">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">{ins.name || 'Instructor'}</div>
                    <div className="text-xs text-muted-foreground">{ins.courseCode}</div>
                  </div>
                  <div className="flex gap-2">
                    <button className="text-sm text-primary underline" onClick={() => handleEditInstructor(f, idx)}>Edit</button>
                  </div>
                </div>
                <div className="mt-2 space-y-1">
                  {ins.ratings && ins.ratings.map((r: number, i: number) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-72 text-sm">{QUESTIONS[i]}</div>
                      <div className="flex">
                        {Array.from({ length: 5 }).map((_, s) => (
                          <Star key={s} className={`w-4 h-4 ${s < r ? 'text-yellow-400' : 'text-muted-foreground'}`} />
                        ))}
                      </div>
                    </div>
                  ))}
                  {ins.commentsInstructor ? <div className="mt-1 text-sm"><strong>Comment (Instructor):</strong><div>{ins.commentsInstructor}</div></div> : null}
                  {ins.commentsCourse ? <div className="mt-1 text-sm"><strong>Comment (Course):</strong><div>{ins.commentsCourse}</div></div> : null}
                </div>
              </div>
            ))}
          </div>
        );
      }

      // fallback: older single-instructor format
      return <div>{f.content}</div>;
    } catch (e) {
      return <div>{f.content}</div>;
    }
  };

  return (
    <ProtectedRoute allowedRoles={["student"]}>
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <Navigation />
        <div className="container mx-auto px-4 pt-24 pb-12">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              Student Feedback Form
            </h1>
            <p className="text-muted-foreground">Fill the mid-term feedback form (1 = Poor, 5 = Excellent). Stars represent ratings.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <Card className="shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <MessageSquare className="w-8 h-8 text-primary mb-2" />
                <CardTitle>Submit Feedback</CardTitle>
                <CardDescription>Enter course details and rate the instructor/course using stars</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={submitFeedback} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Institute Email ID</label>
                    <div className="mt-1 text-sm text-muted-foreground">{profile?.email || 'Not available'}</div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Programme</label>
                    <div className="flex gap-4 mt-2">
                      {['B.Tech','M.Tech','M.Sc','MCA','Ph. D'].map(p => (
                        <label key={p} className="flex items-center gap-2">
                          <input type="radio" name="programme" checked={programme===p} onChange={() => setProgramme(p)} />
                          <span className="text-sm">{p}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Department</label>
                    <div className="flex gap-4 mt-2">
                      {['CE','CS','EC','EE','ME','CB','MA','PH','HS'].map(d => (
                        <label key={d} className="flex items-center gap-2">
                          <input type="radio" name="department" checked={department===d} onChange={() => setDepartment(d)} />
                          <span className="text-sm">{d}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Semester</label>
                    <div className="flex gap-4 mt-2">
                      {['1st','2nd','3rd','4th','5th','6th','7th','8th'].map(s => (
                        <label key={s} className="flex items-center gap-2">
                          <input type="radio" name="semester" checked={semester===s} onChange={() => setSemester(s)} />
                          <span className="text-sm">{s}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">Instructors</div>
                    <div className="flex gap-2">
                      <Button type="button" onClick={addInstructor} disabled={instructors.length >= 7}>Add Course and Instructor</Button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {instructors.length > 0 && (() => {
                      const idx = Math.max(0, Math.min(currentPage, instructors.length - 1));
                      const ins = instructors[idx];
                      return (
                        <div key={idx} className="p-4 border rounded">
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-medium">Instructor {idx + 1}</div>
                            <div className="flex gap-2">
                              {instructors.length > 1 && (
                                <button type="button" className="text-sm text-destructive" onClick={() => removeInstructor(idx)}>Remove</button>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 gap-2">
                            <div>
                              <label className="text-sm">Course Code</label>
                              <input value={ins.courseCode} onChange={(e) => updateInstructorField(idx, 'courseCode', e.target.value)} className="w-full mt-1 p-2 border rounded" placeholder="Eg: CS471" />
                            </div>
                            <div>
                              <label className="text-sm">Course Instructor</label>
                              <input value={ins.name} onChange={(e) => updateInstructorField(idx, 'name', e.target.value)} className="w-full mt-1 p-2 border rounded" placeholder="Full name" />
                            </div>

                            <div className="space-y-3">
                              {QUESTIONS.map((q, qi) => {
                                  const isMissing = (missingQuestions[idx] || []).includes(qi);
                                  return (
                                    <div key={qi} className={`p-3 rounded ${isMissing ? 'border border-destructive bg-destructive/5' : 'border'}`}>
                                      <div className="flex items-center justify-between mb-2">
                                        <div className="text-sm">{q}</div>
                                        {isMissing ? <div className="text-xs text-red-600 font-semibold">Required</div> : null}
                                      </div>
                                      <StarRating value={ins.ratings[qi] || 0} onChange={(n) => updateRating(idx, qi, n)} />
                                    </div>
                                  );
                                })}
                            </div>

                            <div>
                              <label className="text-sm">Comments on Instructor</label>
                              <Textarea value={ins.commentsInstructor} onChange={(e) => updateInstructorField(idx, 'commentsInstructor', e.target.value)} rows={3} />
                            </div>

                            <div>
                              <label className="text-sm">Comments on Course</label>
                              <Textarea value={ins.commentsCourse} onChange={(e) => updateInstructorField(idx, 'commentsCourse', e.target.value)} rows={3} />
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    <div className="flex flex-col items-center gap-2 mt-4">
                      <div className="w-full flex justify-center">
                        <Button type="button" onClick={addInstructor} disabled={instructors.length >= 7}>Add Another Response</Button>
                      </div>
                      <div className="flex items-center justify-center gap-4">
                        <Button type="button" onClick={() => setCurrentPage((p) => Math.max(0, p - 1))} disabled={currentPage === 0}>Previous</Button>
                        <div className="text-sm">Page {Math.min(currentPage + 1, instructors.length || 1)} of {instructors.length || 1}</div>
                        <Button type="button" onClick={() => setCurrentPage((p) => Math.min(instructors.length - 1, p + 1))} disabled={currentPage >= instructors.length - 1}>Next</Button>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 items-center">
                    <Button type="submit" className="bg-gradient-to-r from-primary to-primary-glow">{editingFeedbackId ? 'Update' : 'Submit'}</Button>
                    <Button type="button" variant="ghost" onClick={() => {
                      setInstructors([{ courseCode: '', name: '', ratings: Array(QUESTIONS.length).fill(0), commentsInstructor: '', commentsCourse: '' }]);
                      setEditingFeedbackId(null); setEditingInstructorIndex(null);
                    }}>Clear</Button>
                  </div>
                </form>
              </CardContent>
              </Card>
            </div>

            <div className="md:col-span-1">
              <Card className="shadow-lg hover:shadow-xl transition-shadow sticky top-24">
              <CardHeader>
                <BookOpen className="w-8 h-8 text-primary mb-2" />
                <CardTitle>Your Feedback</CardTitle>
                <CardDescription>View your previously submitted feedback</CardDescription>
              </CardHeader>
              <CardContent>
                {feedbacks.length === 0 ? (
                  <p className="text-muted-foreground">No feedback submitted yet.</p>
                ) : (
                  <div className="space-y-4">
                    {/* Group feedback entries by courseCode|instructor name */}
                      {(() => {
                      const entries = getInstructorEntries();
                        const groups = new Map<string, Array<{
                          groupKey: string;
                          courseCode?: string;
                          name?: string;
                          feedbackId?: string;
                          instructorIndex?: number;
                          created_at?: string;
                          ratings?: number[];
                          commentsInstructor?: string;
                          commentsCourse?: string;
                          rawRow?: any;
                        }>>();
                      for (const e of entries) {
                        const arr = groups.get(e.groupKey) || [];
                        arr.push(e);
                        groups.set(e.groupKey, arr);
                      }

                      if (!selectedGroupKey) {
                        // show list of groups
                        return (
                          <div className="space-y-3">
                            {[...groups.entries()].map(([key, items]) => {
                              const [courseCode, name] = key.split('|');
                              return (
                                <div key={key} className="flex items-center justify-between p-3 border rounded">
                                  <div>
                                    <div className="font-medium">{name}</div>
                                    <div className="text-xs text-muted-foreground">{courseCode}</div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="text-sm text-muted-foreground">{items.length} submission{items.length>1?'s':''}</div>
                                    <Button size="sm" onClick={() => setSelectedGroupKey(key)}>View</Button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      }

                      // show details for selected group
                      const groupItems = groups.get(selectedGroupKey) || [];
                      return (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="font-medium">Responses for {selectedGroupKey?.split('|')[1]} ({selectedGroupKey?.split('|')[0]})</div>
                            <div className="flex gap-2">
                              <Button variant="ghost" onClick={() => setSelectedGroupKey(null)}>Back</Button>
                            </div>
                          </div>

                          <div className="space-y-3">
                            {groupItems.sort((a,b)=> new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map((it, idx:number) => (
                              <div key={`${it.feedbackId}-${it.instructorIndex}-${idx}`} className="p-3 border rounded">
                                <div className="flex items-center justify-between">
                                  <div className="text-sm text-muted-foreground">{new Date(it.created_at).toLocaleString()}</div>
                                  <div>
                                    <Button size="sm" onClick={() => handleEditInstructor(it.rawRow, it.instructorIndex)}>Edit</Button>
                                  </div>
                                </div>

                                  <div className="mt-2 space-y-2">
                                  {it.ratings && it.ratings.map((r:number, qi:number) => (
                                    <div key={qi} className="flex items-center gap-3">
                                      <div className="w-64 text-sm">{QUESTIONS[qi]}</div>
                                      <div className="flex">
                                        {Array.from({length:5}).map((_, s) => (
                                          <Star key={s} className={`w-4 h-4 ${s < (r||0) ? 'text-yellow-400' : 'text-muted-foreground'}`} fill={s < (r||0) ? 'currentColor' : 'none'} stroke={s < (r||0) ? 'none' : 'currentColor'} strokeWidth={s < (r||0) ? 0 : 1.2} />
                                        ))}
                                      </div>
                                    </div>
                                  ))}

                                  {it.commentsInstructor ? <div className="mt-1 text-sm"><strong>Comment (Instructor):</strong><div>{it.commentsInstructor}</div></div> : null}
                                  {it.commentsCourse ? <div className="mt-1 text-sm"><strong>Comment (Course):</strong><div>{it.commentsCourse}</div></div> : null}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
