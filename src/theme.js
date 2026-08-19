// Paleta e espaçamento únicos do app — mantém tudo consistente num só lugar
// pra não repetir cores/tamanhos espalhados pelos componentes.
export const colors = {
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceMuted: '#F1F5F9',
  border: '#E2E8F0',
  headerBg: '#0F172A',
  headerSubtitle: '#94A3B8',
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  accent: '#2563EB',
  accentSoft: '#DBEAFE',
  success: '#16A34A',
  successSoft: '#DCFCE7',
  warning: '#D97706',
  warningSoft: '#FEF3C7',
  danger: '#DC2626',
  dangerSoft: '#FEE2E2',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
};

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
};

export const typography = {
  title: { fontSize: 20, fontWeight: '700' },
  subtitle: { fontSize: 13, fontWeight: '500' },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  body: { fontSize: 14, fontWeight: '400' },
  small: { fontSize: 12, fontWeight: '500' },
};

// Faixas de bateria usadas pra colorir o indicador na lista/detalhe.
export function batteryTone(level) {
  if (level === null || level === undefined) return 'muted';
  if (level < 20) return 'danger';
  if (level < 50) return 'warning';
  return 'success';
}
