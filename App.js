import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ActivityIndicator, StatusBar, KeyboardAvoidingView, Platform, Image, SafeAreaView, Linking, ScrollView, Modal } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { FlaskConical, Scan, User, Lock, LogOut, ShieldCheck, Settings } from 'lucide-react-native';
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
      const GITHUB_APP_JSON_URL = `https://raw.githubusercontent.com/SiberizmBey/DeltaMobile/main/app.json?t=${new Date().getTime()}`;
      const response = await fetch(GITHUB_APP_JSON_URL);
      const data = await response.json();
      const remoteVersion = data.expo.version;
      const localVersion = Constants.expoConfig.version;
      if (parseFloat(remoteVersion) > parseFloat(localVersion)) {
        setLatestVersion(remoteVersion);
        setUpdateAvailable(true);
      }
    } catch (error) { console.log(error); }
  };

  return (
    <SafeAreaView style={styles.darkContainer}>
      <View style={styles.profileHeader}>
        <View style={styles.profileAvatar}>
          {userData.profilePic ? (
            <Image source={{ uri: userData.profilePic }} style={{ width: 100, height: 100, borderRadius: 50 }} />
          ) : (
            <View style={styles.avatarPlaceholder}><User color="#901d35" size={50} /></View>
          )}
        </View>
        <Text style={styles.profileName}>{userData.username || 'Kullanıcı'}</Text>
        <Text style={styles.profileId}>Üye ID: {userData.id || '---'}</Text>

        {updateAvailable && (
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.updateBanner}
            onPress={() => Linking.openURL("https://github.com/SiberizmBey/DeltaMobile/releases")}
          >
            <View style={styles.updateLeft}>
              <View style={styles.updateIconCircle}><ShieldCheck color="#fff" size={24} /></View>
              <View>
                <Text style={styles.updateTitle}>Yeni Sürüm Hazır!</Text>
                <Text style={styles.updateVersion}>Sürüm v{latestVersion} yayınlandı</Text>
              </View>
            </View>
            <View style={styles.updateButton}><Text style={styles.updateButtonText}>İNDİR</Text></View>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.menuContainer}>
        <View style={styles.menuItem}>
          <ShieldCheck color="#666" size={20} />
          <Text style={styles.menuText}>Uygulama Sürümü: {currentVersion}</Text>
        </View>
        <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
          <LogOut color="#901d35" size={20} />
          <Text style={[styles.menuText, { color: '#901d35' }]}>Oturumu Kapat</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// --- BİLEŞEN: ANA SAYFA (LABS) ---
function HomeScreen() {
  const [labsData, setLabsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null); // Seçilen proje/deney
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => { fetchLabsData(); }, []);

  const fetchLabsData = async () => {
    try {
      const response = await fetch('https://labs.nexabag.xyz/labs.data.json');
      const data = await response.json();
      setLabsData(data);
    } catch (error) { console.log("Hata:", error); } finally { setLoading(false); }
  };

  const openDetail = (item) => {
    setSelectedItem(item);
    setModalVisible(true);
  };

  const renderCard = (item, isProject = true) => (
    <TouchableOpacity
      key={item.slug}
      style={styles.labsCard}
      onPress={() => openDetail(item)}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardBadge}>{isProject ? 'PROJE' : 'DENEY'}</Text>
        <Text style={styles.cardStage}>
          {item.stage === 'live' ? 'AKTİF' : 'PASİF'}
        </Text>
      </View>
      <Text style={styles.cardTitle}>{item.title}</Text>
      <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.darkContainer}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={styles.labsHero}>
          <Text style={styles.labsHeroTitle}>Nexa Labs</Text>
          <Text style={styles.labsHeroSub}>Ar-Ge ve Prototip Merkezi</Text>
        </View>

        <Text style={styles.sectionTitle}>Aktif Projeler</Text>
        {labsData?.projects.map(project => renderCard(project, true))}

        <Text style={styles.sectionTitle}>Deneyler</Text>
        {labsData?.experiments.map(exp => renderCard(exp, false))}
      </ScrollView>

      {/* --- DETAY MODAL (PROFESYONEL GÖRÜNÜM) --- */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedItem?.title}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={{ color: '#901d35', fontWeight: 'bold' }}>KAPAT</Text>
              </TouchableOpacity>
            </View>

            <ScrollView>
              <Text style={styles.detailHeroText}>{selectedItem?.detail?.hero}</Text>

              <Text style={styles.detailSectionLabel}>HAKKINDA</Text>
              <Text style={styles.detailLongDesc}>{selectedItem?.detail?.longDescription}</Text>

              <Text style={styles.detailSectionLabel}>TEKNOLOJİ YIĞINI</Text>
              <View style={styles.tagRow}>
                {selectedItem?.detail?.stack?.map((s, i) => (
                  <View key={i} style={styles.stackTag}><Text style={styles.stackTagText}>{s}</Text></View>
                ))}
              </View>

              {selectedItem?.links?.[0]?.url && (
                <TouchableOpacity
                  style={styles.detailLinkButton}
                  onPress={() => Linking.openURL(selectedItem.links[0].url)}
                >
                  <Text style={styles.detailLinkButtonText}>PROJEYE GİT</Text>
                </TouchableOpacity>
              )}
              <View style={{ height: 30 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
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
          tabBarShowLabel: true, // Yazıları kaldırıp sadece ikon bırakıyoruz (Daha modern)
          tabBarStyle: {
            position: 'absolute', // Havada asılı kalması için şart
            bottom: 30,           // Ekranın en altından uzaklık
            marginLeft: 50,
            marginRight: 50,
            height: 65,           // Adanın yüksekliği
            backgroundColor: '#1c1c1f',
            borderRadius: 35,     // Köşeleri tam yuvarlak yapıyoruz
            alignContent: 'center',
            justifyContent: 'center',

            borderWidth: 1,
            borderColor: '#333',

            // Gölge Efektleri (Yükselti hissi verir)
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.4,
            shadowRadius: 10,
            elevation: 15,        // Android için gölge derinliği
          },
          tabBarItemStyle: {
            height: 65,               // Barın tam yüksekliği kadar alan tanımla
            justifyContent: 'center', // Dikeyde tam merkez
            alignItems: 'center',     // Yatayda tam merkez
            margin: 0,
            padding: 0,
          },
          tabBarActiveTintColor: '#901d35', // Aktif olan ikonun rengi
          tabBarInactiveTintColor: '#666',   // Pasif olan ikonun rengi
        }}
      >
        <Tab.Screen
          name="Labs"
          options={{ tabBarIcon: ({ color }) => <FlaskConical color={color} size={24} /> }}
        >
          {() => <HomeScreen />}
        </Tab.Screen>
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
  updateBanner: {
    width: '100%',
    backgroundColor: '#1c1c1f',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderRadius: 20,
    marginTop: 25,
    borderWidth: 1,
    borderColor: '#901d35',
    // Hafif bir parlama efekti (Glow)
    shadowColor: "#901d35",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  updateLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  updateIconCircle: {
    width: 45,
    height: 45,
    borderRadius: 12,
    backgroundColor: '#901d35',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  updateTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  updateVersion: {
    color: '#666',
    fontSize: 12,
  },
  updateButton: {
    backgroundColor: '#901d35',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 10,
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
  // Labs Ana Sayfa Stilleri
  labsHero: { alignItems: 'center', marginVertical: 30 },
  labsHeroLogo: { width: 60, height: 60, marginBottom: 10 },
  labsHeroTitle: { color: '#fff', fontSize: 24, letterSpacing: 1 },
  labsHeroSub: { color: '#666', fontSize: 12, textAlign: 'center', paddingHorizontal: 40, marginTop: 5 },
  sectionTitle: { color: '#901d35', fontSize: 18, fontWeight: 'bold', marginBottom: 15, marginTop: 20, letterSpacing: 1 },
  labsCard: {
    backgroundColor: '#1c1c1f',
    borderRadius: 20,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#333',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  cardBadge: { color: '#901d35', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
  cardStage: { color: '#444', fontSize: 10, fontWeight: 'bold' },
  cardTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
  cardDesc: { color: '#aaa', fontSize: 13, lineHeight: 18, marginBottom: 15 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap' },
  miniTag: { color: '#666', fontSize: 11, marginRight: 10, fontStyle: 'italic' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#161618',
    borderRadius: 30,
    height: '85%',
    marginBottom: 20,
    padding: 25,
    borderWidth: 1,
    borderColor: '#333',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
    paddingBottom: 15,
  },
  modalTitle: { color: '#fff', fontSize: 22, fontWeight: '900' },
  detailHeroText: { color: '#901d35', fontSize: 16, fontWeight: 'bold', marginBottom: 15 },
  detailSectionLabel: { color: '#555', fontSize: 12, fontWeight: 'bold', marginTop: 20, marginBottom: 10, letterSpacing: 1 },
  detailLongDesc: { color: '#bbb', fontSize: 14, lineHeight: 22 },
  stackTag: { backgroundColor: '#222', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginRight: 8, marginBottom: 8 },
  stackTagText: { color: '#901d35', fontSize: 12, fontWeight: 'bold' },
  detailLinkButton: {
    backgroundColor: '#901d35',
    height: 55,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
  },
  detailLinkButtonText: { color: '#fff', fontWeight: 'bold', letterSpacing: 1 },
});