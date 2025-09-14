// ===== CHANTIERS MODULE =====
window.chantiers = {
    data: [],
    currentEdit: null,

    async load() {
        try {
            this.data = await app.apiCall('/chantiers');
            this.render();
        } catch (error) {
            console.error('Error loading chantiers:', error);
            app.showMessage('Erreur lors du chargement des chantiers', 'error');
            this.data = [];
            this.render();
        }
    },

    render() {
        const container = document.getElementById('chantiersList');
        
        if (this.data.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🏗️</div>
                    <h3>Aucun chantier</h3>
                    <p>Commencez par créer votre premier chantier</p>
                    <button class="btn-primary" onclick="chantiers.showAddModal()">+ Nouveau Chantier</button>
                </div>
            `;
            return;
        }

        // Sort by status priority and date
        const sortedData = [...this.data].sort((a, b) => {
            const statusOrder = { 'en_cours': 0, 'en_attente': 1, 'termine': 2, 'facture': 3 };
            const statusDiff = statusOrder[a.statut] - statusOrder[b.statut];
            if (statusDiff !== 0) return statusDiff;
            return new Date(b.created_at) - new Date(a.created_at);
        });

        container.innerHTML = sortedData.map(chantier => `
            <div class="item-card">
                <div class="item-header">
                    <div class="item-title">${chantier.nom}</div>
                    <div class="item-actions">
                        <span class="status-badge status-${chantier.statut}">${this.getStatusLabel(chantier.statut)}</span>
                        <button class="btn-edit" onclick="chantiers.showEditModal('${chantier.id}')">Modifier</button>
                        <button class="btn-view" onclick="chantiers.viewDetails('${chantier.id}')">Détails</button>
                        <button class="btn-delete" onclick="chantiers.delete('${chantier.id}', '${chantier.nom}')">Supprimer</button>
                    </div>
                </div>
                <div class="item-info">
                    ${chantier.client_nom ? `<div class="item-detail">👤 ${chantier.client_nom}</div>` : ''}
                    ${chantier.adresse ? `<div class="item-detail">📍 ${chantier.adresse}</div>` : ''}
                    ${chantier.date_debut ? `<div class="item-detail">📅 Début: ${app.formatDate(chantier.date_debut)}</div>` : ''}
                    ${chantier.date_fin_prevue ? `<div class="item-detail">🏁 Fin prévue: ${app.formatDate(chantier.date_fin_prevue)}</div>` : ''}
                    ${chantier.budget_estime ? `<div class="item-detail">💰 Budget: ${app.formatCurrency(chantier.budget_estime)}</div>` : ''}
                    <div class="item-detail">📅 Créé le ${app.formatDate(chantier.created_at)}</div>
                </div>
                ${chantier.description ? `<div class="item-description">${chantier.description}</div>` : ''}
            </div>
        `).join('');
    },

    getStatusLabel(status) {
        const labels = {
            'en_attente': 'En attente',
            'en_cours': 'En cours',
            'termine': 'Terminé',
            'facture': 'Facturé'
        };
        return labels[status] || status;
    },

    showAddModal() {
        this.currentEdit = null;
        this.showModal('Nouveau Chantier');
    },

    showEditModal(chantierId) {
        this.currentEdit = this.data.find(c => c.id === chantierId);
        if (this.currentEdit) {
            this.showModal('Modifier Chantier', this.currentEdit);
        }
    },

    async showModal(title, chantier = null) {
        // Load clients for dropdown
        let clientsOptions = '<option value="">Sélectionner un client</option>';
        try {
            const clients = await app.apiCall('/clients');
            clientsOptions += clients.map(client => 
                `<option value="${client.id}" ${chantier?.client_id === client.id ? 'selected' : ''}>
                    ${client.nom} ${client.prenom || ''}
                </option>`
            ).join('');
        } catch (error) {
            console.error('Error loading clients:', error);
        }

        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3 class="modal-title">${title}</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="chantierForm">
                        <div class="form-row">
                            <div class="form-group">
                                <label>Nom du chantier *</label>
                                <input type="text" id="chantierNom" required value="${chantier?.nom || ''}">
                            </div>
                            <div class="form-group">
                                <label>Client</label>
                                <select id="chantierClient">${clientsOptions}</select>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Description</label>
                            <textarea id="chantierDescription" rows="3">${chantier?.description || ''}</textarea>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Date de début</label>
                                <input type="date" id="chantierDateDebut" value="${chantier?.date_debut || ''}">
                            </div>
                            <div class="form-group">
                                <label>Date de fin prévue</label>
                                <input type="date" id="chantierDateFin" value="${chantier?.date_fin_prevue || ''}">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Budget estimé (€)</label>
                                <input type="number" id="chantierBudget" min="0" step="0.01" value="${chantier?.budget_estime || ''}">
                            </div>
                            <div class="form-group">
                                <label>Statut</label>
                                <select id="chantierStatut">
                                    <option value="en_attente" ${chantier?.statut === 'en_attente' ? 'selected' : ''}>En attente</option>
                                    <option value="en_cours" ${chantier?.statut === 'en_cours' ? 'selected' : ''}>En cours</option>
                                    <option value="termine" ${chantier?.statut === 'termine' ? 'selected' : ''}>Terminé</option>
                                    <option value="facture" ${chantier?.statut === 'facture' ? 'selected' : ''}>Facturé</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Adresse du chantier</label>
                            <input type="text" id="chantierAdresse" value="${chantier?.adresse || ''}">
                        </div>
                    </form>
                </div>
                <div class="modal-actions">
                    <button class="btn-secondary" onclick="this.closest('.modal').remove()">Annuler</button>
                    <button class="btn-primary" onclick="chantiers.save()">Enregistrer</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        
        // Focus first input
        setTimeout(() => {
            modal.querySelector('#chantierNom').focus();
        }, 100);

        // Close on outside click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    },

    async save() {
        const formData = {
            nom: document.getElementById('chantierNom').value.trim(),
            client_id: document.getElementById('chantierClient').value || null,
            description: document.getElementById('chantierDescription').value.trim(),
            date_debut: document.getElementById('chantierDateDebut').value || null,
            date_fin_prevue: document.getElementById('chantierDateFin').value || null,
            budget_estime: parseFloat(document.getElementById('chantierBudget').value) || null,
            statut: document.getElementById('chantierStatut').value,
            adresse: document.getElementById('chantierAdresse').value.trim()
        };

        if (!formData.nom) {
            app.showMessage('Le nom du chantier est obligatoire', 'error');
            return;
        }

        try {
            if (this.currentEdit) {
                await app.apiCall(`/chantiers/${this.currentEdit.id}`, {
                    method: 'PUT',
                    body: JSON.stringify(formData)
                });
                app.showMessage('Chantier modifié avec succès', 'success');
            } else {
                await app.apiCall('/chantiers', {
                    method: 'POST',
                    body: JSON.stringify(formData)
                });
                app.showMessage('Chantier créé avec succès', 'success');
            }

            document.querySelector('.modal').remove();
            await this.load();
            app.updateDashboardStats();
        } catch (error) {
            console.error('Error saving chantier:', error);
            app.showMessage('Erreur lors de la sauvegarde: ' + error.message, 'error');
        }
    },

    async delete(chantierId, chantierNom) {
        if (!confirm(`Êtes-vous sûr de vouloir supprimer le chantier "${chantierNom}" ?`)) {
            return;
        }

        try {
            await app.apiCall(`/chantiers/${chantierId}`, { method: 'DELETE' });
            app.showMessage('Chantier supprimé avec succès', 'success');
            await this.load();
            app.updateDashboardStats();
        } catch (error) {
            console.error('Error deleting chantier:', error);
            app.showMessage('Erreur lors de la suppression: ' + error.message, 'error');
        }
    },

    viewDetails(chantierId) {
        const chantier = this.data.find(c => c.id === chantierId);
        if (!chantier) return;

        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3 class="modal-title">Détails Chantier</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="chantier-details">
                        <h4>${chantier.nom}</h4>
                        <p><strong>Statut:</strong> <span class="status-badge status-${chantier.statut}">${this.getStatusLabel(chantier.statut)}</span></p>
                        ${chantier.client_nom ? `<p><strong>Client:</strong> ${chantier.client_nom}</p>` : ''}
                        ${chantier.description ? `<p><strong>Description:</strong> ${chantier.description}</p>` : ''}
                        ${chantier.adresse ? `<p><strong>Adresse:</strong> ${chantier.adresse}</p>` : ''}
                        ${chantier.date_debut ? `<p><strong>Date de début:</strong> ${app.formatDate(chantier.date_debut)}</p>` : ''}
                        ${chantier.date_fin_prevue ? `<p><strong>Date de fin prévue:</strong> ${app.formatDate(chantier.date_fin_prevue)}</p>` : ''}
                        ${chantier.budget_estime ? `<p><strong>Budget estimé:</strong> ${app.formatCurrency(chantier.budget_estime)}</p>` : ''}
                        <p><strong>Créé le:</strong> ${app.formatDate(chantier.created_at)}</p>
                    </div>
                </div>
                <div class="modal-actions">
                    <button class="btn-secondary" onclick="this.closest('.modal').remove()">Fermer</button>
                    <button class="btn-primary" onclick="chantiers.exportChantierPDF('${chantier.id}')">Export PDF</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    },

    filter() {
        const searchTerm = document.getElementById('chantierSearch').value.toLowerCase();
        const filteredData = this.data.filter(chantier => 
            chantier.nom.toLowerCase().includes(searchTerm) ||
            (chantier.client_nom && chantier.client_nom.toLowerCase().includes(searchTerm)) ||
            (chantier.description && chantier.description.toLowerCase().includes(searchTerm)) ||
            (chantier.adresse && chantier.adresse.toLowerCase().includes(searchTerm))
        );

        this.renderFiltered(filteredData, searchTerm);
    },

    filterByStatus() {
        const status = document.getElementById('chantierStatus').value;
        const filteredData = status ? this.data.filter(c => c.statut === status) : this.data;
        
        this.renderFiltered(filteredData, status ? this.getStatusLabel(status) : '');
    },

    renderFiltered(data, searchTerm) {
        const container = document.getElementById('chantiersList');
        
        if (data.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🔍</div>
                    <h3>Aucun résultat</h3>
                    <p>Aucun chantier trouvé ${searchTerm ? `pour "${searchTerm}"` : ''}</p>
                </div>
            `;
            return;
        }

        // Use same render logic but with filtered data
        const originalData = this.data;
        this.data = data;
        this.render();
        this.data = originalData;
    },

    async exportPDF() {
        if (window.pdfExport) {
            await pdfExport.exportChantiers(this.data);
        }
    },

    async exportChantierPDF(chantierId) {
        const chantier = this.data.find(c => c.id === chantierId);
        if (chantier && window.pdfExport) {
            await pdfExport.exportChantier(chantier);
        }
    }
};