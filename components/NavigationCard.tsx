import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { JSX, memo, useRef } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface NavigationCardProps {
  title: string;
  subtitle?: string;
  onPress: () => void;
  fullWidth?: boolean;
  icon?: JSX.Element;
  disabled?: boolean;
  accentColor?: string;
  /** Small floating count badge (e.g. unread/new items). Hidden when 0/undefined. */
  badge?: number;
}

/**
 * Richer action-menu card than InboundListItemCard: left accent bar, a soft
 * decorative glow behind the icon, a bordered/shadowed icon chip, a circular
 * chevron button, and a spring press animation. Ported from Dorx-Operator's
 * home/tabs/inbound.tsx NavigationCard (same visual language, extracted here
 * as a reusable component since Rider uses it standalone).
 */
export const NavigationCard = memo(
  ({
    title,
    subtitle,
    onPress,
    fullWidth = false,
    icon,
    disabled = false,
    accentColor = '#00BF63',
    badge,
  }: NavigationCardProps) => {
    const scale = useRef(new Animated.Value(1)).current;

    const animateTo = (toValue: number) => {
      Animated.spring(scale, {
        toValue,
        useNativeDriver: true,
        speed: 40,
        bounciness: 6,
      }).start();
    };

    const handlePress = () => {
      if (disabled) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    };

    return (
      <Animated.View
        style={[{ transform: [{ scale }] }, !fullWidth && styles.cardFlex]}
      >
        <TouchableOpacity
          style={[
            fullWidth ? styles.fullWidthCard : styles.sideCard,
            disabled && styles.disabledCard,
          ]}
          onPress={handlePress}
          onPressIn={() => animateTo(0.96)}
          onPressOut={() => animateTo(1)}
          activeOpacity={0.9}
          disabled={disabled}
        >
          <View
            pointerEvents="none"
            style={[styles.cardAccentBar, { backgroundColor: accentColor }]}
          />
          <View
            pointerEvents="none"
            style={[styles.cardGlow, { backgroundColor: `${accentColor}12` }]}
          />

          {!!badge && badge > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {badge > 99 ? '99+' : badge}
              </Text>
            </View>
          )}

          {fullWidth ? (
            <View style={styles.cardInnerRow}>
              {icon && (
                <View
                  style={[
                    styles.iconWrapper,
                    styles.iconWrapperFullWidth,
                    {
                      backgroundColor: `${accentColor}15`,
                      borderColor: `${accentColor}30`,
                      shadowColor: accentColor,
                    },
                  ]}
                >
                  {icon}
                </View>
              )}
              <View style={styles.cardContent}>
                <Text
                  style={[styles.cardTitle, disabled && styles.disabledText]}
                  numberOfLines={2}
                >
                  {title}
                </Text>
                {subtitle && (
                  <Text style={styles.cardSubtitle}>{subtitle}</Text>
                )}
              </View>
              <View
                style={[
                  styles.arrowContainer,
                  { backgroundColor: `${accentColor}15` },
                ]}
              >
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={accentColor}
                />
              </View>
            </View>
          ) : (
            <View style={styles.cardInnerColumn}>
              <View style={styles.cardHeaderRow}>
                {icon && (
                  <View
                    style={[
                      styles.iconWrapper,
                      {
                        backgroundColor: `${accentColor}15`,
                        borderColor: `${accentColor}30`,
                        shadowColor: accentColor,
                      },
                    ]}
                  >
                    {icon}
                  </View>
                )}
                <View
                  style={[
                    styles.arrowContainerSmall,
                    { backgroundColor: `${accentColor}15` },
                  ]}
                >
                  <Ionicons
                    name="chevron-forward"
                    size={14}
                    color={accentColor}
                  />
                </View>
              </View>
              <View style={styles.cardContent}>
                <Text
                  style={[styles.cardTitle, disabled && styles.disabledText]}
                  numberOfLines={2}
                >
                  {title}
                </Text>
                {subtitle && (
                  <Text style={styles.cardSubtitle}>{subtitle}</Text>
                )}
              </View>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  },
);
NavigationCard.displayName = 'NavigationCard';

const styles = StyleSheet.create({
  cardFlex: {
    flex: 1,
  },
  sideCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  fullWidthCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  cardInnerColumn: {
    padding: 16,
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  cardInnerRow: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardAccentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  cardGlow: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  disabledCard: {
    opacity: 0.5,
  },
  disabledText: {
    color: '#94A3B8',
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 3,
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
  },
  iconWrapperFullWidth: {
    marginRight: 12,
  },
  arrowContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  arrowContainerSmall: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: 10,
    right: 10,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 5,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#fff',
  },
});
