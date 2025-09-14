// ===== CALENDRIER MODULE =====
window.calendrier = {
    data: [],
    currentView: 'month',
    currentDate: new Date(),

    async load() {
        try {
            // Load events/appointments
            this.data = await this.loadEvents();
            this.render();
        } catch (error) {
            console.error('Error loading calendar:', error);
            app.showMessage('Erreur lors du chargement du calendrier', 'error');
            this.data = [];
            this.render();
        }
    },

    async loadEvents() {
        // For now, return mock data - will be replaced with real API call
        return [
            {
                id: '1',
                title: 'Visite technique - Dupont',
                date: new Date().toISOString().split('T')[0],
                time: '09:00',
                type: 'visite_technique',
                client: 'M. Dupont',
                adresse: '123 rue de la Paix, Paris',
                status: 'confirme'
            },
            {
                id: '2',
                title: 'Installation PAC - Martin',
                date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
                time: '14:00',
                type: 'installation',
                client: 'Mme Martin',
                adresse: '45 avenue des Champs, Lyon',
                status: 'planifie'
            }
        ];
    },

    render() {
        const container = document.getElementById('calendrierView');
        
        switch (this.currentView) {
            case 'month':
                this.renderMonthView(container);
                break;
            case 'week':
                this.renderWeekView(container);
                break;
            case 'day':
                this.renderDayView(container);
                break;
        }
    },

    renderMonthView(container) {
        const monthGrid = this.generateMonthGrid();
        
        container.innerHTML = `
            <div class="calendar-header">
                <button class="nav-btn" onclick="calendrier.previousMonth()">‹</button>
                <h3>${this.getMonthName(this.currentDate.getMonth())} ${this.currentDate.getFullYear()}</h3>
                <button class="nav-btn" onclick="calendrier.nextMonth()">›</button>
            </div>
            <div class="calendar-grid">
                <div class="calendar-weekdays">
                    <div class="weekday">Lun</div>
                    <div class="weekday">Mar</div>
                    <div class="weekday">Mer</div>
                    <div class="weekday">Jeu</div>
                    <div class="weekday">Ven</div>
                    <div class="weekday">Sam</div>
                    <div class="weekday">Dim</div>
                </div>
                <div class="calendar-days">
                    ${monthGrid.map(day => this.renderDay(day)).join('')}
                </div>
            </div>
        `;
    },

    renderWeekView(container) {
        container.innerHTML = `
            <div class="calendar-header">
                <button class="nav-btn" onclick="calendrier.previousWeek()">‹</button>
                <h3>Semaine du ${this.getWeekRange()}</h3>
                <button class="nav-btn" onclick="calendrier.nextWeek()">›</button>
            </div>
            <div class="week-view">
                <div class="time-column">
                    ${this.generateTimeSlots().map(time => `<div class="time-slot">${time}</div>`).join('')}
                </div>
                <div class="days-columns">
                    ${this.getWeekDays().map(day => this.renderWeekDay(day)).join('')}
                </div>
            </div>
        `;
    },

    renderDayView(container) {
        const dayEvents = this.getEventsForDate(this.currentDate);
        
        container.innerHTML = `
            <div class="calendar-header">
                <button class="nav-btn" onclick="calendrier.previousDay()">‹</button>
                <h3>${this.formatDate(this.currentDate)}</h3>
                <button class="nav-btn" onclick="calendrier.nextDay()">›</button>
            </div>
            <div class="day-view">
                <div class="day-schedule">
                    ${this.generateTimeSlots().map(time => `
                        <div class="time-slot">
                            <div class="time-label">${time}</div>
                            <div class="time-content">
                                ${this.getEventsForTime(dayEvents, time).map(event => `
                                    <div class="event-item ${event.type}" onclick="calendrier.viewEvent('${event.id}')">
                                        <div class="event-title">${event.title}</div>
                                        <div class="event-details">${event.client}</div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    },

    generateMonthGrid() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDate = new Date(firstDay);
        
        // Start from Monday
        startDate.setDate(startDate.getDate() - (startDate.getDay() + 6) % 7);
        
        const days = [];
        const current = new Date(startDate);
        
        while (current <= lastDay || days.length < 42) {
            days.push({
                date: new Date(current),
                isCurrentMonth: current.getMonth() === month,
                isToday: this.isToday(current),
                events: this.getEventsForDate(current)
            });
            current.setDate(current.getDate() + 1);
            
            if (days.length >= 42) break;
        }
        
        return days;
    },

    renderDay(day) {
        const dayClass = [
            'calendar-day',
            day.isCurrentMonth ? 'current-month' : 'other-month',
            day.isToday ? 'today' : '',
            day.events.length > 0 ? 'has-events' : ''
        ].filter(Boolean).join(' ');

        return `
            <div class="${dayClass}" onclick="calendrier.selectDay('${day.date.toISOString()}')">
                <div class="day-number">${day.date.getDate()}</div>
                <div class="day-events">
                    ${day.events.slice(0, 3).map(event => `
                        <div class="event-dot ${event.type}" title="${event.title}"></div>
                    `).join('')}
                    ${day.events.length > 3 ? `<div class="more-events">+${day.events.length - 3}</div>` : ''}
                </div>
            </div>
        `;
    },

    changeView(view) {
        this.currentView = view;
        
        // Update view buttons
        document.querySelectorAll('.view-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-view="${view}"]`).classList.add('active');
        
        this.render();
    },

    previousMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        this.render();
    },

    nextMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        this.render();
    },

    previousWeek() {
        this.currentDate.setDate(this.currentDate.getDate() - 7);
        this.render();
    },

    nextWeek() {
        this.currentDate.setDate(this.currentDate.getDate() + 7);
        this.render();
    },

    previousDay() {
        this.currentDate.setDate(this.currentDate.getDate() - 1);
        this.render();
    },

    nextDay() {
        this.currentDate.setDate(this.currentDate.getDate() + 1);
        this.render();
    },

    getEventsForDate(date) {
        const dateString = date.toISOString().split('T')[0];
        return this.data.filter(event => event.date === dateString);
    },

    getEventsForTime(events, time) {
        return events.filter(event => event.time.startsWith(time.split(':')[0]));
    },

    generateTimeSlots() {
        const slots = [];
        for (let hour = 8; hour <= 18; hour++) {
            slots.push(`${hour.toString().padStart(2, '0')}:00`);
        }
        return slots;
    },

    getMonthName(monthIndex) {
        const months = [
            'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
            'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
        ];
        return months[monthIndex];
    },

    formatDate(date) {
        return date.toLocaleDateString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    },

    isToday(date) {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    },

    showAddEventModal() {
        const modal = this.createEventModal();
        document.getElementById('modals').innerHTML = modal;
        document.getElementById('eventModal').style.display = 'block';
    },

    createEventModal(event = null) {
        return `
            <div id="eventModal" class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>${event ? 'Modifier RDV' : 'Nouveau Rendez-vous'}</h2>
                        <button class="btn-close" onclick="calendrier.closeModal()">&times;</button>
                    </div>
                    <form id="eventForm" onsubmit="calendrier.handleSubmit(event)">
                        <div class="form-group">
                            <label>Titre</label>
                            <input type="text" name="title" value="${event?.title || ''}" required placeholder="Ex: Visite technique">
                        </div>
                        <div class="form-group">
                            <label>Type</label>
                            <select name="type" required>
                                <option value="visite_technique" ${event?.type === 'visite_technique' ? 'selected' : ''}>Visite Technique</option>
                                <option value="releve_chantier" ${event?.type === 'releve_chantier' ? 'selected' : ''}>Relevé Chantier</option>
                                <option value="installation" ${event?.type === 'installation' ? 'selected' : ''}>Installation</option>
                                <option value="maintenance" ${event?.type === 'maintenance' ? 'selected' : ''}>Maintenance</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Date</label>
                            <input type="date" name="date" value="${event?.date || new Date().toISOString().split('T')[0]}" required>
                        </div>
                        <div class="form-group">
                            <label>Heure</label>
                            <input type="time" name="time" value="${event?.time || '09:00'}" required>
                        </div>
                        <div class="form-group">
                            <label>Client</label>
                            <input type="text" name="client" value="${event?.client || ''}" required placeholder="Nom du client">
                        </div>
                        <div class="form-group">
                            <label>Adresse</label>
                            <textarea name="adresse" placeholder="Adresse complète">${event?.adresse || ''}</textarea>
                        </div>
                        <div class="form-group">
                            <label>Statut</label>
                            <select name="status">
                                <option value="planifie" ${event?.status === 'planifie' ? 'selected' : ''}>Planifié</option>
                                <option value="confirme" ${event?.status === 'confirme' ? 'selected' : ''}>Confirmé</option>
                                <option value="en_cours" ${event?.status === 'en_cours' ? 'selected' : ''}>En cours</option>
                                <option value="termine" ${event?.status === 'termine' ? 'selected' : ''}>Terminé</option>
                                <option value="annule" ${event?.status === 'annule' ? 'selected' : ''}>Annulé</option>
                            </select>
                        </div>
                        <div class="modal-actions">
                            <button type="button" class="btn-secondary" onclick="calendrier.closeModal()">Annuler</button>
                            <button type="submit" class="btn-primary">${event ? 'Mettre à jour' : 'Créer'}</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    },

    async handleSubmit(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const eventData = Object.fromEntries(formData.entries());
        eventData.id = Date.now().toString();

        try {
            // For now, just add to local data - will be replaced with API call
            this.data.push(eventData);
            app.showMessage('Rendez-vous créé avec succès', 'success');
            this.closeModal();
            this.render();
        } catch (error) {
            console.error('Error saving event:', error);
            app.showMessage('Erreur lors de la sauvegarde: ' + error.message, 'error');
        }
    },

    closeModal() {
        const modal = document.getElementById('eventModal');
        if (modal) modal.style.display = 'none';
    }
};