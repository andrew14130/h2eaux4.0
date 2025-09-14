import { create } from 'zustand';
import axios from 'axios';

export interface Document {
  id: string;
  nom: string;
  type: 'facture' | 'devis' | 'contrat' | 'fiche_technique' | 'rapport' | 'autre';
  client_nom: string;
  chantier_nom: string;
  description: string;
  tags: string;
  file_path?: string;
  file_size?: number;
  mime_type?: string;
  created_at: string;
  updated_at: string;
}

interface DocumentState {
  documents: Document[];
  loading: boolean;
  error: string | null;
  fetchDocuments: () => Promise<void>;
  addDocument: (documentData: Omit<Document, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateDocument: (id: string, documentData: Partial<Document>) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
}

// For Expo web, we need to use the hardcoded URL since process.env is not available in browser
const BACKEND_URL = 'https://h2eaux-gestion-1.preview.emergentagent.com';

export const useDocumentStore = create<DocumentState>((set, get) => ({
  documents: [],
  loading: false,
  error: null,

  fetchDocuments: async () => {
    set({ loading: true, error: null });
    try {
      const response = await axios.get(`${BACKEND_URL}/api/documents`);
      set({ documents: response.data, loading: false });
    } catch (error) {
      console.error('Error fetching documents:', error);
      set({ error: 'Erreur lors du chargement des documents', loading: false });
    }
  },

  addDocument: async (documentData) => {
    set({ loading: true, error: null });
    try {
      const response = await axios.post(`${BACKEND_URL}/api/documents`, documentData);
      const newDocument = response.data;
      set(state => ({ 
        documents: [newDocument, ...state.documents], 
        loading: false 
      }));
    } catch (error) {
      console.error('Error adding document:', error);
      set({ error: 'Erreur lors de l\'ajout du document', loading: false });
      throw error;
    }
  },

  updateDocument: async (id: string, documentData) => {
    set({ loading: true, error: null });
    try {
      const response = await axios.put(`${BACKEND_URL}/api/documents/${id}`, documentData);
      const updatedDocument = response.data;
      set(state => ({
        documents: state.documents.map(document => 
          document.id === id ? updatedDocument : document
        ),
        loading: false
      }));
    } catch (error) {
      console.error('Error updating document:', error);
      set({ error: 'Erreur lors de la mise à jour du document', loading: false });
      throw error;
    }
  },

  deleteDocument: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await axios.delete(`${BACKEND_URL}/api/documents/${id}`);
      set(state => ({
        documents: state.documents.filter(document => document.id !== id),
        loading: false
      }));
    } catch (error) {
      console.error('Error deleting document:', error);
      set({ error: 'Erreur lors de la suppression du document', loading: false });
      throw error;
    }
  },
}));