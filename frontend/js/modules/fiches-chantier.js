// ===== FICHES CHANTIER MODULE WITH 2D PLAN SYSTEM =====
window.fiches = {
    data: [],
    currentEdit: null,
    currentPlan: null,
    planCanvas: null,
    planContext: null,
    planData: {
        elements: [],
        measurements: [],
        rooms: [],
        scale: 1,
        gridSize: 20,
        currentTool: 'select'
    },
    isDrawing: false,
    startPoint: null,
    selectedElement: null,

    async load() {
        try {
            this.data = await app.apiCall('/fiches-sdb'); // Utilise l'endpoint existant qui fonctionne
            this.render();
        } catch (error) {
            console.error('Error loading fiches:', error);
            app.showMessage('Erreur lors du chargement des fiches', 'error');
            this.data = [];
            this.render();
        }
    },

    render() {
        const container = document.getElementById('fichesList');
        
        if (this.data.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📋</div>
                    <h3>Aucune fiche de relevé</h3>
                    <p>Commencez par créer votre première fiche de chantier</p>
                    <button class="btn-primary" onclick="fiches.showAddModal()">+ Nouvelle Fiche</button>
                </div>
            `;
            return;
        }

        container.innerHTML = this.data.map(fiche => `
            <div class="item-card">
                <div class="item-header">
                    <div class="item-title">📋 ${fiche.nom}</div>
                    <div class="item-actions">
                        <button class="btn-view" onclick="fiches.openFiche('${fiche.id}')">Ouvrir</button>
                        <button class="btn-edit" onclick="fiches.showEditModal('${fiche.id}')">Modifier</button>
                        <button class="btn-delete" onclick="fiches.delete('${fiche.id}', '${fiche.nom}')">Supprimer</button>
                    </div>
                </div>
                <div class="item-info">
                    <div class="item-detail">👤 Client: ${fiche.client_nom}</div>
                    <div class="item-detail">🏠 Type: ${this.getTypeLabel(fiche.type_sdb)}</div>
                    ${fiche.adresse ? `<div class="item-detail">📍 ${fiche.adresse}</div>` : ''}
                    <div class="item-detail">📅 Créé le ${app.formatDate(fiche.created_at)}</div>
                </div>
            </div>
        `).join('');
    },

    getTypeLabel(type) {
        const types = {
            'visite_technique': 'Visite Technique',
            'releve_existant': 'Relevé Existant', 
            'installation': 'Installation',
            'maintenance': 'Maintenance',
            'complete': 'Fiche Complète',
            'douche': 'Douche',
            'wc': 'WC',
            'mixte': 'Mixte'
        };
        return types[type] || 'Fiche Chantier';
    },

    showAddModal() {
        const modal = this.createFicheModal();
        document.getElementById('modals').innerHTML = modal;
        document.getElementById('ficheModal').style.display = 'block';
        this.currentEdit = null;
    },

    openFiche(id) {
        const fiche = this.data.find(f => f.id === id);
        if (!fiche) return;
        
        this.currentEdit = fiche;
        this.showFicheEditor(fiche);
    },

    showFicheEditor(fiche) {
        const editorModal = this.createFicheEditor(fiche);
        document.getElementById('modals').innerHTML = editorModal;
        document.getElementById('ficheEditor').style.display = 'block';
        
        // Initialize tabs
        this.initializeTabs();
        
        // Initialize plan canvas if on plan tab
        setTimeout(() => {
            if (document.querySelector('.tab-btn[data-tab="plan"]').classList.contains('active')) {
                this.initializePlanCanvas();
            }
        }, 100);
    },

    createFicheEditor(fiche) {
        return `
            <div id="ficheEditor" class="modal modal-fullscreen">
                <div class="modal-content fiche-editor">
                    <div class="fiche-header">
                        <h2>📋 ${fiche ? 'Fiche: ' + fiche.nom : 'Nouvelle Fiche'}</h2>
                        <div class="fiche-actions">
                            <button class="btn-secondary" onclick="fiches.saveFiche()">💾 Enregistrer</button>
                            <button class="btn-secondary" onclick="fiches.exportFichePDF()">📄 Export PDF</button>
                            <button class="btn-close" onclick="fiches.closeFicheEditor()">✕</button>
                        </div>
                    </div>

                    <div class="fiche-tabs">
                        <button class="tab-btn active" data-tab="general" onclick="fiches.switchTab('general')">1. Général</button>
                        <button class="tab-btn" data-tab="client" onclick="fiches.switchTab('client')">2. Client</button>
                        <button class="tab-btn" data-tab="logement" onclick="fiches.switchTab('logement')">3. Logement</button>
                        <button class="tab-btn" data-tab="existant" onclick="fiches.switchTab('existant')">4. Existant</button>
                        <button class="tab-btn" data-tab="besoins" onclick="fiches.switchTab('besoins')">5. Besoins</button>
                        <button class="tab-btn" data-tab="technique" onclick="fiches.switchTab('technique')">6. Technique</button>
                        <button class="tab-btn plan-tab" data-tab="plan" onclick="fiches.switchTab('plan')">7. 📐 Plan 2D</button>
                        <button class="tab-btn" data-tab="notes" onclick="fiches.switchTab('notes')">8. Notes</button>
                    </div>

                    <div class="fiche-content">
                        ${this.createTabContent(fiche)}
                    </div>
                </div>
            </div>
        `;
    },

    createTabContent(fiche) {
        return `
            <!-- ONGLET 1: GÉNÉRAL -->
            <div class="tab-content active" data-tab="general">
                <div class="form-grid">
                    <div class="form-group">
                        <label>Nom de la fiche</label>
                        <input type="text" id="ficheNom" value="${fiche?.nom || ''}" placeholder="Ex: Relevé SDB Dupont">
                    </div>
                    <div class="form-group">
                        <label>Date du rendez-vous</label>
                        <input type="date" id="ficheDate" value="${fiche?.date_rdv || new Date().toISOString().split('T')[0]}">
                    </div>
                    <div class="form-group">
                        <label>Type d'intervention</label>
                        <select id="ficheType">
                            <option value="visite_technique" ${fiche?.type_intervention === 'visite_technique' ? 'selected' : ''}>Visite Technique</option>
                            <option value="releve_existant" ${fiche?.type_intervention === 'releve_existant' ? 'selected' : ''}>Relevé Existant</option>
                            <option value="installation" ${fiche?.type_intervention === 'installation' ? 'selected' : ''}>Installation</option>
                            <option value="maintenance" ${fiche?.type_intervention === 'maintenance' ? 'selected' : ''}>Maintenance</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Statut</label>
                        <select id="ficheStatut">
                            <option value="planifie" ${fiche?.statut === 'planifie' ? 'selected' : ''}>Planifié</option>
                            <option value="en_cours" ${fiche?.statut === 'en_cours' ? 'selected' : ''}>En cours</option>
                            <option value="termine" ${fiche?.statut === 'termine' ? 'selected' : ''}>Terminé</option>
                            <option value="valide" ${fiche?.statut === 'valide' ? 'selected' : ''}>Validé</option>
                        </select>
                    </div>
                </div>
            </div>

            <!-- ONGLET 2: CLIENT -->
            <div class="tab-content" data-tab="client">
                <div class="form-grid">
                    <div class="form-group">
                        <label>Nom du client</label>
                        <input type="text" id="clientNom" value="${fiche?.client_nom || ''}" placeholder="Nom du client">
                    </div>
                    <div class="form-group">
                        <label>Adresse complète</label>
                        <textarea id="clientAdresse" placeholder="Adresse complète du client">${fiche?.adresse || ''}</textarea>
                    </div>
                    <div class="form-group">
                        <label>Téléphone</label>
                        <input type="tel" id="clientTelephone" value="${fiche?.telephone || ''}" placeholder="06 12 34 56 78">
                    </div>
                    <div class="form-group">
                        <label>Email</label>
                        <input type="email" id="clientEmail" value="${fiche?.email || ''}" placeholder="client@email.com">
                    </div>
                    <div class="form-group">
                        <label>Budget indicatif</label>
                        <input type="text" id="budgetIndicatif" value="${fiche?.budget_estime || ''}" placeholder="Ex: 15000€">
                    </div>
                    <div class="form-group">
                        <label>Nombre de personnes</label>
                        <input type="number" id="nbPersonnes" value="${fiche?.nb_personnes || ''}" min="1" max="10">
                    </div>
                </div>
            </div>

            <!-- ONGLET 3: LOGEMENT -->
            <div class="tab-content" data-tab="logement">
                <div class="form-grid">
                    <div class="form-group">
                        <label>Type de logement</label>
                        <select id="typeLogement">
                            <option value="maison" ${fiche?.type_logement === 'maison' ? 'selected' : ''}>Maison</option>
                            <option value="appartement" ${fiche?.type_logement === 'appartement' ? 'selected' : ''}>Appartement</option>
                            <option value="studio" ${fiche?.type_logement === 'studio' ? 'selected' : ''}>Studio</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Année de construction</label>
                        <input type="number" id="anneeConstruction" value="${fiche?.annee_construction || ''}" min="1900" max="2025">
                    </div>
                    <div class="form-group">
                        <label>Surface habitable (m²)</label>
                        <input type="number" id="surfaceHabitable" value="${fiche?.surface || ''}" min="10" max="1000">
                    </div>
                    <div class="form-group">
                        <label>Type d'isolation</label>
                        <select id="typeIsolation">
                            <option value="faible" ${fiche?.isolation === 'faible' ? 'selected' : ''}>Faible (avant 1975)</option>
                            <option value="moyenne" ${fiche?.isolation === 'moyenne' ? 'selected' : ''}>Moyenne (1975-2000)</option>
                            <option value="bonne" ${fiche?.isolation === 'bonne' ? 'selected' : ''}>Bonne (2000-2012)</option>
                            <option value="rt2012" ${fiche?.isolation === 'rt2012' ? 'selected' : ''}>RT2012+ (après 2012)</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Type de menuiseries</label>
                        <select id="typeMenuiseries">
                            <option value="simple" ${fiche?.menuiseries === 'simple' ? 'selected' : ''}>Simple vitrage</option>
                            <option value="double" ${fiche?.menuiseries === 'double' ? 'selected' : ''}>Double vitrage</option>
                            <option value="triple" ${fiche?.menuiseries === 'triple' ? 'selected' : ''}>Triple vitrage</option>
                        </select>
                    </div>
                </div>
            </div>

            <!-- ONGLET 4: EXISTANT -->
            <div class="tab-content" data-tab="existant">
                <div class="form-grid">
                    <div class="form-group full-width">
                        <label>Installation de chauffage actuelle</label>
                        <textarea id="chauffageActuel" placeholder="Décrivez l'installation existante...">${fiche?.chauffage_actuel || ''}</textarea>
                    </div>
                    <div class="form-group">
                        <label>État général</label>
                        <select id="etatGeneral">
                            <option value="bon" ${fiche?.etat_general === 'bon' ? 'selected' : ''}>Bon état</option>
                            <option value="moyen" ${fiche?.etat_general === 'moyen' ? 'selected' : ''}>État moyen</option>
                            <option value="mauvais" ${fiche?.etat_general === 'mauvais' ? 'selected' : ''}>Mauvais état</option>
                            <option value="vetuste" ${fiche?.etat_general === 'vetuste' ? 'selected' : ''}>Vétuste</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Production ECS</label>
                        <select id="productionECS">
                            <option value="chaudiere" ${fiche?.production_ecs === 'chaudiere' ? 'selected' : ''}>Chaudière</option>
                            <option value="ballon_electrique" ${fiche?.production_ecs === 'ballon_electrique' ? 'selected' : ''}>Ballon électrique</option>
                            <option value="chauffe_eau_gaz" ${fiche?.production_ecs === 'chauffe_eau_gaz' ? 'selected' : ''}>Chauffe-eau gaz</option>
                            <option value="solaire" ${fiche?.production_ecs === 'solaire' ? 'selected' : ''}>Solaire</option>
                            <option value="aucune" ${fiche?.production_ecs === 'aucune' ? 'selected' : ''}>Aucune</option>
                        </select>
                    </div>
                    <div class="form-group full-width">
                        <label>Observations complémentaires</label>
                        <textarea id="observationsExistant" placeholder="Notes sur l'existant...">${fiche?.observations_existant || ''}</textarea>
                    </div>
                </div>
            </div>

            <!-- ONGLET 5: BESOINS -->
            <div class="tab-content" data-tab="besoins">
                <div class="besoins-section">
                    <h3>Besoins exprimés par le client</h3>
                    <div class="checkbox-grid">
                        <label><input type="checkbox" name="besoins" value="chauffage"> Chauffage principal</label>
                        <label><input type="checkbox" name="besoins" value="climatisation"> Climatisation</label>
                        <label><input type="checkbox" name="besoins" value="ecs"> Production ECS</label>
                        <label><input type="checkbox" name="besoins" value="renovation"> Rénovation complète</label>
                        <label><input type="checkbox" name="besoins" value="economie"> Économies d'énergie</label>
                        <label><input type="checkbox" name="besoins" value="confort"> Amélioration confort</label>
                        <label><input type="checkbox" name="besoins" value="ecologie"> Solution écologique</label>
                        <label><input type="checkbox" name="besoins" value="maintenance"> Contrat maintenance</label>
                    </div>
                </div>
                
                <div class="form-grid">
                    <div class="form-group">
                        <label>Priorité</label>
                        <select id="priorite">
                            <option value="haute">Haute - Urgent</option>
                            <option value="moyenne" selected>Moyenne - Normal</option>
                            <option value="basse">Basse - Peut attendre</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Délai souhaité</label>
                        <select id="delaiSouhaite">
                            <option value="immediat">Immédiat (< 1 mois)</option>
                            <option value="court">Court terme (1-3 mois)</option>
                            <option value="moyen" selected>Moyen terme (3-6 mois)</option>
                            <option value="long">Long terme (> 6 mois)</option>
                        </select>
                    </div>
                    <div class="form-group full-width">
                        <label>Contraintes particulières</label>
                        <textarea id="contraintes" placeholder="Contraintes, restrictions, demandes spéciales...">${fiche?.contraintes || ''}</textarea>
                    </div>
                </div>
            </div>

            <!-- ONGLET 6: TECHNIQUE -->
            <div class="tab-content" data-tab="technique">
                <div class="form-grid">
                    <div class="form-group">
                        <label>Compteur électrique</label>
                        <input type="text" id="compteurElectrique" value="${fiche?.compteur_electrique || ''}" placeholder="Puissance, type...">
                    </div>
                    <div class="form-group">
                        <label>Arrivée gaz</label>
                        <select id="arriveeGaz">
                            <option value="oui" ${fiche?.arrivee_gaz === 'oui' ? 'selected' : ''}>Oui, disponible</option>
                            <option value="non" ${fiche?.arrivee_gaz === 'non' ? 'selected' : ''}>Non</option>
                            <option value="proche" ${fiche?.arrivee_gaz === 'proche' ? 'selected' : ''}>Proche (raccordement possible)</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Évacuation des eaux</label>
                        <input type="text" id="evacuationEaux" value="${fiche?.evacuation_eaux || ''}" placeholder="Type, accessibilité...">
                    </div>
                    <div class="form-group">
                        <label>Accès pour matériel</label>
                        <select id="accesMateriel">
                            <option value="facile" ${fiche?.acces_materiel === 'facile' ? 'selected' : ''}>Facile</option>
                            <option value="moyen" ${fiche?.acces_materiel === 'moyen' ? 'selected' : ''}>Moyen</option>
                            <option value="difficile" ${fiche?.acces_materiel === 'difficile' ? 'selected' : ''}>Difficile</option>
                            <option value="impossible" ${fiche?.acces_materiel === 'impossible' ? 'selected' : ''}>Très difficile</option>
                        </select>
                    </div>
                    <div class="form-group full-width">
                        <label>Contraintes techniques</label>
                        <textarea id="contraintesToechniques" placeholder="Contraintes d'installation, problèmes identifiés...">${fiche?.contraintes_techniques || ''}</textarea>
                    </div>
                </div>
            </div>

            <!-- ONGLET 7: PLAN 2D -->
            <div class="tab-content" data-tab="plan">
                <div class="plan-container">
                    <div class="plan-toolbar">
                        <div class="tool-group">
                            <button class="tool-btn active" data-tool="select" onclick="fiches.selectTool('select')" title="Sélectionner">👆</button>
                            <button class="tool-btn" data-tool="draw" onclick="fiches.selectTool('draw')" title="Dessiner">✏️</button>
                            <button class="tool-btn" data-tool="room" onclick="fiches.selectTool('room')" title="Ajouter pièce">🏠</button>
                            <button class="tool-btn" data-tool="measure" onclick="fiches.selectTool('measure')" title="Coter">📏</button>
                            <button class="tool-btn" data-tool="door" onclick="fiches.selectTool('door')" title="Porte">🚪</button>
                            <button class="tool-btn" data-tool="window" onclick="fiches.selectTool('window')" title="Fenêtre">🪟</button>
                        </div>
                        <div class="tool-group">
                            <button class="tool-btn" onclick="fiches.clearPlan()" title="Effacer tout">🗑️</button>
                            <button class="tool-btn" onclick="fiches.undoPlan()" title="Annuler">↶</button>
                            <button class="tool-btn" onclick="fiches.redoPlan()" title="Refaire">↷</button>
                        </div>
                        <div class="tool-group">
                            <button class="tool-btn" onclick="fiches.importPlanFile()" title="Importer plan">📁</button>
                            <button class="tool-btn" onclick="fiches.exportPlanImage()" title="Exporter image">🖼️</button>
                        </div>
                        <div class="scale-control">
                            <label>Échelle:</label>
                            <select id="planScale" onchange="fiches.changeScale()">
                                <option value="50">1:50</option>
                                <option value="100" selected>1:100</option>
                                <option value="200">1:200</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="plan-workspace">
                        <canvas id="planCanvas" width="800" height="600"></canvas>
                        <input type="file" id="planFileInput" accept="image/*,.pdf,.dwg" style="display:none" onchange="fiches.handlePlanFileImport()">
                    </div>
                    
                    <div class="plan-info">
                        <div class="plan-measurements" id="planMeasurements">
                            <h4>Mesures</h4>
                            <div id="measurementsList">Aucune mesure</div>
                        </div>
                        <div class="plan-rooms" id="planRooms">
                            <h4>Pièces</h4>
                            <div id="roomsList">Aucune pièce définie</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- ONGLET 8: NOTES -->
            <div class="tab-content" data-tab="notes">
                <div class="form-grid">
                    <div class="form-group full-width">
                        <label>Solution recommandée</label>
                        <textarea id="solutionRecommandee" placeholder="Décrivez la solution technique recommandée..." rows="4">${fiche?.solution_recommandee || ''}</textarea>
                    </div>
                    <div class="form-group full-width">
                        <label>Points d'attention</label>
                        <textarea id="pointsAttention" placeholder="Points importants à retenir..." rows="3">${fiche?.points_attention || ''}</textarea>
                    </div>
                    <div class="form-group">
                        <label>Estimation budget final</label>
                        <input type="text" id="budgetFinal" value="${fiche?.budget_final || ''}" placeholder="Ex: 18500€">
                    </div>
                    <div class="form-group">
                        <label>Délai de réalisation</label>
                        <input type="text" id="delaiRealisation" value="${fiche?.delai_realisation || ''}" placeholder="Ex: 2 semaines">
                    </div>
                    <div class="form-group full-width">
                        <label>Notes complémentaires</label>
                        <textarea id="notesComplementaires" placeholder="Informations diverses..." rows="4">${fiche?.notes || ''}</textarea>
                    </div>
                </div>
            </div>
        `;
    },

    // ===== PLAN 2D SYSTEM =====
    initializePlanCanvas() {
        this.planCanvas = document.getElementById('planCanvas');
        if (!this.planCanvas) return;
        
        this.planContext = this.planCanvas.getContext('2d');
        this.setupCanvasEvents();
        this.drawGrid();
        
        // Load existing plan data if available
        if (this.currentEdit && this.currentEdit.plan_data) {
            try {
                this.planData = JSON.parse(this.currentEdit.plan_data);
                this.redrawPlan();
            } catch (e) {
                console.error('Error loading plan data:', e);
            }
        }
    },

    setupCanvasEvents() {
        // Touch events for tablets
        this.planCanvas.addEventListener('touchstart', (e) => this.handlePlanTouchStart(e), { passive: false });
        this.planCanvas.addEventListener('touchmove', (e) => this.handlePlanTouchMove(e), { passive: false });
        this.planCanvas.addEventListener('touchend', (e) => this.handlePlanTouchEnd(e), { passive: false });
        
        // Mouse events for desktop
        this.planCanvas.addEventListener('mousedown', (e) => this.handlePlanMouseDown(e));
        this.planCanvas.addEventListener('mousemove', (e) => this.handlePlanMouseMove(e));
        this.planCanvas.addEventListener('mouseup', (e) => this.handlePlanMouseUp(e));
    },

    getPointerPosition(e) {
        const rect = this.planCanvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        
        return {
            x: Math.round((clientX - rect.left) / this.planData.gridSize) * this.planData.gridSize,
            y: Math.round((clientY - rect.top) / this.planData.gridSize) * this.planData.gridSize
        };
    },

    handlePlanTouchStart(e) {
        e.preventDefault();
        this.handlePlanStart(e);
    },

    handlePlanMouseDown(e) {
        this.handlePlanStart(e);
    },

    handlePlanStart(e) {
        const pos = this.getPointerPosition(e);
        this.startPoint = pos;
        this.isDrawing = true;

        switch (this.planData.currentTool) {
            case 'select':
                this.selectElementAt(pos);
                break;
            case 'draw':
                this.startDrawing(pos);
                break;
            case 'room':
                this.startRoom(pos);
                break;
            case 'measure':
                this.startMeasurement(pos);
                break;
            case 'door':
            case 'window':
                this.addElement(pos, this.planData.currentTool);
                break;
        }
    },

    handlePlanTouchMove(e) {
        e.preventDefault();
        this.handlePlanMove(e);
    },

    handlePlanMouseMove(e) {
        if (!this.isDrawing) return;
        this.handlePlanMove(e);
    },

    handlePlanMove(e) {
        if (!this.isDrawing || !this.startPoint) return;
        
        const pos = this.getPointerPosition(e);
        
        switch (this.planData.currentTool) {
            case 'draw':
                this.continuDrawing(pos);
                break;
            case 'room':
                this.updateRoom(pos);
                break;
        }
    },

    handlePlanTouchEnd(e) {
        e.preventDefault();
        this.handlePlanEnd(e);
    },

    handlePlanMouseUp(e) {
        this.handlePlanEnd(e);
    },

    handlePlanEnd(e) {
        this.isDrawing = false;
        
        if (this.planData.currentTool === 'room' && this.startPoint) {
            const pos = this.getPointerPosition(e);
            this.finishRoom(pos);
        }
        
        this.startPoint = null;
        this.redrawPlan();
    },

    selectTool(tool) {
        document.querySelectorAll('.tool-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-tool="${tool}"]`).classList.add('active');
        this.planData.currentTool = tool;
        this.selectedElement = null;
    },

    drawGrid() {
        const ctx = this.planContext;
        const canvas = this.planCanvas;
        const gridSize = this.planData.gridSize;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Grid
        ctx.strokeStyle = '#e0e0e0';
        ctx.lineWidth = 0.5;
        
        for (let x = 0; x <= canvas.width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }
        
        for (let y = 0; y <= canvas.height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }
    },

    startDrawing(pos) {
        this.planData.elements.push({
            type: 'line',
            points: [pos],
            id: Date.now()
        });
    },

    continuDrawing(pos) {
        const currentElement = this.planData.elements[this.planData.elements.length - 1];
        if (currentElement && currentElement.type === 'line') {
            currentElement.points.push(pos);
            this.redrawPlan();
        }
    },

    startRoom(pos) {
        // Start drawing room rectangle
    },

    finishRoom(pos) {
        const roomName = prompt('Nom de la pièce:', 'Pièce');
        if (roomName) {
            this.planData.rooms.push({
                name: roomName,
                x: Math.min(this.startPoint.x, pos.x),
                y: Math.min(this.startPoint.y, pos.y),
                width: Math.abs(pos.x - this.startPoint.x),
                height: Math.abs(pos.y - this.startPoint.y),
                id: Date.now()
            });
            this.updateRoomsList();
        }
    },

    addElement(pos, type) {
        this.planData.elements.push({
            type: type,
            x: pos.x,
            y: pos.y,
            id: Date.now()
        });
        this.redrawPlan();
    },

    redrawPlan() {
        this.drawGrid();
        
        const ctx = this.planContext;
        
        // Draw rooms
        ctx.fillStyle = 'rgba(200, 220, 255, 0.3)';
        ctx.strokeStyle = '#4a90e2';
        ctx.lineWidth = 2;
        
        this.planData.rooms.forEach(room => {
            ctx.fillRect(room.x, room.y, room.width, room.height);
            ctx.strokeRect(room.x, room.y, room.width, room.height);
            
            // Room label
            ctx.fillStyle = '#333';
            ctx.font = '12px Arial';
            ctx.fillText(room.name, room.x + 5, room.y + 15);
            ctx.fillStyle = 'rgba(200, 220, 255, 0.3)';
        });
        
        // Draw elements
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 3;
        
        this.planData.elements.forEach(element => {
            if (element.type === 'line' && element.points.length > 1) {
                ctx.beginPath();
                ctx.moveTo(element.points[0].x, element.points[0].y);
                element.points.forEach(point => {
                    ctx.lineTo(point.x, point.y);
                });
                ctx.stroke();
            } else if (element.type === 'door') {
                this.drawDoor(ctx, element.x, element.y);
            } else if (element.type === 'window') {
                this.drawWindow(ctx, element.x, element.y);
            }
        });
        
        // Draw measurements
        ctx.strokeStyle = '#ff4444';
        ctx.fillStyle = '#ff4444';
        ctx.font = '10px Arial';
        
        this.planData.measurements.forEach(measure => {
            // Draw measurement line and text
            ctx.beginPath();
            ctx.moveTo(measure.x1, measure.y1);
            ctx.lineTo(measure.x2, measure.y2);
            ctx.stroke();
            
            const midX = (measure.x1 + measure.x2) / 2;
            const midY = (measure.y1 + measure.y2) / 2;
            ctx.fillText(measure.value + 'm', midX, midY);
        });
    },

    drawDoor(ctx, x, y) {
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(x, y, 20, 4);
        ctx.strokeRect(x, y, 20, 4);
    },

    drawWindow(ctx, x, y) {
        ctx.fillStyle = '#87CEEB';
        ctx.fillRect(x, y, 20, 4);
        ctx.strokeRect(x, y, 20, 4);
        
        // Window cross
        ctx.beginPath();
        ctx.moveTo(x + 10, y);
        ctx.lineTo(x + 10, y + 4);
        ctx.stroke();
    },

    // Import plan file (image/PDF)
    importPlanFile() {
        document.getElementById('planFileInput').click();
    },

    handlePlanFileImport(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    // Draw the imported image as background
                    this.planContext.globalAlpha = 0.5;
                    this.planContext.drawImage(img, 0, 0, this.planCanvas.width, this.planCanvas.height);
                    this.planContext.globalAlpha = 1.0;
                    this.redrawPlan();
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
        
        app.showMessage('Plan importé avec succès', 'success');
    },

    clearPlan() {
        if (confirm('Effacer tout le plan ?')) {
            this.planData.elements = [];
            this.planData.rooms = [];
            this.planData.measurements = [];
            this.redrawPlan();
        }
    },

    updateRoomsList() {
        const container = document.getElementById('roomsList');
        if (!container) return;
        
        if (this.planData.rooms.length === 0) {
            container.innerHTML = 'Aucune pièce définie';
            return;
        }
        
        container.innerHTML = this.planData.rooms.map(room => `
            <div class="room-item">
                <span>${room.name}</span>
                <button onclick="fiches.deleteRoom('${room.id}')" title="Supprimer">🗑️</button>
            </div>
        `).join('');
    },

    // ===== TAB MANAGEMENT =====
    initializeTabs() {
        // Load saved form data if editing
        if (this.currentEdit) {
            this.loadFormData(this.currentEdit);
        }
    },

    switchTab(tabName) {
        // Save current tab data
        this.saveCurrentTabData();
        
        // Switch tabs
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        document.querySelector(`.tab-content[data-tab="${tabName}"]`).classList.add('active');
        
        // Initialize plan canvas if switching to plan tab
        if (tabName === 'plan') {
            setTimeout(() => this.initializePlanCanvas(), 100);
        }
    },

    saveCurrentTabData() {
        // Save current form state to temporary object
        // This will be implemented based on current active tab
    },

    loadFormData(fiche) {
        // Load existing fiche data into form fields for all 8 tabs
        if (!fiche) return;
        
        // Onglet 1: Général
        if (document.getElementById('ficheNom')) document.getElementById('ficheNom').value = fiche.nom || '';
        if (document.getElementById('ficheDate')) document.getElementById('ficheDate').value = fiche.date_rdv || '';
        if (document.getElementById('ficheType')) document.getElementById('ficheType').value = fiche.type_intervention || fiche.type_sdb || 'visite_technique';
        if (document.getElementById('ficheStatut')) document.getElementById('ficheStatut').value = fiche.statut || 'planifie';
        
        // Onglet 2: Client
        if (document.getElementById('clientNom')) document.getElementById('clientNom').value = fiche.client_nom || '';
        if (document.getElementById('clientAdresse')) document.getElementById('clientAdresse').value = fiche.adresse || '';
        if (document.getElementById('clientTelephone')) document.getElementById('clientTelephone').value = fiche.telephone || '';
        if (document.getElementById('clientEmail')) document.getElementById('clientEmail').value = fiche.email || '';
        if (document.getElementById('budgetIndicatif')) document.getElementById('budgetIndicatif').value = fiche.budget_estime || '';
        if (document.getElementById('nbPersonnes')) document.getElementById('nbPersonnes').value = fiche.nb_personnes || 1;
        
        // Onglet 3: Logement
        if (document.getElementById('typeLogement')) document.getElementById('typeLogement').value = fiche.type_logement || 'maison';
        if (document.getElementById('anneeConstruction')) document.getElementById('anneeConstruction').value = fiche.annee_construction || 2000;
        if (document.getElementById('surfaceHabitable')) document.getElementById('surfaceHabitable').value = fiche.surface || '';
        if (document.getElementById('typeIsolation')) document.getElementById('typeIsolation').value = fiche.isolation || 'moyenne';
        if (document.getElementById('typeMenuiseries')) document.getElementById('typeMenuiseries').value = fiche.menuiseries || 'double';
        
        // Onglet 4: Existant
        if (document.getElementById('chauffageActuel')) document.getElementById('chauffageActuel').value = fiche.chauffage_actuel || '';
        if (document.getElementById('etatGeneral')) document.getElementById('etatGeneral').value = fiche.etat_general || 'bon';
        if (document.getElementById('productionECS')) document.getElementById('productionECS').value = fiche.production_ecs || 'chaudiere';
        if (document.getElementById('observationsExistant')) document.getElementById('observationsExistant').value = fiche.observations_existant || '';
        
        // Onglet 5: Besoins
        this.loadBesoins(fiche.besoins);
        if (document.getElementById('priorite')) document.getElementById('priorite').value = fiche.priorite || 'moyenne';
        if (document.getElementById('delaiSouhaite')) document.getElementById('delaiSouhaite').value = fiche.delai_souhaite || 'moyen';
        if (document.getElementById('contraintes')) document.getElementById('contraintes').value = fiche.contraintes || '';
        
        // Onglet 6: Technique
        if (document.getElementById('compteurElectrique')) document.getElementById('compteurElectrique').value = fiche.compteur_electrique || '';
        if (document.getElementById('arriveeGaz')) document.getElementById('arriveeGaz').value = fiche.arrivee_gaz || 'non';
        if (document.getElementById('evacuationEaux')) document.getElementById('evacuationEaux').value = fiche.evacuation_eaux || '';
        if (document.getElementById('accesMateriel')) document.getElementById('accesMateriel').value = fiche.acces_materiel || 'facile';
        if (document.getElementById('contraintesToechniques')) document.getElementById('contraintesToechniques').value = fiche.contraintes_techniques || '';
        
        // Onglet 7: Plan 2D
        if (fiche.plan_data) {
            try {
                this.planData = JSON.parse(fiche.plan_data);
            } catch (e) {
                console.error('Error parsing plan data:', e);
                this.planData = {
                    elements: [],
                    measurements: [],
                    rooms: [],
                    scale: 1,
                    gridSize: 20,
                    currentTool: 'select'
                };
            }
        }
        
        // Onglet 8: Notes
        if (document.getElementById('solutionRecommandee')) document.getElementById('solutionRecommandee').value = fiche.solution_recommandee || '';
        if (document.getElementById('pointsAttention')) document.getElementById('pointsAttention').value = fiche.points_attention || '';
        if (document.getElementById('budgetFinal')) document.getElementById('budgetFinal').value = fiche.budget_final || '';
        if (document.getElementById('delaiRealisation')) document.getElementById('delaiRealisation').value = fiche.delai_realisation || '';
        if (document.getElementById('notesComplementaires')) document.getElementById('notesComplementaires').value = fiche.notes || '';
    },

    loadBesoins(besoinsString) {
        if (!besoinsString) return;
        
        try {
            const besoins = JSON.parse(besoinsString);
            besoins.forEach(besoin => {
                const checkbox = document.querySelector(`input[name="besoins"][value="${besoin}"]`);
                if (checkbox) checkbox.checked = true;
            });
        } catch (e) {
            console.error('Error parsing besoins:', e);
        }
    },

    // ===== CRUD OPERATIONS =====
    async saveFiche() {
        try {
            const ficheData = this.collectFicheData();
            
            if (this.currentEdit) {
                // Update existing
                await app.apiCall(`/fiches-sdb/${this.currentEdit.id}`, {
                    method: 'PUT',
                    body: JSON.stringify(ficheData)
                });
                app.showMessage('Fiche mise à jour avec succès', 'success');
            } else {
                // Create new
                await app.apiCall('/fiches-sdb', {
                    method: 'POST',
                    body: JSON.stringify(ficheData)
                });
                app.showMessage('Fiche créée avec succès', 'success');
            }
            
            this.closeFicheEditor();
            this.load();
        } catch (error) {
            console.error('Error saving fiche:', error);
            app.showMessage('Erreur lors de la sauvegarde: ' + error.message, 'error');
        }
    },

    collectFicheData() {
        // Collect all form data from all 8 tabs
        const formData = {
            // Onglet 1: Général
            nom: document.getElementById('ficheNom')?.value || '',
            date_rdv: document.getElementById('ficheDate')?.value || '',
            type_intervention: document.getElementById('ficheType')?.value || 'visite_technique',
            statut: document.getElementById('ficheStatut')?.value || 'planifie',
            
            // Onglet 2: Client
            client_nom: document.getElementById('clientNom')?.value || '',
            adresse: document.getElementById('clientAdresse')?.value || '',
            telephone: document.getElementById('clientTelephone')?.value || '',
            email: document.getElementById('clientEmail')?.value || '',
            budget_estime: document.getElementById('budgetIndicatif')?.value || '',
            nb_personnes: parseInt(document.getElementById('nbPersonnes')?.value) || 1,
            
            // Onglet 3: Logement
            type_logement: document.getElementById('typeLogement')?.value || 'maison',
            annee_construction: parseInt(document.getElementById('anneeConstruction')?.value) || 2000,
            surface: document.getElementById('surfaceHabitable')?.value || '',
            isolation: document.getElementById('typeIsolation')?.value || 'moyenne',
            menuiseries: document.getElementById('typeMenuiseries')?.value || 'double',
            
            // Onglet 4: Existant
            chauffage_actuel: document.getElementById('chauffageActuel')?.value || '',
            etat_general: document.getElementById('etatGeneral')?.value || 'bon',
            production_ecs: document.getElementById('productionECS')?.value || 'chaudiere',
            observations_existant: document.getElementById('observationsExistant')?.value || '',
            
            // Onglet 5: Besoins
            besoins: this.collectBesoins(),
            priorite: document.getElementById('priorite')?.value || 'moyenne',
            delai_souhaite: document.getElementById('delaiSouhaite')?.value || 'moyen',
            contraintes: document.getElementById('contraintes')?.value || '',
            
            // Onglet 6: Technique
            compteur_electrique: document.getElementById('compteurElectrique')?.value || '',
            arrivee_gaz: document.getElementById('arriveeGaz')?.value || 'non',
            evacuation_eaux: document.getElementById('evacuationEaux')?.value || '',
            acces_materiel: document.getElementById('accesMateriel')?.value || 'facile',
            contraintes_techniques: document.getElementById('contraintesToechniques')?.value || '',
            
            // Onglet 7: Plan 2D
            plan_data: JSON.stringify(this.planData),
            
            // Onglet 8: Notes
            solution_recommandee: document.getElementById('solutionRecommandee')?.value || '',
            points_attention: document.getElementById('pointsAttention')?.value || '',
            budget_final: document.getElementById('budgetFinal')?.value || '',
            delai_realisation: document.getElementById('delaiRealisation')?.value || '',
            notes: document.getElementById('notesComplementaires')?.value || '',
            
            // Legacy SDB compatibility
            type_sdb: document.getElementById('ficheType')?.value || 'visite_technique'
        };
        
        return formData;
    },

    collectBesoins() {
        const checkboxes = document.querySelectorAll('input[name="besoins"]:checked');
        const besoins = Array.from(checkboxes).map(cb => cb.value);
        return JSON.stringify(besoins);
    },

    closeFicheEditor() {
        document.getElementById('ficheEditor').style.display = 'none';
        this.currentEdit = null;
        this.planData = {
            elements: [],
            measurements: [],
            rooms: [],
            scale: 1,
            gridSize: 20,
            currentTool: 'select'
        };
    },

    createFicheModal(doc = null) {
        return `
            <div id="ficheModal" class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>${doc ? 'Modifier Fiche' : 'Nouvelle Fiche de Relevé'}</h2>
                        <button class="btn-close" onclick="fiches.closeModal()">&times;</button>
                    </div>
                    <form id="ficheForm" onsubmit="fiches.handleSubmit(event)">
                        <div class="form-group">
                            <label>Nom de la fiche</label>
                            <input type="text" name="nom" required placeholder="Ex: Relevé chantier Dupont">
                        </div>
                        <div class="form-group">
                            <label>Client</label>
                            <input type="text" name="client_nom" placeholder="Nom du client (optionnel)">
                        </div>
                        <div class="form-group">
                            <label>Adresse</label>
                            <textarea name="adresse" placeholder="Adresse du chantier"></textarea>
                        </div>
                        <div class="form-group">
                            <label>Type d'intervention</label>
                            <select name="type_sdb">
                                <option value="visite_technique">Visite Technique</option>
                                <option value="releve_existant">Relevé Existant</option>
                                <option value="installation">Installation</option>
                                <option value="maintenance">Maintenance</option>
                            </select>
                        </div>
                        <div class="modal-actions">
                            <button type="button" class="btn-secondary" onclick="fiches.closeModal()">Annuler</button>
                            <button type="submit" class="btn-primary">Créer la fiche</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    },

    async handleSubmit(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const ficheData = Object.fromEntries(formData.entries());
        
        try {
            const newFiche = await app.apiCall('/fiches-sdb', {
                method: 'POST',
                body: JSON.stringify(ficheData)
            });
            
            app.showMessage('Fiche créée avec succès', 'success');
            this.closeModal();
            this.load();
            
            // Open the new fiche for editing
            setTimeout(() => this.openFiche(newFiche.id), 500);
        } catch (error) {
            console.error('Error creating fiche:', error);
            app.showMessage('Erreur lors de la création: ' + error.message, 'error');
        }
    },

    closeModal() {
        const modal = document.getElementById('ficheModal');
        if (modal) modal.style.display = 'none';
    },

    // ===== FILTERS =====
    filter() {
        const searchTerm = document.getElementById('ficheSearch').value.toLowerCase();
        this.filteredData = this.data.filter(fiche => 
            fiche.nom.toLowerCase().includes(searchTerm) ||
            fiche.client_nom.toLowerCase().includes(searchTerm) ||
            (fiche.adresse && fiche.adresse.toLowerCase().includes(searchTerm))
        );
        this.renderFiltered();
    },

    filterByType() {
        const type = document.getElementById('ficheType').value;
        this.filteredData = type ? this.data.filter(fiche => fiche.type_sdb === type) : this.data;
        this.renderFiltered();
    },

    renderFiltered() {
        const container = document.getElementById('fichesList');
        const dataToRender = this.filteredData || this.data;
        
        if (dataToRender.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>Aucune fiche trouvée</p></div>';
            return;
        }
        
        container.innerHTML = dataToRender.map(fiche => `
            <div class="item-card">
                <div class="item-header">
                    <div class="item-title">📋 ${fiche.nom}</div>
                    <div class="item-actions">
                        <button class="btn-view" onclick="fiches.openFiche('${fiche.id}')">Ouvrir</button>
                        <button class="btn-edit" onclick="fiches.showEditModal('${fiche.id}')">Modifier</button>
                        <button class="btn-delete" onclick="fiches.delete('${fiche.id}', '${fiche.nom}')">Supprimer</button>
                    </div>
                </div>
                <div class="item-info">
                    <div class="item-detail">👤 Client: ${fiche.client_nom}</div>
                    <div class="item-detail">🏠 Type: ${this.getTypeLabel(fiche.type_sdb)}</div>
                    ${fiche.adresse ? `<div class="item-detail">📍 ${fiche.adresse}</div>` : ''}
                    <div class="item-detail">📅 Créé le ${app.formatDate(fiche.created_at)}</div>
                </div>
            </div>
        `).join('');
    },

    async delete(id, nom) {
        if (confirm(`Supprimer la fiche "${nom}" ?\nCette action est irréversible.`)) {
            try {
                await app.apiCall(`/fiches-sdb/${id}`, { method: 'DELETE' });
                app.showMessage('Fiche supprimée avec succès', 'success');
                this.load();
            } catch (error) {
                console.error('Error deleting fiche:', error);
                app.showMessage('Erreur lors de la suppression', 'error');
            }
        }
    },

    // ===== PDF EXPORT =====
    async exportPDF() {
        app.showMessage('Export PDF en cours...', 'info');
        
        if (window.pdfExport) {
            await pdfExport.exportFiches(this.data);
        } else {
            app.showMessage('Module PDF non disponible', 'error');
        }
    },

    async exportFichePDF() {
        if (!this.currentEdit) return;
        
        app.showMessage('Export PDF de la fiche en cours...', 'info');
        
        if (window.pdfExport) {
            const ficheData = this.collectFicheData();
            await pdfExport.exportSingleFiche({ ...this.currentEdit, ...ficheData });
        } else {
            app.showMessage('Module PDF non disponible', 'error');
        }
    }
};