import { Navigation } from "@/components/Navigation";
import { Slideshow } from "@/components/Slideshow";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { GraduationCap, Users, BookOpen, Award } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <Navigation />
      
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            Welcome to College Portal
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Your gateway to academic excellence and seamless college management
          </p>
        </div>

        <div className="mb-16">
          <Slideshow />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="p-6 bg-card rounded-xl shadow-lg hover:shadow-xl transition-all">
            <Users className="w-12 h-12 text-primary mb-4" />
            <h3 className="text-xl font-bold mb-2">For Students</h3>
            <p className="text-muted-foreground mb-4">
              Access courses, track attendance, view grades, and manage your academic journey.
            </p>
            <Button 
              onClick={() => navigate("/auth")} 
              className="w-full bg-gradient-to-r from-primary to-primary-glow"
            >
              Student Portal
            </Button>
          </div>

          <div className="p-6 bg-card rounded-xl shadow-lg hover:shadow-xl transition-all">
            <BookOpen className="w-12 h-12 text-primary mb-4" />
            <h3 className="text-xl font-bold mb-2">For Faculty</h3>
            <p className="text-muted-foreground mb-4">
              Manage courses, mark attendance, grade assignments, and connect with students.
            </p>
            <Button 
              onClick={() => navigate("/auth")} 
              className="w-full bg-gradient-to-r from-primary to-primary-glow"
            >
              Faculty Portal
            </Button>
          </div>

          <div className="p-6 bg-card rounded-xl shadow-lg hover:shadow-xl transition-all">
            <Award className="w-12 h-12 text-primary mb-4" />
            <h3 className="text-xl font-bold mb-2">For Admins</h3>
            <p className="text-muted-foreground mb-4">
              Comprehensive system management, user administration, and analytics dashboard.
            </p>
            <Button 
              onClick={() => navigate("/auth")} 
              className="w-full bg-gradient-to-r from-primary to-primary-glow"
            >
              Admin Portal
            </Button>
          </div>
        </div>

        <footer className="text-center py-8 border-t border-border">
          <div className="flex items-center justify-center gap-2 mb-4">
            <GraduationCap className="w-6 h-6 text-primary" />
            <p className="text-lg font-semibold">College Portal</p>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2025 College Portal. All rights reserved.
          </p>
          <p className="text-sm text-muted-foreground">
            Email: contact@collegeportal.edu | Phone: +1 (555) 123-4567
          </p>
        </footer>
      </main>
    </div>
  );
};

export default Index;
