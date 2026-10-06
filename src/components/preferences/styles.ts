import { StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../../theme';

export const prefStyles = StyleSheet.create({
  optionCard: {
    padding: 14, borderRadius: radius.md, borderWidth: 2, borderColor: colors.line, backgroundColor: colors.card,
  },
  optionCardActive: { borderColor: colors.forest, backgroundColor: colors.sageLight },
  optionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  optionLabel: { fontWeight: '700', fontSize: 14.5, color: colors.ink },
  optionSub: { fontSize: 12.5, color: colors.inkSoft, marginTop: 2 },
  list: { gap: 10 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: radius.pill, borderWidth: 1.5, borderColor: colors.line, backgroundColor: colors.card,
  },
  chipActive: { borderColor: colors.rust, backgroundColor: colors.rustLight },
  chipLabel: { fontSize: 13.5, fontWeight: '700', color: colors.ink },
  note: { fontSize: 12, color: colors.inkSoft, lineHeight: 17 },
});
