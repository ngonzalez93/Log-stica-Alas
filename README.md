# Informes Logística · KPI — Alas

Conjunto de dashboards de logística (KPI) en HTML autónomo. Cada informe
funciona igual que antes: **cargás tu Excel/CSV en el navegador y se calcula todo
del lado del cliente** — no se guardan datos en ningún servidor.

Sobre esa base se agregaron tres cosas, **sin modificar la lógica de los informes**:

- **Git** — control de versiones del código.
- **Vercel** — publica los informes en una URL.
- **Supabase** — solo **login del equipo** (email + contraseña).

## Estructura

```
├── index.html                         # Login + menú de informes
├── assets/
│   ├── config.js                      # ← acá van tus claves de Supabase
│   └── auth-guard.js                  # Puerta de acceso compartida
├── Tablero_Tiempos_Alas.html          # Tiempos de atención (TTA)
├── Tablero_ATC_Fabrica_Alas.html      # Tiempos de atención — Fábrica
├── reporte_tiempos_entrega.html       # Tiempos de entrega
├── Informe_Pedidos_Pendientes.html    # Pedidos pendientes
├── informe_gastos_vs_presupuesto.html # Gastos vs Presupuesto
├── Georreferenciacion_Clientes_Alas.html # Mapa de clientes
├── vercel.json
├── .gitignore
└── README.md
```

Cada informe incluye al inicio 3 `<script>` que forman la "puerta de acceso":
si no hay sesión de Supabase, redirige a `index.html`. Si Supabase todavía
**no está configurado**, los informes se abren igual (para no bloquear el trabajo).

---

## Puesta en marcha (una sola vez)

### 1. Supabase (login)

1. Creá una cuenta en https://supabase.com y un proyecto nuevo.
2. Andá a **Project Settings → API** y copiá:
   - **Project URL**
   - **anon public** key
3. Pegá esos dos valores en [`assets/config.js`](assets/config.js).
   > La `anon key` es pública por diseño, puede ir en el código.
   > **Nunca** pongas ahí la `service_role` key.
4. Dá de alta a cada persona del equipo en **Authentication → Users → Add user**
   (email + contraseña). Recomendado: en **Authentication → Providers → Email**,
   desactivá "Enable sign-ups" para que nadie se registre solo.

### 2. Git

```powershell
git init
git add .
git commit -m "Informes KPI: base + login (Supabase) + deploy (Vercel)"
```

Luego creá un repositorio en GitHub y subilo:

```powershell
git remote add origin https://github.com/TU-USUARIO/informes-logistica-kpi.git
git branch -M main
git push -u origin main
```

### 3. Vercel (publicar)

1. Entrá a https://vercel.com con tu cuenta de GitHub.
2. **Add New → Project** → importá el repositorio.
3. No hace falta configurar build (es un sitio estático). Deploy.
4. Vas a obtener una URL tipo `informes-logistica-kpi.vercel.app`.
   Esa es la que comparte el equipo.

> Importante: en Supabase → **Authentication → URL Configuration**, agregá tu
> dominio de Vercel a los **Redirect URLs** / Site URL.

---

## Uso diario

1. Abrís la URL de Vercel → ingresás con tu email y contraseña.
2. Elegís el informe en el menú.
3. Dentro del informe, cargás tu Excel/CSV como siempre.

## Editar un informe

Editás el `.html` correspondiente, luego:

```powershell
git add .
git commit -m "Ajuste en <informe>"
git push
```

Vercel redepliega solo con cada `push`.

## Nota de seguridad

El login del lado del cliente **restringe el acceso a la interfaz**, adecuado para
uso interno. No protege archivos por sí solo: como los datos nunca salen del
navegador (no hay base de datos con información sensible), esto es suficiente para
este caso. Si en el futuro querés blindarlo más, se puede activar la protección
por contraseña de Vercel o mover los datos a Supabase con RLS.
