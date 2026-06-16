/**
 * ProfilePage.tsx — Perfil del usuario autenticado.
 * Muestra:
 * - Header con avatar (inicial del nombre), nombre, email, badge "Cuenta activa"
 * - Sidebar izquierdo con información del usuario (nombre, email, ID)
 * - Sidebar derecho con gestión embebida de direcciones (listar, crear, eliminar)
 * - Botón de cerrar sesión (authStore.logout)
 *
 * Estados:
 * - LOADING: mientras se verifica la autenticación (authLoading)
 * - NO AUTENTICADO: mensaje + botón "Iniciar Sesión"
 * - AUTENTICADO: perfil completo con direcciones
 *
 * Queries y Mutations de TanStack Query:
 * - GET /direcciones → fetch de direcciones
 * - POST /direcciones → crear nueva dirección
 * - DELETE /direcciones/:id → eliminar dirección
 */

import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../../api/axiosInstance';
import { useAuthStore } from '../../auth/store/authStore';
import type { DireccionRead, DireccionCreate } from '../../../types';

/** Mismas reglas que en el registro */
const PASSWORD_RULES = [
  { label: 'Al menos 8 caracteres', test: (pw: string) => pw.length >= 8 },
  { label: 'Al menos una mayúscula', test: (pw: string) => /[A-Z]/.test(pw) },
  { label: 'Al menos un número', test: (pw: string) => /\d/.test(pw) },
  { label: 'Al menos un símbolo (!@#$%^&*)', test: (pw: string) => /[^a-zA-Z0-9\s]/.test(pw) },
];

/**
 * ProfilePage — Página de perfil del usuario.
 * Si no está autenticado, muestra un prompt para iniciar sesión.
 *
 * @returns {JSX.Element} Perfil del usuario con datos y direcciones
 */
