import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type ViewToken,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { ONBOARDING_SLIDES, type OnboardingSlide } from '@/constants/demo-data';
import { Brand, Fonts, Radius, Spacing } from '@/constants/theme';

const ONBOARDING_KEY = 'daryeel.onboardingComplete';

export async function markOnboardingComplete() {
  await AsyncStorage.setItem(ONBOARDING_KEY, '1');
}

export async function hasCompletedOnboarding() {
  return (await AsyncStorage.getItem(ONBOARDING_KEY)) === '1';
}

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const listRef = useRef<FlatList<OnboardingSlide>>(null);
  const [index, setIndex] = useState(0);
  const isLast = index === ONBOARDING_SLIDES.length - 1;
  const slide = ONBOARDING_SLIDES[index];
  const imageHeight = Math.min(340, Math.max(240, height * 0.34));
  const compact = width < 380;

  const viewabilityConfig = useMemo(
    () => ({ viewAreaCoveragePercentThreshold: 60 }),
    [],
  );

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems[0]?.index != null) {
        setIndex(viewableItems[0].index);
      }
    },
  ).current;

  function goNext() {
    if (isLast) {
      finishToSignUp();
      return;
    }
    listRef.current?.scrollToIndex({ index: index + 1, animated: true });
  }

  function goBack() {
    if (index === 0) return;
    listRef.current?.scrollToIndex({ index: index - 1, animated: true });
  }

  async function finishToSignUp() {
    await markOnboardingComplete();
    router.replace('/sign-up');
  }

  async function finishToSignIn() {
    await markOnboardingComplete();
    router.replace('/sign-in');
  }

  function onMomentumEnd(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const next = Math.round(e.nativeEvent.contentOffset.x / width);
    setIndex(next);
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <View style={styles.brandRow}>
          <View style={styles.logoMark}>
            <Text style={styles.logoLetter}>D</Text>
          </View>
          <View>
            <Text style={styles.brand}>Daryeel Health</Text>
            <Text style={styles.brandSub}>
              Step {index + 1} of {ONBOARDING_SLIDES.length}
            </Text>
          </View>
        </View>
        <Pressable onPress={finishToSignIn} style={styles.skipBtn}>
          <Text style={styles.skip}>Skip</Text>
        </Pressable>
      </View>

      <FlatList
        ref={listRef}
        data={ONBOARDING_SLIDES}
        keyExtractor={(item) => item.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumEnd}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(_, i) => ({
          length: width,
          offset: width * i,
          index: i,
        })}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <View style={[styles.imageWrap, { height: imageHeight }]}>
              <Image source={item.image} style={styles.image} contentFit="cover" />
              <LinearGradient
                colors={['transparent', 'rgba(245,247,250,0.35)', Brand.bg]}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.badge}>
                <Ionicons name="shield-checkmark" size={14} color={Brand.primary} />
                <Text style={styles.badgeText}>{item.badge}</Text>
              </View>
            </View>

            <View style={[styles.copy, compact && styles.copyCompact]}>
              <Text style={[styles.title, compact && styles.titleCompact]}>
                {item.title}
              </Text>
              <Text style={styles.subtitle}>{item.subtitle}</Text>

              <View style={styles.statsRow}>
                {item.stats.map((stat) => (
                  <View key={stat.label} style={styles.statCard}>
                    <Text style={styles.statValue}>{stat.value}</Text>
                    <Text style={styles.statLabel}>{stat.label}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.chips}>
                {item.highlights.map((chip) => (
                  <View key={chip} style={styles.chip}>
                    <Ionicons
                      name="checkmark-circle"
                      size={14}
                      color={Brand.primary}
                    />
                    <Text style={styles.chipText}>{chip}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}
      />

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.dots}>
          {ONBOARDING_SLIDES.map((item, i) => (
            <View
              key={item.key}
              style={[styles.dot, i === index && styles.dotActive]}
            />
          ))}
        </View>

        <View style={styles.actions}>
          {index > 0 ? (
            <Button
              title="Back"
              variant="ghost"
              onPress={goBack}
              style={styles.half}
            />
          ) : (
            <View style={styles.half} />
          )}
          <Button
            title={isLast ? 'Get Started' : 'Continue'}
            onPress={goNext}
            style={styles.half}
          />
        </View>

        {isLast ? (
          <Pressable onPress={finishToSignIn} style={styles.signInLink}>
            <Text style={styles.signInText}>
              Already have an account?{' '}
              <Text style={styles.signInAccent}>Sign In</Text>
            </Text>
          </Pressable>
        ) : (
          <Text style={styles.hint}>{slide.badge} · swipe or tap Continue</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Brand.bg,
  },
  topBar: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoMark: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: Brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoLetter: {
    fontFamily: Fonts.bold,
    fontSize: 16,
    color: Brand.white,
  },
  brand: {
    fontFamily: Fonts.bold,
    fontSize: 16,
    color: Brand.dark,
  },
  brandSub: {
    fontFamily: Fonts.medium,
    fontSize: 11,
    color: Brand.muted,
  },
  skipBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.full,
    backgroundColor: Brand.white,
    borderWidth: 1,
    borderColor: Brand.border,
  },
  skip: {
    fontFamily: Fonts.semibold,
    fontSize: 13,
    color: Brand.primary,
  },
  slide: {
    flex: 1,
  },
  imageWrap: {
    marginHorizontal: Spacing.four,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    backgroundColor: Brand.light,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  badge: {
    position: 'absolute',
    left: 14,
    bottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: Radius.full,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  badgeText: {
    fontFamily: Fonts.semibold,
    fontSize: 12,
    color: Brand.dark,
  },
  copy: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    gap: Spacing.two,
  },
  copyCompact: {
    paddingTop: Spacing.three,
  },
  title: {
    fontFamily: Fonts.bold,
    fontSize: 28,
    lineHeight: 34,
    color: Brand.dark,
  },
  titleCompact: {
    fontSize: 24,
    lineHeight: 30,
  },
  subtitle: {
    fontFamily: Fonts.regular,
    fontSize: 15,
    lineHeight: 23,
    color: Brand.muted,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  statCard: {
    flex: 1,
    backgroundColor: Brand.white,
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: Radius.md,
    paddingVertical: 10,
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    fontFamily: Fonts.bold,
    fontSize: 16,
    color: Brand.primary,
  },
  statLabel: {
    fontFamily: Fonts.medium,
    fontSize: 11,
    color: Brand.muted,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Brand.white,
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: Radius.full,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  chipText: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    color: Brand.primary,
  },
  footer: {
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Brand.border,
  },
  dotActive: {
    width: 22,
    backgroundColor: Brand.primary,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  half: {
    flex: 1,
  },
  hint: {
    textAlign: 'center',
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: Brand.muted,
  },
  signInLink: {
    alignItems: 'center',
  },
  signInText: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: Brand.muted,
  },
  signInAccent: {
    fontFamily: Fonts.semibold,
    color: Brand.primary,
  },
});
