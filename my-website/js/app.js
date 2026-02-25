/**
 * App Initialization
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Check for legacy data and migrate if needed
    if (Store.migrateLegacyData()) {
        console.log('Legacy data migrated successfully');
    }

    // 2. Initialize Event Listeners

    // Forms
    document.getElementById('tenantForm').addEventListener('submit', (e) => UI.handleAddTenant(e));
    document.getElementById('billForm').addEventListener('submit', (e) => UI.handleCreateBill(e));

    // Modal Background Clicks
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.classList.remove('active');
            }
        });
    });

    // 3. Render Initial View
    UI.renderDashboard();
});
