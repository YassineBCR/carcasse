import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

if (!isSupabaseConfigured) {
  console.warn('Variables Supabase manquantes: VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY')
}

let supabaseClient = null;

if (isSupabaseConfigured) {
  try {
    // On essaie de créer le client Supabase
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey)
  } catch (error) {
    // Si l'URL est fausse (ex: ne commence pas par https://), on empêche le site de crasher
    console.error("L'URL Supabase dans le fichier .env est invalide. Elle doit commencer par https://", error)
  }
}

export const supabase = supabaseClient