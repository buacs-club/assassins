import 'react-native-url-polyfill/auto'

import { createClient } from '@supabase/supabase-js'

import 'expo-sqlite/localStorage/install'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY!

export interface LeaderboardEntry {
  username: string,
  kills: number
}

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    storage: localStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

export async function login(email: string, password: string) {
    await supabase
        .auth
        .signInWithPassword({ email, password })
}

export async function logout() {
    await supabase
        .auth
        .signOut()
}

export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  return new Promise(()=>{
    return [
      { username: "User1", kills: 15 },
      { username: "User2", kills: 13 },
      { username: "User3", kills: 11 },
      { username: "User4", kills: 9 },
      { username: "User5", kills: 4 }
    ]
  })
}