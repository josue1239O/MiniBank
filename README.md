# MiniBank

Aplicacion web para gestion de cuentas bancarias de la feria de niños. Los niños tienen una cuenta virtual, los profesores depositan dinero, y los cobradores descuentan montos escaneando un codigo QR.

## Roles

- **Admin** - Gestiona niños, cobradores y profesores
- **Profesor** - Registra niños, hace depositos y cobros
- **Cobrador** - Escanea QR y realiza cobros

## Stack

- React 19 + TypeScript + Vite
- Firebase Firestore
- Firebase Auth
- Firebase Hosting

## Desarrollo

```bash
npm install
npm run dev
```

## Despliegue

```bash
npm run build
firebase deploy
```
