import 'react-native-url-polyfill/auto'

import { createClient } from '@supabase/supabase-js'

import 'expo-sqlite/localStorage/install'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY!

// Define the format of a single entry on the leaderboard
export interface LeaderboardEntry {
  username: string,
  kills: number,
  place: number,
  id: string
}

// Create a supabase client
export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    storage: localStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

// Log a user in using their email and password
export async function login(email: string, password: string) {
    await supabase
      .auth
      .signInWithPassword({ email, password })
}

// Log a user out
export async function logout() {
    await supabase
      .auth
      .signOut()
}

// Calculate the places of every user on a leaderboard based on their kills
export function placeLeaderboard(unplaced: LeaderboardEntry[]): LeaderboardEntry[] {
  // Sort the currently unsorted array in order of most to least kills 
  const unplacedSorted = unplaced.sort((a,b)=>b.kills-a.kills)

  // Calculate the places of each user sequentially
  const placedLeaderboard = []
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

// Fetch the entire leaderboard from the server
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