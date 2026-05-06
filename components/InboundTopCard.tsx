import { MapPin, User } from "lucide-react-native";
import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

interface InboundTopCardProps {
  username?: string;
  barangay?: string;
  city?: string;
  province?: string;
  title: string;
  totalCount: number;
  isLoading?: boolean;
  backgroundColor?: string;
}

export function InboundTopCard({
  username,
  barangay,
  city,
  province,
  title,
  totalCount,
  isLoading = false,
  backgroundColor = "#22c55e",
}: InboundTopCardProps) {
  return (
    <View style={[styles.topCard, { backgroundColor }]}>
      <View style={styles.userRow}>
        <View style={styles.avatarCircle}>
          <User size={18} color={backgroundColor} strokeWidth={2} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{username}</Text>
          <View style={styles.addressRow}>
            <MapPin size={11} color="rgba(255,255,255,0.7)" strokeWidth={1.8} />
            <Text style={styles.address} numberOfLines={1}>
              {[barangay, city, province].filter(Boolean).join(", ")}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.statRow}>
        <Text style={styles.cardTitle}>{title}</Text>
        {isLoading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <View style={styles.countBadge}>
            <Text style={styles.statText}>{totalCount}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topCard: {
    marginTop: 12,
    marginHorizontal: 12,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  name: {
    fontSize: 15,
    color: "#fff",
    fontWeight: "700",
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 2,
  },
  address: {
    fontSize: 12,
    color: "rgba(255,255,255,0.75)",
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.2)",
    marginVertical: 12,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  countBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  statText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
});

interface InboundTopCardProps {
  username?: string;
  barangay?: string;
  city?: string;
  province?: string;
  title: string;
  totalCount: number;
  isLoading?: boolean;
  backgroundColor?: string;
}

export function InboundTopCard({
  username,
  barangay,
  city,
  province,
  title,
  totalCount,
  isLoading = false,
  backgroundColor = "#64748b",
}: InboundTopCardProps) {
  return (
    <Card style={[styles.topCard, { backgroundColor }]}>
      <Text style={styles.name}>{username}</Text>
      <Text style={styles.address}>
        {barangay}, {city}, {province}
      </Text>

      <View style={styles.statRow}>
        <Text style={styles.cardTitle}>{title}</Text>
        {isLoading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.statText}>{totalCount}</Text>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  topCard: {
    marginTop: 20,
    marginHorizontal: 12,
    borderRadius: 12,
    padding: 16,
  },
  name: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
  },
  address: {
    fontSize: 12,
    color: "#fff",
    opacity: 0.8,
    marginTop: 4,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 14,
    alignItems: "center",
  },
  cardTitle: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  statText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
});
