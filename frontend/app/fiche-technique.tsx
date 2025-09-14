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
import { useFicheSDBStore, FicheSDB } from '../src/stores/ficheSDBStore';

export default function FicheTechniqueScreen() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedFiche, setSelectedFiche] = useState<FicheSDB | null>(null);
  const [newFiche, setNewFiche] = useState({
    nom: '',
    client_nom: '',
    adresse: '',
    type_sdb: 'complete' as 'complete' | 'douche' | 'wc' | 'mixte',
    surface: '',
    carrelage_mur: '',
    carrelage_sol: '',
    sanitaires: '',
    robinetterie: '',
    chauffage: '',
    ventilation: '',
    eclairage: '',
    budget_estime: '',
    notes: '',
  });

  const { fiches, loading, fetchFiches, addFiche, updateFiche, deleteFiche } = useFicheSDBStore();

  useEffect(() => {
    fetchFiches();
  }, []);

  const filteredFiches = fiches.filter(fiche =>
    fiche.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fiche.client_nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fiche.type_sdb.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fiche.carrelage_mur.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddFiche = async () => {
    if (!newFiche.nom.trim() || !newFiche.client_nom.trim()) {
      Alert.alert('Erreur', 'Le nom de la fiche et le client sont obligatoires');
      return;
    }

    try {
      await addFiche(newFiche);
      setShowAddModal(false);
      setNewFiche({
        nom: '',
        client_nom: '',
        adresse: '',
        type_sdb: 'complete',
        surface: '',
        carrelage_mur: '',
        carrelage_sol: '',
        sanitaires: '',
        robinetterie: '',
        chauffage: '',
        ventilation: '',
        eclairage: '',
        budget_estime: '',
        notes: '',
      });
      Alert.alert('Succès', 'Fiche SDB ajoutée avec succès');
    } catch (error) {
      Alert.alert('Erreur', 'Erreur lors de l\'ajout de la fiche');
    }
  };

  const handleDeleteFiche = (fiche: FicheSDB) => {
    Alert.alert(
      'Confirmer la suppression',
      `Êtes-vous sûr de vouloir supprimer la fiche "${fiche.nom}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Supprimer', 
          style: 'destructive',
          onPress: () => deleteFiche(fiche.id)
        },
      ]
    );
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'complete': return 'home-outline';
      case 'douche': return 'water-outline';
      case 'wc': return 'business-outline';
      case 'mixte': return 'grid-outline';
      default: return 'square-outline';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'complete': return '#007AFF';
      case 'douche': return '#00D4AA';
      case 'wc': return '#FF9500';
      case 'mixte': return '#9B59B6';
      default: return '#666';
    }
  };

  const renderFicheItem = ({ item }: { item: FicheSDB }) => (
    <TouchableOpacity 
      style={styles.ficheCard}
      onPress={() => setSelectedFiche(item)}
    >
      <View style={styles.ficheHeader}>
        <View style={styles.ficheIcon}>
          <Ionicons 
            name={getTypeIcon(item.type_sdb) as any} 
            size={24} 
            color={getTypeColor(item.type_sdb)} 
          />
        </View>
        
        <View style={styles.ficheInfo}>
          <Text style={styles.ficheName}>{item.nom}</Text>
          <Text style={styles.ficheClient}>Client: {item.client_nom}</Text>
          <Text style={styles.ficheType}>
            {item.type_sdb.toUpperCase()} - {item.surface}m²
          </Text>
        </View>
        
        <View style={styles.ficheActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleDeleteFiche(item)}
          >
            <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
          </TouchableOpacity>
        </View>
      </View>
      
      {item.adresse && (
        <Text style={styles.ficheAddress}>📍 {item.adresse}</Text>
      )}
      
      <View style={styles.ficheDetails}>
        {item.carrelage_mur && (
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Carrelage mur:</Text>
            <Text style={styles.detailValue}>{item.carrelage_mur}</Text>
          </View>
        )}
        {item.sanitaires && (
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Sanitaires:</Text>
            <Text style={styles.detailValue}>{item.sanitaires}</Text>
          </View>
        )}
      </View>

      {item.budget_estime && (
        <Text style={styles.ficheBudget}>
          💰 Budget estimé: {item.budget_estime}€
        </Text>
      )}

      <Text style={styles.ficheDate}>
        Créé le {new Date(item.created_at).toLocaleDateString('fr-FR')}
      </Text>
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
        
        <Text style={styles.title}>Fiches SDB</Text>
        
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
          placeholder="Rechercher une fiche SDB..."
          placeholderTextColor="#666"
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
      </View>

      <FlatList
        data={filteredFiches}
        renderItem={renderFicheItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshing={loading}
        onRefresh={fetchFiches}
      />

      {/* Modal d'ajout de fiche */}
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
            <Text style={styles.modalTitle}>Nouvelle Fiche SDB</Text>
            <TouchableOpacity onPress={handleAddFiche}>
              <Text style={styles.saveButton}>Sauver</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nom de la fiche *</Text>
              <TextInput
                style={styles.input}
                value={newFiche.nom}
                onChangeText={(text) => setNewFiche({...newFiche, nom: text})}
                placeholder="Ex: Rénovation SDB Dupont"
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Client *</Text>
              <TextInput
                style={styles.input}
                value={newFiche.client_nom}
                onChangeText={(text) => setNewFiche({...newFiche, client_nom: text})}
                placeholder="Nom du client"
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Adresse</Text>
              <TextInput
                style={styles.input}
                value={newFiche.adresse}
                onChangeText={(text) => setNewFiche({...newFiche, adresse: text})}
                placeholder="Adresse du chantier"
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Type de SDB</Text>
              <View style={styles.typeButtons}>
                {[
                  { key: 'complete', label: 'Complète', icon: 'home-outline' },
                  { key: 'douche', label: 'Douche', icon: 'water-outline' },
                  { key: 'wc', label: 'WC', icon: 'business-outline' },
                  { key: 'mixte', label: 'Mixte', icon: 'grid-outline' },
                ].map((type) => (
                  <TouchableOpacity
                    key={type.key}
                    style={[
                      styles.typeButton,
                      newFiche.type_sdb === type.key && styles.typeButtonActive
                    ]}
                    onPress={() => setNewFiche({...newFiche, type_sdb: type.key as any})}
                  >
                    <Ionicons 
                      name={type.icon as any} 
                      size={20} 
                      color={newFiche.type_sdb === type.key ? '#fff' : '#999'} 
                    />
                    <Text style={[
                      styles.typeButtonText,
                      newFiche.type_sdb === type.key && styles.typeButtonTextActive
                    ]}>
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.flex1]}>
                <Text style={styles.inputLabel}>Surface (m²)</Text>
                <TextInput
                  style={styles.input}
                  value={newFiche.surface}
                  onChangeText={(text) => setNewFiche({...newFiche, surface: text})}
                  placeholder="8"
                  placeholderTextColor="#666"
                  keyboardType="numeric"
                />
              </View>

              <View style={[styles.inputGroup, styles.flex2]}>
                <Text style={styles.inputLabel}>Budget estimé (€)</Text>
                <TextInput
                  style={styles.input}
                  value={newFiche.budget_estime}
                  onChangeText={(text) => setNewFiche({...newFiche, budget_estime: text})}
                  placeholder="8000"
                  placeholderTextColor="#666"
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Carrelage mur</Text>
              <TextInput
                style={styles.input}
                value={newFiche.carrelage_mur}
                onChangeText={(text) => setNewFiche({...newFiche, carrelage_mur: text})}
                placeholder="Ex: Grès cérame 30x60 blanc"
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Carrelage sol</Text>
              <TextInput
                style={styles.input}
                value={newFiche.carrelage_sol}
                onChangeText={(text) => setNewFiche({...newFiche, carrelage_sol: text})}
                placeholder="Ex: Grès cérame antidérapant 60x60"
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Sanitaires</Text>
              <TextInput
                style={styles.input}
                value={newFiche.sanitaires}
                onChangeText={(text) => setNewFiche({...newFiche, sanitaires: text})}
                placeholder="Ex: WC suspendu, lavabo 60cm"
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Robinetterie</Text>
              <TextInput
                style={styles.input}
                value={newFiche.robinetterie}
                onChangeText={(text) => setNewFiche({...newFiche, robinetterie: text})}
                placeholder="Ex: Mitigeur thermostatique"
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Chauffage</Text>
              <TextInput
                style={styles.input}
                value={newFiche.chauffage}
                onChangeText={(text) => setNewFiche({...newFiche, chauffage: text})}
                placeholder="Ex: Sèche-serviettes électrique"
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Ventilation</Text>
              <TextInput
                style={styles.input}
                value={newFiche.ventilation}
                onChangeText={(text) => setNewFiche({...newFiche, ventilation: text})}
                placeholder="Ex: VMC hygroréglable"
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Éclairage</Text>
              <TextInput
                style={styles.input}
                value={newFiche.eclairage}
                onChangeText={(text) => setNewFiche({...newFiche, eclairage: text})}
                placeholder="Ex: Spots LED IP44"
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Notes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={newFiche.notes}
                onChangeText={(text) => setNewFiche({...newFiche, notes: text})}
                placeholder="Notes et observations..."
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
    backgroundColor: '#9B59B6',
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
  ficheCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  ficheHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  ficheIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#333',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  ficheInfo: {
    flex: 1,
  },
  ficheName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  ficheClient: {
    fontSize: 14,
    color: '#007AFF',
    marginBottom: 2,
  },
  ficheType: {
    fontSize: 12,
    color: '#999',
  },
  ficheActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
  ficheAddress: {
    fontSize: 14,
    color: '#999',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  ficheDetails: {
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 12,
    color: '#666',
    width: 100,
  },
  detailValue: {
    fontSize: 12,
    color: '#ccc',
    flex: 1,
  },
  ficheBudget: {
    fontSize: 14,
    color: '#00D4AA',
    marginBottom: 4,
    fontWeight: '500',
  },
  ficheDate: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
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
    color: '#9B59B6',
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
  typeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  typeButtonActive: {
    backgroundColor: '#9B59B6',
  },
  typeButtonText: {
    color: '#999',
    fontSize: 14,
  },
  typeButtonTextActive: {
    color: '#fff',
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