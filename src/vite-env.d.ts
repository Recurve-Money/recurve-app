/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_RPC_URL?: string;
  readonly VITE_WALLETCONNECT_ID?: string;
  readonly VITE_REGISTRY?: string;
  readonly VITE_REVE?: string;
  readonly VITE_DEPLOY_BLOCK?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
