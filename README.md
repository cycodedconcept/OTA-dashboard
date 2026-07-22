# OTA Dashboard

## Environment

The frontend reads its production API base URL from `VITE_API_BASE_URL`.

Example:

```bash
VITE_API_BASE_URL=https://zubitechnologies.com/ota_server/api
```

In local development, the app uses the Vite proxy at `/ota-api`, so this variable is mainly required for production-style builds and deployments.

## Vercel

If a Vercel deployment shows `VITE_API_BASE_URL is not configured`, add `VITE_API_BASE_URL` in the Vercel project settings for the environments you use and redeploy.

The app also includes a production fallback to `https://zubitechnologies.com/ota_server/api`, which matches the existing local proxy target.

## Vite Template Notes

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.
