/**
 * Store Service - Manages data persistence
 */

const Store = {
    // Keys
    KEYS: {
        TENANTS: 'tpi_tenants',
        BILLS: 'tpi_bills'
    },

    // Utilities
    _get(key) {
        return JSON.parse(localStorage.getItem(key)) || [];
    },

    _set(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    },

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    // Tenants
    getTenants() {
        return this._get(this.KEYS.TENANTS);
    },

    getTenant(id) {
        return this.getTenants().find(t => t.id === id);
    },

    addTenant(tenantData) {
        const tenants = this.getTenants();
        const newTenant = {
            id: this.generateId(),
            createdAt: new Date().toISOString(),
            ...tenantData
        };
        tenants.push(newTenant);
        this._set(this.KEYS.TENANTS, tenants);
        return newTenant;
    },

    updateTenant(id, updates) {
        let tenants = this.getTenants();
        tenants = tenants.map(t => t.id === id ? { ...t, ...updates } : t);
        this._set(this.KEYS.TENANTS, tenants);
    },

    deleteTenant(id) {
        let tenants = this.getTenants();
        tenants = tenants.filter(t => t.id !== id);
        this._set(this.KEYS.TENANTS, tenants);
        // Also delete associated bills? Or keep them?
        // For now, let's keep bills but maybe mark them as orphan or just delete them.
        // Let's delete them to keep it clean.
        let bills = this.getBills();
        bills = bills.filter(b => b.tenantId !== id);
        this._set(this.KEYS.BILLS, bills);
    },

    // Bills
    getBills() {
        return this._get(this.KEYS.BILLS);
    },

    getTenantBills(tenantId) {
        return this.getBills()
            .filter(b => b.tenantId === tenantId)
            .sort((a, b) => new Date(b.date) - new Date(a.date)); // Newest first
    },

    addBill(billData) {
        const bills = this.getBills();
        const newBill = {
            id: this.generateId(),
            createdAt: new Date().toISOString(),
            ...billData
        };
        bills.push(newBill);
        this._set(this.KEYS.BILLS, bills);
        return newBill;
    },

    updateBill(id, updates) {
        let bills = this.getBills();
        bills = bills.map(b => b.id === id ? { ...b, ...updates } : b);
        this._set(this.KEYS.BILLS, bills);
    },

    deleteBill(id) {
        let bills = this.getBills();
        bills = bills.filter(b => b.id !== id);
        this._set(this.KEYS.BILLS, bills);
    },

    // Legacy Migration (One-time)
    migrateLegacyData() {
        const legacyBills = JSON.parse(localStorage.getItem('electricityBills'));
        if (legacyBills && legacyBills.length > 0 && this.getTenants().length === 0) {
            console.log('Migrating legacy data...');
            // Simple migration: Create tenants from unique names in bills
            const uniqueNames = [...new Set(legacyBills.map(b => b.tenant))];

            uniqueNames.forEach(name => {
                const sampleBill = legacyBills.find(b => b.tenant === name);
                const tenant = this.addTenant({
                    name: name,
                    apartmentNumber: sampleBill.apartment || '',
                    meterNumber: sampleBill.meterAccount || '',
                    phone: ''
                });

                // Link bills to this tenant
                const tenantBills = legacyBills.filter(b => b.tenant === name);
                tenantBills.forEach(b => {
                    this.addBill({
                        ...b,
                        tenantId: tenant.id,
                        date: b.date // Ensure date format matches if needed
                    });
                });
            });

            // Rename legacy key to avoid re-migration
            localStorage.setItem('electricityBills_backup', JSON.stringify(legacyBills));
            localStorage.removeItem('electricityBills');
            return true;
        }
        return false;
    }
};

window.Store = Store;
