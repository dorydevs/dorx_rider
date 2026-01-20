import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { Card } from "react-native-paper";

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
