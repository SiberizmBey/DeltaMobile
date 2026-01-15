import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import {
  StyleSheet, FlatList, Text, View, TextInput, TouchableOpacity,
  Alert, ActivityIndicator, StatusBar, KeyboardAvoidingView,
  Platform, Image, SafeAreaView, Linking, ScrollView, Modal,
  useColorScheme
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer, useFocusEffect } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  FlaskConical, Scan, MessageCircle, User, Lock,
  LogOut, ShieldCheck, Settings, Sun, Moon, Monitor, Instagram, X, Github
} from 'lucide-react-native';
import Constants from 'expo-constants';

// --- NAVIGATOR TANIMLAMALARI (HATAYI ÇÖZEN KISIM) ---
const Tab = createBottomTabNavigator();
const ThemeContext = createContext();

const otherApps = [
  {
    name: 'NexaVerse',
    slug: 'NexaVerse-Mobile',
    // Dosya adının 'nexa.png' olduğunu varsayıyorum, kendi dosya adınla değiştir.
    icon: require('./assets/siskip.png')
  },
  { name: 'Asedia', slug: 'Asedia', icon: null },
  { name: 'SİsKip', slug: 'SIsKip', icon: null },
  { name: 'Mira', slug: 'Mira', icon: null },
  { name: 'SeMira', slug: 'SeMira', icon: null },
  { name: 'PyMira', slug: 'PyMira', icon: null },
];

// --- TEMA PALETLERİ ---
const Themes = {
  light: {
    background: '#F8F9FA',
    card: '#FFFFFF',
    text: '#1A1A1A',
    subText: '#666666',
    border: '#E0E0E0',
    primary: '#901d35',
  },
  dark: {
    background: '#101013',
    card: '#1c1c1f',
    text: '#FFFFFF',
    subText: '#888888',
    border: '#333333',
    primary: '#901d35',
  },
  amoled: {
    background: '#000000',
    card: '#0A0A0A',
    text: '#FFFFFF',
    subText: '#AAAAAA',
    border: '#1A1A1A',
    primary: '#901d35',
  }
};

