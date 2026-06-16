/**
 * cartStore.ts — Estado global del carrito de compras con Zustand.
 * Persiste automáticamente en localStorage bajo la clave "cart-storage".
 *
 * Funciones disponibles via useCartStore():
 * - items: CartItem[] — lista de productos en el carrito
 * - addItem(producto): agrega un producto o incrementa cantidad si ya existe
 * - removeItem(productoId): elimina un item del carrito
 * - updateCantidad(productoId, cantidad): actualiza la cantidad de un item
 * - clearCart(): vacía el carrito
 * - total(): calcula el subtotal sumando precio_base * cantidad de cada item
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Producto } from "../../../types";

/**
 * CartItem — Item individual dentro del carrito.
 * producto: datos completos del producto (precio, nombre, imagen, etc.)
 * cantidad: unidades seleccionadas
 */
export interface CartItem {
  producto: Producto;
  cantidad: number;
}

// --- Tipo del store del carrito
interface CartStore {
  items: CartItem[];
  addItem: (producto: Producto) => void;
  removeItem: (productoId: number) => void;
  updateCantidad: (productoId: number, cantidad: number) => void;
  clearCart: () => void;
  total: () => number;
}

/**
 * useCartStore — Store Zustand con persistencia en localStorage.
 * Se usa como hook: const { items, addItem, total } = useCartStore()
 *
 * Persist middleware: guarda/restaura automáticamente en localStorage
 * bajo la clave "cart-storage".
 */
export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],  // Estado inicial: carrito vacío

      /**
       * addItem — Agrega un producto al carrito respetando el stock disponible.
       * - Si el producto ya existe, incrementa su cantidad en 1 (sin superar stock).
       * - Si no existe, lo agrega con cantidad 1 (solo si hay stock).
       * - Si stock_cantidad es null se interpreta como stock ilimitado.
       *
       * @param producto - Producto a agregar (objeto completo)
       */
      addItem: (producto) =>
        set((state) => {
          const stock = producto.stock_cantidad;
          const existe = state.items.find(
            (i) => i.producto.id === producto.id
          );
          if (existe) {
            // Ya está en el carrito → incrementa cantidad si hay stock
            const nuevaCant = existe.cantidad + 1;
            if (stock !== null && nuevaCant > stock) {
              return state; // No supera el stock disponible
            }
            return {
              items: state.items.map((i) =>
                i.producto.id === producto.id
                  ? { ...i, cantidad: nuevaCant }
                  : i
              ),
            };
          }
          // No está en el carrito → agrega solo si hay stock
          if (stock !== null && stock < 1) {
            return state; // Sin stock
          }
          return { items: [...state.items, { producto, cantidad: 1 }] };
        }),

      /**
       * removeItem — Elimina un producto del carrito por su ID.
       *
       * @param id - ID del producto a eliminar
       */
      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter((i) => i.producto.id !== id),
        })),

      /**
       * updateCantidad — Actualiza la cantidad de un producto específico.
       * No permite superar el stock disponible (si stock_cantidad no es null).
       * Tampoco permite bajar de 1 (mínimo).
       *
       * @param id - ID del producto
       * @param cantidad - Nueva cantidad (debe ser >= 1)
       */
      updateCantidad: (id, cantidad) =>
        set((state) => ({
          items: state.items.map((i) => {
            if (i.producto.id !== id) return i;
            const stock = i.producto.stock_cantidad;
            const nuevaCant = Math.max(1, cantidad);
            const capped = stock !== null ? Math.min(nuevaCant, stock) : nuevaCant;
            return { ...i, cantidad: capped };
          }),
        })),

      /**
       * clearCart — Vacía el carrito completamente.
       * Se usa después de confirmar un pedido exitosamente.
       */
      clearCart: () => set({ items: [] }),

      /**
       * total — Calcula el subtotal del carrito.
       * Suma precio_base * cantidad de cada item.
       *
       * @returns {number} Subtotal total del carrito
       */
      total: () =>
        get().items.reduce(
          (acc, item) => acc + item.producto.precio_base * item.cantidad,
          0
        ),
    }),
    { name: "cart-storage" }  // Clave en localStorage
  )
);
