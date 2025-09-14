// ===== H2EAUX GESTION - APPLICATION COMPLETE =====

// ===== MAIN APPLICATION CLASS =====
class H2EAUXGestion {
    constructor() {
        this.config = {
            apiUrl: 'https://h2eaux-dashboard.preview.emergentagent.com/api',
            version: '2.0.0',
            autoUpdate: true
        };
        
        this.data = {
            clients: [],
            chantiers: [],
            calculsPac: [],
            fiches: [],
            documents: [],
            calendrier: [],
            meg: {},
            chat: []
        };
        
        this.state = {
            currentUser: null,
            currentModule: 'dashboard'
        };
        
        this.init();
    }

    async init() {
        console.log('Initialisation H2EAUX GESTION v2.0.0');
        this.setupEventListeners();
        this.showLoginScreen();
    }

    showLoginScreen() {
        document.getElementById('app').style.display = 'none';
        document.getElementById('loginScreen').style.display = 'flex';
    }

    showApp() {
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('app').style.display = 'block';
        this.showModule('dashboard');
    }

    async login() {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        try {
            const response = await this.apiCall('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ username, password })
            });
            
            this.state.currentUser = response.user;
            localStorage.setItem('h2eaux_token', response.access_token);
            localStorage.setItem('h2eaux_user', JSON.stringify(response.user));
            
            this.showMessage('Connexion réussie', 'success');
            this.showApp();
            this.loadDashboardData();
        } catch (error) {
            console.error('Login error:', error);
            this.showMessage('Erreur de connexion: ' + error.message, 'error');
        }
    }

    async apiCall(endpoint, options = {}) {
        const token = localStorage.getItem('h2eaux_token');
        const defaultOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` })
            }
        };

        const finalOptions = { ...defaultOptions, ...options };
        const url = this.config.apiUrl + endpoint;

        try {
            const response = await fetch(url, finalOptions);
            
            if (response.status === 401) {
                this.logout();
                throw new Error('Session expirée');
            }
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API call error:', error);
            throw error;
        }
    }

    showMessage(message, type = 'info') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message message-${type}`;
        messageDiv.textContent = message;
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 10000;
            max-width: 300px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        
        switch(type) {
            case 'success': messageDiv.style.backgroundColor = '#4CAF50'; break;
            case 'error': messageDiv.style.backgroundColor = '#f44336'; break;
            case 'warning': messageDiv.style.backgroundColor = '#ff9800'; break;
            default: messageDiv.style.backgroundColor = '#2196F3'; break;
        }
        
        document.body.appendChild(messageDiv);
        setTimeout(() => messageDiv.remove(), 5000);
    }

    setupEventListeners() {
        // Login form
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.login();
        });

        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const module = item.dataset.module;
                this.showModule(module);
            });
        });

        // Logout
        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.logout();
        });
    }

    showModule(moduleId) {
        // Hide all modules
        document.querySelectorAll('.module').forEach(m => m.style.display = 'none');
        
        // Show selected module
        const moduleEl = document.getElementById(moduleId + 'Module');
        if (moduleEl) {
            moduleEl.style.display = 'block';
        }
        
        // Update navigation
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        const activeNav = document.querySelector(`[data-module="${moduleId}"]`);
        if (activeNav) activeNav.classList.add('active');
        
        this.state.currentModule = moduleId;
        this.loadModuleData(moduleId);
    }

    loadModuleData(moduleId) {
        switch (moduleId) {
            case 'dashboard':
                this.loadDashboardData();
                break;
            case 'clients':
                this.loadClients();
                break;
            case 'chantiers':
                this.loadChantiers();
                break;
            case 'calculs-pac':
                this.loadCalculsPac();
                break;
            case 'fiches':
                this.loadFiches();
                break;
        }
    }

    async loadDashboardData() {
        try {
            const [clients, chantiers, calculs] = await Promise.all([
                this.apiCall('/clients'),
                this.apiCall('/chantiers'),
                this.apiCall('/calculs-pac')
            ]);
            
            document.getElementById('totalClients').textContent = clients.length;
            document.getElementById('totalChantiers').textContent = chantiers.length;
            document.getElementById('totalCalculs').textContent = calculs.length;
            
            // Statistiques chantiers par statut
            const chantiersEnCours = chantiers.filter(c => c.statut === 'en_cours').length;
            document.getElementById('chantiersEnCours').textContent = chantiersEnCours;
            
        } catch (error) {
            console.error('Error loading dashboard:', error);
        }
    }

    async loadClients() {
        try {
            const clients = await this.apiCall('/clients');
            this.data.clients = clients;
            this.renderClients();
        } catch (error) {
            console.error('Error loading clients:', error);
            this.showMessage('Erreur lors du chargement des clients', 'error');
        }
    }

    renderClients() {
        const container = document.getElementById('clientsList');
        
        if (this.data.clients.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">👥</div>
                    <h3>Aucun client</h3>
                    <p>Commencez par ajouter votre premier client</p>
                    <button class="btn-primary" onclick="app.showAddClientModal()">+ Nouveau Client</button>
                </div>
            `;
            return;
        }

        container.innerHTML = this.data.clients.map(client => `
            <div class="item-card">
                <div class="item-header">
                    <div class="item-title">👤 ${client.nom} ${client.prenom}</div>
                    <div class="item-actions">
                        <button class="btn-edit" onclick="app.editClient('${client.id}')">Modifier</button>
                        <button class="btn-delete" onclick="app.deleteClient('${client.id}', '${client.nom}')">Supprimer</button>
                    </div>
                </div>
                <div class="item-info">
                    <div class="item-detail">📞 ${client.telephone}</div>
                    <div class="item-detail">📧 ${client.email}</div>
                    <div class="item-detail">📍 ${client.ville}</div>
                    <div class="item-detail">📅 Créé le ${this.formatDate(client.created_at)}</div>
                </div>
            </div>
        `).join('');
    }

    async loadFiches() {
        try {
            const fiches = await this.apiCall('/fiches-sdb');
            this.data.fiches = fiches;
            this.renderFiches();
        } catch (error) {
            console.error('Error loading fiches:', error);
            this.showMessage('Erreur lors du chargement des fiches', 'error');
        }
    }

    renderFiches() {
        const container = document.getElementById('fichesList');
        
        if (this.data.fiches.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📋</div>
                    <h3>Aucune fiche de relevé</h3>
                    <p>Commencez par créer votre première fiche de chantier avec plan 2D</p>
                    <button class="btn-primary" onclick="app.showAddFicheModal()">+ Nouvelle Fiche</button>
                </div>
            `;
            return;
        }

        container.innerHTML = this.data.fiches.map(fiche => `
            <div class="item-card">
                <div class="item-header">
                    <div class="item-title">📋 ${fiche.nom}</div>
                    <div class="item-actions">
                        <button class="btn-view" onclick="app.openFiche('${fiche.id}')">Ouvrir</button>
                        <button class="btn-edit" onclick="app.editFiche('${fiche.id}')">Modifier</button>
                        <button class="btn-delete" onclick="app.deleteFiche('${fiche.id}', '${fiche.nom}')">Supprimer</button>
                    </div>
                </div>
                <div class="item-info">
                    <div class="item-detail">👤 Client: ${fiche.client_nom}</div>
                    <div class="item-detail">📅 Date RDV: ${fiche.date_rdv || 'Non définie'}</div>
                    <div class="item-detail">🔧 Type: ${fiche.type_intervention || 'Visite technique'}</div>
                    <div class="item-detail">📅 Créé le ${this.formatDate(fiche.created_at)}</div>
                </div>
            </div>
        `).join('');
    }

    showAddFicheModal() {
        const modal = `
            <div id="ficheModal" class="modal" style="display: block;">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>Nouvelle Fiche de Relevé</h2>
                        <button class="btn-close" onclick="app.closeFicheModal()">&times;</button>
                    </div>
                    <form id="ficheForm" onsubmit="app.createFiche(event)">
                        <div class="form-group">
                            <label>Nom de la fiche</label>
                            <input type="text" name="nom" required placeholder="Ex: Relevé chantier Dupont">
                        </div>
                        <div class="form-group">
                            <label>Client</label>
                            <input type="text" name="client_nom" placeholder="Nom du client">
                        </div>
                        <div class="form-group">
                            <label>Adresse</label>
                            <textarea name="adresse" placeholder="Adresse du chantier"></textarea>
                        </div>
                        <div class="form-group">
                            <label>Type d'intervention</label>
                            <select name="type_intervention">
                                <option value="visite_technique">Visite Technique</option>
                                <option value="releve_existant">Relevé Existant</option>
                                <option value="installation">Installation</option>
                                <option value="maintenance">Maintenance</option>
                            </select>
                        </div>
                        <div class="modal-actions">
                            <button type="button" class="btn-secondary" onclick="app.closeFicheModal()">Annuler</button>
                            <button type="submit" class="btn-primary">Créer la fiche</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        document.getElementById('modals').innerHTML = modal;
    }

    async createFiche(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const ficheData = Object.fromEntries(formData.entries());
        
        try {
            const newFiche = await this.apiCall('/fiches-sdb', {
                method: 'POST',
                body: JSON.stringify(ficheData)
            });
            
            this.showMessage('Fiche créée avec succès', 'success');
            this.closeFicheModal();
            this.loadFiches();
            
            // Ouvrir la fiche pour édition complète
            setTimeout(() => this.openFiche(newFiche.id), 500);
        } catch (error) {
            console.error('Error creating fiche:', error);
            this.showMessage('Erreur lors de la création: ' + error.message, 'error');
        }
    }

    openFiche(id) {
        const fiche = this.data.fiches.find(f => f.id === id);
        if (!fiche) return;
        
        this.showFicheEditor(fiche);
    }

    showFicheEditor(fiche) {
        const editorModal = this.createFicheEditor(fiche);
        document.getElementById('modals').innerHTML = editorModal;
        
        // Initialize tabs
        this.initializeFicheTabs();
        
        // Load form data
        this.loadFicheFormData(fiche);
    }

    createFicheEditor(fiche) {
        return `
            <div id="ficheEditor" class="modal modal-fullscreen" style="display: block;">
                <div class="modal-content fiche-editor">
                    <div class="fiche-header">
                        <h2>📋 Fiche: ${fiche.nom}</h2>
                        <div class="fiche-actions">
                            <button class="btn-secondary" onclick="app.saveFiche()">💾 Enregistrer</button>
                            <button class="btn-close" onclick="app.closeFicheEditor()">✕</button>
                        </div>
                    </div>

                    <div class="fiche-tabs">
                        <button class="tab-btn active" data-tab="general" onclick="app.switchFicheTab('general')">1. Général</button>
                        <button class="tab-btn" data-tab="client" onclick="app.switchFicheTab('client')">2. Client</button>
                        <button class="tab-btn" data-tab="logement" onclick="app.switchFicheTab('logement')">3. Logement</button>
                        <button class="tab-btn" data-tab="existant" onclick="app.switchFicheTab('existant')">4. Existant</button>
                        <button class="tab-btn" data-tab="besoins" onclick="app.switchFicheTab('besoins')">5. Besoins</button>
                        <button class="tab-btn" data-tab="technique" onclick="app.switchFicheTab('technique')">6. Technique</button>
                        <button class="tab-btn plan-tab" data-tab="plan" onclick="app.switchFicheTab('plan')">7. 📐 Plan 2D</button>
                        <button class="tab-btn" data-tab="notes" onclick="app.switchFicheTab('notes')">8. Notes</button>
                    </div>

                    <div class="fiche-content">
                        ${this.createFicheTabContent(fiche)}
                    </div>
                </div>
            </div>
        `;
    }

    createFicheTabContent(fiche) {
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

            <!-- ONGLET 7: PLAN 2D -->
            <div class="tab-content" data-tab="plan">
                <div class="plan-container">
                    <div class="plan-toolbar">
                        <div class="tool-group">
                            <button class="tool-btn active" data-tool="select" onclick="app.selectPlanTool('select')" title="Sélectionner">👆</button>
                            <button class="tool-btn" data-tool="draw" onclick="app.selectPlanTool('draw')" title="Dessiner">✏️</button>
                            <button class="tool-btn" data-tool="room" onclick="app.selectPlanTool('room')" title="Ajouter pièce">🏠</button>
                            <button class="tool-btn" data-tool="measure" onclick="app.selectPlanTool('measure')" title="Coter">📏</button>
                        </div>
                        <div class="tool-group">
                            <button class="tool-btn" onclick="app.clearPlan()" title="Effacer tout">🗑️</button>
                            <button class="tool-btn" onclick="app.undoPlan()" title="Annuler">↶</button>
                        </div>
                        <div class="scale-control">
                            <label>Échelle:</label>
                            <select id="planScale" onchange="app.changeScale()">
                                <option value="50">1:50</option>
                                <option value="100" selected>1:100</option>
                                <option value="200">1:200</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="plan-workspace">
                        <canvas id="planCanvas" width="800" height="600"></canvas>
                    </div>
                    
                    <div class="plan-info">
                        <div class="plan-measurements" id="planMeasurements">
                            <h4>Mesures</h4>
                            <div id="measurementsList">Aucune mesure</div>
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
                    <div class="form-group">
                        <label>Estimation budget final</label>
                        <input type="text" id="budgetFinal" value="${fiche?.budget_final || ''}" placeholder="Ex: 18500€">
                    </div>
                    <div class="form-group full-width">
                        <label>Notes complémentaires</label>
                        <textarea id="notesComplementaires" placeholder="Informations diverses..." rows="4">${fiche?.notes || ''}</textarea>
                    </div>
                </div>
            </div>
        `;
    }

    // Plan 2D functions
    selectPlanTool(tool) {
        document.querySelectorAll('.tool-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-tool="${tool}"]`).classList.add('active');
        this.currentPlanTool = tool;
    }

    clearPlan() {
        if (confirm('Effacer tout le plan ?')) {
            const canvas = document.getElementById('planCanvas');
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            this.drawGrid();
        }
    }

    drawGrid() {
        const canvas = document.getElementById('planCanvas');
        const ctx = canvas.getContext('2d');
        const gridSize = 20;
        
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
    }

    initializeFicheTabs() {
        // Setup tab switching
        this.currentFiche = null;
        this.currentPlanTool = 'select';
    }

    switchFicheTab(tabName) {
        // Switch tabs
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        document.querySelector(`.tab-content[data-tab="${tabName}"]`).classList.add('active');
        
        // Initialize plan canvas if switching to plan tab
        if (tabName === 'plan') {
            setTimeout(() => this.initializePlanCanvas(), 100);
        }
    }

    initializePlanCanvas() {
        const canvas = document.getElementById('planCanvas');
        if (!canvas) return;
        
        this.drawGrid();
        
        // Load existing plan data if available
        if (this.currentFiche && this.currentFiche.plan_data) {
            try {
                const planData = JSON.parse(this.currentFiche.plan_data);
                this.loadPlanData(planData);
            } catch (e) {
                console.error('Error loading plan data:', e);
            }
        }
    }

    loadFicheFormData(fiche) {
        this.currentFiche = fiche;
        // Form data is already loaded in the HTML creation
    }

    async saveFiche() {
        if (!this.currentFiche) return;
        
        const ficheData = this.collectFicheData();
        
        try {
            await this.apiCall(`/fiches-sdb/${this.currentFiche.id}`, {
                method: 'PUT',
                body: JSON.stringify(ficheData)
            });
            
            this.showMessage('Fiche mise à jour avec succès', 'success');
            this.loadFiches();
        } catch (error) {
            console.error('Error saving fiche:', error);
            this.showMessage('Erreur lors de la sauvegarde: ' + error.message, 'error');
        }
    }

    collectFicheData() {
        // Collect form data from all tabs
        const formData = {
            nom: document.getElementById('ficheNom')?.value || '',
            client_nom: document.getElementById('clientNom')?.value || '',
            adresse: document.getElementById('clientAdresse')?.value || '',
            telephone: document.getElementById('clientTelephone')?.value || '',
            email: document.getElementById('clientEmail')?.value || '',
            date_rdv: document.getElementById('ficheDate')?.value || '',
            type_intervention: document.getElementById('ficheType')?.value || 'visite_technique',
            statut: document.getElementById('ficheStatut')?.value || 'planifie',
            budget_estime: document.getElementById('budgetIndicatif')?.value || '',
            nb_personnes: parseInt(document.getElementById('nbPersonnes')?.value) || 1,
            solution_recommandee: document.getElementById('solutionRecommandee')?.value || '',
            budget_final: document.getElementById('budgetFinal')?.value || '',
            notes: document.getElementById('notesComplementaires')?.value || '',
            plan_data: JSON.stringify({ elements: [], scale: 100 }) // Simplified plan data
        };
        
        return formData;
    }

    closeFicheModal() {
        document.getElementById('modals').innerHTML = '';
    }

    closeFicheEditor() {
        document.getElementById('modals').innerHTML = '';
        this.currentFiche = null;
    }

    formatDate(dateString) {
        if (!dateString) return 'Date inconnue';
        try {
            return new Date(dateString).toLocaleDateString('fr-FR');
        } catch (e) {
            return 'Date invalide';
        }
    }

    logout() {
        localStorage.removeItem('h2eaux_token');
        localStorage.removeItem('h2eaux_user');
        this.state.currentUser = null;
        this.showLoginScreen();
    }
}

// Initialize the application
window.app = new H2EAUXGestion();