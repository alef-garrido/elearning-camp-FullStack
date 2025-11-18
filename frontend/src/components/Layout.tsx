
import { Outlet } from "react-router-dom";
import { Navbar } from "./Navbar";
import { memo } from "react";
import { useAuth } from "../hooks/use-auth";

const LayoutComponent = () => {
  const { isAuthenticated } = useAuth();

  return (
    <>
      <Navbar />
      <main className={isAuthenticated ? 'min-h-screen md:pl-64' : 'min-h-screen'}>
        <Outlet />
      </main>
    </>
  );
};

export const Layout = memo(LayoutComponent);
