import { create } from 'zustand';
import axios from 'axios';

export interface RadiateurExistant {
  id: string;
  type_materiau: string;
  hauteur: string;
  largeur: string;
  profondeur: string;
  nombre: string;
}

export interface Piece {
  id: string;
  nom: string;
  type: 'salon' | 'chambre' | 'cuisine' | 'salle_de_bain' | 'bureau' | 'couloir' | 'autre';
  // Dimensions
  longueur: string;
  largeur: string;
  hauteur_plafond: string;
  surface: string; // Calculée automatiquement
  // Calculs de puissance
  coefficient_g: string;
  delta_temperature: string;
  ratio_norme_energetique: string;
  puissance_necessaire: string; // Calculée automatiquement
  // Spécifique Air/Air
  type_unite_interieure?: 'murale' | 'cassette' | 'gainable' | 'console';
  // Spécifique Air/Eau
  temperature_depart?: string;
  // Radiateurs existants (Air/Eau uniquement)
  radiateurs_existants?: RadiateurExistant[];
  // Commentaires
  commentaires: string;
}

export interface CalculPAC {
  id: string;
  nom: string;
  client_nom: string;
  adresse: string;
  type_pac: 'air_eau' | 'air_air' | 'geothermie';
  
  // Commun
  surface_totale?: string;
  isolation?: 'mauvaise' | 'moyenne' | 'bonne' | 'tres_bonne';
  zone_climatique?: 'H1' | 'H2' | 'H3';
  budget_estime?: string;
  pieces?: Piece[];
  notes?: string;
  
  // Nouveaux champs communs
  annee_construction?: string;
  dpe_lettre?: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G';
  document_joint?: string;
  
  // Spécifique Air/Eau
  temperature_exterieure_base?: string;
  temperature_interieure_souhaitee?: string;
  altitude?: string;
  type_emetteur?: 'plancher_chauffant' | 'radiateurs_bt' | 'radiateurs_ht' | 'ventilo_convecteurs';
  production_ecs?: boolean;
  volume_ballon_ecs?: string;
  puissance_calculee?: string;
  cop_estime?: string;
  
  // Spécifique Air/Air
  type_installation?: 'mono_split' | 'multi_split' | 'gainable';
  puissance_totale_calculee?: string;
  scop_estime?: string;
  seer_estime?: string;
  
  // Legacy (pour compatibilité)
  surface_a_chauffer?: string;
  consommation_estimee?: string;
  
  created_at: string;
  updated_at: string;
}

interface CalculPACState {
  calculs: CalculPAC[];
  loading: boolean;
  error: string | null;
  fetchCalculs: () => Promise<void>;
  addCalcul: (calculData: Omit<CalculPAC, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateCalcul: (id: string, calculData: Partial<CalculPAC>) => Promise<void>;
  deleteCalcul: (id: string) => Promise<void>;
}

// For Expo web, we need to use the hardcoded URL since process.env is not available in browser
const BACKEND_URL = 'https://h2eaux-gestion-1.preview.emergentagent.com';

export const useCalculPACStore = create<CalculPACState>((set, get) => ({
  calculs: [],
  loading: false,
  error: null,

  fetchCalculs: async () => {
    set({ loading: true, error: null });
    try {
      const response = await axios.get(`${BACKEND_URL}/api/calculs-pac`);
      set({ calculs: response.data, loading: false });
    } catch (error) {
      console.error('Error fetching calculs PAC:', error);
      set({ error: 'Erreur lors du chargement des calculs PAC', loading: false });
    }
  },

  addCalcul: async (calculData) => {
    set({ loading: true, error: null });
    try {
      const response = await axios.post(`${BACKEND_URL}/api/calculs-pac`, calculData);
      const newCalcul = response.data;
      set(state => ({ 
        calculs: [newCalcul, ...state.calculs], 
        loading: false 
      }));
    } catch (error) {
      console.error('Error adding calcul PAC:', error);
      set({ error: 'Erreur lors de l\'ajout du calcul PAC', loading: false });
      throw error;
    }
  },

  updateCalcul: async (id: string, calculData) => {
    set({ loading: true, error: null });
    try {
      const response = await axios.put(`${BACKEND_URL}/api/calculs-pac/${id}`, calculData);
      const updatedCalcul = response.data;
      set(state => ({
        calculs: state.calculs.map(calcul => 
          calcul.id === id ? updatedCalcul : calcul
        ),
        loading: false
      }));
    } catch (error) {
      console.error('Error updating calcul PAC:', error);
      set({ error: 'Erreur lors de la mise à jour du calcul PAC', loading: false });
      throw error;
    }
  },

  deleteCalcul: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await axios.delete(`${BACKEND_URL}/api/calculs-pac/${id}`);
      set(state => ({
        calculs: state.calculs.filter(calcul => calcul.id !== id),
        loading: false
      }));
    } catch (error) {
      console.error('Error deleting calcul PAC:', error);
      set({ error: 'Erreur lors de la suppression du calcul PAC', loading: false });
      throw error;
    }
  },
}));