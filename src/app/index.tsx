import React from "react";
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.logo}>ExpireEze</Text>

          <Text style={styles.tagline}>
            Track it. Save it. Reduce waste.
          </Text>
        </View>

        {/* TODAY'S STATUS */}
        <Text style={styles.sectionTitle}>Today's Status</Text>

        <View style={styles.statusCard}>
          <View style={styles.statusTextContainer}>
            <Text style={styles.statusTitle}>🟢 Fresh</Text>
            <Text style={styles.statusDescription}>
              Products in good standing
            </Text>
          </View>

          <Text style={styles.freshNumber}>0</Text>
        </View>

        <View style={styles.statusCard}>
          <View style={styles.statusTextContainer}>
            <Text style={styles.statusTitle}>🟡 Expiring Soon</Text>
            <Text style={styles.statusDescription}>
              Products needing attention
            </Text>
          </View>

          <Text style={styles.warningNumber}>0</Text>
        </View>

        <View style={styles.statusCard}>
          <View style={styles.statusTextContainer}>
            <Text style={styles.statusTitle}>🔴 Expired</Text>
            <Text style={styles.statusDescription}>
              Products to remove
            </Text>
          </View>

          <Text style={styles.expiredNumber}>0</Text>
        </View>

        {/* ACTION BUTTONS */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.primaryButton}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>
              📷  Scan Product
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryButtonText}>
              ＋  Add Product
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryButtonText}>
              📦  View Inventory
            </Text>
          </TouchableOpacity>
        </View>

        {/* RECENT ACTIVITY */}
        <View style={styles.activitySection}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>

          <View style={styles.activityCard}>
            <Text style={styles.activityTitle}>
              No recent activity yet
            </Text>

            <Text style={styles.activityDescription}>
              Products you add or scan will appear here.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#101418",
  },

  container: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
  },

  header: {
    marginBottom: 32,
  },

  logo: {
    color: "#FFFFFF",
    fontSize: 38,
    fontWeight: "800",
    letterSpacing: 0.5,
  },

  tagline: {
    color: "#9BA5AE",
    fontSize: 15,
    marginTop: 5,
  },

  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 21,
    fontWeight: "700",
    marginBottom: 14,
  },

  statusCard: {
    backgroundColor: "#1E242B",
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#293039",
  },

  statusTextContainer: {
    flex: 1,
    paddingRight: 10,
  },

  statusTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },

  statusDescription: {
    color: "#9BA5AE",
    fontSize: 13,
    marginTop: 5,
  },

  freshNumber: {
    color: "#4CAF50",
    fontSize: 36,
    fontWeight: "800",
  },

  warningNumber: {
    color: "#F9A825",
    fontSize: 36,
    fontWeight: "800",
  },

  expiredNumber: {
    color: "#D32F2F",
    fontSize: 36,
    fontWeight: "800",
  },

  actions: {
    marginTop: 22,
  },

  primaryButton: {
    backgroundColor: "#2E7D32",
    borderRadius: 14,
    paddingVertical: 17,
    alignItems: "center",
    marginBottom: 12,
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },

  secondaryButton: {
    backgroundColor: "#1E242B",
    borderRadius: 14,
    paddingVertical: 17,
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#303841",
  },

  secondaryButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "600",
  },

  activitySection: {
    marginTop: 24,
  },

  activityCard: {
    backgroundColor: "#1E242B",
    borderRadius: 16,
    paddingVertical: 26,
    paddingHorizontal: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#293039",
  },

  activityTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },

  activityDescription: {
    color: "#9BA5AE",
    fontSize: 13,
    marginTop: 7,
    textAlign: "center",
  },
});