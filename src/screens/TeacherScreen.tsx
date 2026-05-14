import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { subscribeToChildren, addChild, updateChildBalance, getChildByQRId, addTransaction } from '../services/firebase';
import type { Child } from '../types';
import { QRScanner } from '../components/QRScanner';
import { QRCodeSVG } from 'qrcode.react';
import './TeacherScreen.css';

const PiggyLogo = () => (
  <img src="/logo.png" alt="MiniBank" className="header-logo" />
);

export const TeacherScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<string>('all');
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showChargeModal, setShowChargeModal] = useState(false);
  const [showAddChild, setShowAddChild] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [transactionAmount, setTransactionAmount] = useState('');
  const [newChildName, setNewChildName] = useState('');
  const [newChildAge, setNewChildAge] = useState('');
  const [showDownloadSuccess, setShowDownloadSuccess] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

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
    const matchesSearch = child.name.toLowerCase().includes(searchQuery.toLowerCase()) || child.qrId.includes(searchQuery);
    const matchesAgeGroup = selectedAgeGroup === 'all' || child.ageGroup === selectedAgeGroup;
    return matchesSearch && matchesAgeGroup;
  });

  const handleAddChild = async () => {
    if (!newChildName.trim() || !newChildAge.trim()) {
      alert('Complete todos los campos');
      return;
    }
    const age = parseInt(newChildAge);
    if (isNaN(age) || age < 5 || age > 12) {
      alert('La edad debe ser entre 5 y 12 años');
      return;
    }

    try {
      const { generateQRId, getAgeGroup } = await import('../services/firebase');
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

  const handleTransaction = async (type: 'deposit' | 'charge') => {
    const amount = parseFloat(transactionAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Ingrese un monto válido');
      return;
    }

    if (type === 'charge' && selectedChild!.balance < amount) {
      alert(`El niño solo tiene $${selectedChild!.balance.toFixed(2)} de saldo`);
      return;
    }

    try {
      const newBalance = type === 'deposit' 
        ? selectedChild!.balance + amount 
        : selectedChild!.balance - amount;
      
      await updateChildBalance(selectedChild!.id, newBalance);
      await addTransaction({
        childId: selectedChild!.id,
        childName: selectedChild!.name,
        amount,
        type,
        collectorId: user!.id,
        collectorName: user!.name,
      });
      
      setTransactionAmount('');
      setShowDepositModal(false);
      setShowChargeModal(false);
      alert(`${type === 'deposit' ? 'Depósito' : 'Cobro'} de $${amount.toFixed(2)} realizado`);
    } catch (error) {
      alert('Error al realizar la transacción');
    }
  };

  const handleScan = async (qrId: string) => {
    setShowScanner(false);
    try {
      const child = await getChildByQRId(qrId);
      if (child) {
        setSelectedChild(child);
        setShowChargeModal(true);
      } else {
        alert('No se encontró ningún niño con este código');
      }
    } catch (error) {
      alert('Error al buscar el niño');
    }
  };

  const downloadQR = (child: Child) => {
    const svgElement = qrRef.current?.querySelector('svg');
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      const qrSize = 220;
      const padding = 24;
      const textAreaHeight = 80;
      canvas.width = qrSize + padding * 2;
      canvas.height = qrSize + padding * 2 + textAreaHeight;

      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.drawImage(img, padding, padding, qrSize, qrSize);

        const centerY = qrSize + padding + textAreaHeight / 2;

        ctx.fillStyle = '#1f2937';
        ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(child.name, canvas.width / 2, centerY - 14);

        ctx.fillStyle = '#6b7280';
        ctx.font = '14px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.fillText(`ID: ${child.qrId}`, canvas.width / 2, centerY + 14);
      }

      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `QR_${child.name.replace(/\s/g, '_')}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();

      setShowDownloadSuccess(true);
      setTimeout(() => setShowDownloadSuccess(false), 3000);
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  return (
    <div className="teacher-container">
      <header className="header">
        <div className="header-left">
          <PiggyLogo />
          <div className="header-info">
            <p className="header-role">Profesor</p>
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
        <div style={{display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '12px'}}>
          <input
            type="text"
            placeholder="Buscar niño o ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: '1',
              minWidth: '150px',
              padding: '12px 16px',
              border: '2px solid #e5e7eb',
              borderRadius: '12px',
              fontSize: '15px',
              color: '#1f2937',
              backgroundColor: '#ffffff',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
          <button
            onClick={() => setSelectedAgeGroup('all')}
            style={{
              padding: '10px 16px',
              border: selectedAgeGroup === 'all' ? '2px solid #4f46e5' : '1px solid #d1d5db',
              borderRadius: '24px',
              fontSize: '14px',
              fontWeight: '600',
              color: selectedAgeGroup === 'all' ? '#4f46e5' : '#6b7280',
              backgroundColor: selectedAgeGroup === 'all' ? '#eff6ff' : '#ffffff',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            Todos
          </button>
          <button
            onClick={() => setSelectedAgeGroup('5-6')}
            style={{
              padding: '10px 16px',
              border: selectedAgeGroup === '5-6' ? '2px solid #4f46e5' : '1px solid #d1d5db',
              borderRadius: '24px',
              fontSize: '14px',
              fontWeight: '600',
              color: selectedAgeGroup === '5-6' ? '#4f46e5' : '#6b7280',
              backgroundColor: selectedAgeGroup === '5-6' ? '#eff6ff' : '#ffffff',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            5-6
          </button>
        </div>
        <div style={{display: 'flex', gap: '8px', flexWrap: 'wrap'}}>
          <button
            onClick={() => setSelectedAgeGroup('7-8')}
            style={{
              padding: '10px 16px',
              border: selectedAgeGroup === '7-8' ? '2px solid #4f46e5' : '1px solid #d1d5db',
              borderRadius: '24px',
              fontSize: '14px',
              fontWeight: '600',
              color: selectedAgeGroup === '7-8' ? '#4f46e5' : '#6b7280',
              backgroundColor: selectedAgeGroup === '7-8' ? '#eff6ff' : '#ffffff',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            7-8
          </button>
          <button
            onClick={() => setSelectedAgeGroup('9-10')}
            style={{
              padding: '10px 16px',
              border: selectedAgeGroup === '9-10' ? '2px solid #4f46e5' : '1px solid #d1d5db',
              borderRadius: '24px',
              fontSize: '14px',
              fontWeight: '600',
              color: selectedAgeGroup === '9-10' ? '#4f46e5' : '#6b7280',
              backgroundColor: selectedAgeGroup === '9-10' ? '#eff6ff' : '#ffffff',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            9-10
          </button>
          <button
            onClick={() => setSelectedAgeGroup('11-12')}
            style={{
              padding: '10px 16px',
              border: selectedAgeGroup === '11-12' ? '2px solid #4f46e5' : '1px solid #d1d5db',
              borderRadius: '24px',
              fontSize: '14px',
              fontWeight: '600',
              color: selectedAgeGroup === '11-12' ? '#4f46e5' : '#6b7280',
              backgroundColor: selectedAgeGroup === '11-12' ? '#eff6ff' : '#ffffff',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            11-12
          </button>
        </div>
      </div>

      <div className="content-area">
        {loading ? (
          <div className="loading-state">Cargando...</div>
        ) : filteredChildren.length === 0 ? (
          <div className="empty-state">
            <p>No hay niños registrados</p>
          </div>
        ) : (
          filteredChildren.map((child) => (
            <div key={child.id} className="child-card" onClick={() => setSelectedChild(child)}>
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

      <div className="bottom-actions">
        <button className="action-btn secondary" onClick={() => setShowScanner(true)}>
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M9.5 6.5v3h-3v-3h3M11 5H5v6h6V5zm-1.5 9.5v3h-3v-3h3M11 13H5v6h6v-6zm6.5-6.5v3h-3v-3h3M19 5h-6v6h6V5zm-6 8h1.5v1.5H13V13zm1.5 1.5H16V16h-1.5v-1.5zM16 13h1.5v1.5H16V13zm-3 3h1.5v1.5H13V16zm1.5 1.5H16V19h-1.5v-1.5zM16 16h1.5v1.5H16V16zm1.5-1.5H19V16h-1.5v-1.5zm0 3H19V19h-1.5v-1.5zM19 13h-1.5v1.5H17.5V13h1.5zm-3-3h1.5v1.5H14.5V10zm1.5 0H16v1.5h-1.5V10z"/>
          </svg>
        </button>
        <button className="action-btn primary" onClick={() => setShowAddChild(true)}>
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
          </svg>
          Agregar niño
        </button>
      </div>

      {showScanner && <QRScanner onScan={handleScan} onClose={() => setShowScanner(false)} />}

      {selectedChild && !showDepositModal && !showChargeModal && (
        <div className="modal-overlay" onClick={() => setSelectedChild(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedChild(null)}>×</button>
            
            <h2 className="modal-name">{selectedChild.name}</h2>
            <p className="modal-id">ID: {selectedChild.qrId}</p>

            <div className="qr-section">
              <div className="qr-code" id={`qr-${selectedChild.id}`} ref={qrRef}>
                <QRCodeSVG value={selectedChild.qrId} size={160} level="H" bgColor="#FFFFFF" />
              </div>
            </div>

            <div className="balance-section">
              <span className="balance-label">Saldo disponible</span>
              <span className={`balance-value ${selectedChild.balance > 0 ? 'positive' : ''}`}>
                ${selectedChild.balance.toFixed(2)}
              </span>
            </div>

            <div className="modal-actions">
              <button className="modal-btn deposit" onClick={() => setShowDepositModal(true)}>
                Depositar
              </button>
              <button className="modal-btn charge" onClick={() => setShowChargeModal(true)}>
                Cobrar
              </button>
            </div>
            
            <button className="download-btn" onClick={() => downloadQR(selectedChild)}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
              </svg>
              Descargar QR
            </button>
          </div>
        </div>
      )}

      {showDepositModal && selectedChild && (
        <TransactionModal
          title="Depositar"
          childName={selectedChild.name}
          currentBalance={selectedChild.balance}
          onConfirm={() => handleTransaction('deposit')}
          onCancel={() => { setShowDepositModal(false); setTransactionAmount(''); }}
          amount={transactionAmount}
          setAmount={setTransactionAmount}
        />
      )}

      {showChargeModal && selectedChild && (
        <TransactionModal
          title="Cobrar"
          childName={selectedChild.name}
          currentBalance={selectedChild.balance}
          onConfirm={() => handleTransaction('charge')}
          onCancel={() => { setShowChargeModal(false); setTransactionAmount(''); }}
          amount={transactionAmount}
          setAmount={setTransactionAmount}
        />
      )}

      {showAddChild && (
        <div className="modal-overlay" onClick={() => setShowAddChild(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowAddChild(false)}>×</button>
            <h2>Registrar nuevo niño</h2>
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

      {showDownloadSuccess && selectedChild && (
        <div className="download-success">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
          </svg>
          <span>QR descargado: {selectedChild.name}</span>
        </div>
      )}
    </div>
  );
};

const TransactionModal: React.FC<{
  title: string;
  childName: string;
  currentBalance: number;
  onConfirm: () => void;
  onCancel: () => void;
  amount: string;
  setAmount: (v: string) => void;
}> = ({ title, childName, currentBalance, onConfirm, onCancel, amount, setAmount }) => (
  <div className="modal-overlay" onClick={onCancel}>
    <div className="modal transaction-modal" onClick={e => e.stopPropagation()}>
      <button className="modal-close" onClick={onCancel}>×</button>
      <h2>{title}</h2>
      <p className="transaction-child">{childName}</p>
      
      <div className="balance-info">
        <span>Saldo actual</span>
        <strong>${currentBalance.toFixed(2)}</strong>
      </div>

      <div className="amount-input-section">
        <span className="currency-symbol">$</span>
        <input 
          type="number" 
          inputMode="decimal"
          placeholder="0.00" 
          value={amount} 
          onChange={(e) => setAmount(e.target.value)} 
          autoFocus
        />
      </div>

      <button 
        className={`btn-submit ${title === 'Depositar' ? 'deposit' : 'charge'}`} 
        onClick={onConfirm} 
        disabled={!amount || parseFloat(amount) <= 0}
      >
        Confirmar {title}
      </button>
      <button className="btn-cancel" onClick={onCancel}>
        Cancelar
      </button>
    </div>
  </div>
);
