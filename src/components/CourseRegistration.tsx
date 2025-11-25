import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { BookOpen, Calendar, Clock, User } from "lucide-react";

interface Course {
  id: string;
  name: string;
  code: string;
  credits: number;
  instructor: string;
  schedule: string;
  prerequisites?: string[];
  capacity: number;
  enrolled: number;
}

const availableCourses: Course[] = [
  // Computer Science Courses
  {
    id: "1",
    name: "Data Structures and Algorithms",
    code: "CS201",
    credits: 4,
    instructor: "Dr. Smith",
    schedule: "Mon, Wed, Fri 10:00-11:00",
    prerequisites: ["CS101"],
    capacity: 50,
    enrolled: 35
  },
  {
    id: "2",
    name: "Database Management Systems",
    code: "CS301",
    credits: 3,
    instructor: "Prof. Johnson",
    schedule: "Tue, Thu 14:00-15:30",
    prerequisites: ["CS201"],
    capacity: 40,
    enrolled: 28
  },
  {
    id: "3",
    name: "Web Development",
    code: "CS350",
    credits: 3,
    instructor: "Dr. Wilson",
    schedule: "Mon, Wed 16:00-17:30",
    prerequisites: ["CS201"],
    capacity: 45,
    enrolled: 40
  },
  {
    id: "4",
    name: "Machine Learning",
    code: "CS401",
    credits: 4,
    instructor: "Dr. Brown",
    schedule: "Tue, Thu, Fri 11:00-12:00",
    prerequisites: ["CS301", "MATH201"],
    capacity: 30,
    enrolled: 25
  },
  {
    id: "5",
    name: "Software Engineering",
    code: "CS302",
    credits: 3,
    instructor: "Prof. Davis",
    schedule: "Wed, Fri 13:00-14:30",
    prerequisites: ["CS201"],
    capacity: 35,
    enrolled: 20
  },
  {
    id: "6",
    name: "Computer Networks",
    code: "CS305",
    credits: 3,
    instructor: "Dr. Garcia",
    schedule: "Mon, Wed 14:00-15:30",
    prerequisites: ["CS201"],
    capacity: 40,
    enrolled: 32
  },
  {
    id: "7",
    name: "Operating Systems",
    code: "CS303",
    credits: 4,
    instructor: "Prof. Martinez",
    schedule: "Tue, Thu 09:00-11:00",
    prerequisites: ["CS201", "CS202"],
    capacity: 45,
    enrolled: 38
  },
  {
    id: "8",
    name: "Mobile App Development",
    code: "CS360",
    credits: 3,
    instructor: "Dr. Lee",
    schedule: "Mon, Fri 15:00-16:30",
    prerequisites: ["CS201"],
    capacity: 35,
    enrolled: 30
  },
  {
    id: "9",
    name: "Cybersecurity Fundamentals",
    code: "CS370",
    credits: 3,
    instructor: "Prof. Chen",
    schedule: "Wed, Fri 10:00-11:30",
    prerequisites: ["CS201", "CS305"],
    capacity: 30,
    enrolled: 25
  },
  {
    id: "10",
    name: "Artificial Intelligence",
    code: "CS402",
    credits: 4,
    instructor: "Dr. Patel",
    schedule: "Tue, Thu 13:00-15:00",
    prerequisites: ["CS301", "MATH201"],
    capacity: 25,
    enrolled: 22
  },
  
  // Mathematics Courses
  {
    id: "11",
    name: "Calculus I",
    code: "MATH101",
    credits: 4,
    instructor: "Prof. Thompson",
    schedule: "Mon, Wed, Fri 08:00-09:00",
    capacity: 60,
    enrolled: 45
  },
  {
    id: "12",
    name: "Calculus II",
    code: "MATH102",
    credits: 4,
    instructor: "Dr. Anderson",
    schedule: "Mon, Wed, Fri 09:00-10:00",
    prerequisites: ["MATH101"],
    capacity: 55,
    enrolled: 40
  },
  {
    id: "13",
    name: "Linear Algebra",
    code: "MATH201",
    credits: 3,
    instructor: "Prof. White",
    schedule: "Tue, Thu 10:00-11:30",
    prerequisites: ["MATH101"],
    capacity: 50,
    enrolled: 35
  },
  {
    id: "14",
    name: "Discrete Mathematics",
    code: "MATH205",
    credits: 3,
    instructor: "Dr. Kumar",
    schedule: "Mon, Wed 11:00-12:30",
    prerequisites: ["MATH101"],
    capacity: 45,
    enrolled: 30
  },
  {
    id: "15",
    name: "Statistics",
    code: "MATH301",
    credits: 3,
    instructor: "Prof. Taylor",
    schedule: "Tue, Thu 15:00-16:30",
    prerequisites: ["MATH102"],
    capacity: 40,
    enrolled: 28
  },

  // Physics Courses
  {
    id: "16",
    name: "Physics I",
    code: "PHYS101",
    credits: 4,
    instructor: "Dr. Robinson",
    schedule: "Mon, Wed, Fri 13:00-14:00",
    capacity: 50,
    enrolled: 42
  },
  {
    id: "17",
    name: "Physics II",
    code: "PHYS102",
    credits: 4,
    instructor: "Prof. Clark",
    schedule: "Mon, Wed, Fri 14:00-15:00",
    prerequisites: ["PHYS101", "MATH102"],
    capacity: 45,
    enrolled: 35
  },

  // Business & Management
  {
    id: "18",
    name: "Business Communication",
    code: "BUS101",
    credits: 3,
    instructor: "Prof. Adams",
    schedule: "Tue, Thu 11:00-12:30",
    capacity: 60,
    enrolled: 50
  },
  {
    id: "19",
    name: "Project Management",
    code: "BUS301",
    credits: 3,
    instructor: "Dr. Miller",
    schedule: "Wed, Fri 09:00-10:30",
    capacity: 40,
    enrolled: 32
  },
  {
    id: "20",
    name: "Entrepreneurship",
    code: "BUS350",
    credits: 3,
    instructor: "Prof. Young",
    schedule: "Mon, Wed 17:00-18:30",
    capacity: 35,
    enrolled: 28
  },

  // Language & Literature
  {
    id: "21",
    name: "Technical Writing",
    code: "ENG201",
    credits: 3,
    instructor: "Dr. Green",
    schedule: "Tue, Thu 16:00-17:30",
    capacity: 50,
    enrolled: 38
  },
  {
    id: "22",
    name: "Public Speaking",
    code: "ENG301",
    credits: 2,
    instructor: "Prof. Hall",
    schedule: "Fri 14:00-17:00",
    capacity: 25,
    enrolled: 20
  },

  // Electives
  {
    id: "23",
    name: "Digital Design",
    code: "ART201",
    credits: 3,
    instructor: "Dr. Parker",
    schedule: "Mon, Wed 12:00-13:30",
    capacity: 30,
    enrolled: 25
  },
  {
    id: "24",
    name: "Ethics in Technology",
    code: "PHIL301",
    credits: 3,
    instructor: "Prof. Lewis",
    schedule: "Tue, Thu 17:00-18:30",
    capacity: 40,
    enrolled: 30
  },
  {
    id: "25",
    name: "Research Methodology",
    code: "RES401",
    credits: 2,
    instructor: "Dr. Walker",
    schedule: "Wed 15:00-17:00",
    prerequisites: ["Junior Standing"],
    capacity: 20,
    enrolled: 15
  }
];

