// ===== MEG INTEGRATION MODULE =====
window.meg = {
    data: {
        importHistory: [],
        exportHistory: [],
        mappings: {}
    },

    async load() {
        try {
            // Load MEG integration data
            this.render();
        } catch (error) {
            console.error('Error loading MEG integration:', error);
            app.showMessage('Erreur lors du chargement MEG', 'error');
            this.render();
        }
    },

    render() {
        // MEG integration is already rendered in the HTML
        this.updateStatus();
        this.loadImportHistory();
        this.loadExportHistory();
    },

    updateStatus() {
        const statusEl = document.querySelector('#megModule .meg-status');
        if (statusEl) {
            statusEl.innerHTML = `
                <div class="status-item">
                    <span class="status-label">Dernière synchronisation:</span>
                    <span class="status-value">Jamais</span>
                </div>
                <div class="status-item">
                    <span class="status-label">Fichiers traités:</span>
                    <span class="status-value">${this.data.importHistory.length + this.data.exportHistory.length}</span>
                </div>
            `;
        }
    },

    loadImportHistory() {
        // Load import history from storage or API
        this.data.importHistory = JSON.parse(localStorage.getItem('meg_import_history') || '[]');
    },

    loadExportHistory() {
        // Load export history from storage or API
        this.data.exportHistory = JSON.parse(localStorage.getItem('meg_export_history') || '[]');
    },

    handleImport() {
        const fileInput = document.getElementById('megImportFile');
        const file = fileInput.files[0];
        
        if (!file) {
            app.showMessage('Veuillez sélectionner un fichier', 'error');
            return;
        }

        app.showMessage('Traitement du fichier MEG en cours...', 'info');

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                this.processImportFile(file, e.target.result);
            } catch (error) {
                console.error('Error processing MEG file:', error);
                app.showMessage('Erreur lors du traitement du fichier: ' + error.message, 'error');
            }
        };

        if (file.name.endsWith('.csv') || file.name.endsWith('.txt')) {
            reader.readAsText(file);
        } else if (file.name.endsWith('.xml')) {
            reader.readAsText(file);
        } else {
            app.showMessage('Format de fichier non supporté', 'error');
            return;
        }
    },

    processImportFile(file, content) {
        let processedData = [];
        
        try {
            if (file.name.endsWith('.csv') || file.name.endsWith('.txt')) {
                processedData = this.parseCSV(content);
            } else if (file.name.endsWith('.xml')) {
                processedData = this.parseXML(content);
            }

            // Process and import data
            this.importMEGData(processedData, file.name);
            
        } catch (error) {
            throw new Error('Erreur de parsing: ' + error.message);
        }
    },

    parseCSV(content) {
        const lines = content.split('\n');
        const headers = lines[0].split(';').map(h => h.trim());
        const data = [];

        for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim()) {
                const values = lines[i].split(';');
                const row = {};
                headers.forEach((header, index) => {
                    row[header] = values[index]?.trim() || '';
                });
                data.push(row);
            }
        }

        return data;
    },

    parseXML(content) {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(content, 'text/xml');
        const data = [];

        // Basic XML parsing - will need to be adapted based on MEG XML structure
        const items = xmlDoc.getElementsByTagName('client') || xmlDoc.getElementsByTagName('item');
        
        for (let item of items) {
            const obj = {};
            for (let attr of item.attributes) {
                obj[attr.name] = attr.value;
            }
            for (let child of item.children) {
                obj[child.tagName] = child.textContent;
            }
            data.push(obj);
        }

        return data;
    },

    async importMEGData(data, filename) {
        try {
            let importedCount = 0;
            let errorCount = 0;

            for (const item of data) {
                try {
                    // Map MEG fields to H2EAUX fields
                    const mappedData = this.mapMEGToH2EAUX(item);
                    
                    // Check if client already exists
                    const existingClients = await app.apiCall('/clients');
                    const exists = existingClients.find(c => 
                        c.nom.toLowerCase() === mappedData.nom.toLowerCase() &&
                        c.prenom.toLowerCase() === mappedData.prenom.toLowerCase()
                    );

                    if (!exists) {
                        await app.apiCall('/clients', {
                            method: 'POST',
                            body: JSON.stringify(mappedData)
                        });
                        importedCount++;
                    }
                } catch (error) {
                    console.error('Error importing item:', error);
                    errorCount++;
                }
            }

            // Record import history
            const importRecord = {
                id: Date.now(),
                filename: filename,
                date: new Date().toISOString(),
                total: data.length,
                imported: importedCount,
                errors: errorCount,
                type: 'import'
            };

            this.data.importHistory.unshift(importRecord);
            localStorage.setItem('meg_import_history', JSON.stringify(this.data.importHistory));

            app.showMessage(`Import terminé: ${importedCount} clients importés, ${errorCount} erreurs`, 'success');
            this.updateStatus();

        } catch (error) {
            throw new Error('Erreur lors de l\'import: ' + error.message);
        }
    },

    mapMEGToH2EAUX(megData) {
        // Default mapping - can be customized
        return {
            nom: megData.nom || megData.lastname || megData.client_nom || '',
            prenom: megData.prenom || megData.firstname || megData.client_prenom || '',
            telephone: megData.telephone || megData.tel || megData.phone || '',
            email: megData.email || megData.mail || '',
            adresse: megData.adresse || megData.address || '',
            ville: megData.ville || megData.city || '',
            code_postal: megData.code_postal || megData.cp || megData.zip || '',
            notes: 'Importé depuis MEG - ' + new Date().toLocaleDateString()
        };
    },

    async exportClients() {
        try {
            app.showMessage('Export des clients vers MEG...', 'info');
            
            const clients = await app.apiCall('/clients');
            const megData = clients.map(client => this.mapH2EAUXToMEG(client));
            
            this.downloadCSV(megData, 'h2eaux_clients_export.csv');
            
            // Record export history
            const exportRecord = {
                id: Date.now(),
                filename: 'h2eaux_clients_export.csv',
                date: new Date().toISOString(),
                total: clients.length,
                type: 'export_clients'
            };
            
            this.data.exportHistory.unshift(exportRecord);
            localStorage.setItem('meg_export_history', JSON.stringify(this.data.exportHistory));
            
            app.showMessage(`${clients.length} clients exportés avec succès`, 'success');
            this.updateStatus();
            
        } catch (error) {
            console.error('Error exporting clients:', error);
            app.showMessage('Erreur lors de l\'export: ' + error.message, 'error');
        }
    },

    async exportChantiers() {
        try {
            app.showMessage('Export des chantiers vers MEG...', 'info');
            
            const chantiers = await app.apiCall('/chantiers');
            const megData = chantiers.map(chantier => this.mapChantierToMEG(chantier));
            
            this.downloadCSV(megData, 'h2eaux_chantiers_export.csv');
            
            const exportRecord = {
                id: Date.now(),
                filename: 'h2eaux_chantiers_export.csv',
                date: new Date().toISOString(),
                total: chantiers.length,
                type: 'export_chantiers'
            };
            
            this.data.exportHistory.unshift(exportRecord);
            localStorage.setItem('meg_export_history', JSON.stringify(this.data.exportHistory));
            
            app.showMessage(`${chantiers.length} chantiers exportés avec succès`, 'success');
            this.updateStatus();
            
        } catch (error) {
            console.error('Error exporting chantiers:', error);
            app.showMessage('Erreur lors de l\'export: ' + error.message, 'error');
        }
    },

    async exportAll() {
        try {
            app.showMessage('Export complet vers MEG...', 'info');
            
            const [clients, chantiers] = await Promise.all([
                app.apiCall('/clients'),
                app.apiCall('/chantiers')
            ]);
            
            // Export clients
            const clientsMegData = clients.map(client => this.mapH2EAUXToMEG(client));
            this.downloadCSV(clientsMegData, 'h2eaux_clients_complet.csv');
            
            // Export chantiers
            const chantiersMegData = chantiers.map(chantier => this.mapChantierToMEG(chantier));
            this.downloadCSV(chantiersMegData, 'h2eaux_chantiers_complet.csv');
            
            const exportRecord = {
                id: Date.now(),
                filename: 'Export complet',
                date: new Date().toISOString(),
                total: clients.length + chantiers.length,
                type: 'export_all'
            };
            
            this.data.exportHistory.unshift(exportRecord);
            localStorage.setItem('meg_export_history', JSON.stringify(this.data.exportHistory));
            
            app.showMessage(`Export complet terminé: ${clients.length} clients + ${chantiers.length} chantiers`, 'success');
            this.updateStatus();
            
        } catch (error) {
            console.error('Error in complete export:', error);
            app.showMessage('Erreur lors de l\'export complet: ' + error.message, 'error');
        }
    },

    mapH2EAUXToMEG(client) {
        return {
            nom: client.nom,
            prenom: client.prenom,
            telephone: client.telephone,
            email: client.email,
            adresse: client.adresse,
            ville: client.ville,
            code_postal: client.code_postal,
            type_chauffage: client.type_chauffage,
            date_creation: client.created_at
        };
    },

    mapChantierToMEG(chantier) {
        return {
            nom_chantier: chantier.nom,
            client: chantier.client_nom,
            adresse: chantier.adresse,
            ville: chantier.ville,
            type_travaux: chantier.type_travaux,
            statut: chantier.statut,
            date_debut: chantier.date_debut,
            date_fin: chantier.date_fin_prevue,
            budget: chantier.budget_estime,
            date_creation: chantier.created_at
        };
    },

    downloadCSV(data, filename) {
        if (data.length === 0) return;
        
        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(';'),
            ...data.map(row => headers.map(header => row[header] || '').join(';'))
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};