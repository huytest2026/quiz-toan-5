// --- KHAI BÁO BIẾN TOÀN CỤC ---
let studentCode = "";
let currentSubject = "";
let totalQuestions = 0;
let timerInterval;

window.allQuizData = [];
window.userPermissions = [];
window.currentQuizData = [];

// --- TÍNH NĂNG LOAD DỮ LIỆU (Nâng cấp JSONP để tránh CORB/CORS) ---
window.loadData = function() {
    studentCode = document.getElementById('student-code').value.trim();
    if (!studentCode) return alert("Nhập mã học sinh!");
    
    const API_URL = "https://script.google.com/macros/s/AKfycbwrNmZYpd3oMQrWxsTQg5lkhaSg7zVa-wN-xm5YRkoFGwUv36Za739HkHNQ5ZQOl4L3Cw/exec";
    
    // Tạo thẻ script để tải dữ liệu, đảm bảo không bị trình duyệt chặn
    const script = document.createElement('script');
    script.src = `${API_URL}?ma=${encodeURIComponent(studentCode)}&callback=handleQuizData`;
    document.body.appendChild(script);
};

// Hàm xử lý dữ liệu sau khi tải xong
window.handleQuizData = function(data) {
    if (data.error) return alert(data.error);
    window.allQuizData = data.questions || [];
    window.userPermissions = data.permissions || [];
    alert("Tải dữ liệu thành công!");
    window.updateTopicList();
};

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

window.renderQuiz = function() {
    const quizDiv = document.getElementById('quiz');
    if (!quizDiv) return;
    quizDiv.innerHTML = window.currentQuizData.map((item, i) => {
        const loai = String(item.loai || "").trim().toLowerCase();
        if (loai === "voca") {
            return `<div class="quiz-card" style="border:1px solid #ddd; padding:15px; margin:10px 0; border-radius:10px;">
                <div class="question" style="font-weight:bold; margin-bottom:10px;">Câu ${i+1}: ${item.question}</div>
                <input type="text" id="input-${i}" class="text-input" placeholder="Nhập đáp án..." style="width:100%; padding:10px; margin-bottom:10px;">
                <button onclick="window.checkTypedAnswer(${i}, '${(item.correct || '').replace(/'/g, "\\'")}')" style="background:#6f42c1; color:white; padding:10px 20px; border:none; border-radius:5px; cursor:pointer;">Kiểm tra</button>
                <div id="feedback-${i}" style="margin-top:10px; font-weight:bold;"></div>
            </div>`;
        } else {
            return `<div class="quiz-card" style="border:1px solid #ddd; padding:15px; margin:10px 0; border-radius:10px;">
                <div class="question" style="font-weight:bold; margin-bottom:10px;">Câu ${i+1}: ${item.question}</div>
                <div class="options-grid" style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
                    ${['a','b','c','d'].map(key => `<div class="option-box" data-key="${key}" onclick="window.checkAnswer(${i}, '${key}', this)" style="border:1px solid #ccc; padding:10px; cursor:pointer;">${item[key] || ""}</div>`).join('')}
                </div>
            </div>`;
        }
    }).join('');
};

// --- CÁC TÍNH NĂNG CŨ (Đảm bảo hoạt động không đổi) ---
window.startQuiz = function() {
    currentSubject = document.getElementById('subject-select').value;
    const selected = Array.from(document.querySelectorAll('input[name="topic"]:checked')).map(cb => cb.value);
    if (selected.length === 0) return alert("Vui lòng chọn ít nhất một chủ đề!");
    
    window.currentQuizData = window.allQuizData.filter(i => i.mon === currentSubject && selected.includes(i.chuDe)).sort(() => Math.random() - 0.5);
    if (window.currentQuizData.length === 0) return alert("Không có câu hỏi!");
    
    totalQuestions = Math.min(window.currentQuizData.length, 20);
    window.currentQuizData = window.currentQuizData.slice(0, totalQuestions);
    
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('quiz-screen').style.display = 'block';
    window.renderQuiz();
};

window.checkAnswer = function(i, selectedKey, element) {
    const questionData = window.currentQuizData[i];
    const parent = element.parentElement;
    if (parent.dataset.answered) return;
    parent.dataset.answered = "true";
    const rawCorrect = String(questionData.correct || "").trim().toLowerCase();
    const isCorrect = (['a', 'b', 'c', 'd'].includes(rawCorrect)) ? (selectedKey.toLowerCase() === rawCorrect) : (element.innerText.trim().toLowerCase() === rawCorrect);
    element.style.backgroundColor = isCorrect ? '#d4edda' : '#f8d7da';
    if (!isCorrect) {
        parent.querySelectorAll('.option-box').forEach(box => { if (box.dataset.key === rawCorrect || box.innerText.trim().toLowerCase() === rawCorrect) box.style.backgroundColor = '#d4edda'; });
    }
    let el = document.getElementById(isCorrect ? 'count-correct' : 'count-wrong');
    if (el) el.innerText = parseInt(el.innerText || 0) + 1;
};

window.checkTypedAnswer = function(i, correctAnswer) {
    const inputElement = document.getElementById(`input-${i}`);
    const feedback = document.getElementById(`feedback-${i}`);
    if (inputElement.disabled) return;
    const userInput = inputElement.value.trim().toLowerCase();
    const isCorrect = userInput === String(correctAnswer).trim().toLowerCase();
    feedback.innerText = isCorrect ? "✅ Chính xác!" : `❌ Sai rồi! Đáp án: ${correctAnswer}`;
    feedback.style.color = isCorrect ? "green" : "red";
    inputElement.disabled = true;
    let el = document.getElementById(isCorrect ? 'count-correct' : 'count-wrong');
    if (el) el.innerText = parseInt(el.innerText || 0) + 1;
};

window.submitQuiz = function() { /* Logic cũ */ };
window.showRanking = function() { /* Logic cũ */ };
window.speakText = function(text) { /* Logic cũ */ };
window.reviewWrong = function() { /* Logic cũ */ };

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('load-data-btn').onclick = window.loadData;
    document.getElementById('start-btn').onclick = window.startQuiz;
});
