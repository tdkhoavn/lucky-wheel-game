const canvas = document.getElementById('wheelCanvas');
const ctx = canvas.getContext('2d');
const spinBtn = document.getElementById('spinBtn');
const namesInput = document.getElementById('namesInput');
const resultModal = document.getElementById('resultModal');
const winnerNameDisplay = document.getElementById('winnerName');
const closeBtn = document.getElementById('closeBtn');
const closeModalSpan = document.querySelector('.close-modal');
const removeWinnerBtn = document.getElementById('removeWinnerBtn');
const shuffleBtn = document.getElementById('shuffleBtn');
const sortBtn = document.getElementById('sortBtn');
const historyBtn = document.getElementById('historyBtn');
const historyModal = document.getElementById('historyModal');
const historyList = document.getElementById('historyList');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');
const closeHistoryBtn = document.getElementById('closeHistoryBtn');
const closeHistorySpan = document.querySelector('.close-history');

let names = [];
let colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#F1948A'];
let startAngle = 0;
let arc = 0;
let spinTimeout = null;

let spinAngleStart = 10;
let spinTime = 0;
let spinTimeTotal = 0;

let isSpinning = false;
let currentWinner = "";
let isAscending = true;

// Load history from local storage
// Renamed to spinHistory to avoid conflict with window.history
let spinHistory = JSON.parse(localStorage.getItem('luckyWheelHistory')) || [];

function getNames() {
    // Filter out empty lines
    return namesInput.value.split('\n').filter(name => name.trim() !== '');
}

function drawWheel() {
    names = getNames();
    if (names.length === 0) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
    }

    arc = Math.PI * 2 / names.length;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const outsideRadius = 250;
    const insideRadius = 0;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    ctx.save();

    for (let i = 0; i < names.length; i++) {
        const angle = startAngle + i * arc;

        // Draw Slice
        ctx.fillStyle = colors[i % colors.length];

        ctx.beginPath();
        ctx.arc(centerX, centerY, outsideRadius, angle, angle + arc, false);
        ctx.arc(centerX, centerY, insideRadius, angle + arc, angle, true);
        ctx.stroke();
        ctx.fill();

        // Draw Text
        ctx.save();

        // Translate to the center of the wheel
        ctx.translate(centerX, centerY);

        // Rotate to the middle of the slice
        ctx.rotate(angle + arc / 2);

        // Set text alignment to right (end of the slice)
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "white";
        ctx.font = 'bold 16px Roboto, sans-serif';
        ctx.shadowColor = "rgba(0,0,0,0.5)";
        ctx.shadowBlur = 4;

        let text = names[i];

        // Truncate text if too long
        const maxTextWidth = outsideRadius - 40;

        if (ctx.measureText(text).width > maxTextWidth) {
            while (ctx.measureText(text + "...").width > maxTextWidth && text.length > 0) {
                text = text.substring(0, text.length - 1);
            }
            text += "...";
        }

        // Draw text at the outer edge minus some padding
        ctx.fillText(text, outsideRadius - 10, 0);

        ctx.restore();
    }

    ctx.restore();
}

function rotateWheel() {
    spinTime += 30;
    if (spinTime >= spinTimeTotal) {
        stopRotateWheel();
        return;
    }

    // Easing function for smooth deceleration
    const spinAngle = spinAngleStart - easeOut(spinTime, 0, spinAngleStart, spinTimeTotal);
    startAngle += (spinAngle * Math.PI / 180);
    drawWheel();
    spinTimeout = requestAnimationFrame(rotateWheel);
}

function stopRotateWheel() {
    cancelAnimationFrame(spinTimeout);
    isSpinning = false;
    spinBtn.disabled = false;

    // Calculate winner
    const degrees = startAngle * 180 / Math.PI + 90;
    const arcd = arc * 180 / Math.PI;
    const index = Math.floor((360 - degrees % 360) / arcd);

    ctx.save();
    ctx.font = 'bold 30px Roboto, sans-serif';
    const text = names[index];

    // Show result
    currentWinner = text;
    saveHistory(text);
    showWinner(text);
    ctx.restore();
}

