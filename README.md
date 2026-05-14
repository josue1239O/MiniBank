# MiniBank

Aplicacion web para gestion de cuentas bancarias escolares en ferias. Los ninos tienen una cuenta virtual, los padres depositan dinero, y los cobradores descuentan montos escaneando un codigo QR.

## Roles

- **Admin** (PIN: 2580) - Gestiona ninos, cobradores y profesores
- **Profesor** - Registra ninos, hace depositos y cobros
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
