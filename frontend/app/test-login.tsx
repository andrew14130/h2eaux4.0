import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';

export default function TestLoginScreen() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const testLogin = async () => {
    setLoading(true);
    setResult('Test en cours...');
    
    try {
      const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';
      console.log('Backend URL:', BACKEND_URL);
      
      const response = await axios.post(`${BACKEND_URL}/api/auth/login`, {
        username,
        password,
      });
      
      console.log('Response:', response.data);
      
      const { user, access_token } = response.data;
      
      if (access_token && user) {
        setResult(`✅ CONNEXION RÉUSSIE!\n\nUtilisateur: ${user.username}\nRôle: ${user.role}\nToken: ${access_token.substring(0, 50)}...`);
        Alert.alert('Succès', 'La connexion fonctionne parfaitement !');
      } else {
        setResult('❌ Réponse incomplète du serveur');
      }
      
    } catch (error) {
      console.error('Erreur:', error);
      setResult(`❌ ERREUR: ${error.message}\n\nDétails: ${error.response?.data || 'Pas de détails'}`);
      Alert.alert('Erreur', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>🔧 TEST DE CONNEXION H2EAUX</Text>
      
      <View style={styles.form}>
        <Text style={styles.label}>Nom d'utilisateur:</Text>
        <TextInput
          style={styles.input}
          value={username}
          onChangeText={setUsername}
          placeholder="admin"
        />
        
        <Text style={styles.label}>Mot de passe:</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="admin123"
          secureTextEntry
        />
        
        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={testLogin}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? '⏳ Test...' : '🚀 Tester la connexion'}
          </Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.result}>
        <Text style={styles.resultTitle}>Résultat:</Text>
        <Text style={styles.resultText}>{result || 'Aucun test effectué'}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    textAlign: 'center',
    marginBottom: 30,
  },
  form: {
    marginBottom: 30,
  },
  label: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    marginTop: 20,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  result: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 16,
  },
  resultTitle: {
    color: '#007AFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  resultText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'monospace',
    lineHeight: 20,
  },
});