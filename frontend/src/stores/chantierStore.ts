import { create } from 'zustand';
import axios from 'axios';

export interface Chantier {
  id: string;
  nom: string;
  adresse: string;
  ville: string;
  code_postal: string;
  client_nom: string;
  client_telephone: string;
  type_travaux: string;
  statut: 'en_attente' | 'en_cours' | 'termine' | 'annule';
  date_debut: string;
  date_fin_prevue: string;
  date_fin_reelle?: string;
  budget_estime: string;
  budget_final?: string;
  description: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface ChantierState {
  chantiers: Chantier[];
  loading: boolean;
  error: string | null;
  fetchChantiers: () => Promise<void>;
  addChantier: (chantierData: Omit<Chantier, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateChantier: (id: string, chantierData: Partial<Chantier>) => Promise<void>;
  deleteChantier: (id: string) => Promise<void>;
}

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

export const useChantierStore = create<ChantierState>((set, get) => ({
  chantiers: [],
  loading: false,
  error: null,

  fetchChantiers: async () => {
    set({ loading: true, error: null });
    try {
      const response = await axios.get(`${BACKEND_URL}/api/chantiers`);
      set({ chantiers: response.data, loading: false });
    } catch (error) {
      console.error('Error fetching chantiers:', error);
      set({ error: 'Erreur lors du chargement des chantiers', loading: false });
    }
  },

  addChantier: async (chantierData) => {
    set({ loading: true, error: null });
    try {
      const response = await axios.post(`${BACKEND_URL}/api/chantiers`, chantierData);
      const newChantier = response.data;
      set(state => ({ 
        chantiers: [newChantier, ...state.chantiers], 
        loading: false 
      }));
    } catch (error) {
      console.error('Error adding chantier:', error);
      set({ error: 'Erreur lors de l\'ajout du chantier', loading: false });
      throw error;
    }
  },

  updateChantier: async (id: string, chantierData) => {
    set({ loading: true, error: null });
    try {
      const response = await axios.put(`${BACKEND_URL}/api/chantiers/${id}`, chantierData);
      const updatedChantier = response.data;
      set(state => ({
        chantiers: state.chantiers.map(chantier => 
          chantier.id === id ? updatedChantier : chantier
        ),
        loading: false
      }));
    } catch (error) {
      console.error('Error updating chantier:', error);
      set({ error: 'Erreur lors de la mise à jour du chantier', loading: false });
      throw error;
    }
  },

  deleteChantier: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await axios.delete(`${BACKEND_URL}/api/chantiers/${id}`);
      set(state => ({
        chantiers: state.chantiers.filter(chantier => chantier.id !== id),
        loading: false
      }));
    } catch (error) {
      console.error('Error deleting chantier:', error);
      set({ error: 'Erreur lors de la suppression du chantier', loading: false });
      throw error;
    }
  },
}));