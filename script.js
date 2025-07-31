// Cache DOM elements for efficiency
const elements = {
    principal: document.getElementById('principal'),
    rate: document.getElementById('rate'),
    rateManual: document.getElementById('rate-manual'),
    rateValue: document.getElementById('rate-value'),
    timeYears: document.getElementById('time-years'),
    timeMonths: document.getElementById('time-months'),
    timeDays: document.getElementById('time-days'),
    interestType: document.getElementById('interest-type'),
    frequency: document.getElementById('frequency'),
    calculate: document.getElementById('calculate'),
    result: document.getElementById('result'),
    interest: document.getElementById('interest'),
    total: document.getElementById('total'),
    savePdf: document.getElementById('save-pdf'),
    error: document.getElementById('error'),
    history: document.getElementById('history'),
    clearHistory: document.getElementById('clear-history')
};

// Store latest calculation results
let latestResult = { interest: null, total: null };

// Initialize Chart.js
const ctx = document.getElementById('interestChart').getContext('2d');
let chart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: 'Interest Growth',
            data: [],
            borderColor: '#FFD700',
            backgroundColor: 'rgba(255, 215, 0, 0.2)',
            fill: true,
            tension: 0.4
        }]
    },
    options: {
        responsive: true,
        plugins: {
            tooltip: { enabled: true },
            legend: { display: true, labels: { color: '#FFD700' } }
        },
        scales: {
            y: { 
                beginAtZero: true, 
                title: { display: true, text: 'Amount (₹)', color: '#FFD700' },
                ticks: { color: '#FFD700' },
                grid: { color: 'rgba(255, 215, 0, 0.1)' }
            },
            x: { 
                title: { display: true, text: 'Year', color: '#FFD700' },
                ticks: { color: '#FFD700' },
                grid: { color: 'rgba(255, 215, 0, 0.1)' }
            }
        }
    }
});

// Load history from local storage
let history = JSON.parse(localStorage.getItem('interestHistory')) || [];
updateHistory();

// Sync rate inputs
elements.rate.addEventListener('input', function() {
    const rateValue = parseFloat(this.value).toFixed(1);
    elements.rateManual.value = rateValue;
    elements.rateValue.textContent = `${rateValue}%`;
});

elements.rateManual.addEventListener('input', function() {
    let rateValue = parseFloat(this.value);
    if (rateValue < 1) rateValue = 1;
    if (rateValue > 50) rateValue = 50;
    elements.rate.value = rateValue;
    elements.rateValue.textContent = `${rateValue.toFixed(1)}%`;
});

// Calculate interest
elements.calculate.addEventListener('click', function() {
    const principal = parseFloat(elements.principal.value);
    const rate = parseFloat(elements.rate.value);
    const years = parseFloat(elements.timeYears.value) || 0;
    const months = parseFloat(elements.timeMonths.value) || 0;
    const days = parseFloat(elements.timeDays.value) || 0;
    const interestType = elements.interestType.value;
    const frequency = elements.frequency.value;

    // Convert time to years
    const time = years + (months / 12) + (days / 365);

    // Validation
    if (!principal || isNaN(principal) || principal < 0 || time <= 0) {
        elements.error.textContent = 'Please enter valid positive numbers for principal and at least one time period (years, months, or days).';
        elements.error.classList.remove('hidden');
        elements.result.classList.add('hidden');
        return;
    }

    elements.error.classList.add('hidden');
    let interest, total;

    if (interestType === 'simple') {
        interest = (principal * rate * time) / 100;
        total = principal + interest;
    } else {
        if (frequency === 'monthly') {
            const monthlyRate = rate / 1200; // Convert annual rate to monthly percentage
            const periods = time * 12; // Convert time to months
            total = principal * Math.pow(1 + monthlyRate, periods);
            interest = total - principal;
        } else {
            total = principal * Math.pow(1 + rate / 100, time);
            interest = total - principal;
        }
    }

    // Store results
    latestResult.interest = interest.toFixed(2);
    latestResult.total = total.toFixed(2);

    elements.interest.textContent = latestResult.interest;
    elements.total.textContent = latestResult.total;
    elements.result.classList.remove('hidden');

    // Save to history
    const entry = { 
        principal, 
        rate, 
        years, 
        months, 
        days, 
        interestType, 
        frequency, 
        interest: latestResult.interest, 
        total: latestResult.total, 
        date: new Date().toLocaleString() 
    };
    history.push(entry);
    localStorage.setItem('interestHistory', JSON.stringify(history));
    updateHistory();

    // Update chart efficiently
    const totalYears = Math.ceil(time); // Round up to include partial years
    const yearsArray = Array.from({ length: totalYears }, (_, i) => i);
    let data;
    if (interestType === 'simple') {
        data = yearsArray.map(y => principal + (principal * rate * y) / 100);
    } else if (frequency === 'monthly') {
        data = yearsArray.map(y => principal * Math.pow(1 + rate / 1200, y * 12));
    } else {
        data = yearsArray.map(y => principal * Math.pow(1 + rate / 100, y));
    }
    chart.data.labels = yearsArray;
    chart.data.datasets[0].data = data;
    chart.update({ duration: 300 }); // Smooth update with minimal re-render
});

