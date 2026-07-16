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
        let options = [{k:'a',v:item.a}, {k:'b',v:item.b}, {k:'c',v:item.c}, {k:'d',v:item.d}];
        let textToSpeak = `Question ${i + 1}. ${item.question}`;
        
        let listenBtn = (currentSubject === 'Tiếng anh') ? `
            <div style="margin-bottom:15px;">
                <button class="speak-btn" onclick="window.speakText('${textToSpeak.replace(/'/g, "\\'")}')">🔊 Nghe câu hỏi</button>
            </div>` : '';
            
        return `
        <div class="quiz-card" id="q-card-${i}">
            ${listenBtn}
            <div class="question">Câu ${i+1}: ${item.question}</div>
            <div class="options-grid">
                ${options.map(opt => `
                    <div class="option-box" data-key="${opt.k}" onclick="window.checkAnswer(${i}, '${opt.k}', this)">
                        ${opt.v}
                    </div>
                `).join('')}
            </div>
        </div>`;
    }).join('');
};

window.speakText = function(text) {
    window.speechSynthesis.cancel();
    let cleanText = text.replace(/[-_]+/g, '. '); 
    const msg = new SpeechSynthesisUtterance(cleanText);
    msg.lang = 'en-US';
    msg.rate = 0.9;
    window.speechSynthesis.speak(msg);
};

// --- 4. Logic chấm điểm ---
window.checkAnswer = function(i, selectedKey, element) {
    const questionData = window.currentQuizData[i];
    const parent = element.parentElement;
    
    if (parent.dataset.answered) return;
    parent.dataset.answered = "true";

    const rawCorrect = String(questionData.correct || "").trim().toLowerCase();
    let isCorrect = (['a', 'b', 'c', 'd'].includes(rawCorrect)) ? (selectedKey.toLowerCase() === rawCorrect) : (questionData[selectedKey].trim().toLowerCase() === rawCorrect);
    
    element.style.backgroundColor = isCorrect ? '#d4edda' : '#f8d7da';
    element.style.borderColor = isCorrect ? '#28a745' : '#dc3545';

    if (!isCorrect) {
        parent.querySelectorAll('.option-box').forEach(box => {
            if (box.dataset.key === rawCorrect) box.style.backgroundColor = '#d4edda';
        });
        let wrongQuestions = JSON.parse(localStorage.getItem('wrongQuestions') || '[]');
        if (!wrongQuestions.some(q => q.question === questionData.question)) {
            wrongQuestions.push(questionData);
            localStorage.setItem('wrongQuestions', JSON.stringify(wrongQuestions));
        }
    }
    
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
    window.speechSynthesis.cancel();
    const score = document.getElementById('count-correct') ? parseInt(document.getElementById('count-correct').innerText) : 0;
    
    const API_URL = "https://script.google.com/macros/s/AKfycbwrNmZYpd3oMQrWxsTQg5lkhaSg7zVa-wN-xm5YRkoFGwUv36Za739HkHNQ5ZQOl4L3Cw/exec";
    fetch(API_URL, { method: "POST", mode: "no-cors", body: JSON.stringify({ maHS: studentCode, score: score, total: totalQuestions, mon: currentSubject }) });

    alert("Nộp bài thành công!");
    location.reload();
};

// --- 6. Xếp hạng ---
window.showRanking = function() {
    const API_URL = "https://script.google.com/macros/s/AKfycbwrNmZYpd3oMQrWxsTQg5lkhaSg7zVa-wN-xm5YRkoFGwUv36Za739HkHNQ5ZQOl4L3Cw/exec";
    const script = document.createElement('script');
    
    window.jsonp_callback = function(data) {
        document.body.removeChild(script);
        const rankList = document.getElementById('ranking-list');
        if (!data || data.length === 0) return rankList.innerHTML = "Chưa có dữ liệu!";
        
        rankList.innerHTML = data.slice(0, 5).map((r, i) => `
            <div style="padding: 8px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between;">
                <span>${i + 1}. ${r.ten}</span>
                <span style="font-weight:bold; color: #28a745;">${r.diem} điểm</span>
            </div>
        `).join('');
    };

    script.src = `${API_URL}?action=getRanking&callback=jsonp_callback`;
    document.body.appendChild(script);
};

window.reviewWrong = function() {
    const wrong = JSON.parse(localStorage.getItem('wrongQuestions') || '[]');
    if (wrong.length === 0) return alert("Chưa có câu sai để ôn!");
    alert("Số câu sai cần ôn: " + wrong.length);
};

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('load-data-btn').onclick = window.loadData;
    document.getElementById('start-btn').onclick = window.startQuiz;
});
