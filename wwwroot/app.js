const API_URL = '/api/medicine';

// Load medicines on page load
document.addEventListener('DOMContentLoaded', () => {
    loadMedicines();
    setupFormSubmit();
});

// Load all medicines
async function loadMedicines() {
    try {
        const response = await fetch(API_URL);
        const medicines = await response.json();
        displayMedicines(medicines);
        updateStatistics(medicines);
    } catch (error) {
        console.error('Error loading medicines:', error);
        alert('Failed to load medicines');
    }
}

// Display medicines in table
function displayMedicines(medicines) {
    const tbody = document.getElementById('medicinesBody');
    tbody.innerHTML = '';

    if (medicines.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">No medicines found</td></tr>';
        return;
    }

    medicines.forEach(medicine => {
        const row = document.createElement('tr');

        // Apply color coding
        const rowClass = getRowClass(medicine);
        if (rowClass) {
            row.className = rowClass;
        }

        row.innerHTML = `
            <td>${medicine.id}</td>
            <td><strong>${medicine.fullName}</strong></td>
            <td>${medicine.brand}</td>
            <td>${formatDate(medicine.expiryDate)}</td>
            <td>${medicine.quantity}</td>
            <td>$${medicine.price.toFixed(2)}</td>
            <td>
                <button class="action-btn sale-btn" onclick="recordSale(${medicine.id}, '${medicine.fullName}')">
                    Sale
                </button>
            </td>
        `;

        tbody.appendChild(row);
    });
}

// Determine row class based on business rules
function getRowClass(medicine) {
    const today = new Date();
    const expiryDate = new Date(medicine.expiryDate);
    const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));

    // Red background for medicines expiring in less than 30 days
    if (daysUntilExpiry < 30) {
        return 'expiring-soon';
    }

    // Yellow background for medicines with quantity less than 10
    if (medicine.quantity < 10) {
        return 'low-stock';
    }

    return '';
}

// Update statistics dashboard
function updateStatistics(medicines) {
    const today = new Date();

    const totalMedicines = medicines.length;
    const lowStock = medicines.filter(m => m.quantity < 10).length;
    const expiringSoon = medicines.filter(m => {
        const expiryDate = new Date(m.expiryDate);
        const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
        return daysUntilExpiry < 30;
    }).length;

    document.getElementById('totalMedicines').textContent = totalMedicines;
    document.getElementById('lowStock').textContent = lowStock;
    document.getElementById('expiringSoon').textContent = expiringSoon;
}

// Setup form submit handler
function setupFormSubmit() {
    const form = document.getElementById('medicineForm');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await addMedicine();
    });
}

// Add new medicine
async function addMedicine() {
    const medicine = {
        fullName: document.getElementById('fullName').value,
        notes: document.getElementById('notes').value,
        expiryDate: document.getElementById('expiryDate').value,
        quantity: parseInt(document.getElementById('quantity').value),
        price: parseFloat(document.getElementById('price').value),
        brand: document.getElementById('brand').value
    };

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(medicine)
        });

        if (response.ok) {
            alert('Medicine added successfully!');
            document.getElementById('medicineForm').reset();
            loadMedicines();
        } else {
            alert('Failed to add medicine');
        }
    } catch (error) {
        console.error('Error adding medicine:', error);
        alert('Error adding medicine');
    }
}

// Search medicines
async function searchMedicines() {
    const searchTerm = document.getElementById('searchInput').value.trim();

    if (!searchTerm) {
        loadMedicines();
        return;
    }

    try {
        const response = await fetch(`${API_URL}/search/${searchTerm}`);
        const medicines = await response.json();
        displayMedicines(medicines);
        updateStatistics(medicines);
    } catch (error) {
        console.error('Error searching medicines:', error);
        alert('Search failed');
    }
}

// Record sale
async function recordSale(id, medicineName) {
    const quantity = prompt(`Enter quantity to sell for ${medicineName}:`, '1');

    if (!quantity || quantity <= 0) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/${id}/sale?quantity=${quantity}`, {
            method: 'POST'
        });

        if (response.ok) {
            const result = await response.json();
            alert(`Sale recorded! Remaining quantity: ${result.remainingQuantity}`);
            loadMedicines();
        } else {
            const error = await response.text();
            alert(`Sale failed: ${error}`);
        }
    } catch (error) {
        console.error('Error recording sale:', error);
        alert('Error recording sale');
    }
}

// Format date helper
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Allow search on Enter key
document.getElementById('searchInput')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        searchMedicines();
    }
});