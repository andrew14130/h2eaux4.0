// ===== SETTINGS MODULE =====
window.settings = {
    data: {
        company: {
            name: 'H2EAUX GESTION',
            slogan: 'PLOMBERIE • CLIMATISATION • CHAUFFAGE',
            logo: 'assets/logo.png'
        },
        users: []
    },

    async load() {
        await this.loadUsers();
        this.loadCompanySettings();
        this.setupEventListeners();
    },

    async loadUsers() {
        try {
            this.data.users = await app.apiCall('/users');
            this.renderUsers();
        } catch (error) {
            console.error('Error loading users:', error);
            app.showMessage('Erreur lors du chargement des utilisateurs', 'error');
        }
    },

    loadCompanySettings() {
        // Load from localStorage or use defaults
        const saved = localStorage.getItem('h2eaux_company_settings');
        if (saved) {
            this.data.company = { ...this.data.company, ...JSON.parse(saved) };
        }

        // Update form values
        document.getElementById('companyName').value = this.data.company.name;
        document.getElementById('companySlogan').value = this.data.company.slogan;
        document.getElementById('logoPreview').src = this.data.company.logo;
    },

    setupEventListeners() {
        // Company form
        document.getElementById('companyForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveCompanySettings();
        });

        // Auto-update setting
        const autoUpdateCheckbox = document.getElementById('autoUpdate');
        autoUpdateCheckbox.checked = app.config.autoUpdate;
        autoUpdateCheckbox.addEventListener('change', (e) => {
            app.config.autoUpdate = e.target.checked;
            localStorage.setItem('h2eaux_config', JSON.stringify(app.config));
        });
    },

    saveCompanySettings() {
        this.data.company.name = document.getElementById('companyName').value;
        this.data.company.slogan = document.getElementById('companySlogan').value;

        // Save to localStorage
        localStorage.setItem('h2eaux_company_settings', JSON.stringify(this.data.company));

        // Update logos throughout the app
        this.updateLogosInApp();

        app.showMessage('Paramètres de l\'entreprise sauvegardés', 'success');
    },

    async uploadLogo() {
        const fileInput = document.getElementById('logoUpload');
        const file = fileInput.files[0];
        
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            app.showMessage('Veuillez sélectionner un fichier image', 'error');
            return;
        }

        // Validate file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            app.showMessage('Le fichier est trop volumineux (max 2MB)', 'error');
            return;
        }

        try {
            // Convert to base64
            const reader = new FileReader();
            reader.onload = (e) => {
                const base64 = e.target.result;
                
                // Update preview
                document.getElementById('logoPreview').src = base64;
                
                // Save to company settings
                this.data.company.logo = base64;
                
                // Save to localStorage
                localStorage.setItem('h2eaux_company_settings', JSON.stringify(this.data.company));
                
                // Update logos throughout the app
                this.updateLogosInApp();
                
                app.showMessage('Logo mis à jour avec succès', 'success');
            };
            
            reader.readAsDataURL(file);
        } catch (error) {
            console.error('Error uploading logo:', error);
            app.showMessage('Erreur lors du téléchargement du logo', 'error');
        }
    },

    updateLogosInApp() {
        // Update all logo elements in the app
        const logoElements = [
            'loadingLogo',
            'loginLogo', 
            'headerLogo',
            'clientsLogo',
            'chantiersLogo',
            'calculsPacLogo'
        ];

        logoElements.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.src = this.data.company.logo;
                element.style.display = 'block';
            }
        });

        // Update company name and slogan
        document.querySelectorAll('.app-title, .loading-logo').forEach(el => {
            el.textContent = this.data.company.name;
        });

        document.querySelectorAll('.app-subtitle, .loading-subtitle').forEach(el => {
            el.textContent = this.data.company.slogan;
        });
    },

    renderUsers() {
        const container = document.getElementById('usersList');
        
        if (this.data.users.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">👥</div>
                    <h3>Aucun utilisateur</h3>
                    <p>Commencez par ajouter des utilisateurs</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.data.users.map(user => `
            <div class="user-card">
                <div class="user-info-card">
                    <div class="user-avatar">${user.username.charAt(0).toUpperCase()}</div>
                    <div>
                        <div style="font-weight: 600; color: var(--text);">${user.username}</div>
                        <div style="font-size: 0.9rem; color: var(--text-secondary);">
                            ${user.role === 'admin' ? 'Administrateur' : 'Employé'}
                        </div>
                    </div>
                </div>
                <div class="item-actions">
                    <button class="btn-edit" onclick="settings.showEditUserModal('${user.id}')">Modifier</button>
                    ${user.id !== app.state.currentUser?.id ? 
                        `<button class="btn-delete" onclick="settings.deleteUser('${user.id}', '${user.username}')">Supprimer</button>` 
                        : ''}
                </div>
            </div>
        `).join('');
    },

    showAddUserModal() {
        this.showUserModal('Nouvel Utilisateur');
    },

    showEditUserModal(userId) {
        const user = this.data.users.find(u => u.id === userId);
        if (user) {
            this.showUserModal('Modifier Utilisateur', user);
        }
    },

    showUserModal(title, user = null) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3 class="modal-title">${title}</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="userForm">
                        <div class="form-group">
                            <label>Nom d'utilisateur *</label>
                            <input type="text" id="userUsername" required value="${user?.username || ''}" ${user ? 'readonly' : ''}>
                        </div>
                        
                        ${!user ? `
                            <div class="form-group">
                                <label>Mot de passe *</label>
                                <input type="password" id="userPassword" required>
                            </div>
                        ` : ''}
                        
                        <div class="form-group">
                            <label>Rôle *</label>
                            <select id="userRole" onchange="settings.updatePermissionsDisplay()">
                                <option value="employee" ${user?.role === 'employee' ? 'selected' : ''}>Employé</option>
                                <option value="admin" ${user?.role === 'admin' ? 'selected' : ''}>Administrateur</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label>Permissions d'accès</label>
                            <div class="permissions-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.5rem; margin-top: 0.5rem;">
                                <label style="display: flex; align-items: center; gap: 0.5rem;">
                                    <input type="checkbox" id="perm_clients" ${user?.permissions?.clients ? 'checked' : ''}>
                                    👥 Clients
                                </label>
                                <label style="display: flex; align-items: center; gap: 0.5rem;">
                                    <input type="checkbox" id="perm_chantiers" ${user?.permissions?.chantiers ? 'checked' : ''}>
                                    🏗️ Chantiers
                                </label>
                                <label style="display: flex; align-items: center; gap: 0.5rem;">
                                    <input type="checkbox" id="perm_documents" ${user?.permissions?.documents ? 'checked' : ''}>
                                    📄 Documents
                                </label>
                                <label style="display: flex; align-items: center; gap: 0.5rem;">
                                    <input type="checkbox" id="perm_calculs_pac" ${user?.permissions?.calculs_pac ? 'checked' : ''}>
                                    🌡️ Calculs PAC
                                </label>
                                <label style="display: flex; align-items: center; gap: 0.5rem;">
                                    <input type="checkbox" id="perm_catalogues" ${user?.permissions?.catalogues ? 'checked' : ''}>
                                    📦 Catalogues
                                </label>
                                <label style="display: flex; align-items: center; gap: 0.5rem;">
                                    <input type="checkbox" id="perm_chat" ${user?.permissions?.chat ? 'checked' : ''}>
                                    💬 Chat
                                </label>
                                <label style="display: flex; align-items: center; gap: 0.5rem;">
                                    <input type="checkbox" id="perm_parametres" ${user?.permissions?.parametres ? 'checked' : ''}>
                                    ⚙️ Paramètres
                                </label>
                            </div>
                        </div>
                    </form>
                </div>
                <div class="modal-actions">
                    <button class="btn-secondary" onclick="this.closest('.modal').remove()">Annuler</button>
                    <button class="btn-primary" onclick="settings.saveUser(${user ? `'${user.id}'` : 'null'})">Enregistrer</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        
        // Setup permissions display
        setTimeout(() => {
            this.updatePermissionsDisplay();
        }, 100);

        // Focus first input
        setTimeout(() => {
            modal.querySelector('#userUsername').focus();
        }, 100);

        // Close on outside click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    },

    updatePermissionsDisplay() {
        const role = document.getElementById('userRole')?.value;
        const parametresCheckbox = document.getElementById('perm_parametres');
        
        if (role === 'admin') {
            // Admin has all permissions
            document.querySelectorAll('[id^="perm_"]').forEach(cb => {
                cb.checked = true;
            });
        } else {
            // Employee has all except parametres
            document.querySelectorAll('[id^="perm_"]').forEach(cb => {
                cb.checked = cb.id !== 'perm_parametres';
            });
        }
        
        // Parametres only for admin
        if (parametresCheckbox) {
            parametresCheckbox.disabled = role !== 'admin';
            if (role !== 'admin') {
                parametresCheckbox.checked = false;
            }
        }
    },

    async saveUser(userId = null) {
        const username = document.getElementById('userUsername').value.trim();
        const password = document.getElementById('userPassword')?.value;
        const role = document.getElementById('userRole').value;
        
        const permissions = {
            clients: document.getElementById('perm_clients').checked,
            chantiers: document.getElementById('perm_chantiers').checked,
            documents: document.getElementById('perm_documents').checked,
            calculs_pac: document.getElementById('perm_calculs_pac').checked,
            catalogues: document.getElementById('perm_catalogues').checked,
            chat: document.getElementById('perm_chat').checked,
            parametres: document.getElementById('perm_parametres').checked
        };

        if (!username) {
            app.showMessage('Le nom d\'utilisateur est obligatoire', 'error');
            return;
        }

        const userData = { username, role, permissions };
        if (!userId && password) {
            userData.password = password;
        }

        try {
            if (userId) {
                await app.apiCall(`/users/${userId}`, {
                    method: 'PUT',
                    body: JSON.stringify({ role, permissions })
                });
                app.showMessage('Utilisateur modifié avec succès', 'success');
            } else {
                if (!password) {
                    app.showMessage('Le mot de passe est obligatoire', 'error');
                    return;
                }
                await app.apiCall('/auth/register', {
                    method: 'POST',
                    body: JSON.stringify(userData)
                });
                app.showMessage('Utilisateur créé avec succès', 'success');
            }

            document.querySelector('.modal').remove();
            await this.loadUsers();
        } catch (error) {
            console.error('Error saving user:', error);
            app.showMessage('Erreur lors de la sauvegarde: ' + error.message, 'error');
        }
    },

    async deleteUser(userId, username) {
        if (!confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur "${username}" ?`)) {
            return;
        }

        try {
            await app.apiCall(`/users/${userId}`, { method: 'DELETE' });
            app.showMessage('Utilisateur supprimé avec succès', 'success');
            await this.loadUsers();
        } catch (error) {
            console.error('Error deleting user:', error);
            app.showMessage('Erreur lors de la suppression: ' + error.message, 'error');
        }
    },

    async checkUpdates() {
        const button = event.target;
        const originalText = button.textContent;
        
        button.textContent = 'Vérification...';
        button.disabled = true;

        try {
            // Simulate update check
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            document.getElementById('lastUpdateCheck').textContent = new Date().toLocaleDateString('fr-FR');
            app.showMessage('Application à jour (version ' + app.config.version + ')', 'success');
        } catch (error) {
            console.error('Update check failed:', error);
            app.showMessage('Erreur lors de la vérification des mises à jour', 'error');
        } finally {
            button.textContent = originalText;
            button.disabled = false;
        }
    }
};