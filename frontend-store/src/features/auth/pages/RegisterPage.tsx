/**
 * RegisterPage.tsx — Página de registro de nuevo usuario.
 * - Formulario con nombre, email y contraseña (mín 6 caracteres)
 * - Mutation POST /auth/register con TanStack Query
 * - On success: redirige a /login para que el usuario se autentique
 * - Link a la página de login si ya tiene cuenta
 *
 * Estados:
 * - Normal: formulario listo para completar
 * - Pending: botón muestra "Registrando..." y se deshabilita
 * - Error: mensaje "El email podría ya estar en uso"
 */

import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import api from "../../../api/axiosInstance";

/** Requisitos de contraseña con validación en tiempo real */
const PASSWORD_RULES = [
  { label: "Al menos 8 caracteres", test: (pw: string) => pw.length >= 8 },
  { label: "Al menos una mayúscula", test: (pw: string) => /[A-Z]/.test(pw) },
  { label: "Al menos un número", test: (pw: string) => /\d/.test(pw) },
  { label: "Al menos un símbolo (!@#$%^&*)", test: (pw: string) => /[^a-zA-Z0-9\s]/.test(pw) },
];

/**
 * RegisterPage — Formulario de registro de nuevo usuario.
 * Pantalla completa centrada sin Navbar/Footer.
 *
 * @returns {JSX.Element} Formulario de registro con manejo de estados
 */
export default function RegisterPage() {
  const [nombre, setNombre] = useState("");        // Nombre del usuario
  const [email, setEmail] = useState("");            // Email
  const [password, setPassword] = useState("");      // Contraseña
  const navigate = useNavigate();

  /** Validación en tiempo real de la contraseña */
  const passwordChecks = useMemo(
    () => PASSWORD_RULES.map((r) => ({ ...r, ok: r.test(password) })),
    [password]
  );
  const passwordValid = passwordChecks.every((c) => c.ok);

  /**
   * Mutation: POST /auth/register
   * Crea un nuevo usuario en el backend.
   * On success: redirige a /login para que inicie sesión.
   */
  const registerMutation = useMutation({
    mutationFn: (data: {
      nombre: string;
      email: string;
      password: string;
    }) => api.post("/auth/register", data).then((r) => r.data),
    onSuccess: () => {
      navigate("/login");
    },
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#ffeddb]">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-sm">
        {/* Logo y título */}
        <div className="text-center mb-8">
          <img src="/logo.png" alt="ROST" className="h-12 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-[#354867]">Crear cuenta</h2>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            registerMutation.mutate({ nombre, email, password });
          }}
          className="space-y-4"
        >
          {/* Campo Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Nombre
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-[#c8a97e]"
            />
          </div>
          {/* Campo Email */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-[#c8a97e]"
            />
          </div>
          {/* Campo Contraseña */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full border border-gray-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-[#c8a97e]"
            />
            {/* Lista de requisitos con check en tiempo real */}
            {password.length > 0 && (
              <ul className="mt-2 space-y-1">
                {passwordChecks.map((rule) => (
                  <li
                    key={rule.label}
                    className={`text-xs flex items-center gap-1.5 ${
                      rule.ok ? "text-green-600" : "text-gray-400"
                    }`}
                  >
                    <span className="text-sm">{rule.ok ? "✓" : "•"}</span>
                    {rule.label}
                  </li>
                ))}
              </ul>
            )}
          </div>
          {/* Botón de registro (deshabilitado mientras se procesa o contraseña inválida) */}
          <button
            type="submit"
            disabled={registerMutation.isPending || (password.length > 0 && !passwordValid)}
            className="w-full bg-primary-container text-on-primary py-2.5 rounded-lg font-medium hover:opacity-90 transition-colors disabled:bg-gray-300"
          >
            {registerMutation.isPending ? "Registrando..." : "Registrarse"}
          </button>
          {/* Estado ERROR: fallo en el registro */}
          {registerMutation.isError && (
            <p className="text-red-500 text-sm text-center">
              {(registerMutation.error as any)?.response?.data?.detail ||
                "Error al registrarse. El email podría ya estar en uso."}
            </p>
          )}
        </form>

        {/* Link a login si ya tiene cuenta */}
        <p className="text-center text-sm text-gray-500 mt-6">
          ¿Ya tenés cuenta?{" "}
          <button
            onClick={() => navigate("/login")}
            className="text-primary font-semibold hover:underline"
          >
            Iniciá sesión
          </button>
        </p>
      </div>
    </div>
  );
}
