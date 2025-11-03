import React from 'react';
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/use-auth";
import { Role } from "@/types/api";

interface ProtectedRouteProps {
  allowedRoles?: Role[];
}

export const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export const withRoleGuard = (Component: React.ComponentType, allowedRoles: Role[]) => {
  return (props: any) => {
    const { user, isLoading } = useAuth();

    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      );
    }

    if (!user || !allowedRoles.includes(user.role)) {
      return <Navigate to="/" />;
    }

    return <Component {...props} />;
  };
};
