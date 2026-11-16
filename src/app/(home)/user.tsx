import { Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Colors, Fonts, MaxContentWidth, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme.web';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/AuthProvider';
import { cancelNdef, TagObject, TagType, UserTagData, writeNdef } from '@/lib/ndef';
import { logout, supabase } from '@/lib/supabase';
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import { SymbolView } from 'expo-symbols';
import { useCallback, useEffect, useRef, useState } from 'react';
import Animated, { Extrapolation, interpolate, useAnimatedStyle, useSharedValue, withDelay, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

export default function TabTwoScreen() {
  const safeAreaInsets = useSafeAreaInsets();
  const insets = {
    ...safeAreaInsets,
    bottom: safeAreaInsets.bottom + BottomTabInset + Spacing.three,
  };
  const theme = useTheme();

  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  const { session } = useAuth()

  const [usernameModalVisible, setUserNameModalVisible] = useState(false);
  const [registerModalVisible, setRegisterModalVisible] = useState(false);

  const usernameSheet = useRef<TrueSheet>(null);
  const registerSheet = useRef<TrueSheet>(null);

  const hideRegisterSheet = useCallback(()=>{void registerSheet.current?.dismiss();},[])

  const [username, setUsername] = useState("")
  let [syncedUsername, setSyncedUsername] = useState("");

  useEffect(()=>{
    supabase
      .from("user_data")
      .select("*")
      .eq("id", session?.user.id)
      .then((res)=>{
        const data = res.data![0]
        setUsername(data.username)
        setSyncedUsername(data.username)
      })
  },[])

  useEffect(()=>{
    if (!registerModalVisible) {
      successAnimationTime.set(0)
    }
  }, [registerModalVisible])

  const successAnimationTime = useSharedValue(0);

  const animatedSuccessStyle = useAnimatedStyle(() => ({
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

  const animatedSuccessCheckStyle = useAnimatedStyle(()=>({
    transform: [{ 
      scale: interpolate(
        successAnimationTime.value, 
        [0.5, 1],
        [0, 1],
        Extrapolation.CLAMP) 
    }]
  }))

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={{
            alignItems: "center", 
            justifyContent: "space-between", 
            flexDirection: 'row'
        }}>
          <ThemedText type="subtitle" style={{ color: colors.text, fontFamily: Fonts.serif }}>
            Hello, {syncedUsername?.split(" ")[0]} {syncedUsername?.split(" ")[1]?.split("")[0]}{syncedUsername?.split(" ").length > 1 ? "." : ""}
          </ThemedText>
          <Pressable 
            style={({ pressed }) => [{
                transform: [{scale: pressed ? 0.95 : 1.0}],
                alignItems: "center",
                padding: Spacing.two,
                borderRadius: Spacing.six,
                transitionDuration: "125ms",
            }]}

            onPressOut={()=>{
                usernameSheet.current?.present();
            }}
          >
              <SymbolView
                name={{ ios: "pencil", android: 'edit' }}
                size={24}
                tintColor={theme.text}
              />
          </Pressable>
        </View>

        <TrueSheet 
          ref={usernameSheet}
          detents={[0.5, 1]}
          style={{position: 'relative', width: "100%", height: "100%", padding: Spacing.four, gap: Spacing.two}}
        >
            <ThemedText type="default" style={{ color: colors.text }}>
              Change your username:
            </ThemedText>
            <TextInput 
              onChangeText={setUsername} 
              value={username} 
              style={{ 
                  backgroundColor: colors.backgroundElement, 
                  borderRadius: Spacing.six, 
                  width: "100%", 
                  padding: Spacing.three,
                  color: colors.text,
                  fontSize: 16,
                  borderColor: colors.textSecondary,
                  borderWidth: 1
              }} 
              placeholder="Username" 
              textContentType="name"
              autoCorrect={true}
            />  

            <View style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: Spacing.four,
                paddingLeft: Spacing.four,
                paddingRight: Spacing.four,
                flex: 1,
                alignItems: "center"
              }}>
                <Pressable 
                  style={({ pressed }) => [{
                      backgroundColor: pressed ? colors.textSecondary : colors.text,
                      transform: [{scale: pressed ? 0.95 : 1.0}],
                      width: "100%",
                      alignItems: "center",
                      padding: Spacing.two,
                      borderRadius: Spacing.six,
                      transitionDuration: "125ms",
                  }]}

                  onPressOut={async()=>{
                    console.log("UPDATING USER")
                    setSyncedUsername(username)
                    await supabase
                      .from("user_data")
                      .update({username})
                      .eq("id", session?.user.id)
                    usernameSheet.current?.dismiss();
                  }}
                >
                  <ThemedText type="default" style={{ color: colors.background }}>
                      Save
                  </ThemedText>
              </Pressable>
            </View>
        </TrueSheet>

        <ThemedView style={{gap: Spacing.three}}>
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
              console.log("WRITING TAG")
              registerSheet.current?.present();
              const res = await writeNdef({
                type: TagType.UserCard,
                data: {
                  uid: session?.user.id
                } as UserTagData
              } as TagObject)
              if (!res) return;
              successAnimationTime.value = await withSequence(
                withTiming(0.5, { duration: 500 }),
                withDelay(250, withSpring(1, { }, (finished)=>{
                  finished && scheduleOnRN(hideRegisterSheet);
                }))
              )
            }}
          >
              <ThemedText type="default" style={{ color: colors.background }}>
                  Register NFC
              </ThemedText>
          </Pressable>
          <Pressable 
          style={({ pressed }) => [{
              transform: [{scale: pressed ? 0.95 : 1.0}],
              width: "100%",
              alignItems: "center",
              padding: Spacing.two,
              borderRadius: Spacing.six,
              transitionDuration: "125ms",
              borderColor: colors.accent,
              borderWidth: 1
          }]}

          onPressOut={()=>{
              Alert.alert(
                "Sign out?",
                "If you sign out, you will have to sign back in to continue.",
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Sign out",
                    style: "destructive",
                    onPress: () => {
                      logout()
                    }
                  }
                ]
              )
          }}
        >
            <ThemedText type="default" style={{ color: colors.accent }}>
                Sign out
            </ThemedText>
        </Pressable>
        </ThemedView>
        <TrueSheet
          ref={registerSheet}
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
          onDidDismiss={()=>{successAnimationTime.set(0); cancelNdef()}}>
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
            <Animated.View style={[animatedSuccessStyle, {
              borderRadius: "100%",
              backgroundColor: "#5cefaf",
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }]}>
              <Animated.View style={[animatedSuccessCheckStyle]}>
                <SymbolView 
                  name={{ ios: "checkmark.app.fill", android: "check" }} 
                  size={128} 
                  tintColor={colors.text}
                />
              </Animated.View>
            </Animated.View>
          </View>
        </TrueSheet>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    width: "100%",
    height: "100%",
    gap: Spacing.two,
    flexDirection: "column",
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  titleContainer: {
    gap: Spacing.three,
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.six,
  },
  centerText: {
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  linkButton: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.five,
    justifyContent: 'center',
    gap: Spacing.one,
    alignItems: 'center',
  },
  sectionsWrapper: {
    gap: Spacing.five,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
  },
  collapsibleContent: {
    alignItems: 'center',
  },
  imageTutorial: {
    width: '100%',
    aspectRatio: 296 / 171,
    borderRadius: Spacing.three,
    marginTop: Spacing.two,
  },
  imageReact: {
    width: 100,
    height: 100,
    alignSelf: 'center',
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.four,
    gap: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.three,
    maxWidth: MaxContentWidth,
  },
});
