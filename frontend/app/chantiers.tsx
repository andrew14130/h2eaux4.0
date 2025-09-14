import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  TextInput,
  Modal,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useChantierStore, Chantier } from '../src/stores/chantierStore';

export default function ChantiersScreen() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedChantier, setSelectedChantier] = useState<Chantier | null>(null);
  const [newChantier, setNewChantier] = useState({
    nom: '',
    adresse: '',
    ville: '',
    code_postal: '',
    client_nom: '',
    client_telephone: '',
    type_travaux: '',
    statut: 'en_attente' as 'en_attente' | 'en_cours' | 'termine' | 'annule',
    date_debut: '',
    date_fin_prevue: '',
    budget_estime: '',
    description: '',
  });

  const { chantiers, loading, fetchChantiers, addChantier, updateChantier, deleteChantier } = useChantierStore();

  useEffect(() => {
    fetchChantiers();
  }, []);

  const filteredChantiers = chantiers.filter(chantier =>
    chantier.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chantier.client_nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chantier.ville.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chantier.type_travaux.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddChantier = async () => {
    if (!newChantier.nom.trim() || !newChantier.client_nom.trim()) {
      Alert.alert('Erreur', 'Le nom du chantier et le client sont obligatoires');
      return;
    }

    try {
      await addChantier(newChantier);
      setShowAddModal(false);
      setNewChantier({
        nom: '',
        adresse: '',
        ville: '',
        code_postal: '',
        client_nom: '',
        client_telephone: '',
        type_travaux: '',
        statut: 'en_attente',
        date_debut: '',
        date_fin_prevue: '',
        budget_estime: '',
        description: '',
      });
      Alert.alert('Succès', 'Chantier ajouté avec succès');
    } catch (error) {
      Alert.alert('Erreur', 'Erreur lors de l\'ajout du chantier');
    }
  };

  const handleDeleteChantier = (chantier: Chantier) => {
    Alert.alert(
      'Confirmer la suppression',
      `Êtes-vous sûr de vouloir supprimer le chantier "${chantier.nom}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Supprimer', 
          style: 'destructive',
          onPress: () => deleteChantier(chantier.id)
        },
      ]
    );
  };

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'en_attente': return '#FF9500';
      case 'en_cours': return '#007AFF';
      case 'termine': return '#00D4AA';
      case 'annule': return '#FF6B6B';
      default: return '#666';
    }
  };

  const renderChantierItem = ({ item }: { item: Chantier }) => (
    <TouchableOpacity 
      style={styles.chantierCard}
      onPress={() => setSelectedChantier(item)}
    >
      <View style={styles.chantierHeader}>
        <View style={styles.chantierInfo}>
          <Text style={styles.chantierName}>{item.nom}</Text>
          <Text style={styles.chantierClient}>Client: {item.client_nom}</Text>
          <Text style={styles.chantierDetail}>{item.type_travaux}</Text>
        </View>
        
        <View style={styles.chantierActions}>
          <View style={[styles.statutTag, { backgroundColor: getStatutColor(item.statut) }]}>
            <Text style={styles.statutText}>
              {item.statut.replace('_', ' ').toUpperCase()}
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleDeleteChantier(item)}
          >
            <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
          </TouchableOpacity>
        </View>
      </View>
      
      {item.adresse && (
        <Text style={styles.chantierAddress}>
          📍 {item.adresse}, {item.code_postal} {item.ville}
        </Text>
      )}
      
      {item.budget_estime && (
        <Text style={styles.chantierBudget}>
          💰 Budget estimé: {item.budget_estime}€
        </Text>
      )}

      {item.date_debut && (
        <Text style={styles.chantierDate}>
          📅 Début: {new Date(item.date_debut).toLocaleDateString('fr-FR')}
        </Text>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        
        <Text style={styles.title}>Chantiers</Text>
        
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un chantier..."
          placeholderTextColor="#666"
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
      </View>

      <FlatList
        data={filteredChantiers}
        renderItem={renderChantierItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshing={loading}
        onRefresh={fetchChantiers}
      />

      {/* Modal d'ajout de chantier */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Text style={styles.cancelButton}>Annuler</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Nouveau Chantier</Text>
            <TouchableOpacity onPress={handleAddChantier}>
              <Text style={styles.saveButton}>Sauver</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nom du chantier *</Text>
              <TextInput
                style={styles.input}
                value={newChantier.nom}
                onChangeText={(text) => setNewChantier({...newChantier, nom: text})}
                placeholder="Ex: Rénovation salle de bain"
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Client *</Text>
              <TextInput
                style={styles.input}
                value={newChantier.client_nom}
                onChangeText={(text) => setNewChantier({...newChantier, client_nom: text})}
                placeholder="Nom du client"
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Téléphone client</Text>
              <TextInput
                style={styles.input}
                value={newChantier.client_telephone}
                onChangeText={(text) => setNewChantier({...newChantier, client_telephone: text})}
                placeholder="06 12 34 56 78"
                placeholderTextColor="#666"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Type de travaux</Text>
              <TextInput
                style={styles.input}
                value={newChantier.type_travaux}
                onChangeText={(text) => setNewChantier({...newChantier, type_travaux: text})}
                placeholder="Plomberie, Chauffage, Climatisation..."
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Adresse</Text>
              <TextInput
                style={styles.input}
                value={newChantier.adresse}
                onChangeText={(text) => setNewChantier({...newChantier, adresse: text})}
                placeholder="123 Rue de la Paix"
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.flex1]}>
                <Text style={styles.inputLabel}>Code Postal</Text>
                <TextInput
                  style={styles.input}
                  value={newChantier.code_postal}
                  onChangeText={(text) => setNewChantier({...newChantier, code_postal: text})}
                  placeholder="75000"
                  placeholderTextColor="#666"
                  keyboardType="numeric"
                />
              </View>

              <View style={[styles.inputGroup, styles.flex2]}>
                <Text style={styles.inputLabel}>Ville</Text>
                <TextInput
                  style={styles.input}
                  value={newChantier.ville}
                  onChangeText={(text) => setNewChantier({...newChantier, ville: text})}
                  placeholder="Paris"
                  placeholderTextColor="#666"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Budget estimé (€)</Text>
              <TextInput
                style={styles.input}
                value={newChantier.budget_estime}
                onChangeText={(text) => setNewChantier({...newChantier, budget_estime: text})}
                placeholder="5000"
                placeholderTextColor="#666"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Date de début</Text>
              <TextInput
                style={styles.input}
                value={newChantier.date_debut}
                onChangeText={(text) => setNewChantier({...newChantier, date_debut: text})}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Date de fin prévue</Text>
              <TextInput
                style={styles.input}
                value={newChantier.date_fin_prevue}
                onChangeText={(text) => setNewChantier({...newChantier, date_fin_prevue: text})}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={newChantier.description}
                onChangeText={(text) => setNewChantier({...newChantier, description: text})}
                placeholder="Description détaillée des travaux..."
                placeholderTextColor="#666"
                multiline
                textAlignVertical="top"
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  addButton: {
    backgroundColor: '#007AFF',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    margin: 16,
    paddingHorizontal: 16,
    height: 48,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
  },
  listContainer: {
    padding: 16,
    paddingTop: 0,
  },
  chantierCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  chantierHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  chantierInfo: {
    flex: 1,
  },
  chantierName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  chantierClient: {
    fontSize: 14,
    color: '#007AFF',
    marginBottom: 2,
  },
  chantierDetail: {
    fontSize: 14,
    color: '#999',
    marginBottom: 2,
  },
  chantierAddress: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    fontStyle: 'italic',
  },
  chantierBudget: {
    fontSize: 14,
    color: '#00D4AA',
    marginTop: 4,
    fontWeight: '500',
  },
  chantierDate: {
    fontSize: 14,
    color: '#FF9500',
    marginTop: 4,
  },
  chantierActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
  statutTag: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  statutText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  cancelButton: {
    color: '#FF6B6B',
    fontSize: 16,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  saveButton: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
  },
  textArea: {
    height: 100,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  flex1: {
    flex: 1,
  },
  flex2: {
    flex: 2,
  },
});