// src/pages/LoginPage.jsx
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button, Input, Card, CardBody } from "@heroui/react";
import { login as apiLogin, register as apiRegister } from "../api/auth.api.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function LoginPage() {
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || null;

  const isAllowedPathForRole = (path, role) => {
    if (!path) return false;
    if (role === "admin") return path.startsWith("/admin");
    return path === "/" || path === "/dashboard" || path.startsWith("/booking/") || path === "/history";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!username.trim() || !password.trim()) { setError("Inserisci username e password."); return; }
    if (mode === "register") {
      if (password.trim().length < 8) { setError("La password deve contenere almeno 8 caratteri."); return; }
      if (password !== confirmPassword) { setError("Le password non coincidono."); return; }
    }
    setLoading(true);
    try {
      const userData = mode === "register"
        ? await apiRegister({ username: username.trim(), password: password.trim() })
        : await apiLogin(username.trim(), password);
      login(userData);
      if (isAllowedPathForRole(from, userData.role)) navigate(from, { replace: true });
      else if (userData.role === "admin") navigate("/admin", { replace: true });
      else navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.message || "Credenziali non valide.");
    } finally {
      setLoading(false);
    }
  };

  const inputCls = {
    inputWrapper: "border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 hover:!border-yellow-500/50 focus-within:!border-yellow-500",
    input: "!text-slate-900 dark:!text-slate-100 !font-medium placeholder:!text-slate-500",
    label: "!text-slate-600 dark:!text-slate-400",
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 gradient-bg">
      {/* Ambient glows */}
      <div
        className="fixed top-[10%] left-[15%] w-96 h-96 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(189,178,60,0.12) 0%, transparent 70%)" }}
      />
      <div
        className="fixed bottom-[10%] right-[15%] w-72 h-72 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(155,155,0,0.10) 0%, transparent 70%)" }}
      />

      <div className="w-full max-w-[440px] relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <img src="/logoPBH.svg" alt="Logo" className="w-16 h-16 mx-auto mb-3 object-contain dark:bg-transparent bg-[#4d4812]/50 backdrop-blur-md p-2 rounded-2xl border border-[#bdb23c]/30 dark:border-none shadow-lg shadow-[#bdb23c]/20 dark:shadow-none" />
          <h1
            className="text-4xl font-extrabold m-0"
            style={{
              background: "linear-gradient(135deg, #bcb13d, #898025, #807613)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            ParcheggiBH
          </h1>
          <p className="text-slate-600 dark:text-slate-500 mt-2 text-sm">Comune di Brescia — Servizio di Parcheggi</p>
        </div>

        {/* Card */}
        <Card
          shadow="none"
          classNames={{
            base: "!bg-white/80 dark:!bg-white/[0.04] border border-black/10 dark:border-white/[0.08] backdrop-blur-2xl rounded-2xl",
          }}
        >
          <CardBody className="p-8">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 text-center mb-6">
              {mode === "login" ? "Accedi al portale" : "Crea account utente"}
            </h2>

            {error && (
              <div className="alert-error mb-5">
                <img src="/attention.svg" alt="Errore" style={{ width: 26, height: 26, objectFit: "contain" }} />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Input
                id="login-username"
                label="Username"
                placeholder="Inserisci il tuo username"
                value={username}
                onValueChange={setUsername}
                variant="bordered"
                size="lg"
                classNames={inputCls}
                isDisabled={loading}
                autoComplete="username"
              />

              <Input
                id="login-password"
                label="Password"
                placeholder="Inserisci la tua password"
                value={password}
                onValueChange={setPassword}
                type={showPassword ? "text" : "password"}
                variant="bordered"
                size="lg"
                classNames={inputCls}
                endContent={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="bg-transparent border-none cursor-pointer p-0 flex items-center"
                  >
                    <img
                      src={showPassword ? "/hide.svg" : "/show.svg"}
                      alt={showPassword ? "Nascondi" : "Mostra"}
                      style={{ width: 20, height: 20, objectFit: "contain", opacity: 0.5 }}
                    />
                  </button>
                }
                isDisabled={loading}
                autoComplete="current-password"
              />

              {mode === "register" && (
                <Input
                  id="register-password-confirm"
                  label="Conferma password"
                  placeholder="Ripeti la password"
                  value={confirmPassword}
                  onValueChange={setConfirmPassword}
                  type={showPassword ? "text" : "password"}
                  variant="bordered"
                  size="lg"
                  classNames={inputCls}
                  isDisabled={loading}
                  autoComplete="new-password"
                />
              )}

              <Button
                id="login-submit"
                type="submit"
                isLoading={loading}
                size="lg"
                fullWidth
                className="mt-1 font-semibold text-white"
                style={{
                  background: "linear-gradient(135deg, #bdb23c, #9b9b00)",
                  boxShadow: "0 10px 30px rgba(189,178,60,0.30)",
                }}
              >
                {loading
                  ? (mode === "login" ? "Accesso in corso..." : "Registrazione in corso...")
                  : (mode === "login" ? "Accedi" : "Registrati")}
              </Button>

              <Button
                type="button"
                variant="light"
                isDisabled={loading}
                onPress={() => {
                  setMode((p) => p === "login" ? "register" : "login");
                  setError(""); setPassword(""); setConfirmPassword("");
                }}
                className="text-slate-600 dark:text-slate-400 font-semibold"
              >
                {mode === "login" ? "Non hai un account? Registrati" : "Hai già un account? Accedi"}
              </Button>
            </form>
          </CardBody>
        </Card>

        <p className="text-center text-slate-500 dark:text-slate-600 text-xs mt-6">
          © 2026 Comune di Brescia — ParcheggiBH
        </p>
      </div>
    </div>
  );
}
