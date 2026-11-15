import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Colors, MaxContentWidth, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme.web';
import { useAuth } from '@/lib/AuthProvider';
import { readNdef, TagObject, UserTagData } from '@/lib/ndef';
import { supabase } from '@/lib/supabase';
import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { Image } from 'expo-image';
import { LinearGradient } from "expo-linear-gradient";
import { SymbolView } from 'expo-symbols';
import { useCallback, useEffect, useRef, useState } from 'react';
import Animated, { Extrapolation, interpolate, useAnimatedStyle, useSharedValue, withDelay, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

export default function HomeScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  const { width } = useWindowDimensions();

  const [target, setTarget] = useState("")

  const insets = useSafeAreaInsets();

  useEffect(()=>{
    supabase.rpc("get_target_username")
      .then((res)=>{
        setTarget(res.data)
      })
  },[])

  const successAnimationTime = useSharedValue(0);
  
  const animatedOverlayStyle = useAnimatedStyle(() => ({
    width: interpolate(
      successAnimationTime.value, 
      [0, 0.5],
      [0, 1000],
      Extrapolation.CLAMP),
    height: interpolate(
      successAnimationTime.value, 
      [0, 0.5],
      [0, 1000],
      Extrapolation.CLAMP),
  }))

  const animatedIconStyle = useAnimatedStyle(()=>({
    transform: [{ 
      scale: interpolate(
        successAnimationTime.value, 
        [0.5, 1],
        [0, 1],
        Extrapolation.CLAMP) 
    }]
  }))

  const killSheet = useRef<TrueSheet>(null)

  const hideKillSheet = useCallback((json: TagObject)=>{
    killSheet.current?.dismiss();
    supabase.rpc("attack_user", {p_id: (json?.data as UserTagData).uid})
  },[])


  const auth = useAuth()

  const [userData, setUserData] = useState({kills:0,alive:true})
  useEffect(()=>{
    if (!auth.loading) {
      supabase
        .from('user_data')
        .select('alive,kills')
        .eq('id', auth.session?.user.id)
        .then((res) => {
          setUserData(res.data![0])
          console.log(userData)
        })
    }
  }, [auth.loading])

  const getKillStyle = (kills: number): { icon: boolean, color: string } => {
    switch (kills) {
      case 0:
        return ({ icon: false, color: "#9c1c2a" })
      case 1:
        return ({ icon: false, color: "#dc9c1a" })
      case 2:
        return ({ icon: true, color: "#e8d049" })
      case 3:
        return ({ icon: true, color: "#e8cd97" })
      case 4:
        return ({ icon: true, color: "#ffffff" })
      case 5:
        return ({ icon: true, color: "#cbd3ed" })
      default:
        return ({ icon: true, color: "#94b1ff" })
    }
  }

  const [killCounterStyles, setKillCounterStyles] = useState({})

  setInterval(()=>{
    setKillCounterStyles({
      transform: [{
        translate: [
          (userData.kills > 3) ? (Math.random()*2-1)*Math.min(1, userData.kills / 10) : 0, 
          (userData.kills > 3) ? (Math.random()*2-1)*Math.min(1, userData.kills / 10) : 0
        ]
      }]
    })
  }, 500)

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
              {userData.alive ? `Your next target is ${target}` : `You are eliminated`}
            </ThemedText>
            </View>

            <View style={{
              flex: 1,
              flexDirection: 'column',
              position: "absolute",
              width: "100%",
              bottom: insets.bottom + Spacing.four,
              alignItems: 'center',
              gap: Spacing.two
            }}>
              <View style={[killCounterStyles, {
                flex: 1,
                flexDirection: 'row',
                alignItems: "center",
                gap: Spacing.one,
                
              }]}>
                <SymbolView 
                  name={{ios: "flame.fill", android: "mode_heat"}} 
                  tintColor={getKillStyle(userData.kills).color} 
                  size={16}
                  style={{
                    display: getKillStyle(userData.kills).icon ? "contents" : "none"
                  }}
                />
                <ThemedText type="smallBold" style={[, { color: getKillStyle(userData.kills).color }]}>
                  {userData.kills} kills
                </ThemedText>
              </View>
              <Pressable 
                style={({ pressed }) => [{
                    backgroundColor: pressed ? colors.textSecondary : (userData.alive ? colors.text : colors.backgroundElement),
                    transform: [{scale: pressed ? 0.95 : (userData.alive ? 1.0 : 0.95)}],
                    justifyContent: "center",
                    padding: Spacing.three,
                    width: "75%",
                    borderRadius: Spacing.six,
                    transitionDuration: "125ms",
                    flex: 1,
                    flexDirection: "row",
                }]}

                disabled = {!userData.alive}

                onPressOut={async ()=>{
                  console.log("READING TAG")
                  killSheet.current?.present();
                  const json = await readNdef();
                  successAnimationTime.value = await withSequence(
                    withTiming(0.5, { duration: 500 }),
                    withDelay(250, withSpring(1, { }, (finished)=>{
                      finished && scheduleOnRN(hideKillSheet, json!);
                    }))
                  )
                }}
              >
                <SymbolView name={{ios: "bolt.fill", android: "swords"}} size={24} tintColor={(userData.alive ? colors.backgroundElement : colors.background)}/>
            </Pressable>
          </View>

        </SafeAreaView>
      </LinearGradient>

      <TrueSheet
        ref={killSheet}
        detents={[0.5, 1]}
        style={{
          position: 'relative', 
          width: "100%", 
          height: "100%", 
          padding: Spacing.four, 
          gap: Spacing.two, 
          justifyContent: 'center', 
          alignItems: 'center'
        }}
        onDidDismiss={()=>{successAnimationTime.set(0)}}>
        
        <SymbolView name={{ios: "scanner", android: "nfc"}} size={128} tintColor={colors.textSecondary}/>
        <ThemedText type="code">
          Tap the NFC tag on your phone.
        </ThemedText>
        
        <View style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,

          flex: 1,
          alignItems: "center",
          justifyContent: "center"
        }}>
          <Animated.View style={[animatedOverlayStyle, {
            borderRadius: "100%",
            backgroundColor: colors.accent,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }]}>
            <Animated.View style={[animatedIconStyle]}>
              <SymbolView 
                name={{ ios: "checkmark.app.fill", android: "skull" }} 
                size={128} 
                tintColor={colors.text}
              />
            </Animated.View>
          </Animated.View>
        </View>

      </TrueSheet>
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
