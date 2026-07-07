import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

type Product = {
  id: string;
  name: string;
  expirationDate: string;
  quantity: number;
  category: string;
  createdAt: string;
};

const STORAGE_KEY = "@expireeze_products";

export default function HomeScreen() {
  const [modalVisible, setModalVisible] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const [productName, setProductName] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [category, setCategory] = useState("");

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const savedProducts = await AsyncStorage.getItem(STORAGE_KEY);

      if (savedProducts) {
        const parsedProducts: Product[] = JSON.parse(savedProducts);
        setProducts(parsedProducts);
      }
    } catch (error) {
      console.error("Error loading products:", error);
      Alert.alert(
        "Loading Error",
        "Saved products could not be loaded."
      );
    } finally {
      setIsLoaded(true);
    }
  };

  const parseExpirationDate = (dateString: string) => {
    const parts = dateString.split("/");

    if (parts.length !== 3) {
      return null;
    }

    const month = Number(parts[0]);
    const day = Number(parts[1]);
    let year = Number(parts[2]);

    if (
      Number.isNaN(month) ||
      Number.isNaN(day) ||
      Number.isNaN(year)
    ) {
      return null;
    }

    if (year < 100) {
      year += 2000;
    }

    const parsedDate = new Date(year, month - 1, day);

    if (
      parsedDate.getFullYear() !== year ||
      parsedDate.getMonth() !== month - 1 ||
      parsedDate.getDate() !== day
    ) {
      return null;
    }

    parsedDate.setHours(23, 59, 59, 999);

    return parsedDate;
  };

  const getProductStatus = (
    dateString: string
  ): "fresh" | "soon" | "expired" => {
    const expiration = parseExpirationDate(dateString);

    if (!expiration) {
      return "fresh";
    }

    const now = new Date();
    const sevenDaysFromNow = new Date();

    sevenDaysFromNow.setDate(now.getDate() + 7);

    if (expiration < now) {
      return "expired";
    }

    if (expiration <= sevenDaysFromNow) {
      return "soon";
    }

    return "fresh";
  };

  const counts = useMemo(() => {
    let fresh = 0;
    let soon = 0;
    let expired = 0;

    products.forEach((product) => {
      const status = getProductStatus(product.expirationDate);

      if (status === "fresh") {
        fresh += 1;
      }

      if (status === "soon") {
        soon += 1;
      }

      if (status === "expired") {
        expired += 1;
      }
    });

    return {
      fresh,
      soon,
      expired,
    };
  }, [products]);

  const newestProduct = useMemo(() => {
    if (products.length === 0) {
      return null;
    }

    return products[0];
  }, [products]);

  const closeModal = () => {
    setModalVisible(false);
  };

  const resetForm = () => {
    setProductName("");
    setExpirationDate("");
    setQuantity("1");
    setCategory("");
  };

  const saveProduct = async () => {
    const cleanName = productName.trim();
    const cleanDate = expirationDate.trim();
    const cleanCategory = category.trim();

    if (!cleanName) {
      Alert.alert(
        "Missing Product",
        "Enter a product name."
      );
      return;
    }

    if (!cleanDate) {
      Alert.alert(
        "Missing Date",
        "Enter an expiration date."
      );
      return;
    }

    const validDate = parseExpirationDate(cleanDate);

    if (!validDate) {
      Alert.alert(
        "Invalid Date",
        "Enter the expiration date as MM/DD/YYYY."
      );
      return;
    }

    const parsedQuantity = Number.parseInt(quantity, 10);

    if (
      Number.isNaN(parsedQuantity) ||
      parsedQuantity < 1
    ) {
      Alert.alert(
        "Invalid Quantity",
        "Quantity must be at least 1."
      );
      return;
    }

    const newProduct: Product = {
      id: Date.now().toString(),
      name: cleanName,
      expirationDate: cleanDate,
      quantity: parsedQuantity,
      category: cleanCategory || "Uncategorized",
      createdAt: new Date().toISOString(),
    };

    const updatedProducts = [
      newProduct,
      ...products,
    ];

    try {
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(updatedProducts)
      );

      setProducts(updatedProducts);
      resetForm();
      setModalVisible(false);

      Alert.alert(
        "Product Saved",
        `${newProduct.name} was added to your inventory.`
      );
    } catch (error) {
      console.error("Error saving product:", error);

      Alert.alert(
        "Save Error",
        "The product could not be saved."
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.logo}>
            ExpireEze
          </Text>

          <Text style={styles.tagline}>
            Track it. Save it. Reduce waste.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>
          Today's Status
        </Text>

        <View style={styles.statusCard}>
          <View style={styles.statusTextContainer}>
            <Text style={styles.statusTitle}>
              🟢 Fresh
            </Text>

            <Text style={styles.statusDescription}>
              Products in good standing
            </Text>
          </View>

          <Text style={styles.freshNumber}>
            {isLoaded ? counts.fresh : "-"}
          </Text>
        </View>

        <View style={styles.statusCard}>
          <View style={styles.statusTextContainer}>
            <Text style={styles.statusTitle}>
              🟡 Expiring Soon
            </Text>

            <Text style={styles.statusDescription}>
              Products expiring within 7 days
            </Text>
          </View>

          <Text style={styles.warningNumber}>
            {isLoaded ? counts.soon : "-"}
          </Text>
        </View>

        <View style={styles.statusCard}>
          <View style={styles.statusTextContainer}>
            <Text style={styles.statusTitle}>
              🔴 Expired
            </Text>

            <Text style={styles.statusDescription}>
              Products to remove
            </Text>
          </View>

          <Text style={styles.expiredNumber}>
            {isLoaded ? counts.expired : "-"}
          </Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.primaryButton}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>
              📷 Scan Product
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            activeOpacity={0.8}
            onPress={() => setModalVisible(true)}
          >
            <Text style={styles.secondaryButtonText}>
              ＋ Add Product
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryButtonText}>
              📦 View Inventory
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.activitySection}>
          <Text style={styles.sectionTitle}>
            Recent Activity
          </Text>

          <View style={styles.activityCard}>
            {newestProduct ? (
              <>
                <Text style={styles.activityTitle}>
                  {newestProduct.name}
                </Text>

                <Text style={styles.activityDescription}>
                  Expires {newestProduct.expirationDate}
                </Text>

                <Text style={styles.activityDetails}>
                  Qty: {newestProduct.quantity} ·{" "}
                  {newestProduct.category}
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.activityTitle}>
                  No recent activity yet
                </Text>

                <Text style={styles.activityDescription}>
                  Products you add will appear here.
                </Text>
              </>
            )}
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={closeModal}
      >
        <SafeAreaView style={styles.modalSafeArea}>
          <KeyboardAvoidingView
            style={styles.modalFlex}
            behavior={
              Platform.OS === "ios"
                ? "padding"
                : undefined
            }
          >
            <ScrollView
              contentContainerStyle={
                styles.modalContainer
              }
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <TouchableOpacity
                onPress={closeModal}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButton}>
                  ‹ Cancel
                </Text>
              </TouchableOpacity>

              <Text style={styles.modalTitle}>
                Add Product
              </Text>

              <Text style={styles.modalSubtitle}>
                Add an item to your expiration inventory.
              </Text>

              <Text style={styles.label}>
                Product Name
              </Text>

              <TextInput
                style={styles.input}
                placeholder="Example: Milk"
                placeholderTextColor="#6F7A84"
                value={productName}
                onChangeText={setProductName}
              />

              <Text style={styles.label}>
                Expiration Date
              </Text>

              <TextInput
                style={styles.input}
                placeholder="MM/DD/YYYY"
                placeholderTextColor="#6F7A84"
                value={expirationDate}
                onChangeText={setExpirationDate}
                keyboardType="numbers-and-punctuation"
              />

              <Text style={styles.label}>
                Quantity
              </Text>

              <TextInput
                style={styles.input}
                placeholder="1"
                placeholderTextColor="#6F7A84"
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="number-pad"
              />

              <Text style={styles.label}>
                Category
              </Text>

              <TextInput
                style={styles.input}
                placeholder="Cooler, Freezer, Dry Stock..."
                placeholderTextColor="#6F7A84"
                value={category}
                onChangeText={setCategory}
              />

              <TouchableOpacity
                style={styles.saveButton}
                onPress={saveProduct}
                activeOpacity={0.8}
              >
                <Text style={styles.saveButtonText}>
                  Save Product
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
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
    fontSize: 17,
    fontWeight: "700",
  },

  activityDescription: {
    color: "#9BA5AE",
    fontSize: 14,
    marginTop: 7,
    textAlign: "center",
  },

  activityDetails: {
    color: "#66BB6A",
    fontSize: 13,
    marginTop: 7,
    textAlign: "center",
  },

  modalSafeArea: {
    flex: 1,
    backgroundColor: "#101418",
  },

  modalFlex: {
    flex: 1,
  },

  modalContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
  },

  cancelButton: {
    color: "#66BB6A",
    fontSize: 17,
    fontWeight: "600",
    marginBottom: 25,
  },

  modalTitle: {
    color: "#FFFFFF",
    fontSize: 34,
    fontWeight: "800",
  },

  modalSubtitle: {
    color: "#9BA5AE",
    fontSize: 15,
    marginTop: 6,
    marginBottom: 30,
  },

  label: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 8,
  },

  input: {
    backgroundColor: "#1E242B",
    color: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#303841",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 15,
    fontSize: 16,
    marginBottom: 20,
  },

  saveButton: {
    backgroundColor: "#2E7D32",
    borderRadius: 14,
    paddingVertical: 17,
    alignItems: "center",
    marginTop: 10,
  },

  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
});