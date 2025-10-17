// QRScanner.js - IMPROVED CAMERA HANDLING
import React, { useRef, useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

const QRScanner = ({ onScanSuccess, onScanError }) => {
  const scannerRef = useRef(null);
  const [cameraError, setCameraError] = useState('');
  const [activeMethod, setActiveMethod] = useState('camera');
  const [availableCameras, setAvailableCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState('');
  const [scanner, setScanner] = useState(null);
  const [isCameraInitialized, setIsCameraInitialized] = useState(false);

  // Detect available cameras
  const detectCameras = async () => {
    try {
      const devices = await Html5Qrcode.getCameras();
      setAvailableCameras(devices);

      if (devices.length === 0) {
        setCameraError('No cameras found on this device.');
        return;
      }

      // Smart camera selection
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

      let preferredCamera = devices[0]; // Default to first camera

      if (isMobile) {
        // Mobile: Prefer back camera
        const backCamera = devices.find(device =>
          device.label.toLowerCase().includes('back') ||
          device.label.toLowerCase().includes('rear')
        );
        preferredCamera = backCamera || devices[0];
      } else {
        // PC: Prefer front camera
        const frontCamera = devices.find(device =>
          device.label.toLowerCase().includes('front') ||
          device.label.toLowerCase().includes('face') ||
          device.label.includes('Integrated') // Common laptop camera name
        );
        preferredCamera = frontCamera || devices[0];
      }

      setSelectedCamera(preferredCamera.id);

    } catch (err) {
      console.error('Camera detection error:', err);
      setCameraError('Cannot access cameras. Please check browser permissions.');
    }
  };

  // Initialize scanner
  const initializeScanner = async (cameraId) => {
    try {
      // Clear existing scanner
      if (scanner) {
        await scanner.clear();
        setScanner(null);
      }

      const html5QrcodeScanner = new Html5QrcodeScanner(
        "qr-reader",
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          supportedScanTypes: [],
        },
        false
      );

      await html5QrcodeScanner.render(
        (decodedText) => {
          if (onScanSuccess) {
            onScanSuccess(decodedText);
          }
          html5QrcodeScanner.clear();
          setScanner(null);
          setIsCameraInitialized(false);
        },
        (error) => {
          // Don't show common scanning errors
          if (!error.includes('NotFoundException')) {
            if (onScanError) {
              onScanError(error);
            }
          }
        }
      );

      setScanner(html5QrcodeScanner);
      setIsCameraInitialized(true);
      setCameraError(''); // Clear any previous errors

    } catch (err) {
      console.error('Scanner initialization error:', err);
      setCameraError(`Failed to start camera: ${err.message}`);
      if (onScanError) {
        onScanError(`Camera error: ${err.message}`);
      }
    }
  };

  // Start camera when method changes to camera
  useEffect(() => {
    if (activeMethod === 'camera' && selectedCamera && !isCameraInitialized) {
      initializeScanner(selectedCamera);
    }
  }, [activeMethod, selectedCamera, isCameraInitialized]);

  // Initial camera detection
  useEffect(() => {
    detectCameras();
  }, []);

  // Camera selection handler
  const handleCameraChange = async (cameraId) => {
    setSelectedCamera(cameraId);
    setIsCameraInitialized(false); // Reset to trigger re-initialization
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setActiveMethod('upload');

      const formData = new FormData();
      formData.append('qr_image', file);

      const response = await fetch('http://localhost:8000/api/librarian/decode-qr-image/', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      const data = await response.json();

      if (data.success && onScanSuccess) {
        onScanSuccess(data.decoded_text);
      } else if (onScanError) {
        // FIX: Provide more specific error message
        if (data.error && data.error.includes('Invalid QR format')) {
          onScanError('This appears to be a return QR. Please use the Return Books section.');
        } else {
          onScanError(data.error || 'Could not read QR from image');
        }
      }
    } catch (err) {
      if (onScanError) {
        onScanError('Error processing QR image');
      }
    }
  };

  const handleManualInput = () => {
    const manualCode = prompt('Enter QR code manually (format: BORROW:transaction_id:book_id:user_id):');
    if (manualCode && onScanSuccess) {
      if (manualCode.startsWith('BORROW:') && manualCode.split(':').length === 4) {
        onScanSuccess(manualCode);
      } else if (onScanError) {
        onScanError('Invalid QR format. Should be: BORROW:ID:ID:ID');
      }
    }
  };

  const handleTestQR = () => {
    if (onScanSuccess) {
      onScanSuccess('BORROW:35:7:12');
    }
  };

  // Camera permission troubleshooting
  const troubleshootCamera = () => {
    const steps = [
      "1. 🌐 Check if you're on HTTPS or localhost",
      "2. 🔒 Allow camera permissions in browser",
      "3. 🔄 Refresh the page and try again",
      "4. 🚫 Make sure no other app is using camera",
      "5. 📱 Try on mobile device if available"
    ].join('\n');

    alert(`Camera Troubleshooting:\n\n${steps}`);
  };

  return (
    <div className="card">
      <div className="card-body">
        <h5 className="text-center">🔍 Scan Borrow QR Code</h5>

        {/* Method Selection Tabs */}
        <ul className="nav nav-pills nav-fill mb-3">
          <li className="nav-item">
            <button
              className={`nav-link ${activeMethod === 'camera' ? 'active' : ''}`}
              onClick={() => setActiveMethod('camera')}
            >
              📷 Camera Scan
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${activeMethod === 'upload' ? 'active' : ''}`}
              onClick={() => setActiveMethod('upload')}
            >
              📁 Upload QR
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${activeMethod === 'manual' ? 'active' : ''}`}
              onClick={() => setActiveMethod('manual')}
            >
              🔤 Manual Input
            </button>
          </li>
        </ul>

        {/* Camera Error with Troubleshooting */}
        {cameraError && activeMethod === 'camera' && (
          <div className="alert alert-warning">
            <strong>Camera Error:</strong> {cameraError}
            <div className="mt-2">
              <button
                className="btn btn-outline-warning btn-sm"
                onClick={troubleshootCamera}
              >
                🔧 Troubleshoot Camera
              </button>
              <button
                className="btn btn-outline-info btn-sm ms-2"
                onClick={detectCameras}
              >
                🔄 Retry Camera Detection
              </button>
            </div>
          </div>
        )}

        {activeMethod === 'camera' && (
          <div>
            {/* Camera Selection */}
            {availableCameras.length > 0 && (
              <div className="mb-3">
                <label className="form-label">Select Camera:</label>
                <select
                  className="form-select"
                  value={selectedCamera}
                  onChange={(e) => handleCameraChange(e.target.value)}
                >
                  {availableCameras.map(camera => (
                    <option key={camera.id} value={camera.id}>
                      {camera.label || `Camera ${camera.id}`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Scanner Area */}
            <div id="qr-reader" ref={scannerRef} style={{ width: '100%', minHeight: '300px' }}>
              {!isCameraInitialized && !cameraError && (
                <div className="text-center p-4 bg-light rounded">
                  <div className="spinner-border text-primary mb-2"></div>
                  <p>Initializing camera...</p>
                </div>
              )}
            </div>

            <p className="text-muted text-center mt-2">
              📱 Hold QR code steady in front of camera
            </p>
          </div>
        )}

        {/* Other methods remain the same */}
        {activeMethod === 'upload' && (
          <div className="text-center">
            <div className="border rounded p-4 bg-light">
              <i className="fas fa-cloud-upload-alt fa-3x text-primary mb-3"></i>
              <h6>Upload QR Code Image</h6>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="form-control"
              />
              <small className="text-muted">
                Supports PNG, JPG, JPEG. Can be screenshot or downloaded QR image.
              </small>
            </div>
          </div>
        )}

        {activeMethod === 'manual' && (
          <div className="text-center">
            <div className="border rounded p-4 bg-light">
              <i className="fas fa-keyboard fa-3x text-info mb-3"></i>
              <h6>Enter QR Code Manually</h6>
              <button
                className="btn btn-primary btn-lg"
                onClick={handleManualInput}
              >
                🔤 Enter QR Code
              </button>
              <small className="text-muted d-block mt-2">
                Format: BORROW:transaction_id:book_id:user_id
              </small>
            </div>
          </div>
        )}

        <div className="text-center mt-3">
          <button
            className="btn btn-outline-info btn-sm"
            onClick={handleTestQR}
          >
            🧪 Test with Sample QR
          </button>
        </div>
      </div>
    </div>
  );
};

export default QRScanner;