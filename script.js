document.addEventListener('DOMContentLoaded', function() {
    console.log('Script started at', new Date().toLocaleString());

    // Cache DOM elements
    const elements = {
        principal: document.getElementById('principal'),
        rate: document.getElementById('rate'),
        rateManual: document.getElementById('rate-manual'),
        rateValue: document.getElementById('rate-value'),
        timeYears: document.getElementById('time-years'),
        timeMonths: document.getElementById('time-months'),
        timeDays: document.getElementById('time-days'),
        rateType: document.getElementById('rateType'),
        interestType: document.getElementById('interest-type'),
        calculate: document.getElementById('calculate'),
        result: document.getElementById('result'),
        interest: document.getElementById('interest'),
        total: document.getElementById('total'),
        savePdf: document.getElementById('save-pdf'),
        error: document.getElementById('error'),
        history: document.getElementById('history'),
        clearHistory: document.getElementById('clear-history')
    };

    // Check DOM elements
    console.log('DOM Elements:', Object.keys(elements).reduce((acc, key) => {
        acc[key] = !!elements[key];
        return acc;
    }, {}));

    // Exit if critical elements are missing
    if (!elements.calculate || !elements.result || !elements.interest || !elements.total || !elements.savePdf || !elements.history || !elements.clearHistory) {
        console.error('Critical DOM elements missing');
        alert('Error: Application cannot load. Check console.');
        return;
    }

    // Load history from localStorage
    let history = JSON.parse(localStorage.getItem('interestHistory')) || [];
    updateHistory();

    // Sync rate inputs
    elements.rate.addEventListener('input', function() {
        console.log('Rate slider:', this.value);
        const rateValue = Number(this.value).toFixed(1);
        elements.rateManual.value = rateValue;
        elements.rateValue.textContent = `${rateValue}%`;
    });

    elements.rateManual.addEventListener('input', function() {
        console.log('Rate manual:', this.value);
        let rateValue = Number(this.value);
        if (isNaN(rateValue) || rateValue < 0.1) rateValue = 0.1;
        if (rateValue > 50) rateValue = 50;
        elements.rate.value = rateValue;
        elements.rateValue.textContent = `${rateValue.toFixed(1)}%`;
    });

    // Calculate interest
    elements.calculate.addEventListener('click', function() {
        console.log('Calculate button clicked');

        try {
            // Get inputs
            const principal = Number(elements.principal.value) || 0;
            const rate = Number(elements.rate.value) || 0;
            const years = Number(elements.timeYears.value) || 0;
            const months = Number(elements.timeMonths.value) || 0;
            const days = Number(elements.timeDays.value) || 0;
            const rateType = elements.rateType.value;
            const interestType = elements.interestType.value;

            console.log('Inputs:', { principal, rate, years, months, days, rateType, interestType });

            // Validate inputs
            if (principal <= 0) {
                elements.error.textContent = 'Principal must be positive.';
                elements.error.classList.remove('hidden');
                elements.result.classList.add('hidden');
                console.log('Validation failed: Invalid principal');
                return;
            }
            if (rate < 0.1 || rate > 50) {
                elements.error.textContent = 'Rate must be between 0.1% and 50%.';
                elements.error.classList.remove('hidden');
                elements.result.classList.add('hidden');
                console.log('Validation failed: Invalid rate');
                return;
            }
            const time = years + (months / 12) + (days / 365);
            if (time <= 0) {
                elements.error.textContent = 'Time period must be positive.';
                elements.error.classList.remove('hidden');
                elements.result.classList.add('hidden');
                console.log('Validation failed: Invalid time');
                return;
            }

            elements.error.classList.add('hidden');
            console.log('Validation passed');

            // Calculate
            let interest, total;
            if (rateType === 'perMonth') {
                const monthlyRate = rate / 100;
                const periods = time * 12;
                console.log('Per Month:', { monthlyRate, periods });
                if (interestType === 'simple') {
                    interest = principal * monthlyRate * periods;
                    total = principal + interest;
                } else {
                    total = principal * Math.pow(1 + monthlyRate, periods);
                    interest = total - principal;
                }
            } else {
                console.log('Per Year:', { rate, time });
                if (interestType === 'simple') {
                    interest = (principal * rate * time) / 100;
                    total = principal + interest;
                } else {
                    total = principal * Math.pow(1 + rate / 100, time);
                    interest = total - principal;
                }
            }

            // Store results
            const interestResult = (interest || 0).toFixed(2);
            const totalResult = (total || 0).toFixed(2);
            console.log('Results:', { interest: interestResult, total: totalResult });

            // Update DOM
            elements.interest.textContent = interestResult;
            elements.total.textContent = totalResult;
            elements.result.classList.remove('hidden');
            console.log('DOM updated');

            // Save to history
            const entry = {
                principal,
                rate,
                years,
                months,
                days,
                rateType,
                interestType,
                interest: interestResult,
                total: totalResult,
                date: new Date().toLocaleString()
            };
            history.push(entry);
            localStorage.setItem('interestHistory', JSON.stringify(history));
            updateHistory();
            console.log('History updated:', entry);

            // Save PDF handler
            elements.savePdf.onclick = function() {
                console.log('Save PDF button clicked');
                try {
                    const { jsPDF } = window.jspdf;
                    const doc = new jsPDF();
                    doc.setFontSize(16);
                    doc.text('Interest Calculator Results', 10, 10);
                    doc.setFontSize(12);
                    doc.text(`Principal: ₹${principal}`, 10, 20);
                    doc.text(`Rate: ${rate}% (${rateType})`, 10, 30);
                    doc.text(`Time: ${years} years, ${months} months, ${days} days`, 10, 40);
                    doc.text(`Interest Type: ${interestType}`, 10, 50);
                    doc.text(`Interest: ₹${interestResult}`, 10, 60);
                    doc.text(`Total: ₹${totalResult}`, 10, 70);
                    doc.save('interest_calculation.pdf');
                    console.log('PDF saved');
                } catch (error) {
                    console.error('PDF Error:', error.message);
                    elements.error.textContent = 'Failed to save PDF. Check console.';
                    elements.error.classList.remove('hidden');
                }
            };
        } catch (error) {
            console.error('Error:', error.message);
            elements.error.textContent = 'Calculation failed. Check console.';
            elements.error.classList.remove('hidden');
            elements.result.classList.add('hidden');
        }
    });

    // Clear history
    elements.clearHistory.addEventListener('click', function() {
        console.log('Clear History button clicked');
        history = [];
        localStorage.setItem('interestHistory', JSON.stringify(history));
        updateHistory();
    });

    // Update history display
    function updateHistory() {
        if (!elements.history) {
            console.error('History element missing');
            return;
        }
        elements.history.innerHTML = '';
        history.forEach(entry => {
            const li = document.createElement('li');
            li.className = 'text-sm text-yellow-200';
            li.textContent = `${entry.date}: ₹${entry.principal}, ${entry.rate}% ${entry.rateType}, ${entry.years}y ${entry.months}m ${entry.days}d, ${entry.interestType}, Interest: ₹${entry.interest}, Total: ₹${entry.total}`;
            elements.history.appendChild(li);
        });
        console.log('History updated:', history.length, 'entries');
    }
});
