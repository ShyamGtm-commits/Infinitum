// QRScanner.js
import React, { useRef, useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

const QRScanner = ({ onScanSuccess, onScanError }) => {
  const scannerRef = useRef(null);
  const [scanner, setScanner] = useState(null);

  useEffect(() => {
    if (!scannerRef.current) return;

    const html5QrcodeScanner = new Html5QrcodeScanner(
      "qr-reader",
      { 
        fps: 10, 
        qrbox: { width: 250, height: 250 },
        supportedScanTypes: [] 
      },
      false
    );

    html5QrcodeScanner.render(
      (decodedText) => {
        onScanSuccess(decodedText);
      },
      (error) => {
        onScanError(error);
      }
    );

    setScanner(html5QrcodeScanner);

    return () => {
      if (html5QrcodeScanner) {
        html5QrcodeScanner.clear().catch(error => {
          console.error("Failed to clear html5QrcodeScanner. ", error);
        });
      }
    };
  }, [onScanSuccess, onScanError]);

  return (
    <div className="card">
      <div className="card-body text-center">
        <h5>Scan QR Code</h5>
        <div id="qr-reader" ref={scannerRef} style={{ width: '100%' }}></div>
        <p className="text-muted mt-2">
          Position the QR code within the frame to scan
        </p>
      </div>
    </div>
  );
};

export default QRScanner;