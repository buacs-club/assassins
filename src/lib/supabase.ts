import 'react-native-url-polyfill/auto'

import { createClient } from '@supabase/supabase-js'

import 'expo-sqlite/localStorage/install'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY!

export interface LeaderboardEntry {
  username: string,
  kills: number,
  place: number,
  id: string
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

export function placeLeaderboard(unplaced: LeaderboardEntry[]): LeaderboardEntry[] {
  const placedLeaderboard = []

  const unplacedSorted = unplaced.sort((a,b)=>b.kills-a.kills)
  console.log(unplacedSorted)

  let place = 0
  let lowestKillCount = Infinity
  for (const user of unplacedSorted!) {
    if (user.kills < lowestKillCount) {
      place++;
      lowestKillCount = user.kills;
    }
    placedLeaderboard.push({ username: user.username, kills: user.kills, place, id: user.id })
  }

  return placedLeaderboard
}

export async function getLeaderboard(): Promise<LeaderboardEntry[]> {

  return new Promise(async (resolve) => {
    const data = (await supabase
        .from("user_data")
        .select("username,kills,id")
        .order("kills", { ascending: false }))
        .data

    return resolve(placeLeaderboard(data as LeaderboardEntry[]))
  })
}