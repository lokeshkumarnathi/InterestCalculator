// Cache DOM elements for efficiency
const elements = {
    principal: document.getElementById('principal'),
    rate: document.getElementById('rate'),
    rateValue: document.getElementById('rate-value'),
    timeYears: document.getElementById('time-years'),
    timeMonths: document.getElementById('time-months'),
    timeDays: document.getElementById('time-days'),
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

// Update rate display
elements.rate.addEventListener('input', function() {
    const rateValue = parseFloat(this.value).toFixed(1);
    elements.rateValue.textContent = `${rateValue}%`;
});

// Calculate interest
elements.calculate.addEventListener('click', function() {
    const principal = parseFloat(elements.principal.value);
    const rate = parseFloat(elements.rate.value);
    const years = parseFloat(elements.timeYears.value) || 0;
    const months = parseFloat(elements.timeMonths.value) || 0;
    const days = parseFloat(elements.timeDays.value) || 0;
    const interestType = elements.interestType.value;

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
        total = principal * Math.pow(1 + rate / 100, time);
        interest = total - principal;
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
    const data = interestType === 'simple'
        ? yearsArray.map(y => principal + (principal * rate * y) / 100)
        : yearsArray.map(y => principal * Math.pow(1 + rate / 100, y));
    chart.data.labels = yearsArray;
    chart.data.datasets[0].data = data;
    chart.update({ duration: 300 }); // Smooth update with minimal re-render
});

// Save as PDF
elements.savePdf.addEventListener('click', function() {
    // Check if results are available
    if (!latestResult.interest || !latestResult.total || elements.result.classList.contains('hidden')) {
        elements.error.textContent = 'Please calculate interest before saving as PDF.';
        elements.error.classList.remove('hidden');
        return;
    }

    elements.error.classList.add('hidden');
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.setTextColor(255, 215, 0); // Yellow text
    doc.text('Interest Calculation Result', 20, 20);
    doc.setFontSize(12);
    doc.setTextColor(255, 255, 255); // White text for details
    doc.text(`Principal: ₹${elements.principal.value}`, 20, 30);
    doc.text(`Rate: ${elements.rate.value}%`, 20, 40);
    doc.text(`Time: ${elements.timeYears.value || 0}y ${elements.timeMonths.value || 0}m ${elements.timeDays.value || 0}d`, 20, 50);
    doc.text(`Interest Type: ${elements.interestType.value}`, 20, 60);
    doc.text(`Interest: ₹${latestResult.interest}`, 20, 70);
    doc.text(`Total Amount: ₹${latestResult.total}`, 20, 80);
    doc.save('interest_calculation.pdf');
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
        li.textContent = `${entry.date}: ₹${entry.principal}, ${entry.rate}%, ${entry.years}y ${entry.months}m ${entry.days}d, ${entry.interestType}, Interest: ₹${entry.interest}, Total: ₹${entry.total}`;
        elements.history.appendChild(li);
    });
}
