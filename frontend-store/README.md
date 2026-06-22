# ROST Frontend Store (Tienda para Clientes)

LINK DEL VIDEO: https://www.youtube.com/watch?v=MrAY16nCnAo

Este es el frontend de la tienda (e-commerce) del proyecto ROST, construido con **React + TypeScript + Vite** y estilado con **Tailwind CSS**. Permite a los clientes ver productos por categorías, armar un carrito de compras y realizar pagos integrados con Mercado Pago.

## Cómo empezar

Seguí estos pasos para correr la tienda de manera local.

> [!IMPORTANT]  
> Usar siempre **pnpm** como gestor de paquetes para este proyecto.

### 1. Requisitos previos
Asegurate de tener instalado:
- **Node.js** (versión 18 o superior recomendada)
- **pnpm** (instalalo globalmente con `npm install -g pnpm` si todavía no lo tenés)

### 2. Configurar variables de entorno
Crea un archivo `.env` en la raíz de la carpeta `frontend-store` con tu clave pública de Mercado Pago:

```env
VITE_MP_PUBLIC_KEY=tu_public_key_de_mercado_pago
```
*(Podés usar una clave de prueba de una cuenta de desarrollador en Mercado Pago).*

### 3. Instalar dependencias
Desde la carpeta `frontend-store`, ejecutá:
```bash
pnpm install
```

### 4. Ejecutar el servidor de desarrollo
Para levantar el entorno local:
```bash
pnpm dev
```

El servidor levantará en [http://localhost:5173](http://localhost:5173) (o en otro puerto disponible).

---

## Integración con Mercado Pago
La tienda utiliza la SDK oficial de Mercado Pago para procesar los pagos. La clave pública configurada en el `.env` (`VITE_MP_PUBLIC_KEY`) se asocia con el Checkout Pro para desplegar el ladrillo de pago al finalizar el pedido.

---

## Conexión con la API Backend
Este proyecto cuenta con un proxy en `vite.config.ts` que redirige de manera automática las peticiones con prefijo `/api` a `http://localhost:8000` (el puerto por defecto del backend).

*Asegurate de tener el backend corriendo en el puerto 8000 para que las peticiones y los flujos de compra se completen con éxito.*
