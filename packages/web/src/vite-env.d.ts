/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_GOOGLE_CLIENT_ID?: string;
  readonly VITE_DEV_AUTH_ENABLED?: string;
  readonly VITE_DEV_AUTH_SECRET?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
