import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { proteinMeta } from '../theme';
import { Protein } from '../types';

export default function ProteinTag({ protein }: { protein: Protein }) {
  const meta = proteinMeta[protein];
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
