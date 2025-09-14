import { create } from 'zustand';
import axios from 'axios';

export interface FicheSDB {
  id: string;
  nom: string;
  client_nom: string;
  adresse: string;
  type_sdb: 'complete' | 'douche' | 'wc' | 'mixte';
  surface: string;
  carrelage_mur: string;
  carrelage_sol: string;
  sanitaires: string;
  robinetterie: string;
  chauffage: string;
  ventilation: string;
  eclairage: string;
  budget_estime: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

interface FicheSDBState {
  fiches: FicheSDB[];
  loading: boolean;
  error: string | null;
  fetchFiches: () => Promise<void>;
  addFiche: (ficheData: Omit<FicheSDB, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateFiche: (id: string, ficheData: Partial<FicheSDB>) => Promise<void>;
  deleteFiche: (id: string) => Promise<void>;
}

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

export const useFicheSDBStore = create<FicheSDBState>((set, get) => ({
  fiches: [],
  loading: false,
  error: null,

  fetchFiches: async () => {
    set({ loading: true, error: null });
    try {
      const response = await axios.get(`${BACKEND_URL}/api/fiches-sdb`);
      set({ fiches: response.data, loading: false });
    } catch (error) {
      console.error('Error fetching fiches SDB:', error);
      set({ error: 'Erreur lors du chargement des fiches SDB', loading: false });
    }
  },

  addFiche: async (ficheData) => {
    set({ loading: true, error: null });
    try {
      const response = await axios.post(`${BACKEND_URL}/api/fiches-sdb`, ficheData);
      const newFiche = response.data;
      set(state => ({ 
        fiches: [newFiche, ...state.fiches], 
        loading: false 
      }));
    } catch (error) {
      console.error('Error adding fiche SDB:', error);
      set({ error: 'Erreur lors de l\'ajout de la fiche SDB', loading: false });
      throw error;
    }
  },

  updateFiche: async (id: string, ficheData) => {
    set({ loading: true, error: null });
    try {
      const response = await axios.put(`${BACKEND_URL}/api/fiches-sdb/${id}`, ficheData);
      const updatedFiche = response.data;
      set(state => ({
        fiches: state.fiches.map(fiche => 
          fiche.id === id ? updatedFiche : fiche
        ),
        loading: false
      }));
    } catch (error) {
      console.error('Error updating fiche SDB:', error);
      set({ error: 'Erreur lors de la mise à jour de la fiche SDB', loading: false });
      throw error;
    }
  },

  deleteFiche: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await axios.delete(`${BACKEND_URL}/api/fiches-sdb/${id}`);
      set(state => ({
        fiches: state.fiches.filter(fiche => fiche.id !== id),
        loading: false
      }));
    } catch (error) {
      console.error('Error deleting fiche SDB:', error);
      set({ error: 'Erreur lors de la suppression de la fiche SDB', loading: false });
      throw error;
    }
  },
}));