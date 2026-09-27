import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { dietMeta } from '../theme';
import { Diet } from '../types';

export default function DietTag({ diet }: { diet: Diet }) {
  const meta = dietMeta[diet];
  return (
    <View style={[styles.pill, { backgroundColor: meta.bg }]}>
      <Text style={[styles.label, { color: meta.color }]}>{meta.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 20,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