// --- BİLEŞENLER: QR TARAYICI ---
function QRScannerScreen({ handleLogout, scanned, handleBarCodeScanned }) {
  const { theme } = useContext(ThemeContext);
  return (
    <View style={[styles.flex1, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={theme.background === '#F8F9FA' ? "dark-content" : "light-content"} />
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Delta Tarayıcı</Text>
        <TouchableOpacity onPress={handleLogout}><LogOut color={theme.primary} size={24} /></TouchableOpacity>
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
        <Text style={[styles.footerText, { color: theme.subText }]}>Sitedeki QR kodu kutucuğun içine odaklayın</Text>
      </View>
    </View>
  );
}

// --- BİLEŞENLER: LABS ---
function HomeScreen() {
  const { theme } = useContext(ThemeContext);
  const [labsData, setLabsData] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    fetch('https://labs.nexabag.xyz/labs.data.json')
      .then(res => res.json())
      .then(data => setLabsData(data))
      .catch(e => console.log(e));
  }, []);

  const renderCard = (item, isProject) => (
    <TouchableOpacity key={item.slug} style={[styles.labsCard, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={() => { setSelectedItem(item); setModalVisible(true); }}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardBadge}>{isProject ? 'PROJE' : 'DENEY'}</Text>
        <Text style={[styles.cardStage, { color: theme.subText }]}>{item.stage === 'live' ? 'AKTİF' : 'PASİF'}</Text>
      </View>
      <Text style={[styles.cardTitle, { color: theme.text }]}>{item.title}</Text>
      <Text style={[styles.cardDesc, { color: theme.subText }]} numberOfLines={2}>{item.description}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.flex1, { backgroundColor: theme.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
        <View style={styles.labsHero}>
          <Text style={[styles.labsHeroTitle, { color: theme.text }]}>Nexa Labs</Text>
          <Text style={[styles.labsHeroSub, { color: theme.subText }]}>Ar-Ge ve Prototip Merkezi</Text>
        </View>
        <Text style={styles.sectionTitle}>Aktif Projeler</Text>
        {labsData?.projects.map(p => renderCard(p, true))}
        <Text style={styles.sectionTitle}>Deneyler</Text>
        {labsData?.experiments.map(e => renderCard(e, false))}
        <View style={{ height: 120 }} />
      </ScrollView>

      <Modal animationType="slide" transparent={true} visible={modalVisible}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.background, borderColor: theme.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>{selectedItem?.title}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}><Text style={{ color: theme.primary, fontWeight: 'bold' }}>KAPAT</Text></TouchableOpacity>
            </View>
            <ScrollView>
              <Text style={styles.detailHeroText}>{selectedItem?.detail?.hero}</Text>
              <Text style={[styles.detailLongDesc, { color: theme.text }]}>{selectedItem?.detail?.longDescription}</Text>
              <View style={styles.tagRow}>
                {selectedItem?.detail?.stack?.map((s, i) => (
                  <View key={i} style={[styles.stackTag, { backgroundColor: theme.card }]}><Text style={styles.stackTagText}>{s}</Text></View>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// --- BİLEŞENLER: SOSYAL ---
function SocialScreen() {
  const { theme } = useContext(ThemeContext);
  const [view, setView] = useState('list');
  const [conversations, setConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [myId, setMyId] = useState(null);
  const [inputText, setInputText] = useState('');

  useEffect(() => {
    AsyncStorage.getItem('user_id').then(id => {
      setMyId(id);
      fetch(`https://forum.nexabag.xyz/api/v2/messages.php?action=list_all&user_id=${id}`)
        .then(res => res.json()).then(data => setConversations(data.conversations || []));
    });
  }, []);

  const openChat = async (conv) => {
    setActiveChat(conv); setView('chat');
    const res = await fetch(`https://forum.nexabag.xyz/api/v2/messages.php?action=fetch_messages&conversation_id=${conv.id}`);
    const data = await res.json();
    setMessages(data);
  };

  if (view === 'chat') {
    return (
      <SafeAreaView style={[styles.flex1, { backgroundColor: theme.background }]}>
        <View style={[styles.modalHeader, { paddingHorizontal: 20, marginTop: 10 }]}>
          <TouchableOpacity onPress={() => setView('list')}><Text style={{ color: theme.primary, fontWeight: 'bold' }}>GERİ</Text></TouchableOpacity>
          <Text style={[styles.modalTitle, { color: theme.text }]}>Sohbet</Text>
          <View style={{ width: 40 }} />
        </View>
        <FlatList
          data={messages}
          renderItem={({ item }) => (
            <View style={[styles.messageBubble, item.sender_id == myId ? { alignSelf: 'flex-end', backgroundColor: theme.primary } : { alignSelf: 'flex-start', backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border }]}>
              <Text style={{ color: '#fff' }}>{item.content}</Text>
            </View>
          )}
        />
        <KeyboardAvoidingView behavior="padding" keyboardVerticalOffset={100}>
          <View style={[styles.chatInputRow, { paddingHorizontal: 20 }]}>
            <TextInput style={[styles.chatInput, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]} value={inputText} onChangeText={setInputText} placeholder="Mesaj..." placeholderTextColor={theme.subText} />
            <TouchableOpacity style={styles.sendBtn} onPress={() => setInputText('')}><Text style={{ color: '#fff' }}>GÖNDER</Text></TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.flex1, { backgroundColor: theme.background }]}>
      <Text style={[styles.sectionTitle, { marginLeft: 20, marginTop: 20 }]}>Sosyal</Text>
      <FlatList
        data={conversations}
        contentContainerStyle={{ paddingHorizontal: 20 }}
        renderItem={({ item }) => {
          const otherName = item.user1_id == myId ? item.user2_dn : item.user1_dn;
          return (
            <TouchableOpacity style={[styles.menuItem, { backgroundColor: theme.card }]} onPress={() => openChat(item)}>
              <Image source={{ uri: `https://forum.nexabag.xyz/${item.user2_pic || 'default.png'}` }} style={styles.chatAvatar} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.menuText, { color: theme.text }]}>{otherName}</Text>
                <Text style={{ color: theme.subText, fontSize: 12, marginLeft: 15 }} numberOfLines={1}>{item.last_content}</Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
}

function ProfileScreen({ handleLogout }) {
  const { theme } = useContext(ThemeContext);
  const [userData, setUserData] = useState({ username: '', id: '', profilePic: '' });
  const [updateStatus, setUpdateStatus] = useState({
    checked: false,
    isNew: false,
    latest: '',
    loading: true
  });

  const currentVersion = Constants.expoConfig.version;

  // Profil verilerini bir kez yükle
  useEffect(() => {
    const loadUser = async () => {
      const id = await AsyncStorage.getItem('user_id');
      const name = await AsyncStorage.getItem('username');
      const pic = await AsyncStorage.getItem('profile_pic');
      const fullPicUrl = pic ? (pic.startsWith('http') ? pic : `https://forum.nexabag.xyz/${pic}`) : null;
      setUserData({ username: name, id: id, profilePic: fullPicUrl });
    };
    loadUser();
  }, []);

  // SAYFAYA HER GİRİLDİĞİNDE ÇALIŞIR
  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const checkUpdates = async () => {
        setUpdateStatus(prev => ({ ...prev, loading: true }));
        try {
          // app.json üzerinden kontrol
          const GITHUB_APP_JSON_URL = "https://raw.githubusercontent.com/SiberizmBey/DeltaMobile/main/app.json";
          const response = await fetch(GITHUB_APP_JSON_URL);
          const data = await response.json();

          const remoteVersion = data.expo.version;
          const hasUpdate = remoteVersion !== currentVersion;

          if (isActive) {
            setUpdateStatus({
              checked: true,
              isNew: hasUpdate,
              latest: remoteVersion,
              loading: false
            });
          }
        } catch (error) {
          console.log("Versiyon kontrol hatası:", error);
          if (isActive) setUpdateStatus(prev => ({ ...prev, loading: false }));
        }
      };

      checkUpdates();

      return () => { isActive = false; };
    }, [])
  );

  return (
    <SafeAreaView style={[styles.flex1, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>

        <View style={styles.newProfileHeader}>
          <View style={[styles.avatarContainer, { borderColor: theme.primary }]}>
            {userData.profilePic ? (
              <Image source={{ uri: userData.profilePic }} style={styles.avatarImage} />
            ) : (
              <User color={theme.primary} size={50} />
            )}
          </View>
          <Text style={[styles.profileName, { color: theme.text }]}>{userData.username || 'Kullanıcı'}</Text>
          <Text style={[styles.profileId, { color: theme.subText }]}>Üye ID: {userData.id || '---'}</Text>
        </View>

        <View style={{ paddingHorizontal: 20, marginTop: 30 }}>
          <Text style={[styles.sectionTitle, { color: theme.primary }]}>Uygulama Bilgileri</Text>

          <View style={[styles.infoBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.infoRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <ShieldCheck size={20} color={theme.primary} />
                <Text style={[styles.infoText, { color: theme.text }]}>Kurulu Sürüm</Text>
              </View>
              <Text style={[styles.versionTag, { backgroundColor: theme.background, color: theme.text }]}>
                v{currentVersion}
              </Text>
            </View>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            {updateStatus.loading ? (
              <View style={{ paddingVertical: 10 }}>
                <ActivityIndicator size="small" color={theme.primary} />
              </View>
            ) : updateStatus.isNew ? (
              <TouchableOpacity
                style={styles.updateAvailableBox}
                onPress={() => Linking.openURL('https://github.com/SiberizmBey/DeltaMobile')}
              >
                <Text style={styles.updateTitle}>YENİ SÜRÜM MEVCUT (v{updateStatus.latest})</Text>
                <Text style={styles.updateSub}>Güncellemek için GitHub'a git.</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.upToDateBox}>
                <Text style={{ color: '#4CAF50', fontWeight: 'bold', fontSize: 13 }}>✓ Sürüm Güncel</Text>
              </View>
            )}
          </View>

          <TouchableOpacity style={[styles.menuItem, { backgroundColor: theme.card, marginTop: 25 }]} onPress={handleLogout}>
            <LogOut color={theme.primary} size={20} />
            <Text style={[styles.menuText, { color: theme.primary }]}>Oturumu Kapat</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// --- BİLEŞENLER: AYARLAR (YENİ) ---
function SettingsScreen({ handleLogout }) {
  const { theme, themeSetting, updateTheme } = useContext(ThemeContext);

  const options = [
    { id: 'system', label: 'Sistem Teması', icon: <Monitor size={20} color={theme.text} /> },
    { id: 'light', label: 'Aydınlık Mod', icon: <Sun size={20} color={theme.text} /> },
    { id: 'dark', label: 'Karanlık Mod', icon: <Moon size={20} color={theme.text} /> },
    { id: 'amoled', label: 'AMOLED', icon: <ShieldCheck size={20} color={theme.text} /> },
  ];

  const otherApps = [
    { name: 'NexaVerse', slug: 'NexaVerse-Mobile' },
    { name: 'Asedia', slug: 'Asedia' },
    { name: 'SİsKip', slug: 'SIsKip' },
    { name: 'Mira', slug: 'Mira' },
    { name: 'SeMira', slug: 'SeMira' },
    { name: 'PyMira', slug: 'PyMira' },
  ];

  return (
    <SafeAreaView style={[styles.flex1, { backgroundColor: theme.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.labsHero}>
          <Text style={[styles.labsHeroTitle, { color: theme.text }]}>Ayarlar</Text>
        </View>

        <View style={{ paddingHorizontal: 20 }}>
          <Text style={styles.sectionTitle}>Görünüm</Text>
          {options.map(opt => (
            <TouchableOpacity
              key={opt.id}
              style={[styles.menuItem, { backgroundColor: theme.card }, themeSetting === opt.id && { borderColor: theme.primary, borderWidth: 1 }]}
              onPress={() => updateTheme(opt.id)}
            >
              {opt.icon}
              <Text style={[styles.menuText, { color: theme.text }]}>{opt.label}</Text>
            </TouchableOpacity>
          ))}

          {/* --- YENİ EKLENEN KISIM: DİĞER UYGULAMALAR --- */}
          <Text style={[styles.sectionTitle, { marginTop: 30 }]}>Diğer Mobil Uygulamalarımız</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>

            {/* NEXAVERSE */}
            <TouchableOpacity style={[styles.appBadge, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={() => Linking.openURL('https://github.com/SiberizmBey/NexaVerse-Mobile')}>
              <Image
                source={{ uri: 'https://forum.nexabag.xyz/assets/img/nforum.png' }}
                style={{ width: 30, height: 30, borderRadius: 10 }}
              />
              <Text style={[styles.appBadgeText, { color: theme.text }]}>NexaVerse</Text>
            </TouchableOpacity>

            {/* ASEDIA */}
            <TouchableOpacity style={[styles.appBadge, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={() => Linking.openURL('https://github.com/SiberizmBey/Asedia')}>
              <Image
                source={{ uri: 'https://raw.githubusercontent.com/SiberizmBey/Asedia/main/assets/images/icon.png' }}
                style={{ width: 30, height: 30, borderRadius: 10, backgroundColor: '#000' }}
              />
              <Text style={[styles.appBadgeText, { color: theme.text }]}>Asedia</Text>
            </TouchableOpacity>

            {/* SİSKİP */}
            <TouchableOpacity style={[styles.appBadge, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={() => Linking.openURL('https://github.com/SiberizmBey/SIsKip')}>
              <Image
                source={{ uri: 'https://raw.githubusercontent.com/SiberizmBey/SisKip/main/assets/images/icon.png' }}
                style={{ width: 30, height: 30, borderRadius: 10, backgroundColor: '#000' }}
              />
              <Text style={[styles.appBadgeText, { color: theme.text }]}>SisKip</Text>
            </TouchableOpacity>

            {/* MIRA */}
            <TouchableOpacity style={[styles.appBadge, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={() => Linking.openURL('https://github.com/SiberizmBey/Mira')}>
              <Image
                source={{ uri: 'https://raw.githubusercontent.com/SiberizmBey/Mira/main/assets/images/icon.png' }}
                style={{ width: 30, height: 30, borderRadius: 10, backgroundColor: '#000' }}
              />
              <Text style={[styles.appBadgeText, { color: theme.text }]}>Mira</Text>
            </TouchableOpacity>

            {/* SEMIRA */}
            <TouchableOpacity style={[styles.appBadge, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={() => Linking.openURL('https://github.com/SiberizmBey/SeMira')}>
              <Image
                source={{ uri: 'https://raw.githubusercontent.com/SiberizmBey/SeMira/main/assets/images/icon.png' }}
                style={{ width: 30, height: 30, borderRadius: 10, backgroundColor: '#000' }}
              />
              <Text style={[styles.appBadgeText, { color: theme.text }]}>SeMira</Text>
            </TouchableOpacity>

            {/* PYMIRA */}
            <TouchableOpacity style={[styles.appBadge, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={() => Linking.openURL('https://github.com/SiberizmBey/PyMira')}>
              <Image
                source={{ uri: 'https://raw.githubusercontent.com/SiberizmBey/PyMira/main/assets/images/icon.png' }}
                style={{ width: 30, height: 30, borderRadius: 10, backgroundColor: '#000' }}
              />
              <Text style={[styles.appBadgeText, { color: theme.text }]}>PyMira</Text>
            </TouchableOpacity>

          </View>
          {/* ------------------------------------------ */}

          {/* Bizi Takip Edin Bölümü */}
          <Text style={[styles.sectionTitle, { marginTop: 30 }]}>Bizi Takip Edin</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 150 }}>

            {/* INSTAGRAM */}
            <TouchableOpacity
              style={[styles.appBadge, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={() => Linking.openURL('https://instagram.com/nexabag.media')}
            >
              <View style={{ width: 30, height: 30, borderRadius: 10, justifyContent: 'center', alignItems: 'center', backgroundColor: '#E1306C' }}>
                <Instagram size={20} color="#fff" />
              </View>
              <Text style={[styles.appBadgeText, { color: theme.text }]}>Instagram</Text>
            </TouchableOpacity>

            {/* X (TWITTER) */}
            <TouchableOpacity
              style={[styles.appBadge, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={() => Linking.openURL('https://x.com/SiberizmBey')}
            >
              <View style={{ width: 30, height: 30, borderRadius: 10, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
                <X size={20} color="#fff" />
                {/* Not: Eğer Twitter ikonu yerine X istersen kütüphaneden 'X' olarak import edebilirsin */}
              </View>
              <Text style={[styles.appBadgeText, { color: theme.text }]}>X / Twitter</Text>
            </TouchableOpacity>

            {/* GitHub (TWITTER) */}
            <TouchableOpacity
              style={[styles.appBadge, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={() => Linking.openURL('https://x.com/SiberizmBey')}
            >
              <View style={{ width: 30, height: 30, borderRadius: 10, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
                <Github size={20} color="#fff" />
                {/* Not: Eğer Twitter ikonu yerine X istersen kütüphaneden 'X' olarak import edebilirsin */}
              </View>
              <Text style={[styles.appBadgeText, { color: theme.text }]}>GitHub</Text>
            </TouchableOpacity>

            {/* NEXABAG FORUM */}
            <TouchableOpacity
              style={[styles.appBadge, { backgroundColor: theme.card, borderColor: theme.border
               }]}
              onPress={() => Linking.openURL('https://forum.nexabag.xyz/profile.php?id=NexaBAGStudi')}
            >
              <View style={{ width: 30, height: 30, borderRadius: 10, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background, overflow: 'hidden' }}>
                <Image
                  source={{ uri: 'https://forum.nexabag.xyz/assets/img/nforum.png' }} // Buraya kendi ikon URL'ni yapıştır
                  style={{ width: 30, height: 30, resizeMode: 'contain' }}
                />
              </View>
              <Text style={[styles.appBadgeText, { color: theme.text }]}>NexaVerse</Text>
            </TouchableOpacity>

          </View>
          {/* <TouchableOpacity style={[styles.menuItem, { backgroundColor: theme.card, marginTop: 30, marginBottom: 150 }]} onPress={handleLogout}>
            <LogOut color={theme.primary} size={20} />
            <Text style={[styles.menuText, { color: theme.primary }]}>Oturumu Kapat</Text>
          </TouchableOpacity> */}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
// --- ANA UYGULAMA (APP.JS) ---
export default function App() {
  const systemScheme = useColorScheme(); // Cihazın temasını izler
  const [themeSetting, setThemeSetting] = useState('system');
  const [theme, setTheme] = useState(Themes.dark);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    const init = async () => {
      const saved = await AsyncStorage.getItem('user_theme');
      if (saved) setThemeSetting(saved);
      const uid = await AsyncStorage.getItem('user_id');
      if (uid) setIsLoggedIn(true);
      setCheckingAuth(false);
    };
    init();
  }, []);

  useEffect(() => {
    const applyTheme = () => {
      let mode;
      if (themeSetting === 'system') {
        // Eğer sistem seçiliyse, cihazın o anki değerini al
        mode = systemScheme || 'dark';
      } else {
        // Değilse (light, dark, amoled) kullanıcı seçimini kullan
        mode = themeSetting;
      }

      setTheme(Themes[mode] || Themes.dark);
    };

    applyTheme();
  }, [themeSetting, systemScheme]); // systemScheme değiştiğinde tetiklenir

  const updateTheme = async (val) => {
    setThemeSetting(val);
    await AsyncStorage.setItem('user_theme', val);
  };

  const handleLogin = async () => {
    setLoading(true);
    try {
      const res = await fetch('https://forum.nexabag.xyz/api/v2/auth.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (data.success) {
        await AsyncStorage.setItem('user_id', data.user.id.toString());
        await AsyncStorage.setItem('username', data.user.username);
        setIsLoggedIn(true);
      } else { Alert.alert("Hata", "Giriş başarısız."); }
    } catch (e) { Alert.alert("Hata", "Sunucu hatası."); } finally { setLoading(false); }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('user_id');
    setIsLoggedIn(false);
  };

  const handleBarCodeScanned = async ({ data }) => {
    setScanned(true);
    const userId = await AsyncStorage.getItem('user_id');
    const response = await fetch('https://forum.nexabag.xyz/qr_verify.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qr_token: data, user_id: userId }),
    });
    const result = await response.json();
    Alert.alert(result.success ? "Başarılı" : "Hata", result.message);
    setTimeout(() => setScanned(false), 2000);
  };

  if (checkingAuth) return <View style={styles.darkBg}><ActivityIndicator color="#901d35" /></View>;

  if (!isLoggedIn) {
    return (
      <KeyboardAvoidingView style={styles.darkBg}>
        <View style={styles.loginCard}>
          <View style={styles.logoCircle}>
            <Image source={require('./assets/main_icon.png')} style={styles.logoImage} resizeMode="contain" />
          </View>
          <Text style={styles.deltaTitle}>Delta Mobile</Text>
          <Text style={styles.deltaMiniTitle}>Bir NexaBAG Studios uygulamasıdır</Text>
          <View style={styles.inputWrapper}>
            <User color="#666" size={20} />
            <TextInput style={styles.deltaInput} placeholder="KULLANICI ADI" placeholderTextColor="#666" value={username} onChangeText={setUsername} autoCapitalize="none" />
          </View>
          <View style={styles.inputWrapper}>
            <Lock color="#666" size={20} />
            <TextInput style={styles.deltaInput} placeholder="ŞİFRE" placeholderTextColor="#666" value={password} onChangeText={setPassword} secureTextEntry />
          </View>
          <TouchableOpacity style={styles.deltaButton} onPress={handleLogin}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.deltaButtonText}>GİRİŞ YAP</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <ThemeContext.Provider value={{ theme, themeSetting, updateTheme }}>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            tabBarStyle: {
              position: 'absolute', bottom: 30, marginLeft: 40, marginRight: 40, paddingTop: 5,
              paddingLeft: 10, paddingRight: 10,
              height: 65, backgroundColor: theme.card, borderRadius: 35,
              borderWidth: 1, borderColor: theme.border, elevation: 15,
            },
            tabBarActiveTintColor: theme.primary,
            tabBarInactiveTintColor: theme.subText,
          }}
        >
          <Tab.Screen name="Labs" component={HomeScreen} options={{ tabBarIcon: ({ color }) => <FlaskConical color={color} size={24} /> }} />
          <Tab.Screen name="Tarayıcı" options={{ tabBarIcon: ({ color }) => <Scan color={color} size={24} /> }}>
            {() => <QRScannerScreen handleLogout={handleLogout} scanned={scanned} handleBarCodeScanned={handleBarCodeScanned} />}
          </Tab.Screen>

          <Tab.Screen name="Sosyal" component={SocialScreen} options={{ tabBarIcon: ({ color }) => <MessageCircle color={color} size={24} /> }} />
          <Tab.Screen
            name="Profil"
            options={{ tabBarIcon: ({ color }) => <User color={color} size={24} /> }}
          >
            {() => <ProfileScreen handleLogout={handleLogout} />}
          </Tab.Screen>

          <Tab.Screen name="Ayarlar" options={{ tabBarIcon: ({ color }) => <Settings color={color} size={24} /> }}>
            {() => <SettingsScreen handleLogout={handleLogout} />}
          </Tab.Screen>
        </Tab.Navigator>
      </NavigationContainer>
    </ThemeContext.Provider>
  );
}

const styles = StyleSheet.create({
  flex1: { flex: 1 },
  darkBg: { flex: 1, backgroundColor: '#101013', justifyContent: 'center', padding: 20 },
  header: { height: 80, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 40, paddingHorizontal: 20 },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  qrContainer: { flex: 0.8, margin: 20, borderRadius: 25, overflow: 'hidden', backgroundColor: '#000' },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  focusedContainer: { width: 220, height: 220 },
  scanFrame: { flex: 1, borderWidth: 2, borderColor: '#901d35', borderRadius: 20 },
  footer: { height: 100, justifyContent: 'center', alignItems: 'center' },
  footerText: { textAlign: 'center' },
  labsHero: { alignItems: 'center', marginVertical: 30 },
  labsHeroTitle: { fontSize: 24, fontWeight: 'bold' },
  labsHeroSub: { fontSize: 12, textAlign: 'center', marginTop: 5 },
  sectionTitle: { color: '#901d35', fontSize: 18, fontWeight: 'bold', marginBottom: 15, marginTop: 20 },
  labsCard: { borderRadius: 20, padding: 20, marginBottom: 15, borderWidth: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  cardBadge: { color: '#901d35', fontSize: 10, fontWeight: 'bold' },
  cardTitle: { fontSize: 18, fontWeight: 'bold' },
  cardDesc: { fontSize: 13 },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 15, marginBottom: 10 },
  menuText: { marginLeft: 15, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'flex-end' },
  modalContent: { borderRadius: 30, height: '85%', padding: 25, borderWidth: 1, marginBottom: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 22, fontWeight: '900' },
  detailHeroText: { color: '#901d35', fontWeight: 'bold', marginBottom: 15 },
  detailLongDesc: { fontSize: 14, lineHeight: 22 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 20 },
  stackTag: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginRight: 8, marginBottom: 8 },
  stackTagText: { color: '#901d35', fontSize: 12, fontWeight: 'bold' },
  loginCard: { width: '100%', alignItems: 'center' },
  logoCircle: { width: 120, height: 120, borderRadius: 40, backgroundColor: '#1a1a1a', alignItems: 'center', justifyContent: 'center', marginBottom: 20, borderWidth: 1, borderColor: '#333', overflow: 'hidden' },
  logoImage: { width: '100%', height: '100%' },
  deltaTitle: { fontSize: 28, fontWeight: '900', color: '#fff', letterSpacing: 2 },
  deltaMiniTitle: { fontSize: 10, color: '#666', marginBottom: 40 },
  inputWrapper: { width: '100%', flexDirection: 'row', alignItems: 'center', backgroundColor: '#1c1c1f', borderRadius: 30, marginBottom: 15, paddingHorizontal: 20, height: 60, borderWidth: 1, borderColor: '#3A3A3AFF' },
  deltaInput: { flex: 1, color: '#fff', marginLeft: 10 },
  deltaButton: { width: '100%', height: 60, backgroundColor: '#901d35', borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  deltaButtonText: { color: '#fff', fontWeight: 'bold' },
  chatAvatar: { width: 45, height: 45, borderRadius: 22.5, marginRight: 15 },
  messageBubble: { padding: 12, borderRadius: 15, marginVertical: 5, maxWidth: '80%', marginHorizontal: 20 },
  chatInputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 110 },
  chatInput: { flex: 1, borderRadius: 20, paddingHorizontal: 15, height: 45, borderWidth: 1 },
  sendBtn: { marginLeft: 10, backgroundColor: '#901d35', padding: 10, borderRadius: 15 },
  newProfileHeader: { alignItems: 'center', marginTop: 50 },
  avatarContainer: { width: 110, height: 110, borderRadius: 55, borderWidth: 2, justifyContent: 'center', alignItems: 'center', marginBottom: 15, padding: 5 },
  avatarImage: { width: 100, height: 100, borderRadius: 50 },
  profileName: { fontSize: 24, fontWeight: '900', letterSpacing: 0.5 },
  profileId: { fontSize: 14, marginTop: 4 },
  infoBox: { borderRadius: 24, padding: 20, borderWidth: 1, marginTop: 5 },
  infoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  infoText: { marginLeft: 10, fontWeight: '600', fontSize: 15 },
  versionTag: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 10, fontSize: 12, fontWeight: 'bold', overflow: 'hidden' },
  divider: { height: 1, marginVertical: 15, width: '100%' },
  updateAvailableBox: { backgroundColor: '#901d35', borderRadius: 15, padding: 15, alignItems: 'center' },
  updateTitle: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  updateSub: { color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 4 },
  upToDateBox: { alignItems: 'center', paddingVertical: 5 },
  otherAppsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  appBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 15,
    borderWidth: 1,
    width: '48%',
    marginBottom: 10,
  },
  appIconPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  appIconImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    borderRadius: 30,
  },
  appBadgeText: {
    marginLeft: 10,
    fontSize: 12,
    fontWeight: 'bold',
  },
});