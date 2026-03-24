# Mon Belier

Application web de reservation d'agneaux pour l'Aid Al-Adha.

## Stack

- Frontend: React + Vite + Tailwind CSS + React Router
- Backend: Supabase (Auth, PostgreSQL, RLS)
- Paiement: Stripe Checkout + webhook Express

## 1) Installation

```bash
npm install
```

## 2) Variables d'environnement

Copie `.env.example` vers `.env` et renseigne les valeurs:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_STRIPE_PUBLISHABLE_KEY`
- `VITE_API_URL`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `FRONTEND_URL`

## 3) Base Supabase

1. Ouvre Supabase SQL Editor.
2. Execute le script `supabase/schema.sql`.
3. Cree quelques mosquees dans `mosquees`.
4. Attribue des roles dans `users` (`client`, `admin_mosquee`, `livreur`, `admin_global`).

## 4) Lancement

Terminal 1:
```bash
npm run dev
```

Terminal 2:
```bash
npm run server
```

Frontend: `http://localhost:5173`  
API: `http://localhost:8787`

## 5) Webhook Stripe local

Exemple avec Stripe CLI:

```bash
stripe listen --forward-to http://localhost:8787/stripe-webhook
```

Recupere le secret et place-le dans `STRIPE_WEBHOOK_SECRET`.

## Notes

- Le prix unitaire est fixe a 360 EUR.
- Le dashboard admin global inclut un premier bloc de stats (CA, ventes, echecs).
- La logique de role et l'acces aux donnees sont securises cote base via RLS.
# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
