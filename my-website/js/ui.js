/**
 * UI Controller
 */

const UI = {
    // State
    currentView: 'dashboard',
    activeTenantId: null,

    // DOM Elements
    app: document.getElementById('app'),

    // --- Views ---

    renderDashboard() {
        this.currentView = 'dashboard';
        const tenants = Store.getTenants();

        let html = `
            <div class="flex justify-between items-center mb-4">
                <h2 class="text-xl font-bold">المستأجرين</h2>
                <div class="flex gap-2">
                    <button class="btn btn-secondary" onclick="UI.exportToExcel()">
                        <ion-icon name="download-outline"></ion-icon> تصدير إكسل
                    </button>
                    <button class="btn btn-primary" onclick="UI.openModal('tenantModal')">
                        <ion-icon name="add-outline"></ion-icon> مستأجر جديد
                    </button>
                </div>
            </div>
            <div class="dashboard-grid">
        `;

        if (tenants.length === 0) {
            html += `
                <div class="col-span-full text-center py-10">
                    <p class="text-gray-500">لا يوجد مستأجرين حالياً. ابدأ بإضافة مستأجر جديد.</p>
                </div>
            `;
        } else {
            tenants.forEach(tenant => {
                // Get latest bill for summary
                const bills = Store.getTenantBills(tenant.id);
                const lastBill = bills[0];
                const lastReading = lastBill ? lastBill.curr : 0;

                html += `
                    <div class="card cursor-pointer" onclick="UI.renderTenantDetails('${tenant.id}')">
                        <div class="card-header">
                            <span class="tenant-name">${tenant.name}</span>
                            <span class="badge bg-green-100 text-green-800 px-2 py-1 rounded text-xs">نشط</span>
                        </div>
                        <div class="tenant-meta">
                            <ion-icon name="home-outline"></ion-icon> شقة: ${tenant.apartmentNumber}
                        </div>
                        <div class="tenant-meta">
                            <ion-icon name="speedometer-outline"></ion-icon> آخر قراءة: ${lastReading}
                        </div>
                        <div class="mt-4 flex gap-2">
                            <button class="btn btn-secondary w-full" onclick="event.stopPropagation(); UI.openBillModal('${tenant.id}')">
                                <ion-icon name="receipt-outline"></ion-icon> فاتورة جديدة
                            </button>
                        </div>
                    </div>
                `;
            });
        }

        html += `</div>`;
        this.app.innerHTML = html;
    },

    renderTenantDetails(tenantId) {
        this.currentView = 'details';
        this.activeTenantId = tenantId;
        const tenant = Store.getTenant(tenantId);
        const bills = Store.getTenantBills(tenantId);

        if (!tenant) return this.renderDashboard();

        let html = `
            <button class="btn btn-outline mb-4" onclick="UI.renderDashboard()">
                <ion-icon name="arrow-forward-outline"></ion-icon> العودة للقائمة
            </button>
            
            <div class="tenant-details-header card mb-4">
                <div>
                    <h2 class="text-2xl font-bold text-primary">${tenant.name}</h2>
                    <p class="text-gray-500">شقة: ${tenant.apartmentNumber} | عداد: ${tenant.meterNumber || '-'}</p>
                </div>
                <div class="flex gap-2">
                    <button class="btn btn-secondary" onclick="UI.openBillModal('${tenant.id}')">
                        <ion-icon name="add-circle-outline"></ion-icon> فاتورة جديدة
                    </button>
                    <button class="btn btn-danger" onclick="UI.deleteTenant('${tenant.id}')">
                        <ion-icon name="trash-outline"></ion-icon> حذف
                    </button>
                </div>
            </div>

            <div class="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th>التاريخ</th>
                            <th>القراءة السابقة</th>
                            <th>القراءة الحالية</th>
                            <th>الاستهلاك</th>
                            <th>المبلغ الإجمالي</th>
                            <th>حالة السداد</th>
                            <th>إجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        if (bills.length === 0) {
            html += `<tr><td colspan="6" class="text-center py-4">لا توجد فواتير مسجلة</td></tr>`;
        } else {
            bills.forEach(bill => {
                html += `
                    <tr>
                        <td data-label="التاريخ">${new Date(bill.date).toLocaleDateString('ar-SA')}</td>
                        <td data-label="القراءة السابقة">${bill.prev}</td>
                        <td data-label="القراءة الحالية">${bill.curr}</td>
                        <td data-label="الاستهلاك">${bill.usage}</td>
                        <td data-label="المبلغ" class="font-bold text-green-600">${bill.total} ريال</td>
                        <td data-label="حالة السداد">
                            <select onchange="UI.changePaymentStatus('${bill.id}', this.value)" style="padding: 4px; border-radius: 4px; font-size: 0.8rem; border: 1px solid #d1d5db; background-color: ${bill.isPaid ? '#d1fae5' : '#fee2e2'}; color: ${bill.isPaid ? '#065f46' : '#991b1b'}; cursor: pointer;">
                                <option value="false" ${!bill.isPaid ? 'selected' : ''}>غير مسددة</option>
                                <option value="true" ${bill.isPaid ? 'selected' : ''}>مسددة</option>
                            </select>
                        </td>
                        <td data-label="إجراءات" class="actions-cell">
                            <button class="btn btn-sm btn-outline" onclick="UI.printBill('${bill.id}')">
                                <ion-icon name="print-outline"></ion-icon> طباعة
                            </button>
                             <button class="btn btn-sm btn-danger text-white py-1 px-2 text-xs" onclick="UI.deleteBill('${bill.id}')">
                                <ion-icon name="trash-outline"></ion-icon> حذف
                            </button>
                        </td>
                    </tr>
                `;
            });
        }

        html += `</tbody></table></div>`;
        this.app.innerHTML = html;
    },

    // --- Actions ---

    openModal(modalId) {
        document.getElementById(modalId).classList.add('active');
    },

    closeModal(modalId) {
        document.getElementById(modalId).classList.remove('active');
        // Reset forms
        if (modalId === 'tenantModal') document.getElementById('tenantForm').reset();
        if (modalId === 'billModal') document.getElementById('billForm').reset();
    },

    handleAddTenant(e) {
        e.preventDefault();
        const name = document.getElementById('tenantName').value;
        const apt = document.getElementById('tenantApt').value;
        const meter = document.getElementById('tenantMeter').value;
        const phone = document.getElementById('tenantPhone').value;

        Store.addTenant({
            name,
            apartmentNumber: apt,
            meterNumber: meter,
            phone
        });

        this.closeModal('tenantModal');
        this.renderDashboard();
    },

    deleteTenant(id) {
        if (confirm('هل أنت متأكد من حذف هذا المستأجر وجميع فواتيره؟')) {
            Store.deleteTenant(id);
            this.renderDashboard();
        }
    },

    openBillModal(tenantId) {
        const tenant = Store.getTenant(tenantId);
        if (!tenant) return;

        // Auto-fill previous reading from last bill
        const bills = Store.getTenantBills(tenantId);
        const lastBill = bills[0]; // Sorted by newest first in Store
        const prevReading = lastBill ? lastBill.curr : 0;

        document.getElementById('billTenantId').value = tenantId;
        document.getElementById('billTenantName').value = tenant.name;
        document.getElementById('prevReading').value = prevReading;
        document.getElementById('currReading').value = '';
        if (document.getElementById('directUsage')) {
            document.getElementById('directUsage').value = '';
        }

        if (document.getElementById('isPaid')) {
            document.getElementById('isPaid').value = 'false';
        }

        this.updateBillPreview();
        this.openModal('billModal');
    },

    updateBillPreview() {
        const prev = parseFloat(document.getElementById('prevReading').value) || 0;
        const curr = parseFloat(document.getElementById('currReading').value) || 0;
        const directUsageElem = document.getElementById('directUsage');
        const directUsageStr = directUsageElem ? directUsageElem.value : '';
        const directUsage = directUsageStr !== '' ? parseFloat(directUsageStr) : null;
        const fee = parseFloat(document.getElementById('meterFee').value) || 0;

        const result = Billing.calculate(prev, curr, fee, directUsage);

        document.getElementById('previewUsage').textContent = result.usage + ' ك.و.س';
        document.getElementById('previewSubtotal').textContent = result.subtotal + ' ريال';
        document.getElementById('previewVat').textContent = result.vat + ' ريال';
        document.getElementById('previewTotal').textContent = result.total + ' ريال';
    },

    handleCreateBill(e) {
        e.preventDefault();
        const tenantId = document.getElementById('billTenantId').value;
        const prev = parseFloat(document.getElementById('prevReading').value) || 0;
        const curr = parseFloat(document.getElementById('currReading').value) || 0;
        const directUsageElem = document.getElementById('directUsage');
        const directUsageStr = directUsageElem ? directUsageElem.value : '';
        const directUsage = directUsageStr !== '' ? parseFloat(directUsageStr) : null;
        const fee = parseFloat(document.getElementById('meterFee').value) || 0;

        if (directUsage === null && curr < prev) {
            alert('خطأ: القراءة الحالية أقل من السابقة!');
            return;
        }

        const isPaid = document.getElementById('isPaid') ? (document.getElementById('isPaid').value === 'true') : false;

        const result = Billing.calculate(prev, curr, fee, directUsage);

        Store.addBill({
            tenantId,
            prev: directUsage !== null ? 0 : prev,
            curr: directUsage !== null ? 0 : curr,
            ...result,
            isPaid: isPaid,
            date: new Date().toISOString()
        });

        this.closeModal('billModal');

        // Refresh current View
        if (this.currentView === 'details' && this.activeTenantId === tenantId) {
            this.renderTenantDetails(tenantId);
        } else {
            this.renderDashboard();
        }
    },

    changePaymentStatus(billId, valueStr) {
        const isPaid = valueStr === 'true';
        const bills = Store.getBills();
        const bill = bills.find(b => b.id === billId);
        if (bill) {
            Store.updateBill(billId, { isPaid: isPaid });
            if (this.currentView === 'details') {
                this.renderTenantDetails(this.activeTenantId);
            }
        }
    },

    deleteBill(id) {
        if (confirm('حذف الفاتورة؟')) {
            Store.deleteBill(id);
            // Refresh
            if (this.currentView === 'details') {
                this.renderTenantDetails(this.activeTenantId);
            }
        }
    },

    // --- Printing ---
    printBill(billId) {
        const bills = Store.getBills();
        const bill = bills.find(b => b.id === billId);
        if (!bill) return;

        const tenant = Store.getTenant(bill.tenantId);

        const printArea = document.getElementById('printArea');
        printArea.innerHTML = `
            <div class="invoice-container">
                <div class="invoice-header">
                    <div class="invoice-title">
                        <h1>فاتورة الكهرباء</h1>
                        <p style="font-size: 1rem; color: #555; margin-top: 5px;">${new Date(bill.date).toLocaleDateString('ar-SA')}</p>
                    </div>
                </div>

                <div class="invoice-details">
                    <div class="detail-group">
                        <h3>بيانات المستأجر</h3>
                        <p>${tenant.name}</p>
                        <p style="font-size: 0.9rem; font-weight: normal;">شقة: ${tenant.apartmentNumber}</p>
                    </div>
                    <div class="detail-group">
                        <h3>تفاصيل العداد</h3>
                        <p>حساب: ${tenant.meterNumber || '-'}</p>
                        <p style="font-size: 0.9rem; font-weight: normal;">الحالة: نشط</p>
                    </div>
                </div>

                <table class="invoice-table">
                    <thead>
                        <tr>
                            <th>البيان</th>
                            <th style="text-align: center;">التفاصيل</th>
                            <th style="text-align: left;">القيمة</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>القراءة الحالية</td>
                            <td style="text-align: center;">${bill.curr}</td>
                            <td style="text-align: left;">-</td>
                        </tr>
                        <tr>
                            <td>القراءة السابقة</td>
                            <td style="text-align: center;">${bill.prev}</td>
                            <td style="text-align: left;">-</td>
                        </tr>
                        <tr>
                            <td><strong>الاستهلاك الفعلي</strong></td>
                            <td style="text-align: center;"><strong>${bill.usage} ك.و.س</strong></td>
                            <td style="text-align: left;">${(bill.usage * bill.rate).toFixed(2)} ريال</td>
                        </tr>

                    </tbody>
                </table>

                <div class="invoice-summary">
                    <div class="summary-box">
                        <div class="summary-row">
                            <span>المجموع قبل الضريبة</span>
                            <span>${bill.subtotal.toFixed(2)} ريال</span>
                        </div>
                        <div class="summary-row">
                            <span>ضريبة القيمة المضافة (15%)</span>
                            <span>${bill.vat.toFixed(2)} ريال</span>
                        </div>
                        <div class="summary-row total">
                            <span>الإجمالي المستحق</span>
                            <span>${bill.total.toFixed(2)} ريال</span>
                        </div>
                    </div>
                </div>

                <div class="invoice-footer">
                    <p>شكراً لتعاونكم - هذه فاتورة إلكترونية غير رسمية </p>
                    <p>Generated by TPI</p>
                </div>
            </div>
        `;

        setTimeout(() => window.print(), 200);
    },

    // --- Helper ---
    formatDate(dateStr) {
        if (!dateStr) return '-';

        // Handle legacy dd/mm/yyyy format
        if (dateStr.includes('/')) {
            const parts = dateStr.split('/');
            if (parts.length === 3) {
                // Assuming dd/mm/yyyy, convert to yyyy-mm-dd
                // But check if it's already MM/DD/YYYY? 
                // The legacy code used en-GB so it is dd/mm/yyyy
                return `${parts[2]}-${parts[1]}-${parts[0]}`;
            }
        }

        try {
            return new Date(dateStr).toLocaleDateString('en-GB');
        } catch (e) {
            return dateStr;
        }
    },

    exportToExcel() {
        const bills = Store.getBills();
        if (!bills || bills.length === 0) {
            alert("لا توجد فواتير لتصديرها");
            return;
        }

        // Use semicolon (;) for better compatibility with Arabic Excel
        const separator = ";";
        let csvContent = "\uFEFF"; // BOM for Arabic support

        // Headers (quoted)
        const headers = ["التاريخ", "اسم المستأجر", "رقم الشقة", "رقم حساب العداد", "القراءة السابقة", "القراءة الحالية", "الاستهلاك", "سعر الوحدة", "الرسوم", "الضريبة", "الإجمالي", "حالة السداد"];
        csvContent += headers.map(h => `"${h}"`).join(separator) + "\n";

        bills.forEach(bill => {
            try {
                const tenant = Store.getTenant(bill.tenantId);
                const tenantName = tenant ? tenant.name : 'مستأجر محذوف';
                const apartment = tenant ? tenant.apartmentNumber : '-';
                const meter = tenant ? tenant.meterNumber || '' : '-';

                // Safe date handling
                let billDate = bill.date || '-';
                // If it's already formatted as dd/mm/yyyy legacy
                if (billDate.includes('/') && billDate.split('/').length === 3) {
                    // Keep as is
                } else {
                    try {
                        billDate = new Date(bill.date).toLocaleDateString('en-GB');
                        if (billDate === 'Invalid Date') billDate = bill.date;
                    } catch (e) {
                        billDate = bill.date;
                    }
                }

                const row = [
                    billDate,
                    tenantName,
                    apartment,
                    meter,
                    (bill.prev !== undefined && bill.prev !== null) ? bill.prev : 0,
                    (bill.curr !== undefined && bill.curr !== null) ? bill.curr : 0,
                    (bill.usage !== undefined && bill.usage !== null) ? bill.usage : 0,
                    (bill.rate !== undefined && bill.rate !== null) ? bill.rate : 0,
                    (bill.fee !== undefined && bill.fee !== null) ? bill.fee : 0,
                    (bill.vat !== undefined && bill.vat !== null) ? bill.vat : 0,
                    (bill.total !== undefined && bill.total !== null) ? bill.total : 0,
                    bill.isPaid ? 'مسددة' : 'غير مسددة'
                ];

                // Quote all values and join with separator
                csvContent += row.map(val => `"${val}"`).join(separator) + "\n";
            } catch (err) {
                console.error("Error exporting row", err, bill);
            }
        });

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `فواتير_الكهرباء_${new Date().toLocaleDateString('en-GB').replace(/\//g, '-')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};

window.UI = UI;
