// src/components/Layout.jsx
import AppNavbar from "./AppNavbar.jsx";

export default function Layout({ children }) {
  return (
    <div className="gradient-bg" style={{ minHeight: "100vh" }}>
      <AppNavbar />
      <main className="page-container">
        {children}
      </main>
    </div>
  );
}