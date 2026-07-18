import { DrawerHeader } from "@/components/DrawerHeader";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import BottomDrawer from "react-native-animated-bottom-drawer";
interface DeliveryAttemptFloatPanelProps {
  orderInfo: any;
  floatPanel: boolean;
  onCloseFloatPanel: () => void;
  setRemarksModal: (value: boolean) => void;
  onUpdateWaybillStatus: (status: string) => void;
  success: boolean;
  loading: boolean;
  successMessage: string;
  bottomDrawerRef: any;
}

const DeliveryAttemptFloatPanel: React.FC<DeliveryAttemptFloatPanelProps> = ({
  orderInfo,
  floatPanel,
  onCloseFloatPanel,
  setRemarksModal,
  onUpdateWaybillStatus,
  success,
  loading,
  successMessage,
  bottomDrawerRef,
}) => {
  return (
    <BottomDrawer
      ref={bottomDrawerRef}
      initialHeight={560}
      enableSnapping={false}
    >
      <DrawerHeader
        title={orderInfo?.itemName || "Delivery Attempt"}
        subtitle={orderInfo?.orderNumber}
        icon={<Ionicons name="cube" size={22} color="#00BF63" />}
        onClose={onCloseFloatPanel}
      />
      <ScrollView contentContainerStyle={styles.container}>
        {/* Order Card */}
        <View style={styles.card}>
          <View style={styles.row}>
            <Ionicons name="cash-outline" size={16} color="#94A3B8" />
            <Text style={styles.label}>COD Value</Text>
            <Text style={styles.value}>{orderInfo?.codValue}</Text>
          </View>
          <View style={styles.row}>
            <Ionicons name="scale-outline" size={16} color="#94A3B8" />
            <Text style={styles.label}>Item Weight</Text>
            <Text style={styles.value}>{orderInfo?.itemWeight}</Text>
          </View>
          <View style={styles.row}>
            <Ionicons name="layers-outline" size={16} color="#94A3B8" />
            <Text style={styles.label}>Number of Items</Text>
            <Text style={styles.value}>{orderInfo?.numberOfItem}</Text>
          </View>
          <View style={styles.row}>
            <Ionicons name="person-outline" size={16} color="#94A3B8" />
            <Text style={styles.label}>Recipient</Text>
            <Text style={styles.value} numberOfLines={1}>
              {`${orderInfo?.receiverFirstName ?? ""} ${orderInfo?.receiverMiddleName ?? ""} ${orderInfo?.receiverLastName ?? ""}`}
            </Text>
          </View>
          <View style={styles.row}>
            <Ionicons name="call-outline" size={16} color="#94A3B8" />
            <Text style={styles.label}>Phone</Text>
            <Text style={styles.value}>{orderInfo?.receiverPhone}</Text>
          </View>
        </View>

        {/* Status Area */}
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#00BF63" />
            <Text style={{ marginTop: 8 }}>Updating...</Text>
          </View>
        ) : success ? (
          <View style={styles.center}>
            <Text style={styles.successText}>✅</Text>
            <Text>{successMessage}</Text>
          </View>
        ) : (
          <>
            <TouchableOpacity
              style={[styles.button, styles.successButton]}
              onPress={() => onUpdateWaybillStatus("Delivered")}
            >
              <Text style={styles.buttonText}>Mark As Delivered</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.warningButton]}
              onPress={() => setRemarksModal(true)}
            >
              <Text style={styles.buttonText}>Mark As For Return</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Close Button */}
        <TouchableOpacity
          style={[styles.button, styles.closeButton]}
          onPress={onCloseFloatPanel}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Close</Text>
        </TouchableOpacity>
      </ScrollView>
    </BottomDrawer>
  );
};

export default DeliveryAttemptFloatPanel;
const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    marginBottom: 16,
    gap: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  label: {
    fontSize: 14,
    color: "#64748B",
    flex: 1,
  },
  value: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0F172A",
    flexShrink: 1,
    textAlign: "right",
  },
  center: {
    alignItems: "center",
    marginVertical: 20,
  },
  button: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginVertical: 6,
  },
  successButton: {
    backgroundColor: "#00BF63",
  },
  warningButton: {
    backgroundColor: "#F59E0B",
  },
  closeButton: {
    backgroundColor: "#64748B",
    marginTop: 20,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
  successText: {
    fontSize: 32,
    marginBottom: 8,
  },
});
