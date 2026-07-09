import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Image,
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
import * as ImagePicker from "expo-image-picker";
import { CameraView, useCameraPermissions } from "expo-camera";
import {
  extractTextFromImage,
  isSupported,
} from "expo-text-extractor";
type Product = {
  id: string;
  name: string;
  expirationDate: string;
  quantity: number;
  category: string;
  createdAt: string;
  barcode: string | null;
  barcodeType: string | null;
};

const STORAGE_KEY = "@expireeze_products";

export default function HomeScreen() {
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [inventoryVisible, setInventoryVisible] = useState(false);
  const [scanModalVisible, setScanModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [barcodeScannerVisible, setBarcodeScannerVisible] = useState(false);
  const [scannedBarcode, setScannedBarcode] =
    useState<string | null>(null);
  const [scannedBarcodeType, setScannedBarcodeType] =
    useState<string | null>(null);
  const [barcodeScanned, setBarcodeScanned] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const [ocrText, setOcrText] = useState("");
  const [detectedDates, setDetectedDates] = useState<string[]>([]);
  const [isScanning, setIsScanning] = useState(false);

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
        const parsedProducts: Product[] =
          JSON.parse(savedProducts);

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

  const formatExpirationDate = (text: string) => {
    const numbers = text
      .replace(/\D/g, "")
      .slice(0, 6);

    if (numbers.length <= 2) {
      return numbers;
    }

    if (numbers.length <= 4) {
      return `${numbers.slice(0, 2)}/${numbers.slice(2)}`;
    }

    return `${numbers.slice(0, 2)}/${numbers.slice(
      2,
      4
    )}/${numbers.slice(4)}`;
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

    const parsedDate = new Date(
      year,
      month - 1,
      day
    );

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
    const expiration =
      parseExpirationDate(dateString);

    if (!expiration) {
      return "fresh";
    }

    const now = new Date();
    const sevenDaysFromNow = new Date();

    sevenDaysFromNow.setDate(
      now.getDate() + 7
    );

    if (expiration < now) {
      return "expired";
    }

    if (expiration <= sevenDaysFromNow) {
      return "soon";
    }

    return "fresh";
  };

  const getStatusLabel = (
    dateString: string
  ) => {
    const status =
      getProductStatus(dateString);

    if (status === "expired") {
      return "🔴 Expired";
    }

    if (status === "soon") {
      return "🟡 Expiring Soon";
    }

    return "🟢 Fresh";
  };

  const counts = useMemo(() => {
    let fresh = 0;
    let soon = 0;
    let expired = 0;

    products.forEach((product) => {
      const status =
        getProductStatus(
          product.expirationDate
        );

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

  const resetForm = () => {
    setProductName("");
    setExpirationDate("");
    setQuantity("1");
    setCategory("");
  };

  const closeAddModal = () => {
    setAddModalVisible(false);
  };

  const saveProduct = async () => {
    const cleanName = productName.trim();
    const cleanDate =
      expirationDate.trim();
    const cleanCategory =
      category.trim();

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

    const validDate =
      parseExpirationDate(cleanDate);

    if (!validDate) {
      Alert.alert(
        "Invalid Date",
        "Enter the expiration date as MM/DD/YY."
      );

      return;
    }

    const parsedQuantity =
      Number.parseInt(quantity, 10);

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
      category:
      cleanCategory || "Uncategorized",
      createdAt: new Date().toISOString(),
      barcode: scannedBarcode,
      barcodeType: scannedBarcodeType,
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
      setAddModalVisible(false);

      Alert.alert(
        "Product Saved",
        `${newProduct.name} was added to your inventory.`
      );
    } catch (error) {
      console.error(
        "Error saving product:",
        error
      );

      Alert.alert(
        "Save Error",
        "The product could not be saved."
      );
    }
  };

  const deleteProduct = (
    product: Product
  ) => {
    Alert.alert(
      "Delete Product",
      `Remove ${product.name} from inventory?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const updatedProducts =
              products.filter(
                (item) =>
                  item.id !== product.id
              );

            try {
              await AsyncStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(
                  updatedProducts
                )
              );

              setProducts(
                updatedProducts
              );
            } catch (error) {
              console.error(
                "Error deleting product:",
                error
              );

              Alert.alert(
                "Delete Error",
                "The product could not be deleted."
              );
            }
          },
        },
      ]
    );
  };

  const scanImageForDate = async (imageUri: string) => {
    if (!isSupported) {
      Alert.alert(
        "OCR Not Supported",
        "Text recognition is not supported on this device."
      );
      return;
    }

    try {
      setIsScanning(true);
      setOcrText("");
      setDetectedDates([]);

      const textLines = await extractTextFromImage(imageUri);
      const fullText = textLines.join("\n");

      console.log("OCR RESULT:", fullText);

      setOcrText(fullText);

      // Normalize OCR text for date detection.
      const normalizedText = fullText
        .replace(/\r/g, "")
        .replace(/[|]/g, "I")
        .replace(/\s+/g, " ")
        .trim();

      // Common date formats:
      // 08/27/2027
      // 27-08-2027
      // 08 27 27
      // AUG 2027
      // AUG 27 2027
      const numericDateRegex =
        /\b(?:0?[1-9]|[12]\d|3[01])[\s/.-](?:0?[1-9]|1[0-2])[\s/.-](?:\d{2}|\d{4})\b|\b(?:0?[1-9]|1[0-2])[\s/.-](?:0?[1-9]|[12]\d|3[01])[\s/.-](?:\d{2}|\d{4})\b/g;

      const monthDateRegex =
        /\b(?:JAN(?:UARY)?|FEB(?:RUARY)?|MAR(?:CH)?|APR(?:IL)?|MAY|JUN(?:E)?|JUL(?:Y)?|AUG(?:UST)?|SEP(?:TEMBER)?|SEPT(?:EMBER)?|OCT(?:OBER)?|NOV(?:EMBER)?|DEC(?:EMBER)?)(?:[\s/.-]+\d{1,2})?[\s/.-]+\d{2,4}\b/gi;

      const shortMonthYearRegex =
        /\b(?:0?[1-9]|1[0-2])[\s/.-](?:\d{2}|\d{4})\b/g;

      const datePatterns = [
        numericDateRegex,
        monthDateRegex,
        shortMonthYearRegex,
      ];

      const expiryKeywords =
        /\b(BB|BBE|BEST BEFORE|BEST BY|EXP|EXPIRY|EXPIRES|EXPIRATION|USE BY)\b/i;

      const candidates: string[] = [];

      // Prioritize dates on lines containing expiry keywords.
      for (let i = 0; i < textLines.length; i++) {
        const currentLine = textLines[i].trim();
        const nextLine = textLines[i + 1]?.trim() ?? "";

        if (expiryKeywords.test(currentLine)) {
          const priorityText = `${currentLine} ${nextLine}`;

          for (const pattern of datePatterns) {
            const matches = priorityText.match(pattern) ?? [];
            candidates.push(...matches);
          }
        }
      }

      // Fall back to dates anywhere in OCR text.
      for (const pattern of datePatterns) {
        const matches = normalizedText.match(pattern) ?? [];
        candidates.push(...matches);
      }

      const dates = [...new Set(candidates)];

      setDetectedDates(dates);

       if (dates.length > 0) {
        const detectedDate = dates[0];

        const numericParts = detectedDate
          .match(/\d+/g)
          ?.map(Number);

        let normalizedDate = detectedDate;

        const monthNames: Record<string, number> = {
          JAN: 1,
          FEB: 2,
          MAR: 3,
          APR: 4,
          MAY: 5,
          JUN: 6,
          JUL: 7,
          AUG: 8,
          SEP: 9,
          SEPT: 9,
          OCT: 10,
          NOV: 11,
          DEC: 12,
        };

        const monthMatch = detectedDate
          .toUpperCase()
          .match(
            /\b(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|SEPT|OCT|NOV|DEC)[A-Z]*\b/
          );

        if (
          monthMatch &&
          numericParts &&
          numericParts.length >= 2
        ) {
          const month = monthNames[monthMatch[1]];
          const day = numericParts[0];
          const year = numericParts[1];

          const shortYear =
            year >= 2000 ? year - 2000 : year;

          normalizedDate =
            `${String(month).padStart(2, "0")}/` +
            `${String(day).padStart(2, "0")}/` +
            `${String(shortYear).padStart(2, "0")}`;
        } else if (numericParts?.length === 3) {
          let [first, second, year] = numericParts;

          if (first > 12) {
            [first, second] = [second, first];
          }

          const shortYear =
            year >= 2000 ? year - 2000 : year;

          normalizedDate =
            `${String(first).padStart(2, "0")}/` +
            `${String(second).padStart(2, "0")}/` +
            `${String(shortYear).padStart(2, "0")}`;
        }

        setExpirationDate(normalizedDate);
        setScanModalVisible(false);
        setAddModalVisible(true);

        Alert.alert(
          "Expiration Date Detected",
          `${normalizedDate}\n\nReview the product details, then tap Save Product.`
        );
      } else {
        setScanModalVisible(false);
        setAddModalVisible(true);

        Alert.alert(
          "Date Not Detected",
          "The expiration date could not be detected automatically. Enter the date manually in the Expiration Date field."
        );
      }
      
    } catch (error) {
      console.error("OCR error:", error);

      Alert.alert(
        "Scan Error",
        "The image could not be read. Try a close, straight-on photo of the date."
      );
    } finally {
      setIsScanning(false);
    }
  };  
const handleBarcodeScanned = ({
    type,
    data,
  }: {
    type: string;
    data: string;
  }) => {
    const normalizedData = data.trim();

    const isExpoDevelopmentQr =
      type === "qr" &&
      (normalizedData.startsWith("exp+") ||
        normalizedData.includes("expo-development-client"));

    if (isExpoDevelopmentQr) {
      console.log("IGNORED EXPO DEVELOPMENT QR");
      return;
    }

    if (barcodeScanned) {
      return;
    }

    setBarcodeScanned(true);
    setScannedBarcode(normalizedData);
    setScannedBarcodeType(type);
    setBarcodeScannerVisible(false);

    console.log("BARCODE TYPE:", type);
    console.log("BARCODE DATA:", normalizedData);

    Alert.alert(
      type === "qr"
        ? "QR Code Scanned"
        : "Barcode Scanned",
      `Code: ${normalizedData}\n\nNow scan the Best Before or Expiration Date.`,
      [
        {
          text: "Scan Date",
          onPress: () => {
            takeProductPhoto();
          },
        },
        {
          text: "Enter Manually",
          onPress: () => {
            setAddModalVisible(true);
          },
        },
      ]
    );
  };

  const takeProductPhoto = async () => {
    const permission = 
      await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        "Camera Permission Needed",
        "ExpireEze needs camera permission to take a product photo."
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      allowsEditing: false,
      quality: 0.8,
    });

   if (!result.canceled) {
  const imageUri = result.assets[0].uri;

  setSelectedImage(imageUri);
  setScanModalVisible(true);

  await scanImageForDate(imageUri);
}
  };

  const chooseProductPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        "Photo Permission Needed",
        "ExpireEze needs photo access to choose a product image."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled) {
      const imageUri = result.assets[0].uri;

      setSelectedImage(imageUri);
      setScanModalVisible(true);

      await scanImageForDate(imageUri);
    }
  };

  const openScanOptions = async () => {
    if (!cameraPermission?.granted) {
      const permissionResult = await requestCameraPermission();

    if (!permissionResult.granted) {
      Alert.alert(
        "Camera Permission Needed",
        "ExpireEze needs camera permission to scan product barcodes."
      );
      return;
    }
  }

  setBarcodeScanned(false);
  setBarcodeScannerVisible(true);
};

  return (
    <SafeAreaView
      style={styles.safeArea}
    >
      <StatusBar
        barStyle="light-content"
      />

      <ScrollView
        contentContainerStyle={
          styles.container
        }
        showsVerticalScrollIndicator={
          false
        }
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
          <View
            style={
              styles.statusTextContainer
            }
          >
            <Text
              style={styles.statusTitle}
            >
              🟢 Fresh
            </Text>

            <Text
              style={
                styles.statusDescription
              }
            >
              Products in good standing
            </Text>
          </View>

          <Text
            style={styles.freshNumber}
          >
            {isLoaded
              ? counts.fresh
              : "-"}
          </Text>
        </View>

        <View style={styles.statusCard}>
          <View
            style={
              styles.statusTextContainer
            }
          >
            <Text
              style={styles.statusTitle}
            >
              🟡 Expiring Soon
            </Text>

            <Text
              style={
                styles.statusDescription
              }
            >
              Products expiring within 7 days
            </Text>
          </View>

          <Text
            style={styles.warningNumber}
          >
            {isLoaded
              ? counts.soon
              : "-"}
          </Text>
        </View>

        <View style={styles.statusCard}>
          <View
            style={
              styles.statusTextContainer
            }
          >
            <Text
              style={styles.statusTitle}
            >
              🔴 Expired
            </Text>

            <Text
              style={
                styles.statusDescription
              }
            >
              Products to remove
            </Text>
          </View>

          <Text
            style={styles.expiredNumber}
          >
            {isLoaded
              ? counts.expired
              : "-"}
          </Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.primaryButton}
            activeOpacity={0.8}
            onPress={openScanOptions}
          >
            <Text
              style={
                styles.primaryButtonText
              }
            >
              📷 Scan Product
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={
              styles.secondaryButton
            }
            activeOpacity={0.8}
            onPress={() =>
              setAddModalVisible(true)
            }
          >
            <Text
              style={
                styles.secondaryButtonText
              }
            >
              ＋ Add Product
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={
              styles.secondaryButton
            }
            activeOpacity={0.8}
            onPress={() =>
              setInventoryVisible(true)
            }
          >
            <Text
              style={
                styles.secondaryButtonText
              }
            >
              📦 View Inventory
            </Text>
          </TouchableOpacity>
        </View>

        <View
          style={styles.activitySection}
        >
          <Text
            style={styles.sectionTitle}
          >
            Recent Activity
          </Text>

          <View
            style={styles.activityCard}
          >
            {newestProduct ? (
              <>
                <Text
                  style={
                    styles.activityTitle
                  }
                >
                  {newestProduct.name}
                </Text>

                <Text
                  style={
                    styles.activityDescription
                  }
                >
                  Expires{" "}
                  {
                    newestProduct.expirationDate
                  }
                </Text>

                <Text
                  style={
                    styles.activityDetails
                  }
                >
                  Qty:{" "}
                  {newestProduct.quantity}
                  {" · "}
                  {newestProduct.category}
                </Text>
              </>
            ) : (
              <>
                <Text
                  style={
                    styles.activityTitle
                  }
                >
                  No recent activity yet
                </Text>

                <Text
                  style={
                    styles.activityDescription
                  }
                >
                  Products you add will appear here.
                </Text>
              </>
            )}
          </View>
        </View>
      </ScrollView>

      {/* ADD PRODUCT MODAL */}

      <Modal
        visible={addModalVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={closeAddModal}
      >
        <SafeAreaView
          style={styles.modalSafeArea}
        >
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
              showsVerticalScrollIndicator={
                false
              }
            >
              <TouchableOpacity
                onPress={closeAddModal}
                activeOpacity={0.7}
              >
                <Text
                  style={
                    styles.cancelButton
                  }
                >
                  ‹ Cancel
                </Text>
              </TouchableOpacity>

              <Text
                style={styles.modalTitle}
              >
                Add Product
              </Text>

              <Text
                style={
                  styles.modalSubtitle
                }
              >
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
                onChangeText={
                  setProductName
                }
              />

              <Text style={styles.label}>
                Expiration Date
              </Text>

              <TextInput
                style={styles.input}
                placeholder="MM/DD/YY"
                placeholderTextColor="#6F7A84"
                value={expirationDate}
                onChangeText={(text) =>
                  setExpirationDate(
                    formatExpirationDate(
                      text
                    )
                  )
                }
                keyboardType="number-pad"
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
                <Text
                  style={
                    styles.saveButtonText
                  }
                >
                  Save Product
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>


      {/* SCAN PREVIEW MODAL */}

      <Modal
        visible={scanModalVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setScanModalVisible(false)}
      >
        <SafeAreaView style={styles.modalSafeArea}>
          <ScrollView
            contentContainerStyle={styles.scanContainer}
            showsVerticalScrollIndicator={false}
          >
            <TouchableOpacity
              onPress={() => setScanModalVisible(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelButton}>‹ Dashboard</Text>
            </TouchableOpacity>

            <Text style={styles.modalTitle}>Product Image</Text>

            <Text style={styles.modalSubtitle}>
              Image capture is working. Date reading comes in the next scanner milestone.
            </Text>

            {selectedImage ? (
              <Image
                source={{ uri: selectedImage }}
                style={styles.scanPreview}
                resizeMode="contain"
              />
            ) : null}

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={takeProductPhoto}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>
                📷 Take Another Photo
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={chooseProductPhoto}
              activeOpacity={0.8}
            >
              <Text style={styles.secondaryButtonText}>
                🖼️ Choose Another Image
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
      {/* BARCODE SCANNER MODAL */}
      <Modal
        visible={barcodeScannerVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => {
          setBarcodeScannerVisible(false);
          setBarcodeScanned(false);
        }}
      >
        <SafeAreaView style={styles.modalSafeArea}>
          <View style={{ flex: 1 }}>
            <CameraView
              style={{ flex: 1 }}
              autofocus="on"
              facing="back"
              barcodeScannerSettings={{
                barcodeTypes: [
                  "ean13",
                  "ean8",
                  "upc_a",
                  "upc_e",
                  "qr",
                ],
              }}
              onBarcodeScanned={
                barcodeScanned ? undefined : handleBarcodeScanned
              }
            />

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => {
                setBarcodeScannerVisible(false);
                setBarcodeScanned(false);
              }}
            >
              <Text style={styles.primaryButtonText}>
                Cancel Scan
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
      {/* INVENTORY MODAL */}

      <Modal
        visible={inventoryVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() =>
          setInventoryVisible(false)
        }
      >
        <SafeAreaView
          style={styles.modalSafeArea}
        >
          <View
            style={
              styles.inventoryHeader
            }
          >
            <TouchableOpacity
              onPress={() =>
                setInventoryVisible(false)
              }
              activeOpacity={0.7}
            >
              <Text
                style={
                  styles.cancelButton
                }
              >
                ‹ Dashboard
              </Text>
            </TouchableOpacity>

            <Text
              style={styles.modalTitle}
            >
              Inventory
            </Text>

            <Text
              style={
                styles.modalSubtitle
              }
            >
              {products.length}{" "}
              {products.length === 1
                ? "product"
                : "products"}{" "}
              tracked
            </Text>
          </View>

          <ScrollView
            contentContainerStyle={
              styles.inventoryContainer
            }
            showsVerticalScrollIndicator={
              false
            }
          >
            {products.length === 0 ? (
              <View
                style={
                  styles.emptyInventory
                }
              >
                <Text
                  style={
                    styles.emptyInventoryTitle
                  }
                >
                  📦 No products yet
                </Text>

                <Text
                  style={
                    styles.emptyInventoryText
                  }
                >
                  Add your first product from the dashboard.
                </Text>
              </View>
            ) : (
              products.map((product) => (
                <View
                  key={product.id}
                  style={
                    styles.inventoryCard
                  }
                >
                  <View
                    style={
                      styles.inventoryTopRow
                    }
                  >
                    <View
                      style={
                        styles.inventoryNameArea
                      }
                    >
                      <Text
                        style={
                          styles.inventoryName
                        }
                      >
                        {product.name}
                      </Text>

                      <Text
                        style={
                          styles.inventoryStatus
                        }
                      >
                        {getStatusLabel(
                          product.expirationDate
                        )}
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={
                        styles.deleteButton
                      }
                      onPress={() =>
                        deleteProduct(
                          product
                        )
                      }
                      activeOpacity={0.7}
                    >
                      <Text
                        style={
                          styles.deleteButtonText
                        }
                      >
                        Delete
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View
                    style={
                      styles.inventoryDivider
                    }
                  />

                  <Text
                    style={
                      styles.inventoryDetail
                    }
                  >
                    Expires:{" "}
                    {
                      product.expirationDate
                    }
                  </Text>

                  <Text
                    style={
                      styles.inventoryDetail
                    }
                  >
                    Quantity:{" "}
                    {product.quantity}
                  </Text>

                  <Text
                    style={
                      styles.inventoryDetail
                    }
                  >
                    Category:{" "}
                    {product.category}
                  </Text>
                </View>
              ))
            )}
          </ScrollView>
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

  inventoryHeader: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },

  inventoryContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  inventoryCard: {
    backgroundColor: "#1E242B",
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#293039",
  },

  inventoryTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  inventoryNameArea: {
    flex: 1,
    paddingRight: 12,
  },

  inventoryName: {
    color: "#FFFFFF",
    fontSize: 19,
    fontWeight: "700",
  },

  inventoryStatus: {
    color: "#C4CBD1",
    fontSize: 14,
    marginTop: 7,
  },

  inventoryDivider: {
    height: 1,
    backgroundColor: "#303841",
    marginVertical: 14,
  },

  inventoryDetail: {
    color: "#B6BEC6",
    fontSize: 14,
    marginBottom: 7,
  },

  deleteButton: {
    backgroundColor: "#3A2023",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },

  deleteButtonText: {
    color: "#FF8A80",
    fontSize: 13,
    fontWeight: "700",
  },

  emptyInventory: {
    backgroundColor: "#1E242B",
    borderRadius: 16,
    padding: 30,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#293039",
  },

  emptyInventoryTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },

  emptyInventoryText: {
    color: "#9BA5AE",
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
  },

  scanContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
  },

  scanPreview: {
    width: "100%",
    height: 420,
    backgroundColor: "#1E242B",
    borderRadius: 16,
    marginBottom: 20,
  },

});