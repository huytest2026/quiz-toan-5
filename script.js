// --- KHAI BÁO BIẾN TOÀN CỤC ---
let studentCode = "";
let currentSubject = "";
let totalQuestions = 0;
let timerInterval;

window.allQuizData = [];
window.userPermissions = [];
window.currentQuizData = [];

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

// --- LOGIC HIỂN THỊ CÂU HỎI (Hỗ trợ "go_tu" và "Quiz") ---
window.renderQuiz = function() {
    const quizDiv = document.getElementById('quiz');
    if (!quizDiv) return;
    
    // Kiểm tra dữ liệu có tồn tại không
    if (!window.currentQuizData || window.currentQuizData.length === 0) {
        quizDiv.innerHTML = "<p>Không có câu hỏi nào để hiển thị!</p>";
        return;
    }

    quizDiv.innerHTML = window.currentQuizData.map((item, i) => {
        const loai = String(item.loai || "").trim();
        
        // 1. Trường hợp là câu hỏi Gõ từ (go_tu)
        if (loai === "go_tu") {
            return `
            <div class="quiz-card" id="q-card-${i}" style="border: 1px solid #ddd; padding: 15px; margin: 10px 0; border-radius: 10px;">
                <button class="speak-btn" onclick="window.speakText('${(item.correct || "").replace(/'/g, "\\'")}')">🔊 Nghe</button>
                <div class="question" style="font-weight:bold; margin: 10px 0;">Câu ${i+1}: ${item.question}</div>
                <input type="text" id="input-${i}" class="text-input" placeholder="Nhập đáp án tại đây..." style="width: 100%; padding: 10px; margin-bottom: 10px;">
                <button onclick="window.checkTypedAnswer(${i}, '${(item.correct || "").replace(/'/g, "\\'")}')" style="background:#6f42c1; color:white; padding:10px 20px; border:none; border-radius:5px; cursor:pointer;">Kiểm tra</button>
                <div id="feedback-${i}" style="margin-top:10px; font-weight:bold;"></div>
            </div>`;
        } 
        // 2. Trường hợp là câu hỏi Trắc nghiệm (Quiz)
        else {
            let options = [{k:'a',v:item.a}, {k:'b',v:item.b}, {k:'c',v:item.c}, {k:'d',v:item.d}];
            return `
            <div class="quiz-card" id="q-card-${i}" style="border: 1px solid #ddd; padding: 15px; margin: 10px 0; border-radius: 10px;">
                <div class="question" style="font-weight:bold; margin-bottom: 10px;">Câu ${i+1}: ${item.question}</div>
                <div class="options-grid" style="display: grid; gap: 10px;">
                    ${options.map(opt => `<div class="option-box" data-key="${opt.k}" onclick="window.checkAnswer(${i}, '${opt.k}', this)" style="border: 1px solid #ccc; padding: 10px; cursor:pointer;">${opt.v || ""}</div>`).join('')}
                </div>
            </div>`;
        }
    }).join('');
};

window.checkTypedAnswer = function(i, correctAnswer) {
    const inputElement = document.getElementById(`input-${i}`);
    const feedback = document.getElementById(`feedback-${i}`);
    const userInput = inputElement.value.trim().toLowerCase();
    const isCorrect = userInput === String(correctAnswer).trim().toLowerCase();
    feedback.innerText = isCorrect ? "✅ Chính xác!" : `❌ Sai rồi! Đáp án là: ${correctAnswer}`;
    feedback.style.color = isCorrect ? "green" : "red";
    inputElement.style.borderColor = isCorrect ? "green" : "red";
    inputElement.disabled = true;
    let el = document.getElementById(isCorrect ? 'count-correct' : 'count-wrong');
    if (el) el.innerText = parseInt(el.innerText || 0) + 1;
};

window.checkAnswer = function(i, selectedKey, element) {
    const questionData = window.currentQuizData[i];
    const parent = element.parentElement;
    
    // Nếu đã chọn rồi thì không cho chọn nữa
    if (parent.dataset.answered) return;
    parent.dataset.answered = "true";
    
    // Lấy đáp án đúng từ dữ liệu (chuẩn hóa về chữ thường để so sánh)
    // Lưu ý: Dữ liệu Google Sheets trả về thường nằm ở cột 'correct' hoặc 'dapAnDung'
    const rawCorrect = String(questionData.correct || questionData.dapAnDung || "").trim().toLowerCase();
    const isCorrect = selectedKey.toLowerCase() === rawCorrect;
    
    // Đổi màu phần tử đã chọn
    element.style.backgroundColor = isCorrect ? '#d4edda' : '#f8d7da';
    element.style.borderColor = isCorrect ? '#28a745' : '#dc3545';
    
    // Nếu sai, tự động tô màu xanh vào ô chứa đáp án đúng
    if (!isCorrect) {
        parent.querySelectorAll('.option-box').forEach(box => {
            if (box.dataset.key.toLowerCase() === rawCorrect) {
                box.style.backgroundColor = '#d4edda';
                box.style.borderColor = '#28a745';
            }
        });
    }
    
    // Cập nhật điểm số trên giao diện
    let counter = document.getElementById(isCorrect ? 'count-correct' : 'count-wrong');
    if (counter) {
        counter.innerText = parseInt(counter.innerText || 0) + 1;
    }
};

window.startQuiz = function() {
    currentSubject = document.getElementById('subject-select').value;
    const selected = Array.from(document.querySelectorAll('input[name="topic"]:checked')).map(cb => cb.value);
    if (selected.length === 0) return alert("Chọn chủ đề!");
    window.currentQuizData = window.allQuizData.filter(i => i.mon === currentSubject && selected.includes(i.chuDe)).sort(() => Math.random() - 0.5).slice(0, currentSubject === 'Toán' ? 10 : 20);
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

window.showRanking = function() { /* Logic xếp hạng cũ */ };
window.speakText = function(text) { /* Logic nói cũ */ };
window.reviewWrong = function() { /* Logic ôn tập cũ */ };

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('load-data-btn').onclick = window.loadData;
    document.getElementById('start-btn').onclick = window.startQuiz;
});
