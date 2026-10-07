/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  /** 设为 '1' 时把 src/modules-lab 下开发中的模块也注册进来（仅本地调试用） */
  readonly VITE_SHOW_LAB?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
