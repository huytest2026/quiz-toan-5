window.allQuizData = [];
window.currentQuizData = [];
window.correctCount = 0;
window.wrongCount = 0;
window.timerInterval = null;

function safeUpdateText(id, value) {
    const el = document.getElementById(id);
    if (el) el.innerText = value;
}

window.loadData = async function() {
    try {
        const response = await fetch("https://script.google.com/macros/s/AKfycbwrNmZYpd3oMQrWxsTQg5lkhaSg7zVa-wN-xm5YRkoFGwUv36Za739HkHNQ5ZQOl4L3Cw/exec");
        window.allQuizData = await response.json();
        updateTopicList();
    } catch (e) { console.error("Lỗi tải:", e); }
};

window.updateTopicList = function() {
    const mon = document.getElementById('subject-select')?.value;
    const container = document.getElementById('topic-container');
    if (!container) return;
    container.innerHTML = '';
    if (!mon) return;
    const topics = [...new Set(window.allQuizData.filter(i => i.mon === mon).map(i => i.chuDe))];
    topics.forEach(topic => {
        container.innerHTML += `<label style="display:block; margin:5px 0; cursor:pointer;"><input type="checkbox" name="topic" value="${topic}" checked> ${topic}</label>`;
    });
};

window.toggleTopics = function(selectAll) {
    document.querySelectorAll('input[name="topic"]').forEach(cb => cb.checked = selectAll);
};

window.renderQuiz = function() {
    const quizDiv = document.getElementById('quiz');
    if (!quizDiv) return;
    quizDiv.innerHTML = window.currentQuizData.map((item, i) => {
        let options = [{key:'a', val:item.a}, {key:'b', val:item.b}, {key:'c', val:item.c}, {key:'d', val:item.d}];
        options.sort(() => Math.random() - 0.5);
        return `<div class="quiz-card" style="margin-bottom:20px; padding:15px; border:1px solid #ddd; border-radius:8px;">
            <div class="question" style="margin-bottom:12px;"><b>Câu ${i+1}:</b> ${item.question}</div>
            ${options.map(opt => `<label class="option-box" style="display:block; margin:8px 0; padding:10px; border:1px solid #eee; cursor:pointer;">
                <input type="radio" name="q${i}" value="${opt.key}" onchange="updateLiveStatus(${i}, this.value, this.parentElement)"> ${opt.val}</label>`).join('')}
        </div>`;
    }).join('');
};

window.startTimer = function() {
    let timeLeft = 10 * 60;
    window.timerInterval = setInterval(() => {
        timeLeft--;
        let m = Math.floor(timeLeft / 60), s = timeLeft % 60;
        safeUpdateText('timer-display', `${m}:${s < 10 ? '0' : ''}${s}`);
        if (timeLeft <= 0) { clearInterval(window.timerInterval); alert("Hết giờ!"); }
    }, 1000);
};

window.updateLiveStatus = function(index, val, el) {
    let item = window.currentQuizData[index];
    if (item.answered) return;
    item.answered = true;
    if (val.toLowerCase() === item.correct.toLowerCase()) {
        window.correctCount++;
        safeUpdateText('count-correct', window.correctCount);
        el.style.backgroundColor = "#d4edda";
    } else {
        window.wrongCount++;
        safeUpdateText('count-wrong', window.wrongCount);
        el.style.backgroundColor = "#f8d7da";
    }
    el.closest('.quiz-card').querySelectorAll('label').forEach(l => l.style.pointerEvents = "none");
};

document.addEventListener('DOMContentLoaded', () => {
    loadData();
    document.getElementById('start-btn')?.addEventListener('click', () => {
        const mon = document.getElementById('subject-select').value;
        const name = document.getElementById("student-name")?.value.trim();
        if (!mon || !name) return alert("Vui lòng chọn môn và nhập tên!");
        
        const topics = Array.from(document.querySelectorAll('input[name="topic"]:checked')).map(cb => cb.value);
        window.currentQuizData = window.allQuizData.filter(i => i.mon === mon && topics.includes(i.chuDe)).sort(() => Math.random() - 0.5).slice(0, 20);
        
        if (window.currentQuizData.length === 0) return alert("Không tìm thấy câu hỏi!");
        document.getElementById('start-screen').style.display = 'none';
        document.getElementById('quiz-screen').style.display = 'block';
        renderQuiz(); startTimer();
    });
});
