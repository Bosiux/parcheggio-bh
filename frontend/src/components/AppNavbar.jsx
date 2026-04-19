// src/components/AppNavbar.jsx
import { useState } from "react";
import {
  Navbar, NavbarBrand, NavbarContent, NavbarItem,
  NavbarMenuToggle, NavbarMenu, NavbarMenuItem,
  Chip, Avatar,
  Dropdown, DropdownTrigger, DropdownMenu, DropdownItem,
} from "@heroui/react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function AppNavbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logout();
    navigate("/login");
  };

  const roleColor = user?.role === "admin" ? "secondary" : "warning";
  const roleLabel = user?.role === "admin" ? "Admin" : "Utente";
  const initials  = user?.username ? user.username.slice(0, 2).toUpperCase() : "??";

  const userLinks  = [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/history",   label: "Storico" },
  ];
  const adminLinks = [
    { to: "/admin",              label: "Pannello" },
    { to: "/admin/add-area",     label: "Aggiungi Area" },
    { to: "/admin/manage-areas", label: "Gestisci Aree" },
    { to: "/admin/bookings",     label: "Prenotazioni" },
    { to: "/admin/stats",        label: "Statistiche" },
  ];
  const mobileLinks = user?.role === "admin" ? adminLinks : userLinks;

  return (
    <Navbar
      isMenuOpen={isMenuOpen}
      onMenuOpenChange={setIsMenuOpen}
      maxWidth="xl"
      className="bg-white/80 dark:bg-[#0d1b2a]/85 border-b border-black/5 dark:border-white/5 backdrop-blur-xl"
    >
      <NavbarContent className="sm:hidden" justify="start">
        <NavbarMenuToggle aria-label={isMenuOpen ? "Chiudi menu" : "Apri menu"} />
      </NavbarContent>

      <NavbarBrand>
        <Link to={user?.role === "admin" ? "/admin" : "/"} className="flex items-center gap-2 no-underline">
          <div className="dark:bg-transparent bg-[#4d4812]/50 backdrop-blur-md p-1 rounded-md flex items-center justify-center border border-[#bdb23c]/30 dark:border-none shadow-sm shadow-[#bdb23c]/10 dark:shadow-none">
            <img src="/logoPBH.svg" alt="Logo" style={{ width: 28, height: 28, objectFit: "contain" }} />
          </div>
          <span
            className="font-bold text-lg"
            style={{
              background: "linear-gradient(135deg, #bdb23c, #9b9b00)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            ParcheggiBH
          </span>
        </Link>
      </NavbarBrand>

      {user?.role === "user" && (
        <NavbarContent className="hidden sm:flex gap-4" justify="center">
          {userLinks.map((l) => (
            <NavbarItem key={l.to}>
              <Link to={l.to} className="app-nav-link">{l.label}</Link>
            </NavbarItem>
          ))}
        </NavbarContent>
      )}

      {user?.role === "admin" && (
        <NavbarContent className="hidden sm:flex gap-4" justify="center">
          {adminLinks.map((l) => (
            <NavbarItem key={l.to}>
              <Link to={l.to} className="app-nav-link">{l.label}</Link>
            </NavbarItem>
          ))}
        </NavbarContent>
      )}

      <NavbarContent justify="end" className="gap-3">
        {user && (
          <>
            <NavbarItem className="hidden sm:flex items-center gap-2">
              <span className="text-slate-600 dark:text-slate-400 text-sm">{user.username}</span>
              <Chip size="sm" color={roleColor} variant="flat">{roleLabel}</Chip>
            </NavbarItem>

            <NavbarItem>
              <Dropdown
                placement="bottom-end"
                classNames={{
                  content: "bg-white dark:!bg-[#1a1a2e] border border-black/5 dark:border-white/10 backdrop-blur-xl",
                }}
              >
                <DropdownTrigger>
                  <Avatar
                    name={initials}
                    size="sm"
                    style={{
                      cursor: "pointer",
                      background: "linear-gradient(135deg, #bdb23c, #9b9b00)",
                      color: "white",
                      fontWeight: 700,
                    }}
                  />
                </DropdownTrigger>
                <DropdownMenu
                  aria-label="User menu"
                  style={{ background: "transparent", border: "none", padding: 8, borderRadius: 14 }}
                >
                  <DropdownItem
                    key="profile"
                    textValue={`Accesso come ${user.username}`}
                    isReadOnly
                    style={{
                      background: "var(--surface-05)",
                      border: "1px solid var(--border-default)",
                      borderRadius: 12,
                      marginBottom: 6,
                    }}
                  >
                    <div style={{ color: "var(--text-muted)", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>
                      Accesso come
                    </div>
                    <div style={{ color: "var(--text-primary)", fontWeight: 700 }}>{user.username}</div>
                    <div style={{ color: "var(--text-subtle)", fontSize: "0.78rem", marginTop: 2 }}>{roleLabel}</div>
                  </DropdownItem>
                  <DropdownItem
                    key="logout"
                    textValue="Logout"
                    style={{
                      background: "var(--alert-error-bg)",
                      border: "1px solid var(--alert-error-border)",
                      borderRadius: 12,
                      color: "var(--alert-error-text)",
                      fontWeight: 800,
                    }}
                    onPress={handleLogout}
                    isDisabled={isLoggingOut}
                  >
                    {isLoggingOut ? "Uscendo..." : "Logout"}
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
            </NavbarItem>
          </>
        )}
      </NavbarContent>

      <NavbarMenu
        style={{
          background: "var(--app-bg-mid)",
          borderTop: "1px solid var(--border-soft)",
          paddingTop: 12,
        }}
      >
        {mobileLinks.map((item) => (
          <NavbarMenuItem key={item.to}>
            <Link
              to={item.to}
              onClick={() => setIsMenuOpen(false)}
              style={{
                display: "block",
                padding: "0.65rem 0.25rem",
                color: "var(--text-primary)",
                fontWeight: 700,
                textDecoration: "none",
                borderBottom: "1px solid var(--border-soft)",
              }}
            >
              {item.label}
            </Link>
          </NavbarMenuItem>
        ))}
      </NavbarMenu>
    </Navbar>
  );
}
