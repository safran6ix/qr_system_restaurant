const QRCode = require('qrcode');
const Table = require('../models/Table');

exports.generateTableQRs = async (tableCount) => {
    const qrCodes = [];

    for (let i = 1; i <= tableCount; i++) {
        const tableUrl = `${process.env.QR_BASE_URL}/menu/${i}`;

        // Generate QR code as base64
        const qrImage = await QRCode.toDataURL(tableUrl, {
            errorCorrectionLevel: 'H',
            margin: 1,
            color: {
                dark: '#00ff88',
                light: '#0a0e27'
            }
        });

        // Save table with QR
        const table = await Table.create({
            tableNumber: i,
            capacity: Math.floor(Math.random() * 3) + 2, // 2-4 persons
            qrCode: qrImage,
            status: 'available'
        });

        qrCodes.push({
            tableNumber: i,
            qrCode: qrImage,
            tableId: table._id
        });
    }

    return qrCodes;
};