/**
 * Billing Service - Handles calculations
 */

const Billing = {
    // Configuration
    RATES: {
        TIER_1: 0.18,
        TIER_2: 0.30,
        LIMIT_1: 6000,
        VAT: 0.15
    },

    calculate(prev, curr, fee = 0, directUsage = null) {
        let usage = 0;
        if (directUsage !== null && !isNaN(directUsage)) {
            usage = directUsage;
        } else {
            usage = curr - prev;
        }
        if (usage < 0) usage = 0;

        // Round usage to 2 decimals
        usage = parseFloat(usage.toFixed(2));

        let rate = this.RATES.TIER_1;
        if (usage > this.RATES.LIMIT_1) {
            rate = this.RATES.TIER_2;
        }

        const cost = usage * rate;
        const subtotal = cost + fee;
        const vat = subtotal * this.RATES.VAT;
        const total = subtotal + vat;

        return {
            usage,
            rate,
            cost: parseFloat(cost.toFixed(2)),
            fee: parseFloat(fee.toFixed(2)),
            subtotal: parseFloat(subtotal.toFixed(2)),
            vat: parseFloat(vat.toFixed(2)),
            total: parseFloat(total.toFixed(2))
        };
    }
};

window.Billing = Billing;