function easeOut(t, b, c, d) {
    const ts = (t /= d) * t;
    const tc = ts * t;
    return b + c * (tc + -3 * ts + 3 * t);
}

function spin() {
    if (isSpinning) return;

    names = getNames();
    if (names.length < 2) {
        alert("Vui lòng nhập ít nhất 2 tên!");
        return;
    }

    isSpinning = true;
    spinBtn.disabled = true;

    // Randomize spin parameters
    spinAngleStart = Math.random() * 10 + 10; // Initial speed
    spinTime = 0;
    spinTimeTotal = Math.random() * 3000 + 4000; // Spin duration 4-7s

    rotateWheel();
}

function showWinner(winner) {
    winnerNameDisplay.textContent = winner;
    resultModal.classList.remove('hidden');

    // Fire confetti
    confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 }
    });
}

function removeWinner() {
    const index = names.indexOf(currentWinner);
    if (index > -1) {
        names.splice(index, 1);
        namesInput.value = names.join('\n');
        drawWheel();
    }
    resultModal.classList.add('hidden');
}

// --- New Features ---

function shuffleNames() {
    let names = getNames();
    for (let i = names.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [names[i], names[j]] = [names[j], names[i]];
    }
    namesInput.value = names.join('\n');
    drawWheel();
}

function sortNames() {
    let names = getNames();

    if (isAscending) {
        // A-Z
        names.sort((a, b) => a.trim().localeCompare(b.trim(), 'vi', { sensitivity: 'base' }));
        sortBtn.textContent = "ZA Sắp xếp"; // Change text to indicate next action is Z-A
        sortBtn.title = "Sắp xếp Z-A";
    } else {
        // Z-A
        names.sort((a, b) => b.trim().localeCompare(a.trim(), 'vi', { sensitivity: 'base' }));
        sortBtn.textContent = "AZ Sắp xếp"; // Change text to indicate next action is A-Z
        sortBtn.title = "Sắp xếp A-Z";
    }

    isAscending = !isAscending;
    namesInput.value = names.join('\n');
    drawWheel();
}

function saveHistory(winner) {
    const now = new Date();
    const timeString = now.toLocaleTimeString('vi-VN') + ' ' + now.toLocaleDateString('vi-VN');
    spinHistory.unshift({ name: winner, time: timeString });
    localStorage.setItem('luckyWheelHistory', JSON.stringify(spinHistory));
}

function renderHistory() {
    historyList.innerHTML = '';
    if (spinHistory.length === 0) {
        historyList.innerHTML = '<li style="justify-content: center;">Chưa có lịch sử quay.</li>';
        return;
    }

    spinHistory.forEach(item => {
        const li = document.createElement('li');
        li.innerHTML = `<span>${item.name}</span> <span class="timestamp">${item.time}</span>`;
        historyList.appendChild(li);
    });
}

function clearHistory() {
    console.log("Clear history clicked");
    if (confirm("Bạn có chắc muốn xóa toàn bộ lịch sử?")) {
        spinHistory = [];
        localStorage.removeItem('luckyWheelHistory');
        renderHistory();
        console.log("History cleared");
    }
}

// Event Listeners
spinBtn.addEventListener('click', spin);
removeWinnerBtn.addEventListener('click', removeWinner);
shuffleBtn.addEventListener('click', shuffleNames);
sortBtn.addEventListener('click', sortNames);

historyBtn.addEventListener('click', () => {
    renderHistory();
    historyModal.classList.remove('hidden');
});

clearHistoryBtn.addEventListener('click', clearHistory);

closeHistoryBtn.addEventListener('click', () => {
    historyModal.classList.add('hidden');
});

closeHistorySpan.addEventListener('click', () => {
    historyModal.classList.add('hidden');
});

namesInput.addEventListener('input', () => {
    if (!isSpinning) {
        drawWheel();
    }
});

closeBtn.addEventListener('click', () => {
    resultModal.classList.add('hidden');
});

closeModalSpan.addEventListener('click', () => {
    resultModal.classList.add('hidden');
});

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === resultModal) {
        resultModal.classList.add('hidden');
    }
    if (e.target === historyModal) {
        historyModal.classList.add('hidden');
    }
});

// Initial draw
drawWheel();