// Save as PDF
elements.savePdf.addEventListener('click', function() {
    // Check if results are available and valid
    if (elements.result.classList.contains('hidden') || !elements.interest.textContent || !elements.total.textContent || !latestResult.interest || !latestResult.total) {
        elements.error.textContent = 'Please calculate interest before saving as PDF.';
        elements.error.classList.remove('hidden');
        return;
    }

    elements.error.classList.add('hidden');

    // Debug: Log values to verify
    console.log('Generating PDF with values:');
    console.log('Principal:', elements.principal.value);
    console.log('Rate:', elements.rate.value);
    console.log('Time:', `${elements.timeYears.value || 0}y ${elements.timeMonths.value || 0}m ${elements.timeDays.value || 0}d`);
    console.log('Interest Type:', elements.interestType.value);
    console.log('Frequency:', elements.frequency.value);
    console.log('Interest:', elements.interest.textContent);
    console.log('Total:', elements.total.textContent);

    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Prepare formatted text
        const text = [
            'Interest Calculation Result',
            '',
            `Principal: ₹${parseFloat(elements.principal.value || 0).toFixed(2)}`,
            `Rate: ${parseFloat(elements.rate.value || 0).toFixed(1)}%`,
            `Time: ${elements.timeYears.value || 0}y ${elements.timeMonths.value || 0}m ${elements.timeDays.value || 0}d`,
            `Interest Type: ${elements.interestType.value}`,
            `Frequency: ${elements.frequency.value}`,
            `Interest: ₹${parseFloat(elements.interest.textContent || 0).toFixed(2)}`,
            `Total Amount: ₹${parseFloat(elements.total.textContent || 0).toFixed(2)}`
        ].join('\n');

        // Set font and colors
        doc.setFontSize(12);
        doc.setTextColor(255, 255, 255); // White text
        doc.setFont('helvetica', 'normal');

        // Add text to PDF
        doc.text(text, 20, 20);

        // Save PDF
        doc.save('interest_calculation.pdf');
    } catch (error) {
        console.error('Error generating PDF:', error);
        elements.error.textContent = 'Error generating PDF. Please try again.';
        elements.error.classList.remove('hidden');
    }
});

// Clear history
elements.clearHistory.addEventListener('click', function() {
    history = [];
    localStorage.setItem('interestHistory', JSON.stringify(history));
    updateHistory();
});

// Update history display
function updateHistory() {
    elements.history.innerHTML = '';
    history.forEach(entry => {
        const li = document.createElement('li');
        li.className = 'text-sm text-yellow-200';
        li.textContent = `${entry.date}: ₹${entry.principal}, ${entry.rate}%, ${entry.years}y ${entry.months}m ${entry.days}d, ${entry.interestType}, ${entry.frequency}, Interest: ₹${entry.interest}, Total: ₹${entry.total}`;
        elements.history.appendChild(li);
    });
}
