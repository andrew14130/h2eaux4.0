import { create } from 'zustand';
import axios from 'axios';

export interface Client {
  id: string;
  nom: string;
  prenom: string;
  telephone: string;
  email: string;
  adresse: string;
  ville: string;
  code_postal: string;
  type_chauffage?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface ClientsState {
  clients: Client[];
  loading: boolean;
  error: string | null;
  fetchClients: () => Promise<void>;
  addClient: (clientData: Omit<Client, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateClient: (id: string, clientData: Partial<Client>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
}

// For Expo web, we need to use the hardcoded URL since process.env is not available in browser
const BACKEND_URL = 'https://h2eaux-gestion-1.preview.emergentagent.com';

export const useClientsStore = create<ClientsState>((set, get) => ({
  clients: [],
  loading: false,
  error: null,

  fetchClients: async () => {
    set({ loading: true, error: null });
    try {
      const response = await axios.get(`${BACKEND_URL}/api/clients`);
      set({ clients: response.data, loading: false });
    } catch (error) {
      console.error('Error fetching clients:', error);
      set({ error: 'Erreur lors du chargement des clients', loading: false });
    }
  },

  addClient: async (clientData) => {
    set({ loading: true, error: null });
    try {
      const response = await axios.post(`${BACKEND_URL}/api/clients`, clientData);
      const newClient = response.data;
      set(state => ({ 
        clients: [newClient, ...state.clients], 
        loading: false 
      }));
    } catch (error) {
      console.error('Error adding client:', error);
      set({ error: 'Erreur lors de l\'ajout du client', loading: false });
      throw error;
    }
  },

  updateClient: async (id: string, clientData) => {
    set({ loading: true, error: null });
    try {
      const response = await axios.put(`${BACKEND_URL}/api/clients/${id}`, clientData);
      const updatedClient = response.data;
      set(state => ({
        clients: state.clients.map(client => 
          client.id === id ? updatedClient : client
        ),
        loading: false
      }));
    } catch (error) {
      console.error('Error updating client:', error);
      set({ error: 'Erreur lors de la mise à jour du client', loading: false });
      throw error;
    }
  },

  deleteClient: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await axios.delete(`${BACKEND_URL}/api/clients/${id}`);
      set(state => ({
        clients: state.clients.filter(client => client.id !== id),
        loading: false
      }));
    } catch (error) {
      console.error('Error deleting client:', error);
      set({ error: 'Erreur lors de la suppression du client', loading: false });
      throw error;
    }
  },
}));