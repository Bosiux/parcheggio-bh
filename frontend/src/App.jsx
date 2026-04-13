import { HeroUIProvider } from "@heroui/react";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import AppRouter from "./router/AppRouter.jsx";

export default function App() {
  return (
    <HeroUIProvider>
      <AuthProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AppRouter />
        </BrowserRouter>
      </AuthProvider>
    </HeroUIProvider>
  );
}