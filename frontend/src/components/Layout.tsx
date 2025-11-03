
import { Outlet } from "react-router-dom";
import { Navbar } from "./Navbar";
import { memo } from "react";

const LayoutComponent = () => {
  return (
    <>
      <Navbar />
      <main>
        <Outlet />
      </main>
    </>
  );
};

export const Layout = memo(LayoutComponent);
