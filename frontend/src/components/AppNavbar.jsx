// src/components/AppNavbar.jsx
import { useState } from "react";
import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  NavbarMenuToggle,
  NavbarMenu,
  NavbarMenuItem,
  Button,
  Chip,
  Avatar,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function AppNavbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isLogoutHovered, setIsLogoutHovered] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logout();
    navigate("/login");
  };

  const roleColor = user?.role === "admin" ? "secondary" : "primary";
  const roleLabel = user?.role === "admin" ? "Admin" : "Utente";

  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : "??";

  const userLinks = [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/history", label: "Storico" },
  ];

  const adminLinks = [
    { to: "/admin", label: "Pannello" },
    { to: "/admin/add-area", label: "Aggiungi Area" },
    { to: "/admin/manage-areas", label: "Gestisci Aree" },
    { to: "/admin/bookings", label: "Prenotazioni" },
    { to: "/admin/stats", label: "Statistiche" },
  ];

  const mobileLinks = user?.role === "admin" ? adminLinks : userLinks;

  return (
    <Navbar
      className="border-b"
      isMenuOpen={isMenuOpen}
      onMenuOpenChange={setIsMenuOpen}
      style={{
        background: "color-mix(in srgb, var(--panel-elevated) 85%, transparent)",
        borderBottomColor: "var(--border-soft)",
        backdropFilter: "blur(20px)",
      }}
      maxWidth="xl"
    >
      <NavbarContent className="sm:hidden" justify="start">
        <NavbarMenuToggle aria-label={isMenuOpen ? "Chiudi menu" : "Apri menu"} />
      </NavbarContent>

      <NavbarBrand>
        <Link to={user?.role === "admin" ? "/admin" : "/"} className="flex items-center gap-2 no-underline">
          <div
            style={{
              width: 36,
              height: 36,
              
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
            }}
          >
            <img src="/logoPBH.svg" alt="Logo" style={{ width: 30, height: 30, display: "block", objectFit: "contain" }} />
          </div>
          <span
            style={{
              fontWeight: 700,
              fontSize: "1.1rem",
              background: "linear-gradient(135deg, #bdb23c, #9b9b00)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            ParcheggiBH
          </span>
        </Link>
      </NavbarBrand>

      {user?.role === "user" && (
        <NavbarContent className="hidden sm:flex gap-4" justify="center">
          <NavbarItem>
            <Link
              to="/dashboard"
              className="app-nav-link"
            >
              Dashboard
            </Link>
          </NavbarItem>
          <NavbarItem>
            <Link
              to="/history"
              className="app-nav-link"
            >
              Storico
            </Link>
          </NavbarItem>
        </NavbarContent>
      )}

      {user?.role === "admin" && (
        <NavbarContent className="hidden sm:flex gap-4" justify="center">
          <NavbarItem>
            <Link
              to="/admin"
              className="app-nav-link"
            >
              Pannello
            </Link>
          </NavbarItem>
          <NavbarItem>
            <Link
              to="/admin/add-area"
              className="app-nav-link"
            >
              Aggiungi Area
            </Link>
          </NavbarItem>
          <NavbarItem>
            <Link
              to="/admin/manage-areas"
              className="app-nav-link"
            >
              Gestisci Aree
            </Link>
          </NavbarItem>
          <NavbarItem>
            <Link
              to="/admin/bookings"
              className="app-nav-link"
            >
              Prenotazioni
            </Link>
          </NavbarItem>
          <NavbarItem>
            <Link
              to="/admin/stats"
              className="app-nav-link"
            >
              Statistiche
            </Link>
          </NavbarItem>
        </NavbarContent>
      )}

      <NavbarContent justify="end" className="gap-3">
        {user && (
          <>
            <NavbarItem className="hidden sm:flex items-center gap-2">
              <span className="text-default-400 text-sm">{user.username}</span>
              <Chip size="sm" color={roleColor} variant="flat">
                {roleLabel}
              </Chip>
            </NavbarItem>
            <NavbarItem>
              <Dropdown
                placement="bottom-end"
                classNames={{
                  content: "!bg-[var(--surface-02)] !border !border-[var(--border-soft)] !shadow-[0_14px_32px_rgba(15,23,42,0.08)] backdrop-blur-xl",
                }}
              >
                <DropdownTrigger>
                  <Avatar
                    name={initials}
                    size="sm"
                    style={{
                      cursor: "pointer",
                      background: "linear-gradient(135deg, #bdb23c, #9b9b00)",
                    }}
                  />
                </DropdownTrigger>
                <DropdownMenu
                  aria-label="User menu"
                  style={{
                    background: "transparent",
                    border: "none",
                    boxShadow: "none",
                    padding: 8,
                    borderRadius: 14,
                  }}
                >
                  <DropdownItem
                    key="profile"
                    textValue={`Accesso come ${user.username} ${roleLabel}`}
                    isReadOnly
                    style={{
                      background: "var(--surface-04)",
                      border: "1px solid var(--border-soft)",
                      borderRadius: 14,
                      marginBottom: 6,
                      paddingTop: 10,
                      paddingBottom: 10,
                    }}
                  >
                    <div style={{ color: "var(--text-muted)", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>
                      Accesso come
                    </div>
                    <div style={{ color: "var(--text-primary)", fontWeight: 700 }}>
                      {user.username}
                    </div>
                    <div style={{ color: "var(--text-subtle)", fontSize: "0.78rem", marginTop: 2 }}>
                      {roleLabel}
                    </div>
                  </DropdownItem>
                  <DropdownItem
                    key="logout"
                    textValue="Logout"
                    style={{
                      background: isLogoutHovered ? "rgba(220,38,38,0.34)" : "rgba(239,68,68,0.20)",
                      border: isLogoutHovered ? "1px solid rgba(220,38,38,0.72)" : "1px solid rgba(239,68,68,0.46)",
                      borderRadius: 14,
                      color: "#b11212",
                      fontWeight: 900,
                      marginTop: 4,
                      transition: "all 0.18s ease",
                    }}
                    onMouseEnter={() => setIsLogoutHovered(true)}
                    onMouseLeave={() => setIsLogoutHovered(false)}
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
        className="sm:hidden"
        style={{
          background: "color-mix(in srgb, var(--panel-bg) 96%, transparent)",
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
