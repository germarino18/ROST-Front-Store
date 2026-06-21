/**
 * api/direcciones.ts — Endpoints de direcciones.
 */

import api from "./axiosInstance";
import type { DireccionRead, DireccionCreate, DireccionUpdate } from "../types";

/**
 * getDirecciones — Obtiene todas las direcciones del usuario autenticado.
 */
export const getDirecciones = () =>
  api.get<DireccionRead[]>("/direcciones").then((r) => r.data);

/**
 * createDireccion — Crea una nueva dirección.
 *
 * @param data - Datos de la dirección a crear
 */
export const createDireccion = (data: DireccionCreate) =>
  api.post("/direcciones", data).then((r) => r.data);

/**
 * updateDireccion — Actualiza una dirección existente.
 *
 * @param id - ID de la dirección a actualizar
 * @param data - Campos a actualizar (todos opcionales)
 */
export const updateDireccion = (id: number, data: DireccionUpdate) =>
  api.put<DireccionRead>(`/direcciones/${id}`, data).then((r) => r.data);

/**
 * deleteDireccion — Elimina una dirección por ID.
 *
 * @param id - ID de la dirección a eliminar
 */
export const deleteDireccion = (id: number) =>
  api.delete(`/direcciones/${id}`);
