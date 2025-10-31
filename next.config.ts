import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Expõe explicitamente as variáveis públicas no bundle do cliente durante o dev
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY,
  },
};

export default nextConfig;
