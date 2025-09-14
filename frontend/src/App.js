import React, { useState, useEffect } from 'react';
import './App.css';

const BACKEND_URL = 'https://h2eaux-gestion-1.preview.emergentagent.com';

function App() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Veuillez saisir votre nom d\'utilisateur et mot de passe');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      console.log('🔄 Tentative de connexion avec:', username);
      
      const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Connexion réussie:', data);
      
      setUser(data.user);
      localStorage.setItem('auth_token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
    } catch (error) {
      console.error('❌ Erreur login:', error);
      setError(`Erreur de connexion: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setUsername('');
    setPassword('');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
  };

  // Vérifier si l'utilisateur est déjà connecté
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  if (user) {
    return (
      <div className="App">
        <div className="dashboard">
          <div className="dashboard-header">
            <h1>H2EAUX GESTION</h1>
            <p className="subtitle">PLOMBERIE • CLIMATISATION • CHAUFFAGE</p>
            <div className="user-info">
              <p>Bienvenue <strong>{user.username}</strong></p>
              <p>Rôle: <span className="role">{user.role === 'admin' ? 'Administrateur' : 'Employé'}</span></p>
              <button onClick={handleLogout} className="logout-btn">Déconnexion</button>
            </div>
          </div>

          <div className="modules-grid">
            <div className="module-card">
              <div className="module-icon clients">👥</div>
              <h3>Clients</h3>
              <p>Gestion des clients MEG</p>
            </div>
            <div className="module-card">
              <div className="module-icon chantiers">🏗️</div>
              <h3>Chantiers</h3>
              <p>Gestion des chantiers</p>
            </div>
            <div className="module-card">
              <div className="module-icon documents">📄</div>
              <h3>Documents</h3>
              <p>Documents PDF hors-ligne</p>
            </div>
            <div className="module-card">
              <div className="module-icon fiches">🛁</div>
              <h3>Fiches SDB</h3>
              <p>Fiches techniques SDB</p>
            </div>
            <div className="module-card">
              <div className="module-icon calculs">🌡️</div>
              <h3>Calculs PAC</h3>
              <p>PAC Air/Eau & Air/Air</p>
            </div>
            <div className="module-card">
              <div className="module-icon meg">🔄</div>
              <h3>MEG Integration</h3>
              <p>Synchronisation comptabilité</p>
            </div>
            <div className="module-card">
              <div className="module-icon calendrier">📅</div>
              <h3>Calendrier</h3>
              <p>Planning chantiers</p>
            </div>
            <div className="module-card">
              <div className="module-icon chat">💬</div>
              <h3>Chat Équipe</h3>
              <p>Communication interne</p>
            </div>
          </div>

          <div className="info-section">
            <h3>✅ Statut Application H2EAUX GESTION</h3>
            <ul>
              <li>✅ Authentification fonctionnelle</li>
              <li>✅ Backend API complet (14 endpoints)</li>
              <li>✅ Gestion clients avec MEG</li>
              <li>✅ Fiches techniques SDB</li>
              <li>✅ Calculs PAC Air/Eau & Air/Air</li>
              <li>✅ Synchronisation comptabilité</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <div className="login-container">
        <div className="login-card">
          <div className="logo-section">
            <h1>H2EAUX GESTION</h1>
            <p className="subtitle">PLOMBERIE • CLIMATISATION • CHAUFFAGE</p>
          </div>

          <form onSubmit={handleLogin} className="login-form">
            {error && <div className="error-message">{error}</div>}
            
            <div className="input-group">
              <input
                type="text"
                placeholder="Nom d'utilisateur"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
                className="login-input"
              />
            </div>

            <div className="input-group">
              <input
                type="password"
                placeholder="Mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="login-input"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="login-button"
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>

          <div className="test-credentials">
            <h4>Identifiants de test :</h4>
            <p><strong>Admin:</strong> admin / admin123</p>
            <p><strong>Employé:</strong> employe1 / employe123</p>
          </div>

          <div className="footer">
            <p>Version 1.0.0 - H2EAUX GESTION</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;