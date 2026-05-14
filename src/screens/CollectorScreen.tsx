import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { subscribeToChildren, updateChildBalance, addTransaction } from '../services/firebase';
import type { Child } from '../types';
import { QRScanner } from '../components/QRScanner';
import './CollectorScreen.css';

const PiggyLogo = () => (
  <img src="/logo.png" alt="MiniBank" className="header-logo" />
);

export const CollectorScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [chargeAmount, setChargeAmount] = useState('');

  useEffect(() => {
    const unsubscribe = subscribeToChildren((data) => {
      setChildren(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (showScanner) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
  }, [showScanner]);

  const filteredChildren = children.filter(child => {
    const query = searchQuery.toLowerCase();
    return child.name.toLowerCase().includes(query) || child.qrId.includes(query);
  });

  const handleScan = async (qrId: string) => {
    setShowScanner(false);
    const child = children.find(c => c.qrId === qrId);
    if (child) {
      setSelectedChild(child);
    } else {
      alert('No se encontró ningún niño con este código');
    }
  };

  const handleSelectChild = (child: Child) => {
    setSelectedChild(child);
    setChargeAmount('');
  };

  const handleCharge = async () => {
    const amount = parseFloat(chargeAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Ingrese un monto válido');
      return;
    }

    if (!selectedChild || selectedChild.balance < amount) {
      alert(`El niño solo tiene $${selectedChild?.balance.toFixed(2)} de saldo`);
      return;
    }

    try {
      const newBalance = selectedChild.balance - amount;
      await updateChildBalance(selectedChild.id, newBalance);
      await addTransaction({
        childId: selectedChild.id,
        childName: selectedChild.name,
        amount,
        type: 'charge',
        collectorId: user!.id,
        collectorName: user!.name,
      });

      alert(`Cobro de $${amount.toFixed(2)} realizado a ${selectedChild.name}`);
      setChargeAmount('');
      setSelectedChild(null);
    } catch (error) {
      alert('No se pudo realizar el cobro');
    }
  };

  const closeModal = () => {
    setSelectedChild(null);
    setChargeAmount('');
  };

  return (
    <div className="collector-container">
      <header className="header">
        <div className="header-left">
          <PiggyLogo />
          <div className="header-info">
            <p className="header-role">Cobrador</p>
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

      <div className="search-section">
        <input
          type="text"
          placeholder="Buscar niño o ID..."
          className="search-input"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button className="scan-btn" onClick={() => setShowScanner(true)}>
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M9.5 6.5v3h-3v-3h3M11 5H5v6h6V5zm-1.5 9.5v3h-3v-3h3M11 13H5v6h6v-6zm6.5-6.5v3h-3v-3h3M19 5h-6v6h6V5zm-6 8h1.5v1.5H13V13zm1.5 1.5H16V16h-1.5v-1.5zM16 13h1.5v1.5H16V13zm-3 3h1.5v1.5H13V16zm1.5 1.5H16V19h-1.5v-1.5zM16 16h1.5v1.5H16V16zm1.5-1.5H19V16h-1.5v-1.5zm0 3H19V19h-1.5v-1.5zM19 13h-1.5v1.5H17.5V13h1.5zm-3-3h1.5v1.5H14.5V10zm1.5 0H16v1.5h-1.5V10z"/>
          </svg>
          Escanear
        </button>
      </div>

      <div className="children-list">
        {loading ? (
          <div className="loading-state">Cargando...</div>
        ) : filteredChildren.length === 0 ? (
          <div className="empty-state">
            <p>No hay niños registrados</p>
          </div>
        ) : (
          filteredChildren.map((child) => (
            <div 
              key={child.id} 
              className="child-card"
              onClick={() => handleSelectChild(child)}
            >
              <div className="child-info">
                <h3>{child.name}</h3>
                <p>ID: {child.qrId}</p>
              </div>
              <div className="child-balance">
                <span className={`balance-amount ${child.balance > 0 ? 'has-balance' : ''}`}>
                  ${child.balance.toFixed(2)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {showScanner && (
        <QRScanner onScan={handleScan} onClose={() => setShowScanner(false)} />
      )}

      {selectedChild && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>×</button>
            
            <h2 className="modal-name">{selectedChild.name}</h2>
            <p className="modal-id">ID: {selectedChild.qrId}</p>

            <div className="balance-section">
              <span className="balance-label">Saldo disponible</span>
              <span className={`balance-value ${selectedChild.balance > 0 ? 'positive' : ''}`}>
                ${selectedChild.balance.toFixed(2)}
              </span>
            </div>

            <div className="amount-input-section">
              <span className="currency-symbol">$</span>
              <input
                type="number"
                inputMode="decimal"
                placeholder="0.00"
                value={chargeAmount}
                onChange={(e) => setChargeAmount(e.target.value)}
                autoFocus
              />
            </div>

            <button 
              className="btn-charge"
              onClick={handleCharge}
              disabled={!chargeAmount || parseFloat(chargeAmount) <= 0 || selectedChild.balance < parseFloat(chargeAmount)}
            >
              Confirmar cobro
            </button>
            <button className="btn-cancel" onClick={closeModal}>
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
