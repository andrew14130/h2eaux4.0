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
import { useDocumentStore, Document } from '../src/stores/documentStore';

export default function DocumentsScreen() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [newDocument, setNewDocument] = useState({
    nom: '',
    type: 'facture' as 'facture' | 'devis' | 'contrat' | 'fiche_technique' | 'rapport' | 'autre',
    client_nom: '',
    chantier_nom: '',
    description: '',
    tags: '',
  });

  const { documents, loading, fetchDocuments, addDocument, updateDocument, deleteDocument } = useDocumentStore();

  useEffect(() => {
    fetchDocuments();
  }, []);

  const filteredDocuments = documents.filter(doc =>
    doc.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.client_nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.chantier_nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.tags.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddDocument = async () => {
    if (!newDocument.nom.trim()) {
      Alert.alert('Erreur', 'Le nom du document est obligatoire');
      return;
    }

    try {
      await addDocument(newDocument);
      setShowAddModal(false);
      setNewDocument({
        nom: '',
        type: 'facture',
        client_nom: '',
        chantier_nom: '',
        description: '',
        tags: '',
      });
      Alert.alert('Succès', 'Document ajouté avec succès');
    } catch (error) {
      Alert.alert('Erreur', 'Erreur lors de l\'ajout du document');
    }
  };

  const handleDeleteDocument = (document: Document) => {
    Alert.alert(
      'Confirmer la suppression',
      `Êtes-vous sûr de vouloir supprimer le document "${document.nom}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Supprimer', 
          style: 'destructive',
          onPress: () => deleteDocument(document.id)
        },
      ]
    );
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'facture': return 'receipt-outline';
      case 'devis': return 'calculator-outline';
      case 'contrat': return 'document-text-outline';
      case 'fiche_technique': return 'build-outline';
      case 'rapport': return 'clipboard-outline';
      default: return 'document-outline';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'facture': return '#00D4AA';
      case 'devis': return '#FF9500';
      case 'contrat': return '#007AFF';
      case 'fiche_technique': return '#9B59B6';
      case 'rapport': return '#E74C3C';
      default: return '#666';
    }
  };

  const renderDocumentItem = ({ item }: { item: Document }) => (
    <TouchableOpacity 
      style={styles.documentCard}
      onPress={() => setSelectedDocument(item)}
    >
      <View style={styles.documentHeader}>
        <View style={styles.documentIcon}>
          <Ionicons 
            name={getTypeIcon(item.type) as any} 
            size={24} 
            color={getTypeColor(item.type)} 
          />
        </View>
        
        <View style={styles.documentInfo}>
          <Text style={styles.documentName}>{item.nom}</Text>
          <Text style={styles.documentType}>
            {item.type.replace('_', ' ').toUpperCase()}
          </Text>
          {item.client_nom && (
            <Text style={styles.documentClient}>Client: {item.client_nom}</Text>
          )}
          {item.chantier_nom && (
            <Text style={styles.documentChantier}>Chantier: {item.chantier_nom}</Text>
          )}
        </View>
        
        <View style={styles.documentActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleDeleteDocument(item)}
          >
            <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
          </TouchableOpacity>
        </View>
      </View>
      
      {item.description && (
        <Text style={styles.documentDescription} numberOfLines={2}>
          {item.description}
        </Text>
      )}
      
      {item.tags && (
        <View style={styles.tagsContainer}>
          {item.tags.split(',').map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>{tag.trim()}</Text>
            </View>
          ))}
        </View>
      )}

      <Text style={styles.documentDate}>
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
        
        <Text style={styles.title}>Documents</Text>
        
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
          placeholder="Rechercher un document..."
          placeholderTextColor="#666"
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
      </View>

      <FlatList
        data={filteredDocuments}
        renderItem={renderDocumentItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshing={loading}
        onRefresh={fetchDocuments}
      />

      {/* Modal d'ajout de document */}
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
            <Text style={styles.modalTitle}>Nouveau Document</Text>
            <TouchableOpacity onPress={handleAddDocument}>
              <Text style={styles.saveButton}>Sauver</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nom du document *</Text>
              <TextInput
                style={styles.input}
                value={newDocument.nom}
                onChangeText={(text) => setNewDocument({...newDocument, nom: text})}
                placeholder="Ex: Facture plomberie Dupont"
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Type de document</Text>
              <View style={styles.typeButtons}>
                {[
                  { key: 'facture', label: 'Facture', icon: 'receipt-outline' },
                  { key: 'devis', label: 'Devis', icon: 'calculator-outline' },
                  { key: 'contrat', label: 'Contrat', icon: 'document-text-outline' },
                  { key: 'fiche_technique', label: 'Fiche technique', icon: 'build-outline' },
                  { key: 'rapport', label: 'Rapport', icon: 'clipboard-outline' },
                  { key: 'autre', label: 'Autre', icon: 'document-outline' },
                ].map((type) => (
                  <TouchableOpacity
                    key={type.key}
                    style={[
                      styles.typeButton,
                      newDocument.type === type.key && styles.typeButtonActive
                    ]}
                    onPress={() => setNewDocument({...newDocument, type: type.key as any})}
                  >
                    <Ionicons 
                      name={type.icon as any} 
                      size={20} 
                      color={newDocument.type === type.key ? '#fff' : '#999'} 
                    />
                    <Text style={[
                      styles.typeButtonText,
                      newDocument.type === type.key && styles.typeButtonTextActive
                    ]}>
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Client</Text>
              <TextInput
                style={styles.input}
                value={newDocument.client_nom}
                onChangeText={(text) => setNewDocument({...newDocument, client_nom: text})}
                placeholder="Nom du client"
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Chantier associé</Text>
              <TextInput
                style={styles.input}
                value={newDocument.chantier_nom}
                onChangeText={(text) => setNewDocument({...newDocument, chantier_nom: text})}
                placeholder="Nom du chantier"
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Tags</Text>
              <TextInput
                style={styles.input}
                value={newDocument.tags}
                onChangeText={(text) => setNewDocument({...newDocument, tags: text})}
                placeholder="plomberie, urgence, paris (séparés par des virgules)"
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={newDocument.description}
                onChangeText={(text) => setNewDocument({...newDocument, description: text})}
                placeholder="Description du document..."
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
  documentCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  documentHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  documentIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#333',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  documentType: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  documentClient: {
    fontSize: 14,
    color: '#007AFF',
    marginBottom: 2,
  },
  documentChantier: {
    fontSize: 14,
    color: '#FF9500',
  },
  documentActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
  documentDescription: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 8,
    lineHeight: 20,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  tag: {
    backgroundColor: '#444',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  tagText: {
    color: '#fff',
    fontSize: 12,
  },
  documentDate: {
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
    backgroundColor: '#007AFF',
  },
  typeButtonText: {
    color: '#999',
    fontSize: 14,
  },
  typeButtonTextActive: {
    color: '#fff',
  },
});