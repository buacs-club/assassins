import { useEffect, useState } from 'react';
import { Platform, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Fonts, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/AuthProvider';
import { LeaderboardEntry, getLeaderboard, placeLeaderboard, supabase } from '@/lib/supabase';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';

export default function LeaderboardScreen() {
  const safeAreaInsets = useSafeAreaInsets();
  const insets = {
    ...safeAreaInsets,
    bottom: safeAreaInsets.bottom + BottomTabInset + Spacing.three,
  };
  const theme = useTheme();

  const session = useAuth().session;

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  useEffect(()=>{
    getLeaderboard().then((board) => { setLeaderboard(board) });
  }, []);

  useEffect(()=>{
    const subscription = supabase
      .channel("user-data-changes")
      .on(
        'postgres_changes',
        {
          event: "UPDATE",
          schema: "public",
          table: "user_data"
        },
        (payload)=>{
          console.log(payload)
          const updatedUserID = (payload.new as LeaderboardEntry).id;
          const newLeaderboard = [...leaderboard] as LeaderboardEntry[];
          const updatedIndex = newLeaderboard.findIndex(i=>i.id===updatedUserID);
          newLeaderboard[updatedIndex] = payload.new as LeaderboardEntry;
          setLeaderboard(placeLeaderboard(newLeaderboard))
        }
      )
      .subscribe()

    return ()=>{
      supabase.removeChannel(subscription)
    }
  })

  const contentPlatformStyle = Platform.select({
    android: {
      paddingTop: insets.top,
      paddingLeft: insets.left,
      paddingRight: insets.right,
      paddingBottom: insets.bottom,
    },
    web: {
      paddingTop: Spacing.six,
      paddingBottom: Spacing.four,
    },
  });

  const getPlaceNumberStyle = (place: number) => {
    switch (place) {
      case 1:
        return {
          color: "#ffdf6c"
        }
      case 2:
        return {
          color: "#8592a3"
        }
      case 3:
        return {
          color: "#8d4319"
        }
      default:
        return {
          color: theme.textSecondary
        }
    }
  }

  const getPlaceHighlightStyle = (id: string) => {
    return id == session!.user.id ? {backgroundColor: theme.backgroundElement} : {backgroundColor: theme.background};
  }

  return (

    <SafeAreaView
      style={[styles.safeArea, {backgroundColor: theme.background, flex: 1}]}>
      <ThemedView style={[styles.container, {backgroundColor: theme.background, alignItems: "center", }]}>
        <ThemedView style={[styles.titleContainer, {backgroundColor: theme.background}]}>
          <ThemedText type="subtitle" style={{fontFamily: Fonts.serif}}>Leaderboard</ThemedText>
        </ThemedView>
        <ThemedView style={[styles.labelContainer, {flexDirection: 'row', flexWrap: 'wrap'}]}>
          <ThemedText style={[styles.labelPlace, {color: theme.text}]}>#</ThemedText>
          <ThemedText style={[styles.labelName, {color: theme.text}]}>Player</ThemedText>
          <ThemedText style={[styles.labelKills, {color: theme.text}]}>Elims</ThemedText>
        </ThemedView>
        <ThemedView style={styles.scrollContainer}>
          <ScrollView style={[styles.scrollView, {backgroundColor: theme.background}]} contentContainerStyle={styles.contentContainer}>
            {leaderboard.map((entry)=>(
              <ThemedView style={[styles.leaderboardEntry, {flexDirection: 'row', flexWrap: 'wrap'}, getPlaceHighlightStyle(entry.id)]} key={entry.username}>
                <ThemedText style={[styles.leaderboardPlace, getPlaceNumberStyle(entry.place)]} type="default">{entry.place}</ThemedText>
                <ThemedText style={[styles.leaderboardName, {color: theme.textSecondary}]} type="default">{entry.username}</ThemedText>
                <ThemedText style={[styles.leaderboardKills, {color: theme.textSecondary}]} type="default">{entry.kills}</ThemedText>
                <ThemedView style={{backgroundColor: theme.backgroundElement, height: 1, width: "100%"}} />
              </ThemedView>
            ))}
          </ScrollView>
        </ThemedView>
        <LinearGradient 
          colors={[theme.backgroundElement, theme.accent]}
          style={[styles.statContainer, {backgroundColor: theme.backgroundSelected, bottom: safeAreaInsets.bottom + Spacing.four}]}>
            <Image
              source={require("@/assets/images/noise.jpg")}
              contentFit="cover"
              pointerEvents="none"
              style={styles.texture}
            />
            <Image
              source={require("@/assets/images/noise.png")}
              contentFit="cover"
              pointerEvents="none"
              style={styles.texture}
            />
            <ThemedView style={{flexDirection: "column", backgroundColor: "transparent", alignItems: "center"}}>
              <ThemedText style={{color: theme.text}} type="default">#{leaderboard.find(i => i.id === session?.user.id)?.place}</ThemedText>
              <ThemedText style={{color: theme.textSecondary}} type="small">Place</ThemedText>
            </ThemedView>

            <ThemedText style={{color: theme.text, fontSize: 20}} type="default">You</ThemedText>
            
            <ThemedView style={{flexDirection: "column", backgroundColor: "transparent", alignItems: "center"}}>
              <ThemedText style={{color: theme.text}} type="default">{leaderboard.find(i => i.id === session?.user.id)?.kills}</ThemedText>
              <ThemedText style={{color: theme.textSecondary}} type="small">Elims</ThemedText>
            </ThemedView>
        </LinearGradient>
      </ThemedView>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    gap: Spacing.three,
    maxWidth: MaxContentWidth
  },
  scrollView: {
    flex: 1,
    width: '100%',
    height: '100%'
  }, 
  contentContainer: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    flexGrow: 1
  },
  container: {
    maxWidth: MaxContentWidth,
    flex: 1
  },
  titleContainer: {
    gap: Spacing.one,
    alignItems: 'center',
    paddingTop: Spacing.six,
    paddingBottom: Spacing.four
  },
  labelContainer: {
    alignSelf: 'center',
    gap: Spacing.two,
    padding: Spacing.two,
    width: '90%',
  },
  labelPlace: {
    width: '15%',
    textAlign: 'left'
  },
  labelName: {
    width: '55%',
    textAlign: 'left'
  },
  labelKills: {
    width: '20%',
    textAlign: 'end'
  },
  scrollContainer: {
    flex: 1,
    height: '70%',
    width: '90%',
    maxHeight: '60%',
    alignSelf: 'center',
  },
  leaderboardEntry: {
    width: '100%',
    padding: Spacing.two
  },
  leaderboardPlace: {
    width: '15%',
    padding: Spacing.two
  },
  leaderboardName: {
    width: '70%',
    padding: Spacing.two
  },
  leaderboardKills: {
    width: '15%',
    padding: Spacing.two,
    textAlign: "end"
  },
  statContainer: {
    position: 'absolute',
    width: "85%", 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'space-between', 
    padding: Spacing.three,
    borderRadius: Spacing.four,
    alignItems: "center"
  },
  texture: {
    ...StyleSheet.absoluteFill,
    opacity: 0.3,
    mixBlendMode: 'multiply',
    borderRadius: Spacing.four
  }
});
