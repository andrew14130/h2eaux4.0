import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../src/stores/authStore';
import { useRouter } from 'expo-router';

export default function DashboardScreen() {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.replace('/');
  };

  const handleNavigateToModule = (module: string) => {
    // Pour l'instant, navigation vers les écrans principaux
    switch(module) {
      case 'clients':
        router.push('/clients');
        break;
      case 'chantiers':
        router.push('/chantiers');
        break;
      case 'documents':
        router.push('/documents');
        break;
      case 'calculs-pac':
        router.push('/calculs-pac');
        break;
      case 'calendrier':
        router.push('/calendrier');
        break;
      case 'chat':
        router.push('/chat');
        break;
      case 'fiche-technique':
        router.push('/fiche-technique');
        break;
      case 'meg-integration':
        router.push('/meg-integration');
        break;
      default:
        // Module non implémenté pour le moment
        break;
    }
  };

  const modules = [
    {
      key: 'clients',
      title: 'Clients',
      icon: 'people',
      color: '#007AFF',
      description: 'Gestion des clients MEG',
      available: user?.permissions.clients,
    },
    {
      key: 'chantiers',
      title: 'Chantiers',
      icon: 'construct',
      color: '#FF6B35',
      description: 'Gestion des chantiers',
      available: user?.permissions.chantiers,
    },
    {
      key: 'documents',
      title: 'Documents',
      icon: 'document-text',
      color: '#00D4AA',
      description: 'Documents PDF hors-ligne',
      available: user?.permissions.documents,
    },
    {
      key: 'fiche-technique',
      title: 'Fiches SDB',
      icon: 'clipboard',
      color: '#9B59B6',
      description: 'Fiches techniques SDB',
      available: true,
    },
    {
      key: 'calculs-pac',
      title: 'Calculs PAC',
      icon: 'thermometer',
      color: '#E74C3C',
      description: 'PAC Air/Eau & Air/Air',
      available: user?.permissions.calculs_pac,
    },
    {
      key: 'meg-integration',
      title: 'MEG Integration',
      icon: 'sync',
      color: '#F39C12',
      description: 'Synchronisation comptabilité',
      available: true,
    },
    {
      key: 'calendrier',
      title: 'Calendrier',
      icon: 'calendar',
      color: '#3498DB',
      description: 'Planning chantiers',
      available: true,
    },
    {
      key: 'chat',
      title: 'Chat Équipe',
      icon: 'chatbubbles',
      color: '#2ECC71',
      description: 'Communication interne',
      available: user?.permissions.chat,
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>H2EAUX GESTION</Text>
          <Text style={styles.subtitle}>Bienvenue {user?.username}</Text>
          <Text style={styles.role}>{user?.role === 'admin' ? 'Administrateur' : 'Employé'}</Text>
        </View>
        
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#FF6B6B" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.modulesGrid}>
          {modules.filter(module => module.available).map((module, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.moduleCard}
              onPress={() => handleNavigateToModule(module.key)}
            >
              <View style={[styles.moduleIcon, { backgroundColor: module.color }]}>
                <Ionicons name={module.icon as any} size={32} color="#fff" />
              </View>
              <Text style={styles.moduleTitle}>{module.title}</Text>
              <Text style={styles.moduleDescription}>{module.description}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.infoCard}>
          <Ionicons name="checkmark-circle" size={24} color="#00D4AA" />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Application H2EAUX GESTION</Text>
            <Text style={styles.infoText}>
              ✅ Authentification fonctionnelle{'\n'}
              ✅ Gestion clients avec MEG{'\n'}
              ✅ Fiches techniques SDB{'\n'}
              ✅ Calculs PAC Air/Eau & Air/Air{'\n'}
              ✅ Génération PDF automatique{'\n'}
              ✅ Synchronisation comptabilité
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Version 1.0.0 - H2EAUX GESTION</Text>
          <Text style={styles.footerText}>Application mobile professionnelle</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#007AFF',
    marginBottom: 2,
  },
  role: {
    fontSize: 14,
    color: '#666',
  },
  logoutButton: {
    padding: 12,
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  modulesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 32,
  },
  moduleCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    width: '47%',
    minHeight: 140,
  },
  moduleIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  moduleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 4,
  },
  moduleDescription: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    lineHeight: 16,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    gap: 16,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#00D4AA',
    lineHeight: 20,
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
});