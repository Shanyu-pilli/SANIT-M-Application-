import { Link } from "react-router-dom";
import { Button } from "./ui/button";

export const DevNav = () => {
  return (
    <>
      {/* Bottom dev nav removed per request; controls are available in the right-side badge */}

      {/* Vertical development badge on the right side to avoid covering content */}
      <div className="fixed right-2 top-1/2 z-50 transform -translate-y-1/2">
        <div className="flex flex-col items-end gap-2">
          <div className="flex flex-col gap-2 mb-1">
            <Button asChild size="sm" variant="outline">
              <Link to="/student">Student Dashboard</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link to="/faculty">Faculty Dashboard</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link to="/admin">Admin Dashboard</Link>
            </Button>
          </div>

          <div
            className="bg-background/80 backdrop-blur-sm px-2 py-1 rounded-l-md border text-xs text-muted-foreground shadow"
            style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
          >
            Development Mode: Authentication Bypassed
          </div>
        </div>
      </div>
    </>
  );
};