// ===== CALCULS PAC MODULE =====
window.calculsPac = {
    data: [],
    currentEdit: null,

    async load() {
        try {
            this.data = await app.apiCall('/calculs-pac');
            this.render();
        } catch (error) {
            console.error('Error loading calculs PAC:', error);
            app.showMessage('Erreur lors du chargement des calculs PAC', 'error');
            this.data = [];
            this.render();
        }
    },

    render() {
        const container = document.getElementById('calculsList');
        
        if (this.data.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🌡️</div>
                    <h3>Aucun calcul PAC</h3>
                    <p>Cliquez sur un type de PAC ci-dessus pour commencer</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.data.map(calcul => `
            <div class="item-card">
                <div class="item-header">
                    <div class="item-title">${calcul.nom}</div>
                    <div class="item-actions">
                        <span class="status-badge ${calcul.type_pac === 'air-eau' ? 'status-en-cours' : 'status-termine'}">
                            ${calcul.type_pac === 'air-eau' ? 'Air/Eau' : 'Air/Air'}
                        </span>
                        <button class="btn-edit" onclick="calculsPac.showEditModal('${calcul.id}')">Modifier</button>
                        <button class="btn-view" onclick="calculsPac.viewDetails('${calcul.id}')">Détails</button>
                        <button class="btn-delete" onclick="calculsPac.delete('${calcul.id}', '${calcul.nom}')">Supprimer</button>
                    </div>
                </div>
                <div class="item-info">
                    ${calcul.client_nom ? `<div class="item-detail">👤 ${calcul.client_nom}</div>` : ''}
                    ${calcul.zone_climatique ? `<div class="item-detail">🌍 Zone ${calcul.zone_climatique}</div>` : ''}
                    ${calcul.puissance_calculee ? `<div class="item-detail">⚡ ${calcul.puissance_calculee} kW</div>` : ''}
                    ${calcul.surface_totale ? `<div class="item-detail">📐 ${calcul.surface_totale} m²</div>` : ''}
                    <div class="item-detail">📅 Créé le ${app.formatDate(calcul.created_at)}</div>
                </div>
            </div>
        `).join('');
    },

    showAddModal(type) {
        this.currentEdit = null;
        const typeLabel = type === 'air-eau' ? 'Air/Eau' : 'Air/Air';
        this.showModal(`Nouveau Calcul PAC ${typeLabel}`, null, type);
    },

    showEditModal(calculId) {
        this.currentEdit = this.data.find(c => c.id === calculId);
        if (this.currentEdit) {
            const typeLabel = this.currentEdit.type_pac === 'air-eau' ? 'Air/Eau' : 'Air/Air';
            this.showModal(`Modifier Calcul PAC ${typeLabel}`, this.currentEdit, this.currentEdit.type_pac);
        }
    },

    async showModal(title, calcul = null, type = 'air-eau') {
        // Load clients for dropdown
        let clientsOptions = '<option value="">Sélectionner un client</option>';
        try {
            const clients = await app.apiCall('/clients');
            clientsOptions += clients.map(client => 
                `<option value="${client.id}" ${calcul?.client_id === client.id ? 'selected' : ''}>
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
                    <form id="calculForm">
                        <input type="hidden" id="calculType" value="${type}">
                        <div class="form-row">
                            <div class="form-group">
                                <label>Nom du calcul *</label>
                                <input type="text" id="calculNom" required value="${calcul?.nom || ''}">
                            </div>
                            <div class="form-group">
                                <label>Client</label>
                                <select id="calculClient">${clientsOptions}</select>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Zone climatique</label>
                                <select id="calculZone">
                                    <option value="H1" ${calcul?.zone_climatique === 'H1' ? 'selected' : ''}>H1 - Zone froide</option>
                                    <option value="H2" ${calcul?.zone_climatique === 'H2' ? 'selected' : ''}>H2 - Zone tempérée</option>
                                    <option value="H3" ${calcul?.zone_climatique === 'H3' ? 'selected' : ''}>H3 - Zone chaude</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Surface totale (m²) *</label>
                                <input type="number" id="calculSurface" required min="1" step="0.1" value="${calcul?.surface_totale || ''}">
                            </div>
                        </div>
                        
                        ${type === 'air-eau' ? `
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Hauteur sous plafond (m)</label>
                                    <input type="number" id="calculHauteur" value="${calcul?.hauteur_plafond || '2.5'}" min="2" max="4" step="0.1">
                                </div>
                                <div class="form-group">
                                    <label>Type d'isolation</label>
                                    <select id="calculIsolation">
                                        <option value="rt2012" ${calcul?.isolation === 'rt2012' ? 'selected' : ''}>RT2012 (Neuf)</option>
                                        <option value="bonne" ${calcul?.isolation === 'bonne' ? 'selected' : ''}>Bonne isolation</option>
                                        <option value="moyenne" ${calcul?.isolation === 'moyenne' ? 'selected' : ''}>Isolation moyenne</option>
                                        <option value="ancienne" ${calcul?.isolation === 'ancienne' ? 'selected' : ''}>Ancienne (avant 1980)</option>
                                    </select>
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Delta T (°C)</label>
                                    <input type="number" id="calculDeltaT" value="${calcul?.delta_t || '20'}" min="15" max="30">
                                </div>
                                <div class="form-group">
                                    <label>Puissance calculée (kW)</label>
                                    <input type="number" id="calculPuissance" step="0.1" readonly style="background: #333;" value="${calcul?.puissance_calculee || ''}">
                                </div>
                            </div>
                        ` : `
                            <div class="form-group">
                                <label>Nombre de pièces</label>
                                <input type="number" id="calculNbPieces" min="1" max="20" value="${calcul?.pieces?.length || 1}" onchange="calculsPac.generatePiecesFields()">
                            </div>
                            <div id="piecesFields"></div>
                        `}
                    </form>
                </div>
                <div class="modal-actions">
                    <button class="btn-secondary" onclick="this.closest('.modal').remove()">Annuler</button>
                    <button class="btn-primary" onclick="calculsPac.save()">Calculer et Enregistrer</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Setup calculations for Air/Eau
        if (type === 'air-eau') {
            const inputs = ['calculSurface', 'calculHauteur', 'calculIsolation', 'calculDeltaT'];
            inputs.forEach(id => {
                modal.querySelector(`#${id}`).addEventListener('input', () => {
                    this.calculateAirEauPower();
                });
            });
            
            // Initial calculation
            setTimeout(() => this.calculateAirEauPower(), 100);
        }

        // Setup pieces fields for Air/Air
        if (type === 'air-air') {
            setTimeout(() => {
                this.generatePiecesFields();
                if (calcul?.pieces) {
                    this.populatePiecesData(calcul.pieces);
                }
            }, 100);
        }
        
        // Focus first input
        setTimeout(() => {
            modal.querySelector('#calculNom').focus();
        }, 100);

        // Close on outside click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    },

    calculateAirEauPower() {
        const surface = parseFloat(document.getElementById('calculSurface')?.value) || 0;
        const hauteur = parseFloat(document.getElementById('calculHauteur')?.value) || 2.5;
        const isolation = document.getElementById('calculIsolation')?.value || 'moyenne';
        const deltaT = parseInt(document.getElementById('calculDeltaT')?.value) || 20;

        if (surface === 0) return;

        // Coefficients d'isolation
        const coeffs = {
            'rt2012': 0.6,
            'bonne': 0.8,
            'moyenne': 1.2,
            'ancienne': 1.8
        };

        const coeffG = coeffs[isolation] || 1.2;
        const puissance = Math.round((surface * hauteur * coeffG * deltaT / 1000) * 10) / 10;

        const puissanceInput = document.getElementById('calculPuissance');
        if (puissanceInput) {
            puissanceInput.value = puissance;
        }
    },

    generatePiecesFields() {
        const nbPieces = parseInt(document.getElementById('calculNbPieces')?.value) || 1;
        const container = document.getElementById('piecesFields');
        
        if (!container) return;

        let html = '<div style="margin: 1rem 0; font-weight: 600; color: var(--primary);">Détail par pièce :</div>';
        
        for (let i = 1; i <= nbPieces; i++) {
            html += `
                <div class="piece-group" style="background: var(--background); padding: 1rem; border-radius: 8px; margin-bottom: 1rem; border: 1px solid var(--border);">
                    <h4 style="color: var(--primary); margin-bottom: 1rem;">Pièce ${i}</h4>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Nom de la pièce</label>
                            <input type="text" id="piece${i}Nom" placeholder="Ex: Salon, Chambre...">
                        </div>
                        <div class="form-group">
                            <label>Surface (m²) *</label>
                            <input type="number" id="piece${i}Surface" required min="1" step="0.1">
                        </div>
                    </div>
                </div>
            `;
        }
        
        container.innerHTML = html;
    },

    populatePiecesData(pieces) {
        pieces.forEach((piece, index) => {
            const nomInput = document.getElementById(`piece${index + 1}Nom`);
            const surfaceInput = document.getElementById(`piece${index + 1}Surface`);
            
            if (nomInput) nomInput.value = piece.nom || '';
            if (surfaceInput) surfaceInput.value = piece.surface || '';
        });
    },

    async save() {
        const type = document.getElementById('calculType').value;
        const formData = {
            nom: document.getElementById('calculNom').value.trim(),
            type_pac: type,
            client_id: document.getElementById('calculClient').value || null,
            zone_climatique: document.getElementById('calculZone').value,
            surface_totale: parseFloat(document.getElementById('calculSurface').value)
        };

        if (!formData.nom) {
            app.showMessage('Le nom du calcul est obligatoire', 'error');
            return;
        }

        if (!formData.surface_totale) {
            app.showMessage('La surface totale est obligatoire', 'error');
            return;
        }

        if (type === 'air-eau') {
            formData.hauteur_plafond = parseFloat(document.getElementById('calculHauteur').value) || 2.5;
            formData.isolation = document.getElementById('calculIsolation').value;
            formData.delta_t = parseInt(document.getElementById('calculDeltaT').value) || 20;
            formData.puissance_calculee = parseFloat(document.getElementById('calculPuissance').value);
        } else if (type === 'air-air') {
            const nbPieces = parseInt(document.getElementById('calculNbPieces').value) || 1;
            const pieces = [];
            let surfaceTotal = 0;

            for (let i = 1; i <= nbPieces; i++) {
                const nom = document.getElementById(`piece${i}Nom`)?.value.trim() || `Pièce ${i}`;
                const surface = parseFloat(document.getElementById(`piece${i}Surface`)?.value) || 0;
                
                if (surface > 0) {
                    pieces.push({ nom, surface });
                    surfaceTotal += surface;
                }
            }

            formData.pieces = pieces;
            formData.surface_totale = surfaceTotal;
            formData.puissance_calculee = Math.round(surfaceTotal * 100); // 100W/m² approximation
        }

        try {
            if (this.currentEdit) {
                await app.apiCall(`/calculs-pac/${this.currentEdit.id}`, {
                    method: 'PUT',
                    body: JSON.stringify(formData)
                });
                app.showMessage('Calcul PAC modifié avec succès', 'success');
            } else {
                await app.apiCall('/calculs-pac', {
                    method: 'POST',
                    body: JSON.stringify(formData)
                });
                app.showMessage('Calcul PAC créé avec succès', 'success');
            }

            document.querySelector('.modal').remove();
            await this.load();
            app.updateDashboardStats();
        } catch (error) {
            console.error('Error saving calcul PAC:', error);
            app.showMessage('Erreur lors de la sauvegarde: ' + error.message, 'error');
        }
    },

    async delete(calculId, calculNom) {
        if (!confirm(`Êtes-vous sûr de vouloir supprimer le calcul "${calculNom}" ?`)) {
            return;
        }

        try {
            await app.apiCall(`/calculs-pac/${calculId}`, { method: 'DELETE' });
            app.showMessage('Calcul PAC supprimé avec succès', 'success');
            await this.load();
            app.updateDashboardStats();
        } catch (error) {
            console.error('Error deleting calcul PAC:', error);
            app.showMessage('Erreur lors de la suppression: ' + error.message, 'error');
        }
    },

    viewDetails(calculId) {
        const calcul = this.data.find(c => c.id === calculId);
        if (!calcul) return;

        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3 class="modal-title">Détails Calcul PAC</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="calcul-details">
                        <h4>${calcul.nom}</h4>
                        <p><strong>Type:</strong> ${calcul.type_pac === 'air-eau' ? 'Air/Eau' : 'Air/Air'}</p>
                        ${calcul.client_nom ? `<p><strong>Client:</strong> ${calcul.client_nom}</p>` : ''}
                        ${calcul.zone_climatique ? `<p><strong>Zone climatique:</strong> ${calcul.zone_climatique}</p>` : ''}
                        <p><strong>Surface totale:</strong> ${calcul.surface_totale} m²</p>
                        ${calcul.puissance_calculee ? `<p><strong>Puissance calculée:</strong> ${calcul.puissance_calculee} kW</p>` : ''}
                        
                        ${calcul.type_pac === 'air-eau' ? `
                            ${calcul.hauteur_plafond ? `<p><strong>Hauteur sous plafond:</strong> ${calcul.hauteur_plafond} m</p>` : ''}
                            ${calcul.isolation ? `<p><strong>Isolation:</strong> ${calcul.isolation}</p>` : ''}
                            ${calcul.delta_t ? `<p><strong>Delta T:</strong> ${calcul.delta_t}°C</p>` : ''}
                        ` : ''}
                        
                        ${calcul.pieces && calcul.pieces.length > 0 ? `
                            <div style="margin-top: 1rem;">
                                <strong>Détail des pièces:</strong>
                                <ul style="margin-top: 0.5rem;">
                                    ${calcul.pieces.map(piece => `<li>${piece.nom}: ${piece.surface} m²</li>`).join('')}
                                </ul>
                            </div>
                        ` : ''}
                        
                        <p><strong>Créé le:</strong> ${app.formatDate(calcul.created_at)}</p>
                    </div>
                </div>
                <div class="modal-actions">
                    <button class="btn-secondary" onclick="this.closest('.modal').remove()">Fermer</button>
                    <button class="btn-primary" onclick="calculsPac.exportCalculPDF('${calcul.id}')">Export PDF</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    },

    async exportPDF() {
        if (window.pdfExport) {
            await pdfExport.exportCalculsPac(this.data);
        }
    },

    async exportCalculPDF(calculId) {
        const calcul = this.data.find(c => c.id === calculId);
        if (calcul && window.pdfExport) {
            await pdfExport.exportCalculPac(calcul);
        }
    }
};