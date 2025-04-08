const API_URL = 'http://localhost:3000/api/transaksi';

const daftarTransaksiEl = document.getElementById('daftar-transaksi');
const totalSaldoEl = document.getElementById('total-saldo');
const totalPemasukanEl = document.getElementById('total-pemasukan');
const totalPengeluaranEl = document.getElementById('total-pengeluaran');
const formTransaksi = document.getElementById('formTransaksi');
const transaksiIdInput = document.getElementById('transaksiId');
const kategoriInput = document.getElementById('kategori');
const jumlahInput = document.getElementById('jumlah');
const tanggalInput = document.getElementById('tanggal');
const deskripsiInput = document.getElementById('deskripsi');
const btnSimpan = document.getElementById('btnSimpan');
const btnReset = document.getElementById('btnReset');
const btnKonfirmasiHapus = document.getElementById('btnKonfirmasiHapus');
const modalKonfirmasiHapus = new bootstrap.Modal(document.getElementById('modalKonfirmasiHapus'));

let transaksiData = [];
let transaksiToDelete = null;
let isEditMode = false;

const formatRupiah = (angka) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(angka);
};

const formatTanggal = (tanggal) => {
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    return new Date(tanggal).toLocaleDateString('id-ID', options);
};

const loadTransaksi = async () => {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        transaksiData = await response.json();
        renderTransaksi();
        updateSummary();
    } catch (error) {
        console.error('Error loading transaksi:', error);
        daftarTransaksiEl.innerHTML = `
            <div class="alert alert-danger" role="alert">
                Gagal memuat data. Silakan coba lagi nanti.
            </div>
        `;
    }
};

const renderTransaksi = () => {
    transaksiData.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
    
    if (transaksiData.length === 0) {
        daftarTransaksiEl.innerHTML = `
            <div class="text-center py-5">
                <p class="mb-0">Belum ada transaksi. Tambahkan transaksi baru dengan mengisi form di atas.</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    
    transaksiData.forEach(item => {
        const isIncome = item.kategori === 'pemasukan';
        html += `
            <div class="card ${item.kategori}">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-center">
                        <h5 class="card-title mb-1">${item.deskripsi}</h5>
                        <h5 class="card-title mb-1 ${isIncome ? 'text-success' : 'text-danger'}">
                            ${isIncome ? '+' : '-'} ${formatRupiah(item.jumlah)}
                        </h5>
                    </div>
                    <p class="card-text text-muted small">
                        ${formatTanggal(item.tanggal)} - ${isIncome ? 'Pemasukan' : 'Pengeluaran'}
                    </p>
                    <div class="d-flex justify-content-end">
                        <button class="btn btn-sm btn-outline-primary me-2" onclick="editTransaksi(${item.id})">Edit</button>
                        <button class="btn btn-sm btn-outline-danger" onclick="showDeleteConfirmation(${item.id})">Hapus</button>
                    </div>
                </div>
            </div>
        `;
    });
    
    daftarTransaksiEl.innerHTML = html;
};

const updateSummary = () => {
    const totalPemasukan = transaksiData
        .filter(item => item.kategori === 'pemasukan')
        .reduce((sum, item) => sum + parseFloat(item.jumlah), 0);
    
    const totalPengeluaran = transaksiData
        .filter(item => item.kategori === 'pengeluaran')
        .reduce((sum, item) => sum + parseFloat(item.jumlah), 0);
    
    const totalSaldo = totalPemasukan - totalPengeluaran;
    
    totalSaldoEl.textContent = formatRupiah(totalSaldo);
    totalPemasukanEl.textContent = formatRupiah(totalPemasukan);
    totalPengeluaranEl.textContent = formatRupiah(totalPengeluaran);
    
    if (totalSaldo < 0) {
        totalSaldoEl.classList.add('text-danger');
        totalSaldoEl.classList.remove('text-success');
    } else {
        totalSaldoEl.classList.add('text-success');
        totalSaldoEl.classList.remove('text-danger');
    }
};

const tambahTransaksi = async () => {
    if (!formTransaksi.checkValidity()) {
        formTransaksi.reportValidity();
        return;
    }
    
    const newTransaksi = {
        kategori: kategoriInput.value,
        jumlah: parseFloat(jumlahInput.value),
        tanggal: tanggalInput.value,
        deskripsi: deskripsiInput.value
    };
    
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newTransaksi)
        });
        
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        
        await loadTransaksi();
        resetForm();
        
        showAlert('success', 'Transaksi berhasil ditambahkan');
    } catch (error) {
        console.error('Error adding transaksi:', error);
        showAlert('danger', 'Gagal menambahkan transaksi');
    }
};

const editTransaksi = (id) => {
    const transaksi = transaksiData.find(item => item.id === id);
    if (!transaksi) return;
    
    transaksiIdInput.value = transaksi.id;
    kategoriInput.value = transaksi.kategori;
    jumlahInput.value = transaksi.jumlah;
    tanggalInput.value = transaksi.tanggal;
    deskripsiInput.value = transaksi.deskripsi;
    
    btnSimpan.textContent = 'Update';
    isEditMode = true;
    
    window.scrollTo({
        top: formTransaksi.offsetTop - 100,
        behavior: 'smooth'
    });
};

const updateTransaksi = async (id) => {
    if (!formTransaksi.checkValidity()) {
        formTransaksi.reportValidity();
        return;
    }
    
    const updatedTransaksi = {
        kategori: kategoriInput.value,
        jumlah: parseFloat(jumlahInput.value),
        tanggal: tanggalInput.value,
        deskripsi: deskripsiInput.value
    };
    
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatedTransaksi)
        });
        
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        
        await loadTransaksi();
        resetForm();
        
        showAlert('success', 'Transaksi berhasil diperbarui');
    } catch (error) {
        console.error('Error updating transaksi:', error);
        showAlert('danger', 'Gagal memperbarui transaksi');
    }
};

const showDeleteConfirmation = (id) => {
    transaksiToDelete = id;
    modalKonfirmasiHapus.show();
};

const deleteTransaksi = async () => {
    if (!transaksiToDelete) return;
    
    try {
        const response = await fetch(`${API_URL}/${transaksiToDelete}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        
        await loadTransaksi();
        modalKonfirmasiHapus.hide();
        
        showAlert('success', 'Transaksi berhasil dihapus');
    } catch (error) {
        console.error('Error deleting transaksi:', error);
        showAlert('danger', 'Gagal menghapus transaksi');
    }
};

const showAlert = (type, message) => {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 end-0 m-3`;
    alertDiv.setAttribute('role', 'alert');
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
        alertDiv.remove();
    }, 3000);
};

const resetForm = () => {
    transaksiIdInput.value = '';
    kategoriInput.value = '';
    jumlahInput.value = '';
    tanggalInput.valueAsDate = new Date();
    deskripsiInput.value = '';
    btnSimpan.textContent = 'Simpan';
    isEditMode = false;
};

btnSimpan.addEventListener('click', () => {
    const id = transaksiIdInput.value;
    if (id) {
        updateTransaksi(parseInt(id));
    } else {
        tambahTransaksi();
    }
});

btnReset.addEventListener('click', resetForm);

btnKonfirmasiHapus.addEventListener('click', deleteTransaksi);

tanggalInput.valueAsDate = new Date();

loadTransaksi();