export default function ProfilePage() {
  const { usuario, logout, isLoading: authLoading } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // --- Estado del formulario de cambio de contraseña
  const [showPassForm, setShowPassForm] = useState(false);
  const [passActual, setPassActual] = useState('');
  const [passNueva, setPassNueva] = useState('');
  const [passConfirm, setPassConfirm] = useState('');
  const [passSuccess, setPassSuccess] = useState('');

  const passwordChecks = useMemo(
    () => PASSWORD_RULES.map((r) => ({ ...r, ok: r.test(passNueva) })),
    [passNueva],
  );
  const passwordValid = passwordChecks.every((c) => c.ok);
  const passwordsMatch = passNueva === passConfirm;

  /** Mutation: POST /auth/cambiar-password */
  const cambiarPassMutation = useMutation({
    mutationFn: (data: { password_actual: string; password_nueva: string }) =>
      api.post('/auth/cambiar-password', data).then((r) => r.data),
    onSuccess: () => {
      setShowPassForm(false);
      setPassActual('');
      setPassNueva('');
      setPassConfirm('');
      setPassSuccess('Contraseña actualizada correctamente');
      setTimeout(() => setPassSuccess(''), 4000);
    },
  });

  // --- Estado del formulario de nueva dirección (embebido)
  const [showForm, setShowForm] = useState(false);
  const [alias, setAlias] = useState('');
  const [direccion, setDireccion] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [region, setRegion] = useState('');
  const [codigoPostal, setCodigoPostal] = useState('');
  const [departamento, setDepartamento] = useState(false);
  const [piso, setPiso] = useState('');
  const [puerta, setPuerta] = useState('');

  /**
   * Query: GET /direcciones
   * Obtiene las direcciones del usuario autenticado.
   * Cacheada con queryKey ["direcciones"].
   */
  const { data: direcciones } = useQuery<DireccionRead[]>({
    queryKey: ['direcciones'],
    queryFn: () => api.get('/direcciones').then((r) => r.data),
  });

  /**
   * Mutation: POST /direcciones
   * Crea una nueva dirección.
   * On success: refresca lista, cierra formulario, resetea campos.
   */
  const crearMutation = useMutation({
    mutationFn: (data: DireccionCreate) =>
      api.post('/direcciones', data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['direcciones'] });
      setShowForm(false);
      setAlias('');
      setDireccion('');
      setCiudad('');
      setRegion('');
      setCodigoPostal('');
      setDepartamento(false);
      setPiso('');
      setPuerta('');
    },
  });

  /**
   * Mutation: DELETE /direcciones/:id
   * Elimina una dirección por ID.
   * On success: refresca la lista de direcciones.
   */
  const eliminarMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/direcciones/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['direcciones'] });
    },
  });

  /**
   * handleLogout — Cierra sesión y redirige al home.
   */
  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  /**
   * handleSubmit — Envía el formulario de nueva dirección.
   *
   * @param e - Evento del formulario
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    crearMutation.mutate({
      alias, direccion, ciudad, region,
      codigo_postal: codigoPostal,
      departamento,
      piso: departamento ? (piso || null) : null,
      puerta: departamento ? (puerta || null) : null,
    });
  };

  // --- Estado LOADING: verificando autenticación
  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="font-body text-on-surface-variant">Cargando perfil...</p>
      </div>
    );
  }

  // --- Estado NO AUTENTICADO: usuario no logueado
  if (!usuario) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <span className="material-symbols-outlined text-5xl text-on-surface-variant/40">person_off</span>
        <h2 className="font-headline text-headline-md text-primary">Iniciá sesión para ver tu perfil</h2>
        <button
          onClick={() => navigate('/login')}
          className="bg-primary text-on-primary px-8 py-3 rounded-lg font-label-md text-label-md hover:opacity-90 transition-all"
        >
          Iniciar Sesión
        </button>
      </div>
    );
  }

  // --- Estado AUTENTICADO: renderiza el perfil completo
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      {/* Header del perfil: avatar, nombre, email, botón logout */}
      <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/10 p-8 mb-8">
        <div className="flex items-center gap-6">
          {/* Avatar con inicial */}
          <div className="w-20 h-20 rounded-full bg-primary-container flex items-center justify-center text-white text-3xl font-bold font-headline">
            {usuario.nombre?.charAt(0).toUpperCase() ?? 'U'}
          </div>
          <div className="flex-1">
            <h1 className="font-headline text-headline-md text-primary">{usuario.nombre}</h1>
            <p className="font-body text-body-md text-on-surface-variant mt-1">{usuario.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="material-symbols-outlined text-[16px] text-green-600">check_circle</span>
              <span className="font-body text-label-md text-green-600">Cuenta activa</span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-5 py-3 rounded-lg border border-outline-variant text-on-surface-variant hover:bg-error-container hover:text-error hover:border-error/20 transition-all font-label-md text-label-md"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            Cerrar Sesión
          </button>
        </div>
      </div>

      {/* Grid de 2 columnas: info izquierda + direcciones derecha */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Columna izquierda: Información del usuario */}
        <div className="space-y-4">
          <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/10 p-6">
            <h3 className="font-headline text-headline-sm text-primary mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]">info</span>
              Información
            </h3>
            <div className="space-y-3">
              <div>
                <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Nombre</p>
                <p className="font-body text-body-md text-on-surface mt-0.5">{usuario.nombre}</p>
              </div>
              <div>
                <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Email</p>
                <p className="font-body text-body-md text-on-surface mt-0.5">{usuario.email}</p>
              </div>
              <div>
                <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">ID Usuario</p>
                <p className="font-body text-body-md text-on-surface mt-0.5">#{usuario.id}</p>
              </div>
            </div>
          </div>

          {/* Cambiar contraseña */}
          <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/10 p-6">
            <button
              onClick={() => setShowPassForm(!showPassForm)}
              className="w-full flex items-center justify-between text-left"
            >
              <h3 className="font-headline text-headline-sm text-primary flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px]">lock</span>
                Contraseña
              </h3>
              <span className="material-symbols-outlined text-on-surface-variant/50 text-[20px] transition-transform">
                {showPassForm ? 'expand_less' : 'expand_more'}
              </span>
            </button>

            {showPassForm && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setPassSuccess('');
                  if (!passwordsMatch) return;
                  cambiarPassMutation.mutate({ password_actual: passActual, password_nueva: passNueva });
                }}
                className="mt-4 space-y-3 border-t border-outline-variant/10 pt-4"
              >
                {/* Contraseña actual */}
                <div>
                  <label className="block font-label-md text-label-md text-on-surface-variant mb-1">Contraseña actual</label>
                  <input
                    type="password"
                    value={passActual}
                    onChange={(e) => setPassActual(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full bg-[#F5E6D3] border border-outline-variant rounded-lg px-4 py-2.5 text-on-surface font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary-container placeholder:text-on-surface-variant/50"
                  />
                </div>

                {/* Contraseña nueva */}
                <div>
                  <label className="block font-label-md text-label-md text-on-surface-variant mb-1">Contraseña nueva</label>
                  <input
                    type="password"
                    value={passNueva}
                    onChange={(e) => setPassNueva(e.target.value)}
                    required
                    minLength={8}
                    placeholder="••••••••"
                    className="w-full bg-[#F5E6D3] border border-outline-variant rounded-lg px-4 py-2.5 text-on-surface font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary-container placeholder:text-on-surface-variant/50"
                  />
                  {passNueva.length > 0 && (
                    <ul className="mt-1.5 space-y-0.5">
                      {passwordChecks.map((rule) => (
                        <li key={rule.label} className={`text-[11px] flex items-center gap-1 ${rule.ok ? 'text-green-600' : 'text-gray-400'}`}>
                          <span>{rule.ok ? '✓' : '•'}</span>
                          {rule.label}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Confirmar contraseña */}
                <div>
                  <label className="block font-label-md text-label-md text-on-surface-variant mb-1">Confirmar contraseña</label>
                  <input
                    type="password"
                    value={passConfirm}
                    onChange={(e) => setPassConfirm(e.target.value)}
                    required
                    placeholder="••••••••"
                    className={`w-full bg-[#F5E6D3] border rounded-lg px-4 py-2.5 text-on-surface font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary-container placeholder:text-on-surface-variant/50 ${
                      passConfirm && !passwordsMatch ? 'border-red-400' : 'border-outline-variant'
                    }`}
                  />
                  {passConfirm && !passwordsMatch && (
                    <p className="text-red-500 text-[11px] mt-0.5">Las contraseñas no coinciden</p>
                  )}
                </div>

                {/* Botón submit */}
                <button
                  type="submit"
                  disabled={cambiarPassMutation.isPending || !passwordsMatch || (passNueva.length > 0 && !passwordValid) || !passActual}
                  className="w-full bg-primary text-on-primary py-2.5 rounded-lg font-label-md text-label-md hover:opacity-90 transition-all disabled:opacity-50"
                >
                  {cambiarPassMutation.isPending ? 'Actualizando...' : 'Cambiar contraseña'}
                </button>

                {/* Estado ERROR */}
                {cambiarPassMutation.isError && (
                  <p className="text-red-500 text-xs text-center">
                    {(cambiarPassMutation.error as any)?.response?.data?.detail || 'Error al cambiar la contraseña'}
                  </p>
                )}

                {/* Estado SUCCESS */}
                {passSuccess && (
                  <p className="text-green-600 text-xs text-center font-semibold">{passSuccess}</p>
                )}
              </form>
            )}
          </div>

          {/* Card decorativa de bienvenida */}
          <div className="bg-primary-container text-on-primary-container rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-3">
              <span className="material-symbols-outlined text-[28px]">coffee_maker</span>
              <h3 className="font-headline text-headline-sm">¡Gracias por ser parte de ROST!</h3>
            </div>
            <p className="font-body text-body-md opacity-90">
              Disfrutá de nuestros cafés de especialidad tostados artesanalmente.
            </p>
          </div>
        </div>

        {/* Columna derecha: Gestión de direcciones embebida */}
        <div className="lg:col-span-2">
          <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/10 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-headline text-headline-sm text-primary flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px]">location_on</span>
                Mis Direcciones
              </h3>
              <button
                onClick={() => setShowForm(!showForm)}
                className="flex items-center gap-2 bg-primary text-on-primary px-4 py-2 rounded-lg font-label-md text-label-md hover:opacity-90 transition-all"
              >
                <span className="material-symbols-outlined text-[16px]">{showForm ? 'close' : 'add'}</span>
                {showForm ? 'Cancelar' : 'Nueva Dirección'}
              </button>
            </div>

            {/* Formulario de nueva dirección (toggle) */}
            {showForm && (
              <form onSubmit={handleSubmit} className="bg-surface-container-high rounded-lg p-6 mb-6 space-y-4 border border-outline-variant/10">
                <div>
                  <label className="block font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-1.5">Alias</label>
                  <input
                    type="text"
                    value={alias}
                    onChange={(e) => setAlias(e.target.value)}
                    placeholder="Casa, Trabajo, etc."
                    required
                    className="w-full bg-[#F5E6D3] border border-outline-variant rounded-lg px-4 py-2.5 text-on-surface font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary-container placeholder:text-on-surface-variant/50"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <label className="block font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-1.5">Dirección</label>
                    <input
                      type="text"
                      value={direccion}
                      onChange={(e) => setDireccion(e.target.value)}
                      placeholder="Calle y número"
                      required
                      className="w-full bg-[#F5E6D3] border border-outline-variant rounded-lg px-4 py-2.5 text-on-surface font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary-container placeholder:text-on-surface-variant/50"
                    />
                  </div>
                  <div>
                    <label className="block font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-1.5">Código Postal</label>
                    <input
                      type="text"
                      value={codigoPostal}
                      onChange={(e) => setCodigoPostal(e.target.value)}
                      placeholder="1234"
                      required
                      className="w-full bg-[#F5E6D3] border border-outline-variant rounded-lg px-4 py-2.5 text-on-surface font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary-container placeholder:text-on-surface-variant/50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-1.5">Ciudad</label>
                    <input
                      type="text"
                      value={ciudad}
                      onChange={(e) => setCiudad(e.target.value)}
                      required
                      className="w-full bg-[#F5E6D3] border border-outline-variant rounded-lg px-4 py-2.5 text-on-surface font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary-container placeholder:text-on-surface-variant/50"
                    />
                  </div>
                  <div>
                    <label className="block font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-1.5">Departamento</label>
                    <input
                      type="text"
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      required
                      className="w-full bg-[#F5E6D3] border border-outline-variant rounded-lg px-4 py-2.5 text-on-surface font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary-container placeholder:text-on-surface-variant/50"
                    />
                  </div>
                </div>

                {/* Departamento toggle */}
                <div className="flex items-center gap-3">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={departamento}
                      onChange={(e) => setDepartamento(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-container/40 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                  <span className="font-body text-sm text-on-surface">Es un departamento / ph</span>
                </div>

                {departamento && (
                  <div className="grid grid-cols-2 gap-4 pl-1">
                    <div>
                      <label className="block font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-1.5">Piso</label>
                      <input
                        type="text"
                        value={piso}
                        onChange={(e) => setPiso(e.target.value)}
                        placeholder="Ej: 3"
                        className="w-full bg-[#F5E6D3] border border-outline-variant rounded-lg px-4 py-2.5 text-on-surface font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary-container placeholder:text-on-surface-variant/50"
                      />
                    </div>
                    <div>
                      <label className="block font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-1.5">Puerta / Departamento</label>
                      <input
                        type="text"
                        value={puerta}
                        onChange={(e) => setPuerta(e.target.value)}
                        placeholder="Ej: B"
                        className="w-full bg-[#F5E6D3] border border-outline-variant rounded-lg px-4 py-2.5 text-on-surface font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary-container placeholder:text-on-surface-variant/50"
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={crearMutation.isPending}
                  className="w-full bg-primary-container text-on-primary py-3 rounded-lg font-label-md text-label-md hover:opacity-90 transition-all disabled:opacity-50"
                >
                  {crearMutation.isPending ? 'Guardando...' : 'Guardar Dirección'}
                </button>
              </form>
            )}

            {/* Lista de direcciones */}
            <div className="space-y-3">
              {direcciones && direcciones.length > 0 ? (
                /* Estado CON DATOS */
                direcciones.map((d) => (
                  <div
                    key={d.id}
                    className="flex items-center justify-between bg-surface-container-high rounded-lg p-4 border border-outline-variant/10 hover:shadow-sm transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <span className="material-symbols-outlined text-primary text-[20px]">home</span>
                      </div>
                      <div>
                        <p className="font-body font-semibold text-on-surface">{d.alias}</p>
                        <p className="font-body text-sm text-on-surface-variant">
                          {d.direccion}, {d.ciudad} ({d.codigo_postal})
                        </p>
                        <p className="font-body text-sm text-on-surface-variant">{d.region}</p>
                        {d.departamento && d.piso && (
                          <p className="font-body text-xs text-on-surface-variant/70">Piso {d.piso}{d.puerta ? `, Puerta ${d.puerta}` : ''}</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => eliminarMutation.mutate(d.id)}
                      className="text-on-surface-variant/50 hover:text-error transition-colors p-2 opacity-0 group-hover:opacity-100"
                      title="Eliminar"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                ))
              ) : (
                /* Estado EMPTY */
                <div className="text-center py-12">
                  <span className="material-symbols-outlined text-4xl text-on-surface-variant/30 mb-3">map</span>
                  <p className="font-body text-on-surface-variant">No tenés direcciones guardadas</p>
                  <button
                    onClick={() => setShowForm(true)}
                    className="mt-4 text-primary font-label-md text-label-md hover:underline inline-flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[16px]">add</span>
                    Agregá tu primera dirección
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
