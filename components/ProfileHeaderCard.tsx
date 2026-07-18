import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface ProfileHeaderCardProps {
  username: string;
  role: string;
  location?: string;
  size?: 'md' | 'lg';
}

export const ProfileHeaderCard = memo(
  ({ username, role, location, size = 'md' }: ProfileHeaderCardProps) => {
    const isLarge = size === 'lg';

    return (
      <LinearGradient
        colors={['#00BF63', '#009950']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        {/* Decorative depth shapes */}
        <View pointerEvents="none" style={styles.decorCircleLarge} />
        <View pointerEvents="none" style={styles.decorCircleSmall} />

        <View style={styles.avatarRing}>
          <View
            style={[styles.avatar, isLarge ? styles.avatarLg : styles.avatarMd]}
          >
            <Ionicons
              name="person"
              size={isLarge ? 32 : 28}
              color={isLarge ? '#00BF63' : '#fff'}
            />
          </View>
        </View>
        <View style={styles.content}>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{role}</Text>
          </View>
          <Text style={[styles.username, isLarge && styles.usernameLg]}>
            {username}
          </Text>
          {location && (
            <View style={styles.locationRow}>
              <Ionicons
                name="location-outline"
                size={14}
                color="rgba(255, 255, 255, 0.7)"
              />
              <Text style={styles.locationText} numberOfLines={1}>
                {location}
              </Text>
            </View>
          )}
        </View>
      </LinearGradient>
    );
  },
);
ProfileHeaderCard.displayName = 'ProfileHeaderCard';

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#00BF63',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  decorCircleLarge: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    top: -70,
    right: -50,
  },
  decorCircleSmall: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    bottom: -36,
    left: -24,
  },
  avatarRing: {
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.45)',
    borderRadius: 999,
    padding: 3,
    marginRight: 16,
  },
  avatar: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarMd: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  avatarLg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
  },
  roleBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  roleText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  username: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  usernameLg: {
    fontSize: 22,
    marginBottom: 6,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 13,
    flex: 1,
  },
});
