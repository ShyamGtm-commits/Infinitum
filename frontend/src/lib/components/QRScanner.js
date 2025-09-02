import { Html5QrcodeScanner } from 'html5-qrcode';
import { useEffect } from 'react';

const QRScanner = ({ onScanSuccess, onScanError }) => {
    useEffect(() => {
        const scanner = new Html5QrcodeScanner('qr-reader', {
            qrbox: {
                width: 250,
                height: 250,
            },
            fps: 5,
        });

        scanner.render(
            (decodedText) => {
                onScanSuccess(decodedText);
            },
            (error) => {
                onScanError(error);
            }
        );

        return () => {
            scanner.clear().catch(error => {
                console.error('Failed to clear html5QrcodeScanner. ', error);
            });
        };
    }, [onScanSuccess, onScanError]);

    return <div id="qr-reader" style={{ width: '100%' }}></div>;
};

export default QRScanner;