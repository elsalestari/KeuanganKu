const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(bodyParser.json());
app.use(cors());
app.use(express.static('public'));

const dataPath = path.join(__dirname, 'data', 'keuangan.json');

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
}

if (!fs.existsSync(dataPath)) {
    fs.writeFileSync(dataPath, JSON.stringify([]));
}

const readData = () => {
    const data = fs.readFileSync(dataPath);
    return JSON.parse(data);
};

const writeData = (data) => {
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
};

// GET - Mendapatkan semua transaksi
app.get('/api/transaksi', (req, res) => {
    try {
        const transaksi = readData();
        res.json(transaksi);
    } catch (error) {
        res.status(500).json({ message: 'Terjadi kesalahan saat membaca data' });
    }
});

// GET - Mendapatkan transaksi berdasarkan ID
app.get('/api/transaksi/:id', (req, res) => {
    try {
        const transaksi = readData();
        const id = parseInt(req.params.id);
        const transaksiItem = transaksi.find(item => item.id === id);
        
        if (!transaksiItem) {
            return res.status(404).json({ message: 'Transaksi tidak ditemukan' });
        }
        
        res.json(transaksiItem);
    } catch (error) {
        res.status(500).json({ message: 'Terjadi kesalahan saat membaca data' });
    }
});

// POST - Menambahkan transaksi baru
app.post('/api/transaksi', (req, res) => {
    try {
        const transaksi = readData();
        const newTransaksi = req.body;
        
        if (!newTransaksi.kategori || !newTransaksi.jumlah || !newTransaksi.tanggal || !newTransaksi.deskripsi) {
            return res.status(400).json({ message: 'Semua kolom harus diisi' });
        }
        
        const id = transaksi.length > 0 ? Math.max(...transaksi.map(item => item.id)) + 1 : 1;
        newTransaksi.id = id;
        
        transaksi.push(newTransaksi);
        writeData(transaksi);
        
        res.status(201).json(newTransaksi);
    } catch (error) {
        res.status(500).json({ message: 'Terjadi kesalahan saat menyimpan data' });
    }
});

// PUT - Mengupdate transaksi berdasarkan ID
app.put('/api/transaksi/:id', (req, res) => {
    try {
        const transaksi = readData();
        const id = parseInt(req.params.id);
        const updateData = req.body;
        
        const index = transaksi.findIndex(item => item.id === id);
        
        if (index === -1) {
            return res.status(404).json({ message: 'Transaksi tidak ditemukan' });
        }
        
        transaksi[index] = { ...transaksi[index], ...updateData, id };
        writeData(transaksi);
        
        res.json(transaksi[index]);
    } catch (error) {
        res.status(500).json({ message: 'Terjadi kesalahan saat mengupdate data' });
    }
});

// DELETE - Menghapus transaksi berdasarkan ID
app.delete('/api/transaksi/:id', (req, res) => {
    try {
        let transaksi = readData();
        const id = parseInt(req.params.id);
        
        const transaksiToDelete = transaksi.find(item => item.id === id);
        
        if (!transaksiToDelete) {
            return res.status(404).json({ message: 'Transaksi tidak ditemukan' });
        }
        
        transaksi = transaksi.filter(item => item.id !== id);
        writeData(transaksi);
        
        res.json({ message: 'Transaksi berhasil dihapus', deletedItem: transaksiToDelete });
    } catch (error) {
        res.status(500).json({ message: 'Terjadi kesalahan saat menghapus data' });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});