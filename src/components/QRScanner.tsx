import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import './QRScanner.css';

interface QRScannerProps {
  onScan: (qrId: string) => void;
  onClose: () => void;
}

export const QRScanner: React.FC<QRScannerProps> = ({ onScan, onClose }) => {
  const [cameraError, setCameraError] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lastScannedRef = useRef<string>('');

  useEffect(() => {
    const startScanner = async () => {
      try {
        const scanner = new Html5Qrcode('qr-reader');
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText) => {
            if (decodedText !== lastScannedRef.current) {
              lastScannedRef.current = decodedText;
              onScan(decodedText);
            }
          },
          () => {}
        );
        setIsScanning(true);
      } catch (err) {
        console.error('Camera error:', err);
        setCameraError('No se pudo acceder a la cámara. Verifica los permisos.');
      }
    };

    startScanner();

    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, [onScan]);

  const handleManualInput = () => {
    const manualId = prompt('Ingresa el ID del niño:');
    if (manualId) {
      onScan(manualId.trim());
    }
  };

  return (
    <div className="scanner-overlay">
      <div className="scanner-container">
        <div className="scanner-header">
          <h2>Escanear QR</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        {cameraError ? (
          <div className="scanner-error">
            <p>{cameraError}</p>
            <button className="btn btn-primary" onClick={handleManualInput}>
              Ingresar ID manualmente
            </button>
          </div>
        ) : (
          <>
            <div className="qr-reader-wrapper">
              <div id="qr-reader"></div>
              {isScanning && <div className="scan-frame"></div>}
            </div>
            <p className="scanner-hint">Apunta al código QR del niño</p>
            <button className="btn btn-secondary" onClick={handleManualInput}>
              ¿No puedes escanear? Ingresa el ID manualmente
            </button>
          </>
        )}
      </div>
    </div>
  );
};
