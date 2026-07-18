import { memo, JSX } from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface SectionHeaderProps {
  title: string;
  icon: JSX.Element;
  accentColor?: string;
}

export const SectionHeader = memo(
  ({ title, icon, accentColor = '#00BF63' }: SectionHeaderProps) => (
    <View style={styles.sectionHeader}>
      <View
        style={[
          styles.sectionIconBadge,
          { backgroundColor: `${accentColor}15` },
        ]}
      >
        {icon}
      </View>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  ),
);
SectionHeader.displayName = 'SectionHeader';

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    marginTop: 12,
    gap: 10,
  },
  sectionIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
});
