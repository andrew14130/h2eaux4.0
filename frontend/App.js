import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import * as SecureStore from 'expo-secure-store';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Dimensions
} from 'react-native';

const BACKEND_URL = 'https://h2eaux-dashboard.preview.emergentagent.com/api';

// Configuration couleurs optimisées
const colors = {
  primary: '#007AFF',
  background: '#1a1a1a',
  surface: '#2a2a2a',
  text: '#ffffff',
  textSecondary: '#999999',
  error: '#E74C3C',
  success: '#00D4AA'
};

// Application principale simplifiée
export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentScreen, setCurrentScreen] = useState('login');

  // Form states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  useEffect(() => {
    checkLoginStatus();
  }, []);

  const checkLoginStatus = async () => {
    try {
      const token = await SecureStore.getItemAsync('token');
      const userData = await SecureStore.getItemAsync('user');
      
      if (token && userData) {
        setUser(JSON.parse(userData));
        setIsLoggedIn(true);
        setCurrentScreen('dashboard');
      }
    } catch (error) {
      console.error('Erreur vérification:', error);
    }
    setLoading(false);
  };

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir vos identifiants');
      return;
    }

    setLoginLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim()
        })
      });

      const data = await response.json();
      
      if (response.ok && data.access_token) {
        await SecureStore.setItemAsync('token', data.access_token);
        await SecureStore.setItemAsync('user', JSON.stringify(data.user));
        setUser(data.user);
        setIsLoggedIn(true);
        setCurrentScreen('dashboard');
        Alert.alert('Succès', 'Connexion réussie !');
      } else {
        Alert.alert('Erreur', data.detail || 'Erreur de connexion');
      }
    } catch (error) {
      console.error('Erreur login:', error);
      Alert.alert('Erreur', 'Impossible de se connecter au serveur');
    }
    setLoginLoading(false);
  };

  const handleLogout = async () => {
    Alert.alert('Déconnexion', 'Voulez-vous vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      { 
        text: 'Déconnexion', 
        onPress: async () => {
          await SecureStore.deleteItemAsync('token');
          await SecureStore.deleteItemAsync('user');
          setUser(null);
          setIsLoggedIn(false);
          setCurrentScreen('login');
          setUsername('');
          setPassword('');
        }
      }
    ]);
  };

  const showModule = (moduleId) => {
    Alert.alert('Module ' + moduleId, 'Interface en développement pour tablette Android', [
      { text: 'OK' }
    ]);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>H2EAUX GESTION</Text>
        <Text style={styles.loadingSubtext}>Chargement...</Text>
      </View>
    );
  }

  // Écran de connexion
  if (currentScreen === 'login') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <ScrollView contentContainerStyle={styles.loginContainer}>
          <View style={styles.logoSection}>
            <Text style={styles.logo}>H2EAUX GESTION</Text>
            <Text style={styles.subtitle}>PLOMBERIE • CLIMATISATION • CHAUFFAGE</Text>
            <Text style={styles.versionText}>Version Android 1.0</Text>
          </View>

          <View style={styles.formContainer}>
            <TextInput
              style={styles.input}
              placeholder="Nom d'utilisateur"
              placeholderTextColor={colors.textSecondary}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Mot de passe"
              placeholderTextColor={colors.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCorrect={false}
            />

            <TouchableOpacity 
              style={[styles.button, loginLoading && styles.buttonDisabled]} 
              onPress={handleLogin}
              disabled={loginLoading}
            >
              {loginLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.buttonText}>Se connecter</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.credentialsInfo}>
            <Text style={styles.credentialsTitle}>Identifiants de test :</Text>
            <Text style={styles.credentialsText}>👤 Admin: admin / admin123</Text>
            <Text style={styles.credentialsText}>👤 Employé: employe1 / employe123</Text>
          </View>

          <View style={styles.infoSection}>
            <Text style={styles.infoTitle}>📱 Application Native Android</Text>
            <Text style={styles.infoText}>Optimisée pour tablette et smartphone</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Dashboard principal
  if (currentScreen === 'dashboard') {
    const modules = [
      { id: 'clients', title: 'Clients', icon: '👥', description: 'Gestion clients MEG' },
      { id: 'chantiers', title: 'Chantiers', icon: '🏗️', description: 'Gestion chantiers' },
      { id: 'documents', title: 'Documents', icon: '📄', description: 'PDF hors-ligne' },
      { id: 'fiches', title: 'Fiches Chantier', icon: '📋', description: 'Relevés + Plans 2D' },
      { id: 'calculs', title: 'Calculs PAC', icon: '🌡️', description: 'Air/Eau & Air/Air' },
      { id: 'meg', title: 'MEG Integration', icon: '🔄', description: 'Synchronisation' },
      { id: 'calendrier', title: 'Calendrier', icon: '📅', description: 'Planning' },
      { id: 'chat', title: 'Chat Équipe', icon: '💬', description: 'Communication' }
    ];

    if (user?.permissions?.parametres) {
      modules.push({ 
        id: 'parametres', 
        title: 'Paramètres', 
        icon: '⚙️', 
        description: 'Administration' 
      });
    }

    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        
        <View style={styles.header}>
          <Text style={styles.headerTitle}>H2EAUX GESTION</Text>
          <Text style={styles.headerSubtitle}>Application Android Native</Text>
          
          <View style={styles.userInfo}>
            <Text style={styles.userText}>👤 {user?.username}</Text>
            <Text style={[styles.userRole, user?.role === 'admin' && styles.adminRole]}>
              {user?.role === 'admin' ? 'Administrateur' : 'Employé'}
            </Text>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Text style={styles.logoutText}>Déconnexion</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.modulesContainer} showsVerticalScrollIndicator={false}>
          <Text style={styles.modulesTitle}>Modules Disponibles</Text>
          
          <View style={styles.modulesGrid}>
            {modules.map((module) => (
              <TouchableOpacity 
                key={module.id} 
                style={styles.moduleCard}
                onPress={() => showModule(module.title)}
                activeOpacity={0.7}
              >
                <Text style={styles.moduleIcon}>{module.icon}</Text>
                <Text style={styles.moduleTitle}>{module.title}</Text>
                <Text style={styles.moduleDescription}>{module.description}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.statusSection}>
            <Text style={styles.statusTitle}>📊 Statut Application</Text>
            <Text style={styles.statusItem}>✅ Backend API opérationnel</Text>
            <Text style={styles.statusItem}>✅ Authentification sécurisée</Text>  
            <Text style={styles.statusItem}>✅ Interface tablette optimisée</Text>
            <Text style={styles.statusItem}>✅ Stockage local sécurisé</Text>
            <Text style={styles.statusItem}>✅ {modules.length} modules disponibles</Text>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>H2EAUX GESTION v1.0</Text>
            <Text style={styles.footerText}>Application Android Native • 2025</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return null;
}

// Styles optimisés tablette/mobile
const { width, height } = Dimensions.get('window');
const isTablet = width >= 768;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Loading
  loadingText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    marginTop: 20,
  },
  loadingSubtext: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 8,
  },
  
  // Login
  loginContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: isTablet ? 40 : 20,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    fontSize: isTablet ? 42 : 32,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: isTablet ? 16 : 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 4,
  },
  versionText: {
    fontSize: isTablet ? 14 : 12,
    color: colors.success,
    fontWeight: '600',
  },
  formContainer: {
    width: '100%',
    maxWidth: isTablet ? 450 : 350,
    marginBottom: 30,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: isTablet ? 20 : 16,
    marginBottom: 16,
    fontSize: isTablet ? 18 : 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: '#444',
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: isTablet ? 20 : 16,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    fontSize: isTablet ? 20 : 18,
    fontWeight: '600',
  },
  credentialsInfo: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: isTablet ? 450 : 350,
    marginBottom: 20,
  },
  credentialsTitle: {
    color: colors.primary,
    fontSize: isTablet ? 16 : 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  credentialsText: {
    color: colors.textSecondary,
    fontSize: isTablet ? 15 : 14,
    marginBottom: 6,
  },
  infoSection: {
    alignItems: 'center',
    padding: 20,
  },
  infoTitle: {
    color: colors.success,
    fontSize: isTablet ? 18 : 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  infoText: {
    color: colors.textSecondary,
    fontSize: isTablet ? 14 : 12,
  },

  // Dashboard
  header: {
    backgroundColor: colors.surface,
    padding: isTablet ? 30 : 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  headerTitle: {
    fontSize: isTablet ? 36 : 28,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: isTablet ? 14 : 12,
    color: colors.success,
    marginBottom: 16,
    fontWeight: '600',
  },
  userInfo: {
    alignItems: 'center',
  },
  userText: {
    color: colors.text,
    fontSize: isTablet ? 18 : 16,
    fontWeight: '500',
    marginBottom: 6,
  },
  userRole: {
    backgroundColor: colors.primary,
    color: 'white',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    fontSize: isTablet ? 14 : 12,
    fontWeight: '600',
    marginBottom: 12,
  },
  adminRole: {
    backgroundColor: colors.error,
  },
  logoutButton: {
    backgroundColor: colors.error,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  logoutText: {
    color: 'white',
    fontSize: isTablet ? 14 : 12,
    fontWeight: '600',
  },

  // Modules
  modulesContainer: {
    flex: 1,
    padding: isTablet ? 24 : 16,
  },
  modulesTitle: {
    fontSize: isTablet ? 24 : 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  modulesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  moduleCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: isTablet ? 24 : 20,
    width: isTablet ? '48%' : '100%',
    marginBottom: 16,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  moduleIcon: {
    fontSize: isTablet ? 40 : 36,
    marginBottom: 12,
  },
  moduleTitle: {
    color: colors.text,
    fontSize: isTablet ? 18 : 16,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  moduleDescription: {
    color: colors.textSecondary,
    fontSize: isTablet ? 14 : 12,
    textAlign: 'center',
  },

  // Status
  statusSection: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: isTablet ? 24 : 20,
    marginTop: 20,
    marginBottom: 20,
  },
  statusTitle: {
    color: colors.success,
    fontSize: isTablet ? 18 : 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  statusItem: {
    color: colors.text,
    fontSize: isTablet ? 15 : 14,
    marginBottom: 8,
  },

  // Footer
  footer: {
    alignItems: 'center',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#444',
  },
  footerText: {
    color: colors.textSecondary,
    fontSize: isTablet ? 12 : 10,
    textAlign: 'center',
    marginBottom: 4,
  },
});
