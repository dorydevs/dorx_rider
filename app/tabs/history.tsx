import { DashboardHeader } from "@/components/DashboardHeader";
import { InboundListItemCard } from "@/components/InboundListItemCard";
import { SectionHeader } from "@/components/SectionHeader";
import { useAppSelector } from "@/store/hooks";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HistoryScreen() {
  const router = useRouter();
  const user = useAppSelector((state: any) => state.user.user);
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("user");
        if (storedUser) {
          setUserData(JSON.parse(storedUser));
        } else if (user) {
          setUserData(user);
        }
      } catch (error) {
        console.error("Error loading user data:", error);
      }
    };

    loadUserData();
  }, [user]);

  const handlePress = (type: "clients" | "customers") => {
    if (type === "clients") {
      router.push({
        pathname: "/history/clients",
      });
    } else if (type === "customers") {
      router.push({
        pathname: "/history/customers",
      });
    }
  };

  const roleLabel =
    userData?.accountType === 1 ? "Hub Rider" : "Store Rider";
  const locationLabel =
    [userData?.storeCity, userData?.storeProvince].filter(Boolean).join(", ") ||
    "Location not set";

  return (
    <SafeAreaView style={styles.safeArea} edges={["left", "right"]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <DashboardHeader
          eyebrow="HISTORY"
          username={userData?.name || "Rider"}
          role={roleLabel}
          location={locationLabel}
        />

        <View style={styles.container}>
          <View style={styles.sectionHeaderWrapper}>
            <SectionHeader
              title="Browse By"
              accentColor="#00BF63"
              icon={<Ionicons name="list" size={18} color="#00BF63" />}
            />
          </View>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => handlePress("clients")}
          >
            <InboundListItemCard
              icon={<Ionicons name="checkmark-done-circle" size={20} color="#00BF63" />}
              title="Picked-up"
              subtitle="View your pickup history from hub and clients"
            />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => handlePress("customers")}
          >
            <InboundListItemCard
              icon={<Ionicons name="people" size={20} color="#00BF63" />}
              title="Delivered to Customer"
              subtitle="View your delivery history to customers"
            />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  container: {
    paddingTop: 20,
    paddingBottom: 32,
  },
  sectionHeaderWrapper: {
    marginHorizontal: 12,
  },
});