export const CourseRegistration = () => {
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [semester, setSemester] = useState("");
  const [year, setYear] = useState("");
  const [studentId, setStudentId] = useState("");
  const [studentName, setStudentName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCourseToggle = (courseId: string) => {
    setSelectedCourses(prev => 
      prev.includes(courseId) 
        ? prev.filter(id => id !== courseId)
        : [...prev, courseId]
    );
  };

  const getTotalCredits = () => {
    return selectedCourses.reduce((total, courseId) => {
      const course = availableCourses.find(c => c.id === courseId);
      return total + (course?.credits || 0);
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!studentId || !studentName || !semester || !year) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (selectedCourses.length === 0) {
      toast.error("Please select at least one course");
      return;
    }

    if (getTotalCredits() > 18) {
      toast.error("Maximum credit limit is 18. Current selection: " + getTotalCredits());
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const registrationData = {
        studentId,
        studentName,
        semester,
        year,
        courses: selectedCourses.map(courseId => {
          const course = availableCourses.find(c => c.id === courseId);
          return {
            id: courseId,
            code: course?.code,
            name: course?.name,
            credits: course?.credits
          };
        }),
        totalCredits: getTotalCredits(),
        registrationDate: new Date().toISOString()
      };

      console.log("Course Registration Data:", registrationData);
      
      toast.success("Course registration submitted successfully!");
      
      // Reset form
      setSelectedCourses([]);
      setSemester("");
      setYear("");
      setStudentId("");
      setStudentName("");
      
    } catch (error) {
      toast.error("Failed to submit course registration. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-6 h-6" />
            Course Registration
          </CardTitle>
          <CardDescription>
            Register for courses for the upcoming semester. Maximum credit limit: 18 credits.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Student Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="studentId">Student ID *</Label>
                <Input
                  id="studentId"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="Enter your student ID"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="studentName">Full Name *</Label>
                <Input
                  id="studentName"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="Enter your full name"
                  required
                />
              </div>
            </div>

            {/* Semester Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="semester">Semester *</Label>
                <Select value={semester} onValueChange={setSemester}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select semester" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fall">Fall</SelectItem>
                    <SelectItem value="spring">Spring</SelectItem>
                    <SelectItem value="summer">Summer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="year">Academic Year *</Label>
                <Select value={year} onValueChange={setYear}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2024">2024</SelectItem>
                    <SelectItem value="2025">2025</SelectItem>
                    <SelectItem value="2026">2026</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Course Selection */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-lg font-semibold">Available Courses</Label>
                <div className="text-sm text-muted-foreground">
                  Selected Credits: {getTotalCredits()}/18
                </div>
              </div>
              
              <div className="grid gap-4">
                {availableCourses.map((course) => (
                  <Card key={course.id} className={`transition-all ${
                    selectedCourses.includes(course.id) ? 'ring-2 ring-primary' : ''
                  }`}>
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          id={`course-${course.id}`}
                          checked={selectedCourses.includes(course.id)}
                          onCheckedChange={() => handleCourseToggle(course.id)}
                          disabled={course.enrolled >= course.capacity && !selectedCourses.includes(course.id)}
                        />
                        <div className="flex-1 space-y-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-semibold">{course.name}</h4>
                              <p className="text-sm text-muted-foreground">{course.code}</p>
                            </div>
                            <div className="text-right">
                              <span className="text-sm font-medium">{course.credits} Credits</span>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <User className="w-4 h-4" />
                              {course.instructor}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {course.schedule}
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {course.enrolled}/{course.capacity} enrolled
                            </div>
                          </div>

                          {course.prerequisites && course.prerequisites.length > 0 && (
                            <div className="text-xs text-orange-600">
                              Prerequisites: {course.prerequisites.join(", ")}
                            </div>
                          )}

                          {course.enrolled >= course.capacity && (
                            <div className="text-xs text-red-600 font-medium">
                              Course Full - No seats available
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Selected Courses Summary */}
            {selectedCourses.length > 0 && (
              <Card className="bg-primary/5">
                <CardHeader>
                  <CardTitle className="text-lg">Registration Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {selectedCourses.map(courseId => {
                      const course = availableCourses.find(c => c.id === courseId);
                      return course ? (
                        <div key={courseId} className="flex justify-between items-center">
                          <span>{course.code} - {course.name}</span>
                          <span>{course.credits} credits</span>
                        </div>
                      ) : null;
                    })}
                    <hr />
                    <div className="flex justify-between items-center font-semibold">
                      <span>Total Credits:</span>
                      <span>{getTotalCredits()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isSubmitting || selectedCourses.length === 0}
            >
              {isSubmitting ? "Submitting Registration..." : "Submit Course Registration"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};