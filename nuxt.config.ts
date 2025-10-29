// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  css: ['~/assets/css/tailwind.css'],

  postcss: {
    plugins: {
      '@tailwindcss/postcss': {},
      autoprefixer: {},
    },
  },
  
  modules: [
    '@vite-pwa/nuxt'
  ],

  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: "Handball Stats",
      short_name: "PWA",
      start_url: "/",
      display: "standalone",
      orientation: 'landscape',
      background_color: "#ffffff",
      theme_color: "#42b883",
      icons: [
        { src: "icons/web-app-manifest-192x192.png", sizes: "192x192", type: "image/png" },
        { src: "icons/web-app-manifest-512x512.png", sizes: "512x512", type: "image/png" }
      ]
    }
  },
  runtimeConfig: {
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    public: {
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
    }
  }
})