import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { applyBackup, exportBackupJson, readBackup } from '../../store/backupActions';
import { pickBackupFile, saveBackupFile } from '../../services/backupFiles';
import { colors, radius, spacing } from '../../theme';
import { chooseAction, confirmAction, notify } from '../dialogs';
import { prefStyles } from './styles';

// Export/import a backup file. The export includes the allergy list, so it asks first.
export default function DataSection() {
  const handleExport = () =>
    confirmAction(
      'Export a backup?',
      'The file includes your plan, favorites, history, notes, and preferences — including your allergy list. Keep it somewhere private.',
      'Export',
      () => {
        saveBackupFile(exportBackupJson()).catch((e) => {
          console.warn('[backup] export failed', e);
          notify("Couldn't export", 'Something went wrong saving the backup. Please try again.');
        });
      }
    );

  const handleImport = async () => {
    let text: string | null;
    try {
      text = await pickBackupFile();
    } catch (e) {
      console.warn('[backup] could not read file', e);
      notify("Couldn't open that file", 'Pick a Dishcart backup (.json) file.');
      return;
    }
    if (text === null) return;
    const result = readBackup(text);
    if (!result.ok) {
      notify("Couldn't import", result.error);
      return;
    }
    const when = result.exportedAt ? ` from ${new Date(result.exportedAt).toLocaleDateString()}` : '';
    chooseAction(
      `Import backup${when}?`,
      'Merge adds the backup to what you have now. Replace swaps everything on this device for the backup.',
      { label: 'Merge', onPress: () => done(() => applyBackup(result.data, 'merge')) },
      { label: 'Replace everything', destructive: true, onPress: () => done(() => applyBackup(result.data, 'replace')) }
    );
  };

  const done = (apply: () => void) => {
    apply();
    notify('Imported', 'Your backup has been restored.');
  };

  return (
    <View style={{ gap: 10 }}>
      <View style={styles.row}>
        <Pressable onPress={handleExport} style={styles.btn} accessibilityRole="button">
          <Feather name="download" size={15} color={colors.forest} />
          <Text style={styles.label}>Export backup</Text>
        </Pressable>
        <Pressable onPress={handleImport} style={styles.btn} accessibilityRole="button">
          <Feather name="upload" size={15} color={colors.forest} />
          <Text style={styles.label}>Import backup</Text>
        </Pressable>
      </View>
      <Text style={prefStyles.note}>
        Everything lives only on this device. Export a backup to move to a new phone or keep a copy.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm },
  btn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    paddingVertical: 13, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.forest,
  },
  label: { fontSize: 14, fontWeight: '700', color: colors.forest },
});
