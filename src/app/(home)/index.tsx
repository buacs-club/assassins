import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Colors, MaxContentWidth, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme.web';
import { readNdef } from '@/lib/ndef';
import { Image } from 'expo-image';
import { LinearGradient } from "expo-linear-gradient";

export default function HomeScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  const { width } = useWindowDimensions();

  return (
    <ThemedView style={styles.container}>
      <LinearGradient
          colors={[colors.accent, colors.background]}
          start={{ x:0, y:0 }}
          end={{ x:0, y:1 }}
          style={{ flex: 1 }}
        >
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
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.heroSection}>
              <ThemedText type="title" style={styles.title}>
                Assassins
              </ThemedText>
              <ThemedText type="default" style={{ color: colors.textSecondary }}>
                Your next target is ....
              </ThemedText>
              <Pressable 
                  style={({ pressed }) => [{
                      backgroundColor: pressed ? colors.textSecondary : colors.text,
                      transform: [{scale: pressed ? 0.95 : 1.0}],
                      alignItems: "center",
                      padding: Spacing.two,
                      borderRadius: Spacing.six,
                      transitionDuration: "125ms",
                  }]}

                  onPressOut={async ()=>{
                    console.log("READING TAG")
                    await readNdef()
                  }}
                >
                    <ThemedText type="default" style={{ color: colors.background }}>
                        Attack
                    </ThemedText>
              </Pressable>
            </View>

        </SafeAreaView>
      </LinearGradient>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    justifyContent: 'center',
    flexDirection: 'row',
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    gap: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.three,
    maxWidth: MaxContentWidth,
  },
  heroSection: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingHorizontal: Spacing.four,
    gap: Spacing.four,
  },
  title: {
    textAlign: 'center',
  },
  code: {
    textTransform: 'uppercase',
  },
  stepContainer: {
    gap: Spacing.three,
    alignSelf: 'stretch',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.four,
    borderRadius: Spacing.four,
  },
  texture: {
    ...StyleSheet.absoluteFill,
    opacity: 0.3,
    mixBlendMode: 'multiply'
  }
});
