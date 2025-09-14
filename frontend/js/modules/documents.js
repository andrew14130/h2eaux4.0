// ===== DOCUMENTS MODULE =====
window.documents = {
    data: [],
    currentEdit: null,

    async load() {
        try {
            this.data = await app.apiCall('/documents');
            this.render();
        } catch (error) {
            console.error('Error loading documents:', error);
            app.showMessage('Erreur lors du chargement des documents', 'error');
            this.data = [];
            this.render();
        }
    },

    render() {
        const container = document.getElementById('documentsList');
        
        if (this.data.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📄</div>
                    <h3>Aucun document</h3>
                    <p>Ajoutez vos premiers documents (PDF, images, catalogues)</p>
                    <button class="btn-primary" onclick="documents.showAddModal()">+ Ajouter Document</button>
                </div>
            `;
            return;
        }

        container.innerHTML = this.data.map(doc => `
            <div class="item-card">
                <div class="item-header">
                    <div class="item-title">${this.getTypeIcon(doc.type)} ${doc.nom}</div>
                    <div class="item-actions">
                        <button class="btn-view" onclick="documents.viewDocument('${doc.id}')">Voir</button>
                        <button class="btn-edit" onclick="documents.showEditModal('${doc.id}')">Modifier</button>
                        <button class="btn-delete" onclick="documents.delete('${doc.id}', '${doc.nom}')">Supprimer</button>
                    </div>
                </div>
                <div class="item-info">
                    <div class="item-detail">📁 Type: ${this.getTypeLabel(doc.type)}</div>
                    ${doc.client_nom ? `<div class="item-detail">👤 Client: ${doc.client_nom}</div>` : ''}
                    ${doc.chantier_nom ? `<div class="item-detail">🏗️ Chantier: ${doc.chantier_nom}</div>` : ''}
                    ${doc.file_size ? `<div class="item-detail">📊 Taille: ${this.formatFileSize(doc.file_size)}</div>` : ''}
                    <div class="item-detail">📅 Ajouté le ${app.formatDate(doc.created_at)}</div>
                </div>
            </div>
        `).join('');
    },

    getTypeIcon(type) {
        const icons = {
            'facture': '🧾',
            'devis': '💰',
            'contrat': '📋',
            'fiche_technique': '📐',
            'rapport': '📊',
            'autre': '📄'
        };
        return icons[type] || '📄';
    },

    getTypeLabel(type) {
        const labels = {
            'facture': 'Facture',
            'devis': 'Devis',
            'contrat': 'Contrat',
            'fiche_technique': 'Fiche Technique',
            'rapport': 'Rapport',
            'autre': 'Autre'
        };
        return labels[type] || 'Autre';
    },

    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    showAddModal() {
        const modal = this.createDocumentModal();
        document.getElementById('modals').innerHTML = modal;
        document.getElementById('documentModal').style.display = 'block';
        this.currentEdit = null;
    },

    createDocumentModal(doc = null) {
        return `
            <div id="documentModal" class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>${doc ? 'Modifier Document' : 'Nouveau Document'}</h2>
                        <button class="btn-close" onclick="documents.closeModal()">&times;</button>
                    </div>
                    <form id="documentForm" onsubmit="documents.handleSubmit(event)">
                        <div class="form-group">
                            <label>Nom du document</label>
                            <input type="text" name="nom" value="${doc?.nom || ''}" required placeholder="Ex: Facture client Dupont">
                        </div>
                        <div class="form-group">
                            <label>Type</label>
                            <select name="type" required>
                                <option value="facture" ${doc?.type === 'facture' ? 'selected' : ''}>Facture</option>
                                <option value="devis" ${doc?.type === 'devis' ? 'selected' : ''}>Devis</option>
                                <option value="contrat" ${doc?.type === 'contrat' ? 'selected' : ''}>Contrat</option>
                                <option value="fiche_technique" ${doc?.type === 'fiche_technique' ? 'selected' : ''}>Fiche Technique</option>
                                <option value="rapport" ${doc?.type === 'rapport' ? 'selected' : ''}>Rapport</option>
                                <option value="autre" ${doc?.type === 'autre' ? 'selected' : ''}>Autre</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Client associé (optionnel)</label>
                            <input type="text" name="client_nom" value="${doc?.client_nom || ''}" placeholder="Nom du client">
                        </div>
                        <div class="form-group">
                            <label>Chantier associé (optionnel)</label>
                            <input type="text" name="chantier_nom" value="${doc?.chantier_nom || ''}" placeholder="Nom du chantier">
                        </div>
                        <div class="form-group">
                            <label>Description</label>
                            <textarea name="description" placeholder="Description du document">${doc?.description || ''}</textarea>
                        </div>
                        <div class="form-group">
                            <label>Tags (séparés par des virgules)</label>
                            <input type="text" name="tags" value="${doc?.tags || ''}" placeholder="urgent, client, facture">
                        </div>
                        <div class="form-group">
                            <label>Fichier</label>
                            <input type="file" id="documentFile" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" ${!doc ? 'required' : ''}>
                            <div class="file-info">
                                <small>Formats acceptés: PDF, Images, Documents Word</small>
                                <div id="filePreview"></div>
                            </div>
                        </div>
                        <div class="modal-actions">
                            <button type="button" class="btn-secondary" onclick="documents.closeModal()">Annuler</button>
                            <button type="submit" class="btn-primary">${doc ? 'Mettre à jour' : 'Ajouter'}</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    },

    async handleSubmit(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const documentData = Object.fromEntries(formData.entries());
        
        // Handle file upload simulation
        const fileInput = document.getElementById('documentFile');
        const file = fileInput.files[0];
        
        if (file) {
            documentData.file_path = `/uploads/${file.name}`;
            documentData.file_size = file.size;
            documentData.mime_type = file.type;
            
            // Simulate upload progress
            app.showMessage('Upload en cours...', 'info');
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        try {
            if (this.currentEdit) {
                await app.apiCall(`/documents/${this.currentEdit.id}`, {
                    method: 'PUT',
                    body: JSON.stringify(documentData)
                });
                app.showMessage('Document mis à jour avec succès', 'success');
            } else {
                await app.apiCall('/documents', {
                    method: 'POST',
                    body: JSON.stringify(documentData)
                });
                app.showMessage('Document ajouté avec succès', 'success');
            }

            this.closeModal();
            this.load();
        } catch (error) {
            console.error('Error saving document:', error);
            app.showMessage('Erreur lors de la sauvegarde: ' + error.message, 'error');
        }
    },

    closeModal() {
        const modal = document.getElementById('documentModal');
        if (modal) modal.style.display = 'none';
    },

    filter() {
        const searchTerm = document.getElementById('documentSearch').value.toLowerCase();
        this.filteredData = this.data.filter(doc => 
            doc.nom.toLowerCase().includes(searchTerm) ||
            (doc.client_nom && doc.client_nom.toLowerCase().includes(searchTerm)) ||
            (doc.description && doc.description.toLowerCase().includes(searchTerm))
        );
        this.renderFiltered();
    },

    filterByType() {
        const type = document.getElementById('documentType').value;
        this.filteredData = type ? this.data.filter(doc => doc.type === type) : this.data;
        this.renderFiltered();
    },

    renderFiltered() {
        const container = document.getElementById('documentsList');
        const dataToRender = this.filteredData || this.data;
        
        if (dataToRender.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>Aucun document trouvé</p></div>';
            return;
        }
        
        container.innerHTML = dataToRender.map(doc => `
            <div class="item-card">
                <div class="item-header">
                    <div class="item-title">${this.getTypeIcon(doc.type)} ${doc.nom}</div>
                    <div class="item-actions">
                        <button class="btn-view" onclick="documents.viewDocument('${doc.id}')">Voir</button>
                        <button class="btn-edit" onclick="documents.showEditModal('${doc.id}')">Modifier</button>
                        <button class="btn-delete" onclick="documents.delete('${doc.id}', '${doc.nom}')">Supprimer</button>
                    </div>
                </div>
                <div class="item-info">
                    <div class="item-detail">📁 Type: ${this.getTypeLabel(doc.type)}</div>
                    ${doc.client_nom ? `<div class="item-detail">👤 Client: ${doc.client_nom}</div>` : ''}
                    ${doc.chantier_nom ? `<div class="item-detail">🏗️ Chantier: ${doc.chantier_nom}</div>` : ''}
                    ${doc.file_size ? `<div class="item-detail">📊 Taille: ${this.formatFileSize(doc.file_size)}</div>` : ''}
                    <div class="item-detail">📅 Ajouté le ${app.formatDate(doc.created_at)}</div>
                </div>
            </div>
        `).join('');
    },

    async delete(id, nom) {
        if (confirm(`Supprimer le document "${nom}" ?\nCette action est irréversible.`)) {
            try {
                await app.apiCall(`/documents/${id}`, { method: 'DELETE' });
                app.showMessage('Document supprimé avec succès', 'success');
                this.load();
            } catch (error) {
                console.error('Error deleting document:', error);
                app.showMessage('Erreur lors de la suppression', 'error');
            }
        }
    },

    async exportPDF() {
        app.showMessage('Export PDF en cours...', 'info');
        
        if (window.pdfExport) {
            await pdfExport.exportDocuments(this.data);
        } else {
            app.showMessage('Module PDF non disponible', 'error');
        }
    }
};