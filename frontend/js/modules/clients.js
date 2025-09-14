// ===== CLIENTS MODULE =====
window.clients = {
    data: [],
    currentEdit: null,

    async load() {
        try {
            this.data = await app.apiCall('/clients');
            this.render();
        } catch (error) {
            console.error('Error loading clients:', error);
            app.showMessage('Erreur lors du chargement des clients', 'error');
            this.data = [];
            this.render();
        }
    },

    render() {
        const container = document.getElementById('clientsList');
        
        if (this.data.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">👥</div>
                    <h3>Aucun client</h3>
                    <p>Commencez par ajouter votre premier client</p>
                    <button class="btn-primary" onclick="clients.showAddModal()">+ Nouveau Client</button>
                </div>
            `;
            return;
        }

        container.innerHTML = this.data.map(client => `
            <div class="item-card">
                <div class="item-header">
                    <div class="item-title">${client.nom} ${client.prenom || ''}</div>
                    <div class="item-actions">
                        <button class="btn-edit" onclick="clients.showEditModal('${client.id}')">Modifier</button>
                        <button class="btn-view" onclick="clients.viewDetails('${client.id}')">Détails</button>
                        <button class="btn-delete" onclick="clients.delete('${client.id}', '${client.nom}')">Supprimer</button>
                    </div>
                </div>
                <div class="item-info">
                    ${client.email ? `<div class="item-detail">📧 ${client.email}</div>` : ''}
                    ${client.telephone ? `<div class="item-detail">📞 ${this.formatPhone(client.telephone)}</div>` : ''}
                    ${client.adresse ? `<div class="item-detail">📍 ${client.adresse}</div>` : ''}
                    ${client.code_postal && client.ville ? `<div class="item-detail">🏢 ${client.code_postal} ${client.ville}</div>` : ''}
                    <div class="item-detail">📅 Créé le ${app.formatDate(client.created_at)}</div>
                </div>
            </div>
        `).join('');
    },

    showAddModal() {
        this.currentEdit = null;
        this.showModal('Nouveau Client');
    },

    showEditModal(clientId) {
        this.currentEdit = this.data.find(c => c.id === clientId);
        if (this.currentEdit) {
            this.showModal('Modifier Client', this.currentEdit);
        }
    },

    showModal(title, client = null) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3 class="modal-title">${title}</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="clientForm">
                        <div class="form-row">
                            <div class="form-group">
                                <label>Nom *</label>
                                <input type="text" id="clientNom" required value="${client?.nom || ''}">
                            </div>
                            <div class="form-group">
                                <label>Prénom</label>
                                <input type="text" id="clientPrenom" value="${client?.prenom || ''}">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Email</label>
                                <input type="email" id="clientEmail" value="${client?.email || ''}">
                            </div>
                            <div class="form-group">
                                <label>Téléphone</label>
                                <input type="tel" id="clientTelephone" value="${client?.telephone || ''}">
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Adresse</label>
                            <input type="text" id="clientAdresse" value="${client?.adresse || ''}">
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Code postal</label>
                                <input type="text" id="clientCodePostal" value="${client?.code_postal || ''}">
                            </div>
                            <div class="form-group">
                                <label>Ville</label>
                                <input type="text" id="clientVille" value="${client?.ville || ''}">
                            </div>
                        </div>
                    </form>
                </div>
                <div class="modal-actions">
                    <button class="btn-secondary" onclick="this.closest('.modal').remove()">Annuler</button>
                    <button class="btn-primary" onclick="clients.save()">Enregistrer</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        
        // Focus first input
        setTimeout(() => {
            modal.querySelector('#clientNom').focus();
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
            nom: document.getElementById('clientNom').value.trim(),
            prenom: document.getElementById('clientPrenom').value.trim(),
            email: document.getElementById('clientEmail').value.trim(),
            telephone: document.getElementById('clientTelephone').value.trim(),
            adresse: document.getElementById('clientAdresse').value.trim(),
            code_postal: document.getElementById('clientCodePostal').value.trim(),
            ville: document.getElementById('clientVille').value.trim()
        };

        if (!formData.nom) {
            app.showMessage('Le nom du client est obligatoire', 'error');
            return;
        }

        try {
            if (this.currentEdit) {
                await app.apiCall(`/clients/${this.currentEdit.id}`, {
                    method: 'PUT',
                    body: JSON.stringify(formData)
                });
                app.showMessage('Client modifié avec succès', 'success');
            } else {
                await app.apiCall('/clients', {
                    method: 'POST',
                    body: JSON.stringify(formData)
                });
                app.showMessage('Client créé avec succès', 'success');
            }

            document.querySelector('.modal').remove();
            await this.load();
            app.updateDashboardStats();
        } catch (error) {
            console.error('Error saving client:', error);
            app.showMessage('Erreur lors de la sauvegarde: ' + error.message, 'error');
        }
    },

    async delete(clientId, clientNom) {
        if (!confirm(`Êtes-vous sûr de vouloir supprimer le client "${clientNom}" ?`)) {
            return;
        }

        try {
            await app.apiCall(`/clients/${clientId}`, { method: 'DELETE' });
            app.showMessage('Client supprimé avec succès', 'success');
            await this.load();
            app.updateDashboardStats();
        } catch (error) {
            console.error('Error deleting client:', error);
            app.showMessage('Erreur lors de la suppression: ' + error.message, 'error');
        }
    },

    viewDetails(clientId) {
        const client = this.data.find(c => c.id === clientId);
        if (!client) return;

        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3 class="modal-title">Détails Client</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="client-details">
                        <h4>${client.nom} ${client.prenom || ''}</h4>
                        ${client.email ? `<p><strong>Email:</strong> ${client.email}</p>` : ''}
                        ${client.telephone ? `<p><strong>Téléphone:</strong> ${this.formatPhone(client.telephone)}</p>` : ''}
                        ${client.adresse ? `<p><strong>Adresse:</strong> ${client.adresse}</p>` : ''}
                        ${client.code_postal && client.ville ? `<p><strong>Ville:</strong> ${client.code_postal} ${client.ville}</p>` : ''}
                        <p><strong>Créé le:</strong> ${app.formatDate(client.created_at)}</p>
                    </div>
                </div>
                <div class="modal-actions">
                    <button class="btn-secondary" onclick="this.closest('.modal').remove()">Fermer</button>
                    <button class="btn-primary" onclick="clients.exportClientPDF('${client.id}')">Export PDF</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    },

    filter() {
        const searchTerm = document.getElementById('clientSearch').value.toLowerCase();
        const filteredData = this.data.filter(client => 
            client.nom.toLowerCase().includes(searchTerm) ||
            (client.prenom && client.prenom.toLowerCase().includes(searchTerm)) ||
            (client.email && client.email.toLowerCase().includes(searchTerm)) ||
            (client.ville && client.ville.toLowerCase().includes(searchTerm))
        );

        this.renderFiltered(filteredData, searchTerm);
    },

    renderFiltered(data, searchTerm) {
        const container = document.getElementById('clientsList');
        
        if (data.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🔍</div>
                    <h3>Aucun résultat</h3>
                    <p>Aucun client trouvé pour "${searchTerm}"</p>
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

    sort() {
        const sortBy = document.getElementById('clientSort').value;
        
        this.data.sort((a, b) => {
            switch (sortBy) {
                case 'nom':
                    return a.nom.localeCompare(b.nom);
                case 'date':
                    return new Date(b.created_at) - new Date(a.created_at);
                case 'ville':
                    return (a.ville || '').localeCompare(b.ville || '');
                default:
                    return 0;
            }
        });

        this.render();
    },

    formatPhone(phone) {
        if (!phone) return '';
        return phone.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1.$2.$3.$4.$5');
    },

    async exportPDF() {
        if (window.pdfExport) {
            await pdfExport.exportClients(this.data);
        }
    },

    async exportClientPDF(clientId) {
        const client = this.data.find(c => c.id === clientId);
        if (client && window.pdfExport) {
            await pdfExport.exportClient(client);
        }
    }
};