// ===== PDF EXPORT MODULE =====
window.pdfExport = {
    
    // Get company info for PDF header
    getCompanyInfo() {
        const saved = localStorage.getItem('h2eaux_company_settings');
        const defaults = {
            name: 'H2EAUX GESTION',
            slogan: 'PLOMBERIE • CLIMATISATION • CHAUFFAGE',
            logo: null
        };
        
        return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
    },

    // Add company header to PDF
    async addHeader(doc, title) {
        const company = this.getCompanyInfo();
        
        // Add logo if available
        if (company.logo && company.logo.startsWith('data:image')) {
            try {
                doc.addImage(company.logo, 'PNG', 15, 15, 30, 15);
            } catch (error) {
                console.warn('Could not add logo to PDF:', error);
            }
        }
        
        // Company name
        doc.setFontSize(20);
        doc.setFont(undefined, 'bold');
        doc.text(company.name, company.logo ? 55 : 15, 25);
        
        // Company slogan
        doc.setFontSize(12);
        doc.setFont(undefined, 'normal');
        doc.text(company.slogan, company.logo ? 55 : 15, 32);
        
        // Document title
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text(title, 15, 50);
        
        // Date
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, 15, 57);
        
        // Line separator
        doc.setDrawColor(0, 122, 255);
        doc.setLineWidth(0.5);
        doc.line(15, 65, 195, 65);
        
        return 75; // Return Y position for content start
    },

    // Export single client
    async exportClient(client) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        let yPos = await this.addHeader(doc, 'Fiche Client');
        
        // Client info
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text(`${client.nom} ${client.prenom || ''}`, 15, yPos);
        yPos += 10;
        
        doc.setFontSize(11);
        doc.setFont(undefined, 'normal');
        
        if (client.email) {
            doc.text(`Email: ${client.email}`, 15, yPos);
            yPos += 7;
        }
        
        if (client.telephone) {
            doc.text(`Téléphone: ${this.formatPhone(client.telephone)}`, 15, yPos);
            yPos += 7;
        }
        
        if (client.adresse) {
            doc.text(`Adresse: ${client.adresse}`, 15, yPos);
            yPos += 7;
        }
        
        if (client.code_postal && client.ville) {
            doc.text(`Ville: ${client.code_postal} ${client.ville}`, 15, yPos);
            yPos += 7;
        }
        
        doc.text(`Créé le: ${app.formatDate(client.created_at)}`, 15, yPos);
        
        // Footer
        this.addFooter(doc);
        
        doc.save(`Client_${client.nom.replace(/\s/g, '_')}.pdf`);
    },

    // Export all clients
    async exportClients(clients) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        let yPos = await this.addHeader(doc, 'Liste des Clients');
        
        // Table data
        const tableData = clients.map(client => [
            `${client.nom} ${client.prenom || ''}`,
            client.email || '',
            this.formatPhone(client.telephone) || '',
            client.ville || '',
            app.formatDate(client.created_at)
        ]);
        
        doc.autoTable({
            head: [['Nom', 'Email', 'Téléphone', 'Ville', 'Créé le']],
            body: tableData,
            startY: yPos,
            styles: { fontSize: 10 },
            headStyles: { fillColor: [0, 122, 255] }
        });
        
        this.addFooter(doc);
        doc.save('Liste_Clients.pdf');
    },

    // Export single chantier
    async exportChantier(chantier) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        let yPos = await this.addHeader(doc, 'Fiche Chantier');
        
        // Chantier info
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text(chantier.nom, 15, yPos);
        yPos += 10;
        
        doc.setFontSize(11);
        doc.setFont(undefined, 'normal');
        
        doc.text(`Statut: ${this.getStatusLabel(chantier.statut)}`, 15, yPos);
        yPos += 7;
        
        if (chantier.client_nom) {
            doc.text(`Client: ${chantier.client_nom}`, 15, yPos);
            yPos += 7;
        }
        
        if (chantier.description) {
            doc.text(`Description: ${chantier.description}`, 15, yPos);
            yPos += 7;
        }
        
        if (chantier.adresse) {
            doc.text(`Adresse: ${chantier.adresse}`, 15, yPos);
            yPos += 7;
        }
        
        if (chantier.date_debut) {
            doc.text(`Date de début: ${app.formatDate(chantier.date_debut)}`, 15, yPos);
            yPos += 7;
        }
        
        if (chantier.date_fin_prevue) {
            doc.text(`Date de fin prévue: ${app.formatDate(chantier.date_fin_prevue)}`, 15, yPos);
            yPos += 7;
        }
        
        if (chantier.budget_estime) {
            doc.text(`Budget estimé: ${app.formatCurrency(chantier.budget_estime)}`, 15, yPos);
            yPos += 7;
        }
        
        doc.text(`Créé le: ${app.formatDate(chantier.created_at)}`, 15, yPos);
        
        this.addFooter(doc);
        doc.save(`Chantier_${chantier.nom.replace(/\s/g, '_')}.pdf`);
    },

    // Export all chantiers
    async exportChantiers(chantiers) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        let yPos = await this.addHeader(doc, 'Liste des Chantiers');
        
        const tableData = chantiers.map(chantier => [
            chantier.nom,
            this.getStatusLabel(chantier.statut),
            chantier.client_nom || '',
            chantier.budget_estime ? app.formatCurrency(chantier.budget_estime) : '',
            app.formatDate(chantier.created_at)
        ]);
        
        doc.autoTable({
            head: [['Nom', 'Statut', 'Client', 'Budget', 'Créé le']],
            body: tableData,
            startY: yPos,
            styles: { fontSize: 10 },
            headStyles: { fillColor: [0, 122, 255] }
        });
        
        this.addFooter(doc);
        doc.save('Liste_Chantiers.pdf');
    },

    // Export single calcul PAC
    async exportCalculPac(calcul) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        let yPos = await this.addHeader(doc, 'Calcul PAC');
        
        // Calcul info
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text(calcul.nom, 15, yPos);
        yPos += 10;
        
        doc.setFontSize(11);
        doc.setFont(undefined, 'normal');
        
        doc.text(`Type de PAC: ${calcul.type_pac === 'air-eau' ? 'Air/Eau' : 'Air/Air'}`, 15, yPos);
        yPos += 7;
        
        if (calcul.client_nom) {
            doc.text(`Client: ${calcul.client_nom}`, 15, yPos);
            yPos += 7;
        }
        
        if (calcul.zone_climatique) {
            doc.text(`Zone climatique: ${calcul.zone_climatique}`, 15, yPos);
            yPos += 7;
        }
        
        doc.text(`Surface totale: ${calcul.surface_totale} m²`, 15, yPos);
        yPos += 7;
        
        if (calcul.puissance_calculee) {
            doc.text(`Puissance calculée: ${calcul.puissance_calculee} kW`, 15, yPos);
            yPos += 10;
        }
        
        // Type-specific details
        if (calcul.type_pac === 'air-eau') {
            doc.setFont(undefined, 'bold');
            doc.text('Détails du calcul Air/Eau:', 15, yPos);
            yPos += 7;
            
            doc.setFont(undefined, 'normal');
            if (calcul.hauteur_plafond) {
                doc.text(`Hauteur sous plafond: ${calcul.hauteur_plafond} m`, 15, yPos);
                yPos += 7;
            }
            if (calcul.isolation) {
                doc.text(`Type d'isolation: ${calcul.isolation}`, 15, yPos);
                yPos += 7;
            }
            if (calcul.delta_t) {
                doc.text(`Delta T: ${calcul.delta_t}°C`, 15, yPos);
                yPos += 7;
            }
        } else if (calcul.pieces && calcul.pieces.length > 0) {
            doc.setFont(undefined, 'bold');
            doc.text('Détail des pièces:', 15, yPos);
            yPos += 7;
            
            doc.setFont(undefined, 'normal');
            calcul.pieces.forEach(piece => {
                doc.text(`• ${piece.nom}: ${piece.surface} m²`, 20, yPos);
                yPos += 6;
            });
        }
        
        yPos += 5;
        doc.text(`Créé le: ${app.formatDate(calcul.created_at)}`, 15, yPos);
        
        this.addFooter(doc);
        doc.save(`Calcul_PAC_${calcul.nom.replace(/\s/g, '_')}.pdf`);
    },

    // Export all calculs PAC
    async exportCalculsPac(calculs) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        let yPos = await this.addHeader(doc, 'Liste des Calculs PAC');
        
        const tableData = calculs.map(calcul => [
            calcul.nom,
            calcul.type_pac === 'air-eau' ? 'Air/Eau' : 'Air/Air',
            calcul.client_nom || '',
            `${calcul.surface_totale} m²`,
            calcul.puissance_calculee ? `${calcul.puissance_calculee} kW` : '',
            app.formatDate(calcul.created_at)
        ]);
        
        doc.autoTable({
            head: [['Nom', 'Type', 'Client', 'Surface', 'Puissance', 'Créé le']],
            body: tableData,
            startY: yPos,
            styles: { fontSize: 9 },
            headStyles: { fillColor: [0, 122, 255] }
        });
        
        this.addFooter(doc);
        doc.save('Liste_Calculs_PAC.pdf');
    },

    // Add footer to PDF
    addFooter(doc) {
        const pageHeight = doc.internal.pageSize.height;
        
        doc.setFontSize(8);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(128, 128, 128);
        
        doc.text('Généré par H2EAUX GESTION - Application de gestion pour plomberie, climatisation et chauffage', 15, pageHeight - 15);
        doc.text(`Page 1 - ${new Date().toLocaleDateString('fr-FR')} ${new Date().toLocaleTimeString('fr-FR')}`, 15, pageHeight - 10);
    },

    // Utility functions
    formatPhone(phone) {
        if (!phone) return '';
        return phone.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1.$2.$3.$4.$5');
    },

    getStatusLabel(status) {
        const labels = {
            'en_attente': 'En attente',
            'en_cours': 'En cours',
            'termine': 'Terminé',
            'facture': 'Facturé'
        };
        return labels[status] || status;
    }
};