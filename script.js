// Cache DOM elements for efficiency
const elements = {
    principal: document.getElementById('principal'),
    rate: document.getElementById('rate'),
    rateManual: document.getElementById('rate-manual'),
    rateValue: document.getElementById('rate-value'),
    timeYears: document.getElementById('time-years'),
    timeMonths: document.getElementById('time-months'),
    timeDays: document.getElementById('time-days'),
    frequency: document.getElementById('frequency'),
    interestType: document.getElementById('interest-type'),
    calculate: document.getElementById('calculate'),
    result: document.getElementById('result'),
    interest: document.getElementById('interest'),
    total: document.getElementById('total'),
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
                title: { display: true, text: 'Period', color: '#FFD700' },
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
    if (isNaN(rateValue) || rateValue < 1) rateValue = 1;
    if (rateValue > 50) rateValue = 50;
    elements.rate.value = rateValue;
    elements.rateValue.textContent = `${rateValue.toFixed(1)}%`;
});

// Calculate interest
elements.calculate.addEventListener('click', function() {
    console.log('Compute Interest clicked');
    
    try {
        // Get inputs
        const principal = parseFloat(elements.principal.value);
        const rate = parseFloat(elements.rate.value);
        const years = parseFloat(elements.timeYears.value) || 0;
        const months = parseFloat(elements.timeMonths.value) || 0;
        const days = parseFloat(elements.timeDays.value) || 0;
        const frequency = elements.frequency.value;
        const interestType = elements.interestType.value;

        console.log('Inputs:', { principal, rate, years, months, days, frequency, interestType });

        // Validate inputs
        if (isNaN(principal) || principal <= 0) {
            elements.error.textContent = 'Please enter a valid positive principal amount.';
            elements.error.classList.remove('hidden');
            elements.result.classList.add('hidden');
            return;
        }
        if (isNaN(rate) || rate < 1 || rate > 50) {
            elements.error.textContent = 'Please enter a valid interest rate between 1 and 50%.';
            elements.error.classList.remove('hidden');
            elements.result.classList.add('hidden');
            return;
        }
        const time = years + (months / 12) + (days / 365);
        if (time <= 0) {
            elements.error.textContent = 'Please enter at least one valid time period (years, months, or days).';
            elements.error.classList.remove('hidden');
            elements.result.classList.add('hidden');
            return;
        }

        elements.error.classList.add('hidden');

        // Calculate interest
        let interest, total;
        if (frequency === 'monthly') {
            const monthlyRate = rate / 1200; // Convert annual rate to monthly percentage
            const periods = time * 12; // Convert time to months
            if (interestType === 'simple') {
                interest = principal * monthlyRate * periods;
                total = principal + interest;
            } else {
                total = principal * Math.pow(1 + monthlyRate, periods);
                interest = total - principal;
            }
        } else {
            if (interestType === 'simple') {
                interest = (principal * rate * time) / 100;
                total = principal + interest;
            } else {
                total = principal * Math.pow(1 + rate / 100, time);
                interest = total - principal;
            }
        }

        // Store results
        latestResult.interest = isNaN(interest) ? '0.00' : interest.toFixed(2);
        latestResult.total = isNaN(total) ? '0.00' : total.toFixed(2);

        // Update DOM
        elements.interest.textContent = latestResult.interest;
        elements.total.textContent = latestResult.total;
        elements.result.classList.remove('hidden');

        // Debug: Log results
        console.log('Calculation Results:', {
            interest: latestResult.interest,
            total: latestResult.total,
            frequency,
            interestType
        });

        // Save to history
        const entry = { 
            principal, 
            rate, 
            years, 
            months, 
            days, 
            frequency, 
            interestType, 
            interest: latestResult.interest, 
            total: latestResult.total, 
            date: new Date().toLocaleString() 
        };
        history.push(entry);
        localStorage.setItem('interestHistory', JSON.stringify(history));
        updateHistory();

        // Update chart
        const totalPeriods = frequency === 'monthly' ? Math.ceil(time * 12) : Math.ceil(time);
        const periodArray = Array.from({ length: totalPeriods }, (_, i) => i);
        let data;
        if (frequency === 'monthly') {
            if (interestType === 'simple') {
                data = periodArray.map(m => principal + (principal * (rate / 1200) * m));
            } else {
                data = periodArray.map(m => principal * Math.pow(1 + rate / 1200, m));
            }
            chart.options.scales.x.title.text = 'Month';
        } else {
            if (interestType === 'simple') {
                data = periodArray.map(y => principal + (principal * rate * y) / 100);
            } else {
                data = periodArray.map(y => principal * Math.pow(1 + rate / 100, y));
            }
            chart.options.scales.x.title.text = 'Year';
        }
        chart.data.labels = periodArray;
        chart.data.datasets[0].data = data;
        chart.update({ duration: 300 });

        console.log('Chart updated with', totalPeriods, 'periods');
    } catch (error) {
        console.error('Calculation Error:', error);
        elements.error.textContent = 'An error occurred during calculation. Check console for details.';
        elements.error.classList.remove('hidden');
        elements.result.classList.add('hidden');
    }
});

// Clear history
elements.clearHistory.addEventListener('click', function() {
    console.log('Clear History clicked');
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
        li.textContent = `${entry.date}: ₹${entry.principal}, ${entry.rate}%, ${entry.years}y ${entry.months}m ${entry.days}d, ${entry.frequency}, ${entry.interestType}, Interest: ₹${entry.interest}, Total: ₹${entry.total}`;
        elements.history.appendChild(li);
    });
    console.log('History updated:', history.length, 'entries');
}
