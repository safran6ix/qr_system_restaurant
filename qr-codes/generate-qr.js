const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

const generateQRCodes = async () => {
    const baseUrl = process.env.QR_BASE_URL || 'http://localhost:3000';
    const tableCount = 20;
    const outputDir = path.join(__dirname, 'generated');

    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    for (let i = 1; i <= tableCount; i++) {
        const tableUrl = `${baseUrl}/menu/${i}`;

        // Generate QR code with neon styling
        const qrImage = await QRCode.toDataURL(tableUrl, {
            errorCorrectionLevel: 'H',
            margin: 2,
            color: {
                dark: '#00ff88',
                light: '#0a0e27'
            },
            width: 500,
            rendererOpts: {
                quality: 0.95
            }
        });

        // Save QR code as PNG
        const base64Data = qrImage.replace(/^data:image\/png;base64,/, '');
        const outputPath = path.join(outputDir, `table-${i}.png`);
        fs.writeFileSync(outputPath, base64Data, 'base64');

        console.log(`✅ Generated QR for Table ${i}`);
    }

    // Generate summary HTML
    generateSummaryHTML(tableCount, outputDir);
};

const generateSummaryHTML = (count, dir) => {
    let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { 
          background: #0a0e27; 
          color: white; 
          font-family: 'Arial', sans-serif;
          padding: 20px;
        }
        .grid { 
          display: grid; 
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }
        .card {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(0,255,136,0.2);
          border-radius: 15px;
          padding: 20px;
          text-align: center;
          backdrop-filter: blur(10px);
          transition: all 0.3s ease;
        }
        .card:hover {
          transform: scale(1.05);
          box-shadow: 0 0 30px rgba(0,255,136,0.3);
        }
        h1 {
          text-align: center;
          color: #00ff88;
          text-shadow: 0 0 20px #00ff88;
          margin-bottom: 40px;
        }
        img {
          width: 150px;
          height: 150px;
          border-radius: 10px;
        }
        p {
          margin-top: 10px;
          color: #00ff88;
        }
      </style>
    </head>
    <body>
      <h1>🍽️ QR Codes - All Tables</h1>
      <div class="grid">
  `;

    for (let i = 1; i <= count; i++) {
        html += `
      <div class="card">
        <img src="table-${i}.png" alt="Table ${i} QR" />
        <p>Table ${i}</p>
        <small style="color: #666;">Scan to order</small>
      </div>
    `;
    }

    html += `
      </div>
    </body>
    </html>
  `;

    fs.writeFileSync(path.join(dir, 'index.html'), html);
    console.log('✅ Generated QR summary page');
};

generateQRCodes().catch(console.error);