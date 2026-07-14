window.allQuizData = [];
window.currentQuizData = [];
window.wrongDetails = [];
window.correctCount = 0;
window.timerInterval = null;

// Tải dữ liệu từ Google Sheet
window.loadData = async function() {
    try {
        const response = await fetch("https://script.google.com/macros/s/AKfycbwrNmZYpd3oMQrWxsTQg5lkhaSg7zVa-wN-xm5YRkoFGwUv36Za739HkHNQ5ZQOl4L3Cw/exec");
        window.allQuizData = await response.json();
        updateTopicList();
    } catch (e) { console.error("Lỗi tải dữ liệu:", e); }
};

window.updateTopicList = function() {
    const mon = document.getElementById('subject-select').value;
    const container = document.getElementById('topic-container');
    container.innerHTML = '';
    if (!mon) return;
    const topics = [...new Set(window.allQuizData.filter(i => i.mon === mon).map(i => i.chuDe))];
    topics.forEach(topic => {
        container.innerHTML += `<label style="display:block; margin:5px 0;"><input type="checkbox" name="topic" value="${topic}" checked> ${topic}</label>`;
    });
};

// --- MỚI: Hàm Chọn/Bỏ chọn tất cả ---
window.toggleTopics = function(selectAll) {
    document.querySelectorAll('input[name="topic"]').forEach(cb => cb.checked = selectAll);
};
// ------------------------------------

window.startTimer = function() {
    let timeLeft = 10 * 60;
    if (window.timerInterval) clearInterval(window.timerInterval);
    window.timerInterval = setInterval(() => {
        timeLeft--;
        let m = Math.floor(timeLeft / 60), s = timeLeft % 60;
        document.getElementById('timer-display').innerText = `${m}:${s < 10 ? '0' : ''}${s}`;
        if (timeLeft <= 0) { clearInterval(window.timerInterval); document.getElementById('submit-btn').click(); }
    }, 1000);
};

window.renderQuiz = function() {
    const quizDiv = document.getElementById('quiz');
    quizDiv.innerHTML = window.currentQuizData.map((item, i) => {
        let options = [{key:'a', val:item.a}, {key:'b', val:item.b}, {key:'c', val:item.c}, {key:'d', val:item.d}];
        options.sort(() => Math.random() - 0.5);
        return `<div class="quiz-card" style="margin-bottom:15px; padding:15px; border:1px solid #ddd; border-radius:8px;">
            <div class="question"><b>Câu ${i+1}: ${item.question}</b></div>
            ${options.map(opt => `<label class="option-box" style="display:block; margin:5px 0; cursor:pointer;">
                <input type="radio" name="q${i}" value="${item.mon === 'Tiếng anh' ? opt.val : opt.key}" 
                onchange="updateLiveStatus(${i}, this.value, this.parentElement)"> ${opt.val}</label>`).join('')}
        </div>`;
    }).join('');
};

window.updateLiveStatus = function(index, selectedValue, element) {
    let item = window.currentQuizData[index];
    if (item.answered) return;
    item.answered = true;
    const isCorrect = String(selectedValue).trim().toLowerCase() === String(item.correct).trim().toLowerCase();
    if (isCorrect) {
        window.correctCount++;
        document.getElementById('count-correct').innerText = window.correctCount;
        element.style.backgroundColor = "#d4edda";
    } else {
        document.getElementById('count-wrong').innerText = parseInt(document.getElementById('count-wrong').innerText) + 1;
        element.style.backgroundColor = "#f8d7da";
        window.wrongDetails.push({ ...item, dapAnSai: selectedValue });
    }
    element.closest('.quiz-card').querySelectorAll('label').forEach(l => l.style.pointerEvents = "none");
};

document.addEventListener('DOMContentLoaded', () => {
    loadData();

    document.getElementById('start-btn').addEventListener('click', () => {
        const mon = document.getElementById('subject-select').value;
        const name = document.getElementById("student-name").value.trim();
        if (!mon || !name) return alert("Vui lòng chọn môn và nhập tên!");
        
        window.correctCount = 0; window.wrongDetails = [];
        document.getElementById('count-correct').innerText = "0";
        document.getElementById('count-wrong').innerText = "0";
        
        document.getElementById('start-screen').style.display = 'none';
        document.getElementById('quiz-screen').style.display = 'block';
        
        const topics = Array.from(document.querySelectorAll('input[name="topic"]:checked')).map(cb => cb.value);
        window.currentQuizData = window.allQuizData.filter(i => i.mon === mon && topics.includes(i.chuDe)).sort(() => Math.random() - 0.5).slice(0, 20);
        renderQuiz(); startTimer();
    });

    document.getElementById('submit-btn').addEventListener('click', () => {
        clearInterval(window.timerInterval);
        const name = document.getElementById("student-name").value;
        fetch("https://script.google.com/macros/s/AKfycbwrNmZYpd3oMQrWxsTQg5lkhaSg7zVa-wN-xm5YRkoFGwUv36Za739HkHNQ5ZQOl4L3Cw/exec", { 
            method: 'POST', 
            body: JSON.stringify({ ten: name, diem: window.correctCount, soCau: 20, mon: document.getElementById('subject-select').value, wrongDetails: window.wrongDetails }) 
        });
        document.getElementById('quiz-screen').style.display = 'none';
        document.getElementById('result-screen').style.display = 'block';
        document.getElementById('result').innerHTML = `<h3>Hoàn thành!</h3><p>Điểm: <b>${window.correctCount}/20</b></p>`;
    });

    document.getElementById('restart-btn').addEventListener('click', () => location.reload());
});
