import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface InboundListItemCardProps {
  /** Pre-built icon element rendered inside the leading icon chip, e.g. <Ionicons name="person" size={20} color="#00BF63" /> */
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  /** Numeric/text value shown in the trailing count badge. Omit to hide the badge entirely. */
  count?: number | string;
  countLabel?: string;
  /** Pre-built icon element rendered before the detail line, e.g. <Ionicons name="location" size={14} color="#94A3B8" /> */
  detailIcon?: React.ReactNode;
  detailText?: string;
}

/**
 * Shared list-row card used across the inbound list screens (from-clients,
 * from-hubs, from-provincial, from-regional, etc). Renders a leading icon
 * chip, a title/subtitle block, an optional trailing count badge, and an
 * optional detail line (typically the address).
 */
export function InboundListItemCard({
  icon,
  title,
  subtitle,
  count,
  countLabel = 'items',
  detailIcon,
  detailText,
}: InboundListItemCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>{icon}</View>
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {count !== undefined && count !== null ? (
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{count}</Text>
            <Text style={styles.countLabel}>{countLabel}</Text>
          </View>
        ) : null}
      </View>

      {detailText ? (
        <View style={styles.detailRow}>
          {detailIcon}
          <Text style={styles.detailText} numberOfLines={2}>
            {detailText}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginBottom: 10,
    borderRadius: 14,
    padding: 14,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#00BF6315',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
  },
  countBadge: {
    backgroundColor: '#00BF6315',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    alignItems: 'center',
    marginLeft: 8,
  },
  countText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#00BF63',
  },
  countLabel: {
    fontSize: 10,
    color: '#00BF63',
    fontWeight: '500',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 52,
  },
  detailText: {
    color: '#64748B',
    fontSize: 13,
    flex: 1,
  },
});
