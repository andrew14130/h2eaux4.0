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
import { useCalculPACStore, CalculPAC, Piece, RadiateurExistant } from '../src/stores/calculPACStore';

export default function CalculsPACScreen() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [showAirEauModal, setShowAirEauModal] = useState(false);
  const [showAirAirModal, setShowAirAirModal] = useState(false);
  const [selectedCalcul, setSelectedCalcul] = useState<CalculPAC | null>(null);
  
  // États pour PAC Air/Eau
  const [airEauCalcul, setAirEauCalcul] = useState({
    nom: '',
    client_nom: '',
    adresse: '',
    surface_totale: '',
    isolation: 'moyenne' as 'mauvaise' | 'moyenne' | 'bonne' | 'tres_bonne',
    zone_climatique: 'H2' as 'H1' | 'H2' | 'H3',
    temperature_exterieure_base: '-7',
    temperature_interieure_souhaitee: '20',
    altitude: '',
    type_emetteur: 'plancher_chauffant' as 'plancher_chauffant' | 'radiateurs_bt' | 'radiateurs_ht' | 'ventilo_convecteurs',
    production_ecs: true,
    volume_ballon_ecs: '200',
    puissance_calculee: '',
    cop_estime: '',
    budget_estime: '',
    pieces: [] as Piece[],
    notes: '',
    // Nouveaux champs
    annee_construction: '',
    dpe_lettre: 'D' as 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G',
    document_joint: '',
  });

  // États pour PAC Air/Air
  const [airAirCalcul, setAirAirCalcul] = useState({
    nom: '',
    client_nom: '',
    adresse: '',
    surface_totale: '',
    isolation: 'moyenne' as 'mauvaise' | 'moyenne' | 'bonne' | 'tres_bonne',
    zone_climatique: 'H2' as 'H1' | 'H2' | 'H3',
    type_installation: 'mono_split' as 'mono_split' | 'multi_split' | 'gainable',
    puissance_totale_calculee: '',
    scop_estime: '',
    seer_estime: '',
    budget_estime: '',
    pieces: [] as Piece[],
    notes: '',
    // Nouveaux champs 
    annee_construction: '',
    dpe_lettre: 'D' as 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G',
    document_joint: '',
  });

  // État pour l'ajout de pièces
  const [showPieceModal, setShowPieceModal] = useState(false);
  const [currentPacType, setCurrentPacType] = useState<'air_eau' | 'air_air'>('air_eau');
  const [newPiece, setNewPiece] = useState({
    nom: '',
    type: 'salon' as 'salon' | 'chambre' | 'cuisine' | 'salle_de_bain' | 'bureau' | 'couloir' | 'autre',
    // Dimensions
    longueur: '',
    largeur: '',
    hauteur_plafond: '2.5',
    surface: '', // Calculée automatiquement
    // Calculs de puissance
    coefficient_g: '',
    delta_temperature: '',
    ratio_norme_energetique: '',
    puissance_necessaire: '', // Calculée automatiquement
    // Spécifique Air/Air
    type_unite_interieure: 'murale' as 'murale' | 'cassette' | 'gainable' | 'console',
    // Spécifique Air/Eau
    temperature_depart: '35',
    // Radiateurs existants (Air/Eau uniquement)
    radiateurs_existants: [
      {
        id: Date.now().toString(),
        type_materiau: '',
        hauteur: '',
        largeur: '',
        profondeur: '',
        nombre: '',
      }
    ] as RadiateurExistant[],
    // Commentaires
    commentaires: '',
  });

  const { calculs, loading, fetchCalculs, addCalcul, updateCalcul, deleteCalcul } = useCalculPACStore();

  useEffect(() => {
    fetchCalculs();
  }, []);

  // Calcul automatique de la surface
  useEffect(() => {
    if (newPiece.longueur && newPiece.largeur) {
      const longueur = parseFloat(newPiece.longueur);
      const largeur = parseFloat(newPiece.largeur);
      if (!isNaN(longueur) && !isNaN(largeur)) {
        const surface = (longueur * largeur).toFixed(2);
        setNewPiece(prev => ({ ...prev, surface }));
      }
    }
  }, [newPiece.longueur, newPiece.largeur]);

  // Calcul automatique de la puissance nécessaire
  useEffect(() => {
    if (newPiece.surface && newPiece.coefficient_g && newPiece.delta_temperature && newPiece.ratio_norme_energetique) {
      const surface = parseFloat(newPiece.surface);
      const coeffG = parseFloat(newPiece.coefficient_g);
      const deltaT = parseFloat(newPiece.delta_temperature);
      const ratio = parseFloat(newPiece.ratio_norme_energetique);
      
      if (!isNaN(surface) && !isNaN(coeffG) && !isNaN(deltaT) && !isNaN(ratio)) {
        // Formule : Puissance = Surface × Coefficient G × Delta T × Ratio
        const puissance = (surface * coeffG * deltaT * ratio).toFixed(0);
        setNewPiece(prev => ({ ...prev, puissance_necessaire: puissance }));
      }
    }
  }, [newPiece.surface, newPiece.coefficient_g, newPiece.delta_temperature, newPiece.ratio_norme_energetique]);

  const filteredCalculs = calculs.filter(calcul =>
    calcul.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    calcul.client_nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    calcul.type_pac.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectPacType = (type: 'air_eau' | 'air_air') => {
    setShowTypeModal(false);
    if (type === 'air_eau') {
      setShowAirEauModal(true);
    } else {
      setShowAirAirModal(true);
    }
  };

  const resetNewPiece = () => {
    setNewPiece({
      nom: '',
      type: 'salon',
      longueur: '',
      largeur: '',
      hauteur_plafond: '2.5',
      surface: '',
      coefficient_g: '',
      delta_temperature: '',
      ratio_norme_energetique: '',
      puissance_necessaire: '',
      type_unite_interieure: 'murale',
      temperature_depart: '35',
      radiateurs_existants: [
        {
          id: Date.now().toString(),
          type_materiau: '',
          hauteur: '',
          largeur: '',
          profondeur: '',
          nombre: '',
        }
      ],
      commentaires: '',
    });
  };

  const handleAddPiece = () => {
    if (!newPiece.nom.trim() || !newPiece.surface.trim()) {
      Alert.alert('Erreur', 'Le nom et les dimensions de la pièce sont obligatoires');
      return;
    }

    const piece: Piece = {
      id: Date.now().toString(),
      ...newPiece,
    };

    if (currentPacType === 'air_eau') {
      setAirEauCalcul(prev => ({
        ...prev,
        pieces: [...prev.pieces, piece]
      }));
    } else {
      setAirAirCalcul(prev => ({
        ...prev,
        pieces: [...prev.pieces, piece]
      }));
    }

    resetNewPiece();
    setShowPieceModal(false);
  };

  const addRadiateur = () => {
    const newRadiateur: RadiateurExistant = {
      id: Date.now().toString(),
      type_materiau: '',
      hauteur: '',
      largeur: '',
      profondeur: '',
      nombre: '',
    };
    setNewPiece(prev => ({
      ...prev,
      radiateurs_existants: [...prev.radiateurs_existants, newRadiateur]
    }));
  };

  const removeRadiateur = (radiateurId: string) => {
    setNewPiece(prev => ({
      ...prev,
      radiateurs_existants: prev.radiateurs_existants.filter(r => r.id !== radiateurId)
    }));
  };

  const updateRadiateur = (radiateurId: string, field: string, value: string) => {
    setNewPiece(prev => ({
      ...prev,
      radiateurs_existants: prev.radiateurs_existants.map(r => 
        r.id === radiateurId ? { ...r, [field]: value } : r
      )
    }));
  };

  const handleSaveAirEau = async () => {
    if (!airEauCalcul.nom.trim() || !airEauCalcul.client_nom.trim()) {
      Alert.alert('Erreur', 'Le nom du calcul et le client sont obligatoires');
      return;
    }

    try {
      const calculData = {
        ...airEauCalcul,
        type_pac: 'air_eau' as const,
      };
      await addCalcul(calculData);
      setShowAirEauModal(false);
      resetAirEauForm();
      Alert.alert('Succès', 'Calcul PAC Air/Eau ajouté avec succès');
    } catch (error) {
      Alert.alert('Erreur', 'Erreur lors de l\'ajout du calcul');
    }
  };

  const handleSaveAirAir = async () => {
    if (!airAirCalcul.nom.trim() || !airAirCalcul.client_nom.trim()) {
      Alert.alert('Erreur', 'Le nom du calcul et le client sont obligatoires');
      return;
    }

    try {
      const calculData = {
        ...airAirCalcul,
        type_pac: 'air_air' as const,
      };
      await addCalcul(calculData);
      setShowAirAirModal(false);
      resetAirAirForm();
      Alert.alert('Succès', 'Calcul PAC Air/Air ajouté avec succès');
    } catch (error) {
      Alert.alert('Erreur', 'Erreur lors de l\'ajout du calcul');
    }
  };

  const resetAirEauForm = () => {
    setAirEauCalcul({
      nom: '',
      client_nom: '',
      adresse: '',
      surface_totale: '',
      isolation: 'moyenne',
      zone_climatique: 'H2',
      temperature_exterieure_base: '-7',
      temperature_interieure_souhaitee: '20',
      altitude: '',
      type_emetteur: 'plancher_chauffant',
      production_ecs: true,
      volume_ballon_ecs: '200',
      puissance_calculee: '',
      cop_estime: '',
      budget_estime: '',
      pieces: [],
      notes: '',
      annee_construction: '',
      dpe_lettre: 'D',
      document_joint: '',
    });
  };

  const resetAirAirForm = () => {
    setAirAirCalcul({
      nom: '',
      client_nom: '',
      adresse: '',
      surface_totale: '',
      isolation: 'moyenne',
      zone_climatique: 'H2',
      type_installation: 'mono_split',
      puissance_totale_calculee: '',
      scop_estime: '',
      seer_estime: '',
      budget_estime: '',
      pieces: [],
      notes: '',
      annee_construction: '',
      dpe_lettre: 'D',
      document_joint: '',
    });
  };

  const handleDeleteCalcul = (calcul: CalculPAC) => {
    Alert.alert(
      'Confirmer la suppression',
      `Êtes-vous sûr de vouloir supprimer le calcul "${calcul.nom}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Supprimer', 
          style: 'destructive',
          onPress: () => deleteCalcul(calcul.id)
        },
      ]
    );
  };

  const removePiece = (pieceId: string, type: 'air_eau' | 'air_air') => {
    if (type === 'air_eau') {
      setAirEauCalcul(prev => ({
        ...prev,
        pieces: prev.pieces.filter(p => p.id !== pieceId)
      }));
    } else {
      setAirAirCalcul(prev => ({
        ...prev,
        pieces: prev.pieces.filter(p => p.id !== pieceId)
      }));
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'air_eau': return 'thermometer-outline';
      case 'air_air': return 'snow-outline';
      case 'geothermie': return 'earth-outline';
      default: return 'build-outline';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'air_eau': return '#E74C3C';
      case 'air_air': return '#3498DB';
      case 'geothermie': return '#2ECC71';
      default: return '#666';
    }
  };

  const renderCalculItem = ({ item }: { item: CalculPAC }) => (
    <TouchableOpacity 
      style={styles.calculCard}
      onPress={() => setSelectedCalcul(item)}
    >
      <View style={styles.calculHeader}>
        <View style={styles.calculIcon}>
          <Ionicons 
            name={getTypeIcon(item.type_pac) as any} 
            size={24} 
            color={getTypeColor(item.type_pac)} 
          />
        </View>
        
        <View style={styles.calculInfo}>
          <Text style={styles.calculName}>{item.nom}</Text>
          <Text style={styles.calculClient}>Client: {item.client_nom}</Text>
          <Text style={styles.calculType}>
            {item.type_pac.replace('_', ' ').toUpperCase()} - Zone {item.zone_climatique || 'H2'}
          </Text>
          <Text style={styles.calculPieces}>
            {item.pieces?.length || 0} pièce(s) - {item.surface_totale || 0}m²
          </Text>
          {item.annee_construction && (
            <Text style={styles.calculDetails}>
              {item.annee_construction} - DPE: {item.dpe_lettre}
            </Text>
          )}
        </View>
        
        <View style={styles.calculActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleDeleteCalcul(item)}
          >
            <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
          </TouchableOpacity>
        </View>
      </View>
      
      {item.adresse && (
        <Text style={styles.calculAddress}>📍 {item.adresse}</Text>
      )}

      {item.budget_estime && (
        <Text style={styles.calculBudget}>
          💰 Budget estimé: {item.budget_estime}€
        </Text>
      )}

      <Text style={styles.calculDate}>
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
        
        <Text style={styles.title}>Calculs PAC</Text>
        
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setShowTypeModal(true)}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un calcul PAC..."
          placeholderTextColor="#666"
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
      </View>

      <FlatList
        data={filteredCalculs}
        renderItem={renderCalculItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshing={loading}
        onRefresh={fetchCalculs}
      />

      {/* Modal de sélection du type de PAC */}
      <Modal
        visible={showTypeModal}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.typeSelectionModal}>
            <Text style={styles.typeSelectionTitle}>Choisir le type de PAC</Text>
            
            <TouchableOpacity 
              style={[styles.typeSelectionButton, { backgroundColor: '#E74C3C' }]}
              onPress={() => handleSelectPacType('air_eau')}
            >
              <Ionicons name="thermometer-outline" size={32} color="#fff" />
              <Text style={styles.typeSelectionButtonText}>PAC Air/Eau</Text>
              <Text style={styles.typeSelectionButtonDesc}>Chauffage + ECS + Radiateurs</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.typeSelectionButton, { backgroundColor: '#3498DB' }]}
              onPress={() => handleSelectPacType('air_air')}
            >
              <Ionicons name="snow-outline" size={32} color="#fff" />
              <Text style={styles.typeSelectionButtonText}>PAC Air/Air</Text>
              <Text style={styles.typeSelectionButtonDesc}>Climatisation réversible pièce par pièce</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.cancelTypeButton}
              onPress={() => setShowTypeModal(false)}
            >
              <Text style={styles.cancelTypeButtonText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal d'ajout de pièce */}
      <Modal
        visible={showPieceModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowPieceModal(false)}>
              <Text style={styles.cancelButton}>Annuler</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Ajouter une pièce</Text>
            <TouchableOpacity onPress={handleAddPiece}>
              <Text style={styles.saveButton}>Ajouter</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nom de la pièce *</Text>
              <TextInput
                style={styles.input}
                value={newPiece.nom}
                onChangeText={(text) => setNewPiece({...newPiece, nom: text})}
                placeholder="Ex: Salon principal"
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Type de pièce</Text>
              <View style={styles.typeButtons}>
                {[
                  { key: 'salon', label: 'Salon' },
                  { key: 'chambre', label: 'Chambre' },
                  { key: 'cuisine', label: 'Cuisine' },
                  { key: 'salle_de_bain', label: 'SDB' },
                  { key: 'bureau', label: 'Bureau' },
                  { key: 'couloir', label: 'Couloir' },
                  { key: 'autre', label: 'Autre' },
                ].map((type) => (
                  <TouchableOpacity
                    key={type.key}
                    style={[
                      styles.typeButton,
                      newPiece.type === type.key && styles.typeButtonActive
                    ]}
                    onPress={() => setNewPiece({...newPiece, type: type.key as any})}
                  >
                    <Text style={[
                      styles.typeButtonText,
                      newPiece.type === type.key && styles.typeButtonTextActive
                    ]}>
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Dimensions */}
            <View style={styles.sectionHeader}>
              <Ionicons name="resize-outline" size={20} color="#007AFF" />
              <Text style={styles.sectionTitle}>Dimensions</Text>
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.flex1]}>
                <Text style={styles.inputLabel}>Longueur (m) *</Text>
                <TextInput
                  style={styles.input}
                  value={newPiece.longueur}
                  onChangeText={(text) => setNewPiece({...newPiece, longueur: text})}
                  placeholder="4.5"
                  placeholderTextColor="#666"
                  keyboardType="numeric"
                />
              </View>

              <View style={[styles.inputGroup, styles.flex1]}>
                <Text style={styles.inputLabel}>Largeur (m) *</Text>
                <TextInput
                  style={styles.input}
                  value={newPiece.largeur}
                  onChangeText={(text) => setNewPiece({...newPiece, largeur: text})}
                  placeholder="3.5"
                  placeholderTextColor="#666"
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.flex1]}>
                <Text style={styles.inputLabel}>Hauteur plafond (m)</Text>
                <TextInput
                  style={styles.input}
                  value={newPiece.hauteur_plafond}
                  onChangeText={(text) => setNewPiece({...newPiece, hauteur_plafond: text})}
                  placeholder="2.5"
                  placeholderTextColor="#666"
                  keyboardType="numeric"
                />
              </View>

              <View style={[styles.inputGroup, styles.flex1]}>
                <Text style={styles.inputLabel}>Surface calculée (m²)</Text>
                <TextInput
                  style={[styles.input, styles.calculatedField]}
                  value={newPiece.surface}
                  editable={false}
                  placeholder="Calculé auto"
                  placeholderTextColor="#00D4AA"
                />
              </View>
            </View>

            {/* Calculs techniques */}
            <View style={styles.sectionHeader}>
              <Ionicons name="calculator-outline" size={20} color="#E74C3C" />
              <Text style={styles.sectionTitle}>Calculs techniques</Text>
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.flex1]}>
                <Text style={styles.inputLabel}>Coefficient G</Text>
                <TextInput
                  style={styles.input}
                  value={newPiece.coefficient_g}
                  onChangeText={(text) => setNewPiece({...newPiece, coefficient_g: text})}
                  placeholder="1.2"
                  placeholderTextColor="#666"
                  keyboardType="numeric"
                />
              </View>

              <View style={[styles.inputGroup, styles.flex1]}>
                <Text style={styles.inputLabel}>Delta T (°C)</Text>
                <TextInput
                  style={styles.input}
                  value={newPiece.delta_temperature}
                  onChangeText={(text) => setNewPiece({...newPiece, delta_temperature: text})}
                  placeholder="27"
                  placeholderTextColor="#666"
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.flex1]}>
                <Text style={styles.inputLabel}>Ratio norme énergétique</Text>
                <TextInput
                  style={styles.input}
                  value={newPiece.ratio_norme_energetique}
                  onChangeText={(text) => setNewPiece({...newPiece, ratio_norme_energetique: text})}
                  placeholder="1.0"
                  placeholderTextColor="#666"
                  keyboardType="numeric"
                />
              </View>

              <View style={[styles.inputGroup, styles.flex1]}>
                <Text style={styles.inputLabel}>Puissance nécessaire (W)</Text>
                <TextInput
                  style={[styles.input, styles.calculatedField]}
                  value={newPiece.puissance_necessaire}
                  editable={false}
                  placeholder="Calculé auto"
                  placeholderTextColor="#00D4AA"
                />
              </View>
            </View>

            {currentPacType === 'air_air' && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Type d'unité intérieure</Text>
                <View style={styles.typeButtons}>
                  {[
                    { key: 'murale', label: 'Murale' },
                    { key: 'cassette', label: 'Cassette' },
                    { key: 'gainable', label: 'Gainable' },
                    { key: 'console', label: 'Console' },
                  ].map((type) => (
                    <TouchableOpacity
                      key={type.key}
                      style={[
                        styles.typeButton,
                        newPiece.type_unite_interieure === type.key && styles.typeButtonActive
                      ]}
                      onPress={() => setNewPiece({...newPiece, type_unite_interieure: type.key as any})}
                    >
                      <Text style={[
                        styles.typeButtonText,
                        newPiece.type_unite_interieure === type.key && styles.typeButtonTextActive
                      ]}>
                        {type.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Radiateurs existants pour Air/Eau */}
            {currentPacType === 'air_eau' && (
              <>
                <View style={styles.sectionHeader}>
                  <Ionicons name="radio-outline" size={20} color="#E74C3C" />
                  <Text style={styles.sectionTitle}>Radiateurs existants</Text>
                  <TouchableOpacity 
                    style={styles.addRadiateurButton}
                    onPress={addRadiateur}
                  >
                    <Ionicons name="add" size={16} color="#fff" />
                  </TouchableOpacity>
                </View>

                {newPiece.radiateurs_existants.map((radiateur, index) => (
                  <View key={radiateur.id} style={styles.radiateurItem}>
                    <View style={styles.radiateurHeader}>
                      <Text style={styles.radiateurTitle}>Radiateur {index + 1}</Text>
                      {newPiece.radiateurs_existants.length > 1 && (
                        <TouchableOpacity onPress={() => removeRadiateur(radiateur.id)}>
                          <Ionicons name="close-circle" size={20} color="#FF6B6B" />
                        </TouchableOpacity>
                      )}
                    </View>
                    
                    <View style={styles.row}>
                      <View style={[styles.inputGroup, styles.flex2]}>
                        <Text style={styles.inputLabelSmall}>Type/Matériau</Text>
                        <TextInput
                          style={styles.inputSmall}
                          value={radiateur.type_materiau}
                          onChangeText={(text) => updateRadiateur(radiateur.id, 'type_materiau', text)}
                          placeholder="Acier, Fonte..."
                          placeholderTextColor="#666"
                        />
                      </View>
                      <View style={[styles.inputGroup, styles.flex1]}>
                        <Text style={styles.inputLabelSmall}>Nombre</Text>
                        <TextInput
                          style={styles.inputSmall}
                          value={radiateur.nombre}
                          onChangeText={(text) => updateRadiateur(radiateur.id, 'nombre', text)}
                          placeholder="1"
                          placeholderTextColor="#666"
                          keyboardType="numeric"
                        />
                      </View>
                    </View>

                    <View style={styles.row}>
                      <View style={[styles.inputGroup, styles.flex1]}>
                        <Text style={styles.inputLabelSmall}>H (mm)</Text>
                        <TextInput
                          style={styles.inputSmall}
                          value={radiateur.hauteur}
                          onChangeText={(text) => updateRadiateur(radiateur.id, 'hauteur', text)}
                          placeholder="600"
                          placeholderTextColor="#666"
                          keyboardType="numeric"
                        />
                      </View>
                      <View style={[styles.inputGroup, styles.flex1]}>
                        <Text style={styles.inputLabelSmall}>L (mm)</Text>
                        <TextInput
                          style={styles.inputSmall}
                          value={radiateur.largeur}
                          onChangeText={(text) => updateRadiateur(radiateur.id, 'largeur', text)}
                          placeholder="1000"
                          placeholderTextColor="#666"
                          keyboardType="numeric"
                        />
                      </View>
                      <View style={[styles.inputGroup, styles.flex1]}>
                        <Text style={styles.inputLabelSmall}>P (mm)</Text>
                        <TextInput
                          style={styles.inputSmall}
                          value={radiateur.profondeur}
                          onChangeText={(text) => updateRadiateur(radiateur.id, 'profondeur', text)}
                          placeholder="100"
                          placeholderTextColor="#666"
                          keyboardType="numeric"
                        />
                      </View>
                    </View>
                  </View>
                ))}
              </>
            )}

            {/* Commentaires */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Commentaires</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={newPiece.commentaires}
                onChangeText={(text) => setNewPiece({...newPiece, commentaires: text})}
                placeholder="Observations, notes techniques..."
                placeholderTextColor="#666"
                multiline
                textAlignVertical="top"
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Ici on peut ajouter les modals Air/Eau et Air/Air avec les nouveaux champs */}
      {/* Je continue avec les modals dans la partie suivante pour ne pas dépasser la limite */}
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
    backgroundColor: '#E74C3C',
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
  calculCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  calculHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  calculIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#333',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  calculInfo: {
    flex: 1,
  },
  calculName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  calculClient: {
    fontSize: 14,
    color: '#007AFF',
    marginBottom: 2,
  },
  calculType: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  calculPieces: {
    fontSize: 12,
    color: '#00D4AA',
    marginBottom: 2,
  },
  calculDetails: {
    fontSize: 12,
    color: '#FF9500',
  },
  calculActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
  calculAddress: {
    fontSize: 14,
    color: '#999',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  calculBudget: {
    fontSize: 14,
    color: '#00D4AA',
    marginBottom: 4,
    fontWeight: '500',
  },
  calculDate: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeSelectionModal: {
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    padding: 24,
    width: '80%',
    alignItems: 'center',
  },
  typeSelectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 24,
  },
  typeSelectionButton: {
    width: '100%',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  typeSelectionButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 8,
  },
  typeSelectionButtonDesc: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.8,
    marginTop: 4,
    textAlign: 'center',
  },
  cancelTypeButton: {
    padding: 12,
  },
  cancelTypeButtonText: {
    color: '#FF6B6B',
    fontSize: 16,
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
    color: '#E74C3C',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 8,
    flex: 1,
  },
  addRadiateurButton: {
    backgroundColor: '#E74C3C',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
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
  inputLabelSmall: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
  },
  inputSmall: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 14,
  },
  calculatedField: {
    backgroundColor: '#1a3d1a',
    color: '#00D4AA',
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
  typeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeButton: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  typeButtonActive: {
    backgroundColor: '#E74C3C',
  },
  typeButtonText: {
    color: '#999',
    fontSize: 14,
  },
  typeButtonTextActive: {
    color: '#fff',
  },
  radiateurItem: {
    backgroundColor: '#333',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  radiateurHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  radiateurTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});