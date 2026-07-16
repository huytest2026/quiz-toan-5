// --- KHAI BÁO BIẾN TOÀN CỤC ---
let studentCode = "";
let currentSubject = "";
let totalQuestions = 0;
let timerInterval;

window.allQuizData = [];
window.userPermissions = [];
window.currentQuizData = [];

// --- 1. Hàm tải dữ liệu ---
window.loadData = function() {
    studentCode = document.getElementById('student-code').value.trim();
    if (!studentCode) return alert("Nhập mã học sinh!");
    
    const API_URL = "https://script.google.com/macros/s/AKfycbwrNmZYpd3oMQrWxsTQg5lkhaSg7zVa-wN-xm5YRkoFGwUv36Za739HkHNQ5ZQOl4L3Cw/exec";
    const script = document.createElement('script');
    script.src = `${API_URL}?ma=${encodeURIComponent(studentCode)}&callback=handleQuizData`;
    document.body.appendChild(script);
    script.onload = () => script.remove();
};

window.handleQuizData = function(data) {
    if (data.error) return alert(data.error);
    window.allQuizData = data.questions || [];
    window.userPermissions = data.permissions || [];
    alert("Tải dữ liệu thành công!");
    window.updateTopicList();
};

// --- 2. Hàm quản lý chủ đề ---
window.updateTopicList = function() {
    currentSubject = document.getElementById('subject-select').value;
    const container = document.getElementById('topic-container');
    if (!container || !currentSubject) return;

    const allowed = window.userPermissions.filter(p => String(p.maHS) === studentCode && p.mon === currentSubject).map(p => p.chuDe);
    const topics = [...new Set(window.allQuizData.filter(i => i.mon === currentSubject).map(i => i.chuDe))];
    
    container.innerHTML = topics.map(topic => {
        const isAllowed = allowed.includes(topic);
        return `<label style="display:block; margin:5px 0; opacity:${isAllowed ? '1' : '0.5'}">
            <input type="checkbox" name="topic" value="${topic}" ${isAllowed ? 'checked' : 'disabled'}> ${topic}
        </label>`;
    }).join('');
};

// --- 3. Hàm hiển thị câu hỏi ---
window.renderQuiz = function() {
    const quizDiv = document.getElementById('quiz');
    if (!quizDiv) return;
    quizDiv.innerHTML = window.currentQuizData.map((item, i) => {
        let options = [{k:'a',v:item.a}, {k:'b',v:item.b}, {k:'c',v:item.c}, {k:'d',v:item.d}].sort(() => Math.random() - 0.5);
        return `
        <div class="quiz-card" id="q-card-${i}" style="margin-bottom:15px; padding:10px; border:2px solid #ddd; border-radius:8px;">
            <b>Câu ${i+1}: ${item.question}</b><br>
            ${options.map(opt => `
                <div class="option-box" style="display:block; margin:5px 0; padding:5px; border:1px solid #eee; cursor:pointer;" onclick="window.checkAnswer(${i}, '${opt.k}', this)">
                    <input type="radio" name="q${i}" value="${opt.k}" disabled> ${opt.v}
                </div>
            `).join('')}
        </div>`;
    }).join('');
};

// --- 4. Logic chấm điểm ---
window.checkAnswer = function(i, selectedKey, element) {
    const questionData = window.currentQuizData[i];
    if (!questionData) return;

    const selectedText = (questionData[selectedKey] || "").trim().toLowerCase();
    const rawCorrect = String(questionData.correct || "").trim().toLowerCase();
    let isCorrect = (['a', 'b', 'c', 'd'].includes(rawCorrect)) ? (selectedKey.toLowerCase() === rawCorrect) : (selectedText === rawCorrect);
    
    if (!isCorrect) {
        let wrongQuestions = JSON.parse(localStorage.getItem('wrongQuestions') || '[]');
        if (!wrongQuestions.some(q => q.question === questionData.question)) {
            wrongQuestions.push(questionData);
            localStorage.setItem('wrongQuestions', JSON.stringify(wrongQuestions));
        }
    }
    
    element.style.backgroundColor = isCorrect ? '#d4edda' : '#f8d7da';
    element.parentElement.querySelectorAll('.option-box').forEach(box => { box.style.pointerEvents = 'none'; box.style.opacity = '0.7'; });
    
    let el = document.getElementById(isCorrect ? 'count-correct' : 'count-wrong');
    if (el) el.innerText = parseInt(el.innerText || 0) + 1;
};

// --- 5. Bắt đầu và Nộp bài ---
window.startQuiz = function() {
    currentSubject = document.getElementById('subject-select').value;
    const selected = Array.from(document.querySelectorAll('input[name="topic"]:checked')).map(cb => cb.value);
    if (selected.length === 0) return alert("Chọn chủ đề!");
    
    window.currentQuizData = window.allQuizData.filter(i => i.mon === currentSubject && selected.includes(i.chuDe))
                                               .sort(() => Math.random() - 0.5)
                                               .slice(0, currentSubject === 'Toán' ? 10 : 20);
    totalQuestions = window.currentQuizData.length;
    
    let time = (currentSubject === 'Toán' ? 15 : 10) * 60;
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        time--;
        document.getElementById('timer-display').innerText = Math.floor(time/60) + ":" + (time%60).toString().padStart(2,'0');
        if (time <= 0) { clearInterval(timerInterval); alert("Hết giờ!"); window.submitQuiz(); }
    }, 1000);
    
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('quiz-screen').style.display = 'block';
    window.renderQuiz();
};

window.submitQuiz = function() {
    clearInterval(timerInterval);
    const countCorrect = document.getElementById('count-correct');
    const score = countCorrect ? parseInt(countCorrect.innerText) : 0;
    
    const API_URL = "https://script.google.com/macros/s/AKfycbwrNmZYpd3oMQrWxsTQg5lkhaSg7zVa-wN-xm5YRkoFGwUv36Za739HkHNQ5ZQOl4L3Cw/exec";
    
    fetch(API_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maHS: studentCode, score: score, total: totalQuestions, mon: currentSubject })
    });

    alert("Nộp bài thành công!");
    location.reload();
};

window.showRanking = function() {
    const API_URL = "https://script.google.com/macros/s/AKfycbwrNmZYpd3oMQrWxsTQg5lkhaSg7zVa-wN-xm5YRkoFGwUv36Za739HkHNQ5ZQOl4L3Cw/exec";
    const callbackName = 'jsonp_callback_' + Date.now();
    window[callbackName] = function(data) {
        document.body.removeChild(script);
        delete window[callbackName];
        if (!data || data.length === 0) return alert("Chưa có dữ liệu xếp hạng!");
        let rankText = "BẢNG XẾP HẠNG (TOP 10):\n" + data.slice(0, 10).map((r, i) => `${i+1}. ${r.ten}: ${r.diem} điểm`).join('\n');
        alert(rankText);
    };
    const script = document.createElement('script');
    script.src = `${API_URL}?action=getRanking&callback=${callbackName}`;
    document.body.appendChild(script);
};

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('load-data-btn').onclick = window.loadData;
    document.getElementById('start-btn').onclick = window.startQuiz;
});
