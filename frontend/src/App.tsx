import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import Communities from "./pages/Communities";
import CreateCommunity from "./pages/CreateCommunity";
import EditCommunity from "./pages/EditCommunity";
import CommunityDetail from "./pages/CommunityDetail";
import Courses from "./pages/Courses";
import CreateCourse from "./pages/CreateCourse";
import CourseDetail from "./pages/CourseDetail";
import EditCourse from "./pages/EditCourse";
// Lazy-loaded heavy pages to reduce initial bundle
import { Suspense, lazy } from "react";
const CoursePlayer = lazy(() => import("./pages/CoursePlayer"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
import NotFound from "./pages/NotFound";
import { Layout } from "./components/Layout";
import MyEnrollments from "./pages/MyEnrollments";
import MyCommunities from "./pages/MyCommunities";
import AuditLogs from "./pages/Admin/AuditLogs";

const queryClient = new QueryClient();



const App = () => (
  <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <Routes>
              <Route element={<Layout />}>
                <Route path="/" element={<Home />} />
                <Route path="/communities" element={<Communities />} />
                <Route path="/communities/:id/edit" element={<EditCommunity />} />
                <Route path="/communities/:id" element={<CommunityDetail />} />
                <Route path="/courses" element={<Courses />} />
                <Route path="/courses/:id/edit" element={<EditCourse />} />
                <Route path="/courses/:id" element={<CourseDetail />} />
                <Route path="/courses/:courseId/player" element={<CoursePlayer />} />
                <Route path="/dashboard" element={<Dashboard />} />

                {/* Publisher and Admin routes */}
                <Route path="/my-communities" element={<MyCommunities />} />
                <Route path="/my-enrollments" element={<MyEnrollments />} />
                <Route path="/communities/create" element={<CreateCommunity />} />
                <Route path="/admin/audit-logs" element={<AuditLogs />} />
                <Route path="/courses/create" element={<CreateCourse />} />

                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Route>
              <Route path="/auth" element={<Auth />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
  </QueryClientProvider>
);

export default App;
