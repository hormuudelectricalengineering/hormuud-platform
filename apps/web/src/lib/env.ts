function requireEnv(key: string): string {
  const value = process.env[key]
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
  return value
}

function optionalEnv(key: string, defaultValue: string = ""): string {
  return process.env[key] || defaultValue
}

export const env = {
  supabaseUrl: requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
  supabaseAnonKey: requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  supabaseServiceRoleKey: requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
  appUrl: optionalEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000"),
}
