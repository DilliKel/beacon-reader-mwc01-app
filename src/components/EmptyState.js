import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../theme';

export default function EmptyState({ scanning, filterMode }) {
  const message = scanning
    ? 'Escaneando… mantenha os crachás ligados e por perto.'
    : filterMode === 'badges'
    ? 'Nenhum crachá reconhecido ainda. Troque pro filtro "Todos" e toque em "Marcar como crachá" no dispositivo certo.'
    : 'Nenhum dispositivo por perto. Toque em "Escanear" pra procurar.';

  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>📡</Text>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingTop: spacing.xl * 2,
    paddingHorizontal: spacing.xl,
  },
  emoji: { fontSize: 40, marginBottom: spacing.md },
  text: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
