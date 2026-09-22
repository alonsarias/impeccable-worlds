/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GITHUB_REPO_URL?: string;
  readonly VITE_SITE_URL?: string;
  /** Public Blob origin for card fallbacks. No trailing slash. */
  readonly VITE_BLOB_CARDS_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
