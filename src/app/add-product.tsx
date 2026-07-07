import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AddProductScreen() {
  const [productName, setProductName] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [category, setCategory] = useState("");

  const saveProduct = () => {
    if (!productName.trim()) {
      Alert.alert("Missing Product", "Enter a product name.");
      return;
    }

    if (!expirationDate.trim()) {
      Alert.alert("Missing Date", "Enter an expiration date.");
      return;
    }

    Alert.alert(
      "Product Ready",
      `${productName} is ready to save. Storage comes in the next part of v0.3.`
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backButton}>‹ Dashboard</Text>
          </TouchableOpacity>

          <Text style={styles.title}>Add Product</Text>

          <Text style={styles.subtitle}>
            Add an item to your expiration inventory.
          </Text>

          <View style={styles.form}>
            <Text style={styles.label}>Product Name</Text>

            <TextInput
              style={styles.input}
              placeholder="Example: Milk"
              placeholderTextColor="#6F7A84"
              value={productName}
              onChangeText={setProductName}
            />

            <Text style={styles.label}>Expiration Date</Text>

            <TextInput
              style={styles.input}
              placeholder="MM/DD/YYYY"
              placeholderTextColor="#6F7A84"
              value={expirationDate}
              onChangeText={setExpirationDate}
              keyboardType="numbers-and-punctuation"
            />

            <Text style={styles.label}>Quantity</Text>

            <TextInput
              style={styles.input}
              placeholder="1"
              placeholderTextColor="#6F7A84"
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="number-pad"
            />

            <Text style={styles.label}>Category</Text>

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
              <Text style={styles.saveButtonText}>Save Product</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },

  safeArea: {
    flex: 1,
    backgroundColor: "#101418",
  },

  container: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
  },

  backButton: {
    color: "#66BB6A",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 25,
  },

  title: {
    color: "#FFFFFF",
    fontSize: 34,
    fontWeight: "800",
  },

  subtitle: {
    color: "#9BA5AE",
    fontSize: 15,
    marginTop: 6,
    marginBottom: 30,
  },

  form: {
    width: "100%",
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