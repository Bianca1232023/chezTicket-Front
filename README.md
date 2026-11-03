# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

## Integração local com a API

O frontend consome categorias e eventos publicados e carrega sessões, locais e tipos de ingresso
na página de detalhes. Para desenvolver localmente:

1. Inicie o backend na porta `8081`.
2. Copie `.env.example` para `.env` (os valores padrão apontam para o backend local).
3. Execute `npm install` e `npm run dev`.

O Vite encaminha as chamadas de `/api` para `VITE_API_PROXY_TARGET`, que por padrão é
`http://localhost:8081`. Para outro endereço local, altere essa variável no `.env`.

Para exibir o mapa do endereço digitado na criação do evento, configure
`VITE_GOOGLE_MAPS_EMBED_API_KEY` em `.env.local` com uma chave da Google Maps Embed API.
Restrinja a chave ao Maps Embed API e às origens do frontend; não a inclua no controle de versão.
Sem a chave, a tela oferece um link para abrir o endereço no Google Maps.

Em produção, defina `VITE_API_BASE_URL` com a URL da API terminada em `/api` e configure o
backend para permitir a origem do frontend via CORS. O proxy do Vite existe apenas para
desenvolvimento. A criação de eventos e o fluxo de compra ainda não estão conectados.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```

You can also install [eslint-plugin-react-x](https://npmx.dev/package/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://npmx.dev/package/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```
