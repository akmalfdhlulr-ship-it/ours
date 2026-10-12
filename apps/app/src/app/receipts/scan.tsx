import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  Platform,
  Dimensions,
  ActivityIndicator,
  Modal,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { luminousColors } from '@ours/design-tokens';
import { api } from '../../services/api';
import { useCoupleData, MenuItem } from '../../context/couple-data-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ScannedReceiptData {
  merchantName: string;
  category: string;
  items: MenuItem[];
  subtotal: number;
  tax: number;
  grandTotal: number;
  accuracy: number;
  date: string;
  receiptImageUri?: string;
}

export default function ScanReceiptScreen() {
  const router = useRouter();
  const { addExpense } = useCoupleData();

  const [isFlashOn, setIsFlashOn] = useState<boolean>(true);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [isProcessingOcr, setIsProcessingOcr] = useState<boolean>(false);
  const [ocrStepText, setOcrStepText] = useState<string>('Memindai format struk...');
  const [capturedImageUri, setCapturedImageUri] = useState<string | null>(null);

  const scanlineAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanlineAnim, {
          toValue: 1,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(scanlineAnim, {
          toValue: 0,
          duration: 1800,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [scanlineAnim]);

  // Process image with genuine OCR
  const processImageOcr = async (uri: string, base64Data?: string | null) => {
    setIsProcessingOcr(true);
    setCapturedImageUri(uri);
    setOcrStepText('Mengirim gambar ke mesin OCR AI...');

    try {
      const reqPayload: { imageBase64?: string; imageUrl?: string } = {};
      if (base64Data && base64Data.trim().length > 0) {
        reqPayload.imageBase64 = base64Data;
      } else if (uri.startsWith('http://') || uri.startsWith('https://')) {
        reqPayload.imageUrl = uri;
      }

      if (!reqPayload.imageBase64 && !reqPayload.imageUrl) {
        setIsProcessingOcr(false);
        Alert.alert(
          'Gambar Tidak Ditemukan',
          'Pastikan Anda telah mengambil foto struk dari kamera atau memilih gambar dari galeri.'
        );
        return;
      }

      setOcrStepText('Menganalisis teks kasir & rincian harga...');
      const rawRes = await api.expenses.scanReceipt(reqPayload);
      const result: any = (rawRes as any)?.data || rawRes;

      if (!result || (!result.grandTotal && (!result.items || result.items.length === 0))) {
        setIsProcessingOcr(false);
        Alert.alert(
          'Struk Tidak Terbaca',
          'Sistem OCR tidak dapat mendeteksi teks transaksi atau rincian harga dari foto ini. Pastikan struk terlihat jelas, tegak lurus, tidak terlipat, dan pencahayaan cukup.'
        );
        return;
      }

      const mappedItems: MenuItem[] = (result.items || []).map((it: any) => ({
        qty: `${it.quantity || 1}x`,
        name: it.name || it.itemName || 'Item Menu',
        category: it.category || 'Menu',
        price: `Rp ${(it.lineTotal || it.unitPrice || 0).toLocaleString('id-ID')}`,
        priceNumber: it.lineTotal || it.unitPrice || 0,
      }));

      const subtotal =
        result.subtotal ||
        mappedItems.reduce((acc, it) => acc + (it.priceNumber || 0), 0) ||
        result.grandTotal ||
        0;
      const tax =
        (result.tax || 0) + (result.serviceCharge || 0) || Math.round(subtotal * 0.1);
      const grandTotal = result.grandTotal || subtotal + tax;

      const parsedData: ScannedReceiptData = {
        merchantName: result.merchantName || 'Tempat Kencan',
        category: result.category || 'Kuliner & Dining',
        items: mappedItems,
        subtotal,
        tax,
        grandTotal,
        accuracy: result.confidence || 95,
        date: result.transactionDate || 'Hari Ini',
        receiptImageUri: uri,
      };

      setOcrStepText('Selesai! Membuka rincian verifikasi...');
      setIsProcessingOcr(false);

      // Navigate to verification screen with real data encoded in params
      router.push({
        pathname: '/receipts/[id]',
        params: {
          id: 'scanned-latest',
          data: JSON.stringify(parsedData),
        },
      } as any);
    } catch (err: any) {
      setIsProcessingOcr(false);
      Alert.alert(
        'Gagal Membaca Struk',
        err?.message ||
          'Pastikan struk terlihat jelas, tidak buram, dan pencahayaan cukup. Silakan coba lagi.'
      );
    }
  };

  // Launch camera
  const handleLaunchCamera = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Izin Kamera',
          'Izin kamera diperlukan untuk memotret struk. Silakan buka galeri jika ingin memilih foto yang sudah ada.',
          [
            { text: '🖼️ Buka Galeri', onPress: handleLaunchGallery },
            { text: 'Batal', style: 'cancel' },
          ]
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        await processImageOcr(asset.uri, asset.base64);
      }
    } catch (err: any) {
      Alert.alert(
        'Kamera Bermasalah',
        'Kamera fisik tidak dapat diakses saat ini. Silakan gunakan foto dari galeri.',
        [
          { text: '🖼️ Buka Galeri', onPress: handleLaunchGallery },
          { text: 'Batal', style: 'cancel' },
        ]
      );
    }
  };

  // Launch gallery
  const handleLaunchGallery = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Izin Galeri', 'Aplikasi memerlukan izin galeri untuk memilih foto struk.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        await processImageOcr(asset.uri, asset.base64);
      }
    } catch (err: any) {
      Alert.alert('Kendala Galeri', err?.message || 'Gagal membuka galeri.');
    }
  };

  const scanlineTranslateY = scanlineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [10, 240],
  });

  return (
    <View style={styles.screenRoot}>
      {/* ---------------- Header ---------------- */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            activeOpacity={0.7}
            accessibilityLabel="Kembali">
            <Ionicons name="chevron-back" size={24} color={luminousColors.onSurface} />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Pindai Struk Kencan
          </Text>
        </View>
      </View>

      {/* ---------------- Camera Viewport ---------------- */}
      <View style={styles.cameraContainer}>
        {/* Real Receipt Scene Background or Camera Preview Placeholder */}
        {capturedImageUri ? (
          <Image
            source={{ uri: capturedImageUri }}
            style={styles.cameraFeedImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.cameraFeedPlaceholder}>
            <Ionicons name="camera-outline" size={64} color="rgba(255, 255, 255, 0.25)" />
            <Text style={styles.cameraFeedHint}>Kamera Siap Memindai Struk</Text>
          </View>
        )}

        {/* Ambient Dark Gradient Scrims */}
        <View style={styles.scrimTop} />
        <View style={styles.scrimBottom} />

        {/* Floating Top Bar inside Viewport */}
        <View style={styles.viewportTopBar}>
          <TouchableOpacity
            style={styles.viewportCircleBtn}
            onPress={() => router.back()}
            activeOpacity={0.8}>
            <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.viewportModePill}>
            <View style={styles.pulseDot} />
            <Text style={styles.viewportModeText}>Smart AI Receipt OCR</Text>
          </View>

          <TouchableOpacity
            style={[
              styles.viewportCircleBtn,
              isFlashOn && { backgroundColor: luminousColors.primaryContainer },
            ]}
            onPress={() => setIsFlashOn(!isFlashOn)}
            activeOpacity={0.8}>
            <Ionicons name={isFlashOn ? 'flash' : 'flash-off'} size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Floating Helper Banner */}
        <View style={styles.helperBanner}>
          <View style={styles.helperIconCircle}>
            <Ionicons name="scan-outline" size={18} color={luminousColors.primary} />
          </View>
          <Text style={styles.helperBannerText}>
            Arahkan kamera ke struk kencan fisik atau pilih foto struk dari galeri untuk membaca item & total secara otomatis.
          </Text>
        </View>

        {/* Reticle / OCR Bounding Box */}
        <View style={styles.reticleWrapper}>
          <View style={styles.reticleBox}>
            {/* Corner Rose Brackets */}
            <View style={[styles.cornerBracket, styles.bracketTopLeft]} />
            <View style={[styles.cornerBracket, styles.bracketTopRight]} />
            <View style={[styles.cornerBracket, styles.bracketBottomLeft]} />
            <View style={[styles.cornerBracket, styles.bracketBottomRight]} />

            {/* Laser Scanline */}
            <Animated.View
              style={[
                styles.laserLine,
                { transform: [{ translateY: scanlineTranslateY }] },
              ]}
            />

            {/* Live Detected Preview Pill */}
            <View style={styles.ocrDetectedCard}>
              <View style={styles.ocrHeaderRow}>
                <View style={styles.ocrTitleGroup}>
                  <View style={styles.ocrSyncDot} />
                  <Text style={styles.ocrMerchantName}>Area Pemindaian Teks</Text>
                </View>
                <View style={styles.ocrStatusPill}>
                  <Text style={styles.ocrStatusText}>AI Ready</Text>
                </View>
              </View>

              <View style={styles.ocrPriceRow}>
                <Text style={styles.ocrItemsDesc}>Potret atau unggah struk asli</Text>
                <Text style={styles.ocrPriceVal}>Ekstraksi Nyata</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Bottom Shutter Controls Floating Island */}
        <View style={styles.controlsIslandWrapper}>
          <View style={styles.controlsIsland}>
            {/* Gallery Picker */}
            <TouchableOpacity
              style={styles.islandSideBtn}
              onPress={handleLaunchGallery}
              activeOpacity={0.8}>
              <Ionicons name="images-outline" size={26} color="#FFFFFF" />
              <Text style={styles.islandSideBtnText}>Galeri</Text>
            </TouchableOpacity>

            {/* Main Shutter (Camera) */}
            <TouchableOpacity
              style={[
                styles.shutterRing,
                isCapturing && { transform: [{ scale: 0.92 }] },
              ]}
              onPress={handleLaunchCamera}
              activeOpacity={0.88}>
              <View style={styles.shutterInnerCircle}>
                <Ionicons name="camera" size={30} color="#FFFFFF" />
              </View>
            </TouchableOpacity>

            {/* Hint Info */}
            <View style={styles.islandSideBtn}>
              <Ionicons name="receipt-outline" size={26} color="rgba(255, 255, 255, 0.6)" />
              <Text style={[styles.islandSideBtnText, { color: 'rgba(255, 255, 255, 0.6)' }]}>Struk Asli</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Bottom Tip Card */}
      <View style={styles.bottomTipCard}>
        <View style={styles.tipIconCircle}>
          <Ionicons name="sparkles" size={20} color={luminousColors.secondary} />
        </View>
        <View style={styles.tipTextCol}>
          <Text style={styles.tipTitle}>Sinkronisasi Dompet Berdua</Text>
          <Text style={styles.tipDesc}>
            Hasil ekstraksi OCR nyata akan langsung diverifikasi dan otomatis tersimpan ke catatan pengeluaran berdua.
          </Text>
        </View>
      </View>

      {/* OCR Processing Overlay */}
      {isProcessingOcr && (
        <View style={styles.ocrLoadingOverlay}>
          <View style={styles.ocrLoadingCard}>
            <ActivityIndicator size="large" color={luminousColors.primary} />
            <Text style={styles.ocrLoadingTitle}>Menganalisis Struk Kencan...</Text>
            <Text style={styles.ocrLoadingStep}>{ocrStepText}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screenRoot: {
    flex: 1,
    backgroundColor: luminousColors.surface,
  },
  header: {
    height: 64,
    paddingTop: Platform.OS === 'ios' ? 12 : 8,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(250, 248, 255, 0.95)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(185, 5, 56, 0.05)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: luminousColors.onSurface,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerActionBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 218, 219, 0.5)',
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#000000',
    overflow: 'hidden',
  },
  cameraFeedImage: {
    width: '100%',
    height: '100%',
  },
  scrimTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  scrimBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 180,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  viewportTopBar: {
    position: 'absolute',
    top: 14,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  viewportCircleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewportModePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 8,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: luminousColors.primaryContainer,
  },
  viewportModeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  helperBanner: {
    position: 'absolute',
    top: 68,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  helperIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: luminousColors.primaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helperBannerText: {
    flex: 1,
    fontSize: 11,
    color: luminousColors.onSurface,
    lineHeight: 16,
  },
  reticleWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reticleBox: {
    width: SCREEN_WIDTH - 64,
    height: 270,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    position: 'relative',
    overflow: 'hidden',
  },
  cornerBracket: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: luminousColors.primary,
  },
  bracketTopLeft: {
    top: 4,
    left: 4,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 10,
  },
  bracketTopRight: {
    top: 4,
    right: 4,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 10,
  },
  bracketBottomLeft: {
    bottom: 4,
    left: 4,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 10,
  },
  bracketBottomRight: {
    bottom: 4,
    right: 4,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 10,
  },
  laserLine: {
    width: '100%',
    height: 3,
    backgroundColor: luminousColors.primary,
    shadowColor: luminousColors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 4,
  },
  ocrDetectedCard: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: 14,
    padding: 10,
    gap: 4,
  },
  ocrHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ocrTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ocrSyncDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: luminousColors.primary,
  },
  ocrMerchantName: {
    fontSize: 12,
    fontWeight: '700',
    color: luminousColors.onSurface,
  },
  ocrStatusPill: {
    backgroundColor: luminousColors.primaryFixed,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  ocrStatusText: {
    fontSize: 9,
    fontWeight: '700',
    color: luminousColors.primary,
  },
  ocrPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ocrItemsDesc: {
    fontSize: 10,
    color: luminousColors.onSurfaceVariant,
  },
  ocrPriceVal: {
    fontSize: 11,
    fontWeight: '700',
    color: luminousColors.primary,
  },
  controlsIslandWrapper: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  controlsIsland: {
    width: '100%',
    backgroundColor: 'rgba(20, 27, 46, 0.75)',
    borderRadius: 36,
    paddingVertical: 12,
    paddingHorizontal: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  islandSideBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
  },
  islandSideBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 4,
  },
  shutterRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  shutterInnerCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: luminousColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomTipCard: {
    padding: 16,
    backgroundColor: 'rgba(250, 248, 255, 0.98)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(185, 5, 56, 0.06)',
  },
  tipIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: luminousColors.secondaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipTextCol: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: luminousColors.onSurface,
  },
  tipDesc: {
    fontSize: 11,
    color: luminousColors.onSurfaceVariant,
    lineHeight: 16,
    marginTop: 2,
  },
  ocrLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(19, 27, 46, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 99,
  },
  ocrLoadingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    gap: 12,
    width: 280,
  },
  ocrLoadingTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: luminousColors.onSurface,
  },
  ocrLoadingStep: {
    fontSize: 12,
    color: luminousColors.onSurfaceVariant,
    textAlign: 'center',
  },
  cameraFeedPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#0D111A',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  cameraFeedHint: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 13,
    fontWeight: '500',
  },
});
