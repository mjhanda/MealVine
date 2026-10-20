import React, { useEffect, useMemo } from 'react';
import { Animated, Easing, StyleSheet, useWindowDimensions, View } from 'react-native';
import { colors } from '../../theme';

const PIECES = 48;
const PALETTE = [colors.gold, colors.sage, colors.rust, colors.blue, colors.forest, colors.goldLight];

interface Piece {
  x: number;
  drift: number;
  size: number;
  color: string;
  delay: number;
  duration: number;
  spin: number;
  progress: Animated.Value; // 0 → 1 over the fall
}

function makePieces(width: number): Piece[] {
  return Array.from({ length: PIECES }, (_, i) => ({
    x: Math.random() * width,
    drift: (Math.random() - 0.5) * 120,
    size: 6 + Math.random() * 6,
    color: PALETTE[i % PALETTE.length],
    delay: Math.random() * 400,
    duration: 1800 + Math.random() * 900,
    spin: (Math.random() < 0.5 ? -1 : 1) * (360 + Math.random() * 360),
    progress: new Animated.Value(0),
  }));
}

// A one-shot confetti burst over the whole screen. Purely decorative: it ignores touches and
// calls onDone when the last piece has fallen, so the parent can unmount it.
export default function Confetti({ onDone }: { onDone: () => void }) {
  const { width, height } = useWindowDimensions();
  const pieces = useMemo(() => makePieces(width), [width]);

  useEffect(() => {
    const anims = pieces.map((p) =>
      Animated.timing(p.progress, {
        toValue: 1,
        duration: p.duration,
        delay: p.delay,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      })
    );
    const all = Animated.parallel(anims);
    all.start(({ finished }) => finished && onDone());
    return () => all.stop();
  }, [pieces, onDone]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {pieces.map((p, i) => {
        const t = p.progress;
        const transform = [
          { translateX: t.interpolate({ inputRange: [0, 1], outputRange: [p.x, p.x + p.drift] }) },
          { translateY: t.interpolate({ inputRange: [0, 1], outputRange: [-20, height + 20] }) },
          { rotate: t.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${p.spin}deg`] }) },
        ];
        const opacity = t.interpolate({ inputRange: [0, 0.8, 1], outputRange: [1, 1, 0] });
        return (
          <Animated.View
            key={i}
            style={[styles.piece, { width: p.size, height: p.size * 0.5, backgroundColor: p.color, opacity, transform }]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  piece: { position: 'absolute', top: 0, left: 0, borderRadius: 1 },
});
