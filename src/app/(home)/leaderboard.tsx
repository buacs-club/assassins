import { useEffect, useState } from 'react';
import { Platform, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { LeaderboardEntry, getLeaderboard } from '@/lib/supabase';

export default function TabTwoScreen() {
  const safeAreaInsets = useSafeAreaInsets();
  const insets = {
    ...safeAreaInsets,
    bottom: safeAreaInsets.bottom + BottomTabInset + Spacing.three,
  };
  const theme = useTheme();

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  useEffect(()=>{
    getLeaderboard().then((board) => { setLeaderboard(board) });
  }, []);

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

  return (

    <ThemedView
      style={[contentPlatformStyle, {backgroundColor: theme.background, flex: 1}]}>
      <ThemedView style={[styles.container, {backgroundColor: theme.background}]}>
        <ThemedView style={[styles.titleContainer, {backgroundColor: theme.background}]}>
          <ThemedText type="subtitle">Leaderboard</ThemedText>
        </ThemedView>
        <ThemedView style={styles.scrollContainer}>
          <ScrollView style={[styles.scrollView, {backgroundColor: theme.background}]} contentContainerStyle={styles.contentContainer}>
            {leaderboard.map((entry)=>(
              <ThemedView style={[styles.leaderboardEntry, {flexDirection: 'row', flexWrap: 'wrap'}]} key={entry.username}>
                <ThemedText style={[styles.leaderboardPlace, getPlaceNumberStyle(entry.place)]} type="default">{entry.place}</ThemedText>
                <ThemedText style={[styles.leaderboardName, {color: theme.textSecondary}]} type="default">{entry.username}</ThemedText>
                <ThemedText style={[styles.leaderboardKills, {color: theme.textSecondary, textAlign: "end"}]} type="default">{entry.kills}</ThemedText>
    
                <ThemedView style={{backgroundColor: theme.backgroundElement, height: 1, width: "100%"}} />
              </ThemedView>
            ))}
          </ScrollView>
        </ThemedView>
      </ThemedView>

    </ThemedView>
  );
}

const styles = StyleSheet.create({

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
    gap: Spacing.two,

  },
  scrollContainer: {
    flex: 1,
    height: '70%',
    width: '90%',
    maxHeight: '70%',
    alignSelf: 'center'
  },
  leaderboardEntry: {
    width: '100%',
    padding: Spacing.two,
  },
  leaderboardPlace: {
    width: '15%',
    padding: Spacing.two,
    outline: '5%'
  },
  leaderboardName: {
    width: '70%',
    padding: Spacing.two,
    outline: '5%'
  },
  leaderboardKills: {
    width: '15%',
    padding: Spacing.two,
    outline: '5%'
  }
});
