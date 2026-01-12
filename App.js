import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ActivityIndicator, StatusBar, KeyboardAvoidingView, Platform, Image, SafeAreaView } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Scan, User, Lock, LogOut, ShieldCheck, Settings } from 'lucide-react-native';
import Constants from 'expo-constants'; // Mevcut versiyonu okumak için

const Tab = createBottomTabNavigator();

// --- BİLEŞEN: QR TARAYICI (ANA SAYFA) ---
function QRScannerScreen({ handleLogout, scanned, handleBarCodeScanned }) {
  return (
    <View style={styles.darkContainer}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Delta Tarayıcı</Text>
        <TouchableOpacity onPress={handleLogout}><LogOut color="#901d35" size={24} /></TouchableOpacity>
      </View>

      <View style={styles.qrContainer}>
        <CameraView
          style={StyleSheet.absoluteFillObject}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        />
        <View style={styles.overlay}>
          <View style={styles.focusedContainer}><View style={styles.scanFrame} /></View>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Sitedeki QR kodu kutucuğun içine odaklayın</Text>
      </View>
    </View>
  );
}

// --- BİLEŞEN: PROFİL SAYFASI ---
function ProfileScreen({ handleLogout }) {
  const [userData, setUserData] = useState({ username: '', id: '', profilePic: '' });
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [latestVersion, setLatestVersion] = useState('');

  // Mevcut uygulama versiyonu (app.json'dan gelir)
  const currentVersion = Constants.expoConfig.version;

  useEffect(() => {
    loadUser();
    checkUpdates();
  }, []);

  const loadUser = async () => {
    const id = await AsyncStorage.getItem('user_id');
    const name = await AsyncStorage.getItem('username');
    const pic = await AsyncStorage.getItem('profile_pic');
    const fullPicUrl = pic ? (pic.startsWith('http') ? pic : `https://forum.nexabag.xyz/${pic}`) : null;
    setUserData({ username: name, id: id, profilePic: fullPicUrl });
  };

  const checkUpdates = async () => {
    try {
      // GitHub Raw linkini kullanıyoruz (Senin kullanıcı adın ve repo adınla)
      const GITHUB_PACKAGE_URL = "https://raw.githubusercontent.com/SiberizmBey/DeltaMobile/main/package.json";

      const response = await fetch(GITHUB_PACKAGE_URL);
      const data = await response.json();

      const remoteVersion = data.version; // GitHub'daki versiyon (Örn: 26.1.0)
      setLatestVersion(remoteVersion);

      // Basit bir kıyaslama (Versiyonlar string olduğu için sayıya çevirip bakıyoruz)
      if (parseFloat(remoteVersion) > parseFloat(currentVersion)) {
        setUpdateAvailable(true);
      }
    } catch (error) {
      console.log("Güncelleme kontrolü başarısız:", error);
    }
  };

  return (
    <SafeAreaView style={styles.darkContainer}>
      <View style={styles.profileHeader}>
        <View style={styles.profileAvatar}>
          {userData.profilePic ? (
            <Image source={{ uri: userData.profilePic }} style={{ width: 100, height: 100, borderRadius: 50 }} />
          ) : (
            <User color="#901d35" size={50} />
          )}
        </View>
        <Text style={styles.profileName}>{userData.username}</Text>
        <Text style={styles.profileId}>Üye ID: {userData.id}</Text>

        {/* --- GÜNCELLEME UYARISI --- */}
        {updateAvailable && (
          <TouchableOpacity
            style={styles.updateBadge}
            onPress={() => Alert.alert("Güncelleme Hazır", `Yeni sürüm (${latestVersion}) mevcut. Lütfen GitHub üzerinden indirin.`)}
          >
            <Text style={styles.updateBadgeText}>YENİ GÜNCELLEME MEVCUT (v{latestVersion})</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.menuContainer}>
        <View style={styles.menuItem}>
          <ShieldCheck color="#666" size={20} />
          <Text style={styles.menuText}>Versiyon: {currentVersion}</Text>
        </View>

        <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
          <LogOut color="#901d35" size={20} />
          <Text style={[styles.menuText, { color: '#901d35' }]}>Oturumu Kapat</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// --- ANA UYGULAMA ---
export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  useEffect(() => { checkLoginStatus(); }, []);

  const checkLoginStatus = async () => {
    const userId = await AsyncStorage.getItem('user_id');
    if (userId) setIsLoggedIn(true);
    setCheckingAuth(false);
  };

  const handleLogin = async () => {
    if (!username || !password) { Alert.alert("Hata", "Alanları boş bırakma!"); return; }
    setLoading(true);
    try {
      const response = await fetch('https://forum.nexabag.xyz/auth.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();

      if (data.success) {
        // Tüm bilgileri kaydediyoruz
        await AsyncStorage.setItem('user_id', data.user.id.toString());
        await AsyncStorage.setItem('username', data.user.username);
        await AsyncStorage.setItem('profile_pic', data.user.profile_picture || ''); // Foto yoksa boş string

        setIsLoggedIn(true);
      } else {
        Alert.alert("Hata", "Bilgiler yanlış.");
      }
    } catch (e) {
      Alert.alert("Hata", "Sunucu hatası.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('user_id');
    setIsLoggedIn(false);
  };

  const handleBarCodeScanned = async ({ data }) => {
    setScanned(true);
    const userId = await AsyncStorage.getItem('user_id');
    try {
      const response = await fetch('https://forum.nexabag.xyz/qr_verify.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qr_token: data, user_id: userId }),
      });
      const result = await response.json();
      Alert.alert(result.success ? "Başarılı" : "Hata", result.message);
    } finally { setTimeout(() => setScanned(false), 2000); }
  };

  if (checkingAuth) return <View style={styles.darkContainer}><ActivityIndicator color="#901d35" size="large" /></View>;

  if (!isLoggedIn) {
    return (
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.darkContainer}>
        <View style={styles.loginCard}>
          <View style={styles.logoCircle}>
            <Image source={require('./assets/main_icon.png')} style={styles.logoImage} resizeMode="contain" />
          </View>
          <Text style={styles.deltaTitle}>Delta Mobile</Text>
          <Text style={styles.deltaMiniTitle}>Bir NexaBAG Studios uygulamasıdır</Text>
          <View style={styles.inputWrapper}>
            <User color="#666" size={20} style={styles.inputIcon} />
            <TextInput style={styles.deltaInput} placeholder="KULLANICI ADI" placeholderTextColor="#666" value={username} onChangeText={setUsername} autoCapitalize="none" />
          </View>
          <View style={styles.inputWrapper}>
            <Lock color="#666" size={20} style={styles.inputIcon} />
            <TextInput style={styles.deltaInput} placeholder="ŞİFRE" placeholderTextColor="#666" value={password} onChangeText={setPassword} secureTextEntry />
          </View>
          <TouchableOpacity style={styles.deltaButton} onPress={handleLogin} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.deltaButtonText}>GİRİŞ YAP</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: { backgroundColor: '#1c1c1f', borderTopWidth: 0, height: 70, paddingBottom: 10 },
          tabBarActiveTintColor: '#901d35',
          tabBarInactiveTintColor: '#666',
        }}
      >
        <Tab.Screen
          name="Tarayıcı"
          options={{ tabBarIcon: ({ color }) => <Scan color={color} size={24} /> }}
        >
          {() => <QRScannerScreen handleLogout={handleLogout} scanned={scanned} handleBarCodeScanned={handleBarCodeScanned} />}
        </Tab.Screen>

        <Tab.Screen
          name="Profil"
          options={{ tabBarIcon: ({ color }) => <User color={color} size={24} /> }}
        >
          {() => <ProfileScreen handleLogout={handleLogout} />}
        </Tab.Screen>
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  darkContainer: { flex: 1, backgroundColor: '#101013', padding: 20 },
  loginCard: { width: '100%', alignItems: 'center', marginTop: 100 },
  logoCircle: { width: 120, height: 120, borderRadius: 40, backgroundColor: '#1a1a1a', alignItems: 'center', justifyContent: 'center', marginBottom: 20, borderWidth: 1, borderColor: '#333', overflow: 'hidden' },
  logoImage: { width: '100%', height: '100%' },
  deltaTitle: { fontSize: 28, fontWeight: '900', color: '#fff', letterSpacing: 2 },
  deltaMiniTitle: { fontSize: 10, color: '#666', marginBottom: 40 },
  inputWrapper: { width: '100%', flexDirection: 'row', alignItems: 'center', backgroundColor: '#1c1c1f', borderRadius: 30, marginBottom: 15, paddingHorizontal: 20, height: 60, borderWidth: 1, borderColor: '#3A3A3AFF' },
  deltaInput: { flex: 1, color: '#fff', fontWeight: 'bold' },
  deltaButton: { width: '100%', height: 60, backgroundColor: '#901d35', borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  deltaButtonText: { color: '#fff', fontWeight: '900' },
  header: { height: 80, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 40 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  qrContainer: { flex: 0.8, borderRadius: 25, overflow: 'hidden', backgroundColor: '#000' },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  focusedContainer: { width: 220, height: 220 },
  scanFrame: { flex: 1, borderWidth: 2, borderColor: '#901d35', borderRadius: 20 },
  footer: { height: 100, justifyContent: 'center', alignItems: 'center' },
  footerText: { color: '#666', textAlign: 'center' },
  // Profil Stilleri
  profileHeader: { alignItems: 'center', marginTop: 60, marginBottom: 40 },
  profileAvatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#1c1c1f', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#901d35' },
  profileName: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginTop: 15 },
  profileId: { color: '#666', fontSize: 14 },
  menuContainer: { width: '100%' },
  menuItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1c1c1f', padding: 20, borderRadius: 15, marginBottom: 10 },
  menuText: { color: '#fff', marginLeft: 15, fontWeight: '600' },
  updateBadge: {
    backgroundColor: '#901d3522', // Çok şeffaf kırmızı
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginTop: 15,
    borderWidth: 1,
    borderColor: '#901d35',
  },
  updateBadgeText: {
    color: '#901d35',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
});