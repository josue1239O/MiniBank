import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { subscribeToChildren, addChild, deleteChild, subscribeToUsers, addUser, generateQRId, getAgeGroup, updateUser } from '../services/firebase';
import type { Child, User } from '../types';
import { QRCodeSVG } from 'qrcode.react';
import './AdminScreen.css';

const PiggyLogo = () => (
  <img src="/logo.png" alt="MiniBank" className="header-logo" />
);

export const AdminScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const [children, setChildren] = useState<Child[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'children' | 'users' | 'approvals'>('dashboard');
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [showAddChild, setShowAddChild] = useState(false);
  const [showAddCollector, setShowAddCollector] = useState(false);
  const [newChildName, setNewChildName] = useState('');
  const [newChildAge, setNewChildAge] = useState('');
  const [newCollectorName, setNewCollectorName] = useState('');
  const [newCollectorPin, setNewCollectorPin] = useState('');

  useEffect(() => {
    const unsubChildren = subscribeToChildren((data) => {
      setChildren(data);
    });
    const unsubUsers = subscribeToUsers((data) => {
      setUsers(data);
      setLoading(false);
    });
    return () => {
      unsubChildren();
      unsubUsers();
    };
  }, []);

  const handleAddChild = async () => {
    if (!newChildName.trim() || !newChildAge.trim()) {
      alert('Completa todos los campos');
      return;
    }
    const age = parseInt(newChildAge);
    if (isNaN(age) || age < 5 || age > 12) {
      alert('La edad debe ser entre 5 y 12 años');
      return;
    }

    try {
      await addChild({
        name: newChildName.trim(),
        age,
        ageGroup: getAgeGroup(age),
        qrId: generateQRId(),
        balance: 0,
      });
      setNewChildName('');
      setNewChildAge('');
      setShowAddChild(false);
      alert('Niño registrado correctamente');
    } catch (error) {
      alert('No se pudo registrar el niño');
    }
  };

  const handleAddCollector = async () => {
    if (!newCollectorName.trim() || !newCollectorPin.trim()) {
      alert('Completa todos los campos');
      return;
    }
    if (newCollectorPin.length !== 4) {
      alert('El PIN debe tener 4 dígitos');
      return;
    }

    try {
      await addUser({
        name: newCollectorName.trim(),
        pin: newCollectorPin,
        role: 'collector',
        active: true,
      });
      setNewCollectorName('');
      setNewCollectorPin('');
      setShowAddCollector(false);
      alert('Cobrador creado correctamente');
    } catch (error) {
      alert('No se pudo crear el cobrador');
    }
  };

  const handleDeleteChild = (child: Child) => {
    if (confirm(`¿Eliminar a ${child.name}?`)) {
      deleteChild(child.id);
    }
  };

  const handleApproveTeacher = async (teacher: User) => {
    if (confirm(`¿Aprobar la cuenta de ${teacher.name}?`)) {
      try {
        await updateUser(teacher.id, { active: true });
        alert('Profesor aprobado correctamente');
      } catch (error) {
        alert('Error al aprobar el profesor');
      }
    }
  };

  const handleRejectTeacher = async (teacher: User) => {
    if (confirm(`¿Rechazar y eliminar la solicitud de ${teacher.name}?`)) {
      try {
        await updateUser(teacher.id, { active: false });
        alert('Solicitud rechazada');
      } catch (error) {
        alert('Error al rechazar la solicitud');
      }
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'teacher': return 'Profesor';
      case 'collector': return 'Cobrador';
      default: return role;
    }
  };

  const totalBalance = children.reduce((sum, c) => sum + c.balance, 0);
  const pendingTeachers = users.filter(u => u.role === 'teacher' && !u.active);

  return (
    <div className="admin-container">
      <header className="header">
        <div className="header-left">
          <PiggyLogo />
          <div className="header-info">
            <p className="header-role">Administrador</p>
            <h1 className="header-name">{user?.name}</h1>
          </div>
        </div>
        <div className="header-right">
          <button className="icon-btn danger" onClick={logout} title="Cerrar sesión">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
            </svg>
          </button>
        </div>
      </header>

      <nav className="nav-tabs">
        <button className={`nav-tab ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>Dashboard</button>
        <button className={`nav-tab ${activeTab === 'children' ? 'active' : ''}`} onClick={() => setActiveTab('children')}>Niños</button>
        <button className={`nav-tab ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>Usuarios</button>
        <button className={`nav-tab ${activeTab === 'approvals' ? 'active' : ''}`} onClick={() => setActiveTab('approvals')}>
          Solicitudes
          {pendingTeachers.length > 0 && <span className="badge">{pendingTeachers.length}</span>}
        </button>
      </nav>

      {loading ? (
        <div className="loading-state">Cargando...</div>
      ) : (
        <>
          {activeTab === 'dashboard' && (
            <div className="content-area">
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon blue">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                  </div>
                  <div className="stat-info">
                    <span className="stat-value">{children.length}</span>
                    <span className="stat-label">Niños Registrados</span>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon green">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                  </div>
                  <div className="stat-info">
                    <span className="stat-value">{users.filter(u => u.role === 'teacher' && u.active).length}</span>
                    <span className="stat-label">Profesores Activos</span>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon purple">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/>
                    </svg>
                  </div>
                  <div className="stat-info">
                    <span className="stat-value">${totalBalance.toFixed(2)}</span>
                    <span className="stat-label">Total en Cuentas</span>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon orange">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                    </svg>
                  </div>
                  <div className="stat-info">
                    <span className="stat-value">{users.filter(u => u.role === 'collector').length}</span>
                    <span className="stat-label">Cobradores</span>
                  </div>
                </div>
              </div>

              {pendingTeachers.length > 0 && (
                <div className="pending-alert" onClick={() => setActiveTab('approvals')}>
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
                  </svg>
                  <span>{pendingTeachers.length} solicitud{pendingTeachers.length > 1 ? 'es' : ''} de profesores pendiente{pendingTeachers.length > 1 ? 's' : ''}</span>
                </div>
              )}
            </div>
          )}

          {activeTab === 'children' && (
            <div className="content-area">
              <div className="list-header">
                <h2>Niños Registrados</h2>
                <button className="btn-primary" onClick={() => setShowAddChild(true)}>+ Agregar</button>
              </div>
              <div className="list">
                {children.length === 0 ? (
                  <div className="empty-state">
                    <p>No hay niños registrados</p>
                  </div>
                ) : (
                  children.map((child) => (
                    <div key={child.id} className="child-card" onClick={() => setSelectedChild(child)}>
                      <div className="child-info">
                        <h3>{child.name}</h3>
                        <p>Grupo {child.ageGroup} • Edad {child.age}</p>
                      </div>
                      <div className={`child-balance ${child.balance > 0 ? 'has-balance' : ''}`}>
                        ${child.balance.toFixed(2)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="content-area">
              <div className="list-header">
                <h2>Usuarios del Sistema</h2>
                <button className="btn-secondary" onClick={() => setShowAddCollector(true)}>+ Cobrador</button>
              </div>
              <div className="list">
                {users.map((u) => (
                  <div key={u.id} className="user-card">
                    <div className="user-avatar" style={{ background: u.role === 'teacher' ? '#16a34a' : u.role === 'collector' ? '#7c3aed' : '#dc2626' }}>
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="child-info">
                      <h3>{u.name}</h3>
                      <p>{getRoleLabel(u.role)}{u.role === 'teacher' && !u.active ? ' (Pendiente)' : ''}</p>
                    </div>
                    <div className="pin-display">PIN: {u.pin}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'approvals' && (
            <div className="content-area">
              <div className="list-header">
                <h2>Solicitudes Pendientes</h2>
              </div>
              <div className="list">
                {pendingTeachers.length === 0 ? (
                  <div className="empty-state">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                    </svg>
                    <p>No hay solicitudes pendientes</p>
                  </div>
                ) : (
                  pendingTeachers.map((teacher) => (
                    <div key={teacher.id} className="approval-card">
                      <div className="approval-info">
                        <div className="user-avatar teacher">
                          {teacher.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="child-info">
                          <h3>{teacher.name}</h3>
                          <p>{teacher.email}</p>
                        </div>
                      </div>
                      <div className="approval-actions">
                        <button className="btn-approve" onClick={() => handleApproveTeacher(teacher)}>
                          Aprobar
                        </button>
                        <button className="btn-reject" onClick={() => handleRejectTeacher(teacher)}>
                          Rechazar
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </>
      )}

      {selectedChild && (
        <div className="modal-overlay" onClick={() => setSelectedChild(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedChild(null)}>×</button>
            
            <h2 className="modal-name">{selectedChild.name}</h2>
            <p className="modal-id">ID: {selectedChild.qrId}</p>

            <div className="qr-section">
              <div className="qr-code">
                <QRCodeSVG value={selectedChild.qrId} size={160} level="H" bgColor="#FFFFFF" />
              </div>
            </div>

            <div className="balance-section">
              <span className="balance-label">Saldo disponible</span>
              <span className={`balance-value ${selectedChild.balance > 0 ? 'positive' : ''}`}>
                ${selectedChild.balance.toFixed(2)}
              </span>
            </div>

            <button className="btn-danger" onClick={() => handleDeleteChild(selectedChild)}>
              Eliminar Niño
            </button>
          </div>
        </div>
      )}

      {showAddChild && (
        <div className="modal-overlay" onClick={() => setShowAddChild(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowAddChild(false)}>×</button>
            <h2>Agregar Nuevo Niño</h2>
            <div className="form-group">
              <label>Nombre</label>
              <input 
                type="text" 
                placeholder="Nombre del niño" 
                value={newChildName} 
                onChange={(e) => setNewChildName(e.target.value)} 
              />
            </div>
            <div className="form-group">
              <label>Edad</label>
              <input 
                type="number" 
                inputMode="numeric"
                placeholder="5-12" 
                value={newChildAge} 
                onChange={(e) => setNewChildAge(e.target.value)} 
              />
            </div>
            <button className="btn-submit" onClick={handleAddChild}>
              Registrar
            </button>
          </div>
        </div>
      )}

      {showAddCollector && (
        <div className="modal-overlay" onClick={() => setShowAddCollector(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowAddCollector(false)}>×</button>
            <h2>Crear Cuenta de Cobrador</h2>
            <div className="form-group">
              <label>Nombre</label>
              <input 
                type="text" 
                placeholder="Nombre del cobrador" 
                value={newCollectorName} 
                onChange={(e) => setNewCollectorName(e.target.value)} 
              />
            </div>
            <div className="form-group">
              <label>PIN</label>
              <input 
                type="number" 
                inputMode="numeric"
                placeholder="4 dígitos" 
                maxLength={4}
                value={newCollectorPin} 
                onChange={(e) => setNewCollectorPin(e.target.value)} 
              />
            </div>
            <button className="btn-submit" onClick={handleAddCollector}>
              Crear Cuenta
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
