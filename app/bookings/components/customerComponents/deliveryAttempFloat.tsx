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
      <View style={styles.overlay}>
        <ScrollView style={styles.container}>
          {/* Order Card */}
          <View style={styles.card}>
            <Text style={styles.boldText}>{orderInfo?.itemName}</Text>
            <Text>{orderInfo?.orderNumber}</Text>

            <View style={styles.divider} />

            <View style={styles.row}>
              <Text>COD Value: </Text>
              <Text>{orderInfo?.codValue}</Text>

              <View style={styles.verticalDivider} />

              <Text>Item Weight: </Text>
              <Text>{orderInfo?.itemWeight}</Text>
            </View>

            <Text>Number of Item: {orderInfo?.numberOfItem}</Text>

            <Text>
              Recipient:{" "}
              {`${orderInfo?.receiverFirstName} ${orderInfo?.receiverMiddleName} ${orderInfo?.receiverLastName}`}
            </Text>

            <Text>Phone: {orderInfo?.receiverPhone}</Text>
          </View>

          {/* Status Area */}
          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" />
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
      </View>
    </BottomDrawer>
  );
};

export default DeliveryAttemptFloatPanel;
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: "#fff",
    padding: 16,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    minHeight: "40%",
  },
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 16,
  },
  boldText: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 4,
  },
  divider: {
    height: 1,
    backgroundColor: "#e5e7eb",
    marginVertical: 10,
  },
  verticalDivider: {
    width: 1,
    height: 14,
    backgroundColor: "#e5e7eb",
    marginHorizontal: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
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
    backgroundColor: "#22c55e",
  },
  warningButton: {
    backgroundColor: "#f59e0b",
  },
  closeButton: {
    backgroundColor: "#6b7280",
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
