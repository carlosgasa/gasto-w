# CLAUDE.md

Contexto para Claude Code al trabajar en este repositorio.

## Qué es este proyecto

App personal de **control de gastos** (no de saldo/balance) para un único usuario (administrador único). El dueño tiene 5 tarjetas + efectivo y quiere registrar cada gasto contra una cuenta de pago y una categoría, para luego ver reportes de **cuánto gastó** (total, por tarjeta/efectivo, por categoría), comparativas contra meses anteriores, tendencias y proyecciones.

El plan funcional completo y el modelo de datos detallado viven en `/home/carlos/.claude/plans/hola-necesito-hacer-una-wondrous-stearns.md` — consultarlo antes de implementar features nuevas. Este archivo es un resumen operativo, no reemplaza el plan.

## Stack (confirmado)

- Frontend: **React + Vite + TypeScript**, PWA (vite-plugin-pwa pendiente de configurar).
- Backend: Firebase (Auth + Firestore), Firebase Hosting para el despliegue final.
- Auth: **email/password**, un único usuario administrador dado de alta manualmente desde la consola de Firebase (sin registro público). UID del dueño en `VITE_OWNER_UID` (`.env`, no versionado).
- Gráficas: Recharts. Fechas: date-fns. PDF: jsPDF.
- Offline: persistencia offline nativa de Firestore (`persistentLocalCache`).

## Repositorio y Firebase

- Repo: https://github.com/carlosgasa/gasto-w (remote `origin` ya configurado localmente).
- Proyecto de Firebase: `gasto-w`. Config del cliente (pública, no es secreta — protegida por reglas de Firestore) en `firebase/firebase.config.json`.
- Cualquier credencial real de servidor (service account, claves admin) NO debe commitearse — ya está cubierta por `.gitignore` (`firebase-service-account*.json`, `.env*`).

## Arquitectura: Clean Architecture

El código se organiza en capas, independientes del framework de UI y de Firebase:

- **domain/** — entidades (`Expense`, `Account`, `Category`, `RecurringTemplate`, `MonthlySummary`), value objects, e interfaces de repositorios. Sin dependencias externas.
- **application/** (use cases) — `RegisterExpense`, `GenerateRecurringExpenses`, `ComputeMonthlySummary`, `ComputeInsights`, `ExportBackupJson`, `ImportBackupJson`, `BuildMonthlyStatementPdf`, etc. Orquestan el domain, no conocen Firebase ni la UI.
- **infrastructure/** — implementaciones concretas contra Firestore/Firebase Auth, generador de PDF, import/export JSON. Implementan las interfaces del domain.
- **presentation/** — componentes de UI, estado de pantalla, navegación. Consumen use cases, nunca hablan directo con Firestore.

No saltarse capas: la UI no debe importar Firestore directamente, y el domain no debe importar nada de infraestructura.

## Modelo de datos (Firestore, resumen)

```
users/{uid}
  accounts/{accountId}        tarjetas y efectivo — solo agrupan gasto, no llevan saldo
  categories/{categoryId}     editable por el usuario; puede tener fieldsTemplate (ej. 'fuel')
  expenses/{expenseId}        gasto puntual o generado de un recurrente; campo extra según fieldsTemplate
  recurringTemplates/{id}     plantillas de gasto fijo mensual
  monthlySummaries/{yyyy-mm}  agregados denormalizados por mes, recalculados al escribir un gasto
```

Detalle completo de campos en el plan referenciado arriba.

## Convenciones importantes

- **Iconografía**: solo SVG propios (categorías, cuentas, menús) — nunca emojis.
- **Temas**: más de dos paletas seleccionables (no solo claro/oscuro), vía tokens de tema/CSS variables. El tema principal ("Violeta", confirmado por el usuario) usa esta paleta:
  - `--color-primary-strong: #A62FEB` (magenta-púrpura vívido, tope del degradado)
  - `--color-primary: #9B24DE` (púrpura medio, cuerpo del degradado)
  - `--color-primary-soft: #C97DF2` (orquídea claro, base del degradado / superficies elevadas)
  - `--color-primary-deep: #5B1594` (púrpura profundo, fondos oscuros / hover / contraste del logo)
  - `--color-accent-surface: #9B4FBE` (mauve, franjas de acciones tipo footer/toolbar)
  - `--color-on-primary: #F7F0FF` (texto/íconos sobre fondos púrpura)
  - Degradado principal recomendado: `linear-gradient(180deg, var(--color-primary-strong) 0%, var(--color-primary-soft) 100%)`.
  - El logo (`assets/brand/logo.svg`) ya usa esta familia de púrpuras en su fondo — mantener consistencia entre logo, splash screen y tema principal.
  - Otros 2+ temas (ej. oscuro neutro, claro neutro) se definen después con la misma estructura de tokens.
- **Zoom**: setting de escala de toda la app en Configuración, persistente.
- **Gráficas**: la analítica visual es prioridad — ver catálogo de gráficas en el plan (pastel, barras apiladas, línea con proyección, heatmap de calendario, rankings, reporte de combustible).

## Flujo de trabajo con git

- Los **commits los hace Claude** durante el desarrollo, con el correo de autor `carlos.oficial.uaz@gmail.com`.
- **Nunca hacer `git push`** — eso lo hace el usuario manualmente.
- Mantener la app corriendo en **localhost** durante el desarrollo para que el usuario la revise en el navegador.
- El despliegue a Firebase Hosting se hace hasta que el usuario comparta su configuración de Firebase.

## Backlog y avance

Porcentaje de avance por fase (ver detalle de cada fase en el plan). Actualizar esta tabla conforme se completen tareas.

| # | Fase | Avance | Notas |
|---|------|--------|-------|
| 1 | Base del proyecto (scaffold, Firebase, capas, íconos SVG, tokens de tema) | 100% | React+Vite+TS, Firebase Auth/Firestore conectados, layout con nav, 3 temas, set de íconos SVG |
| 2 | MVP (auth, cuentas, categorías, gastos puntuales, dashboard básico) | 55% | Login + cuentas + categorías (CRUD real contra Firestore) listos; falta alta de gastos puntuales y dashboard con totales reales |
| 3 | Recurrentes | 0% | No iniciado |
| 4 | Comparativas e histórico (`monthlySummaries`) | 0% | No iniciado |
| 5 | Insights/predicción | 0% | No iniciado |
| 6 | Campos extendidos y reporte de combustible | 10% | Entidad `Category.fieldsTemplate: 'fuel'` y toggle en alta de categoría ya existen; falta el formulario de gasto y el reporte |
| 7 | Respaldo y PDF (export/import JSON, estado de cuenta en PDF) | 0% | No iniciado |
| 8 | Configuración avanzada y PWA polish (temas, zoom, manifest, service worker) | 35% | Selector de tema y control de zoom funcionando; falta manifest.json/service worker (vite-plugin-pwa ya instalado, sin configurar) |
| 9 | Despliegue a Firebase Hosting | 0% | Pendiente de que el usuario lo pida explícitamente |

**Avance global estimado: ~22%**

## Estado actual

App de React + Vite + TS corriendo en `localhost:5173`, conectada al proyecto Firebase `gasto-w` (Auth + Firestore con persistencia offline). Login con email/password funcional, layout con navegación por íconos SVG, y las páginas de **Cuentas** y **Categorías** con alta/listado real contra Firestore (categorías con seed de default). Configuración con selector de 3 temas y control de zoom, ambos persistentes. Reglas de Firestore (`firebase/firestore.rules`) restringidas al UID del dueño. Pendiente inmediato: alta de gastos puntuales y dashboard con totales reales.
