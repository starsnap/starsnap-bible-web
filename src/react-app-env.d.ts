/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PUBLIC_LOCAL_API_HOST: string
  readonly VITE_ADMIN_API_BASE_URL: string
  readonly VITE_GOOGLE_CLIENT_ID: string
  readonly VITE_API_BASE_URL: string
  readonly VITE_WS_BASE_URL: string
  readonly VITE_REPORT_BASE_URL: string
  readonly VITE_S3_OUTPUT_BUCKET_URL: string
  readonly VITE_S3_INPUT_BUCKET_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
