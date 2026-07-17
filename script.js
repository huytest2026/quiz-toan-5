// --- KHAI BÁO BIẾN ---
let studentCode = "", currentSubject = "", totalQuestions = 0, timerInterval, timeLeft = 0, wrongQuestions = [];
window.allQuizData = []; window.userPermissions = []; window.currentQuizData = [];

// --- LOAD DỮ LIỆU ---
window.loadData = function() {
    studentCode = document.getElementById('student-code').value.trim();
    if (!studentCode) return alert("Nhập mã học sinh!");
    const API_URL = "https://script.google.com/macros/s/AKfycbwrNmZYpd3oMQrWxsTQg5lkhaSg7zVa-wN-xm5YRkoFGwUv36Za739HkHNQ5ZQOl4L3Cw/exec";
    const script = document.createElement('script');
    script.src = `${API_URL}?ma=${encodeURIComponent(studentCode)}&callback=handleQuizData`;
    document.body.appendChild(script);
};

window.handleQuizData = function(data) {
    if (data.error) return alert(data.error);
    window.allQuizData = data.questions || [];
    window.userPermissions = data.permissions || [];
    document.getElementById('student-code').style.display = 'none';
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

// --- ÂM THANH (CHỈ HIỆN TRONG TIẾNG ANH) ---
window.speakText = function(text, questionIndex) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance("Câu " + (questionIndex + 1) + ". " + text.replace(/_+/g, " "));
        utterance.lang = 'vi-VN';
        window.speechSynthesis.speak(utterance);
    }
};

// --- BẮT ĐẦU & ĐỒNG HỒ ---
window.startQuiz = function() {
    currentSubject = document.getElementById('subject-select').value;
    const selected = Array.from(document.querySelectorAll('input[name="topic"]:checked')).map(cb => cb.value);
    if (selected.length === 0) return alert("Vui lòng chọn chủ đề!");
    timeLeft = (currentSubject === "Toán") ? 900 : 600;
    wrongQuestions = [];
    window.currentQuizData = window.allQuizData.filter(i => i.mon === currentSubject && selected.includes(i.chuDe)).sort(() => Math.random() - 0.5).slice(0, (currentSubject === "Toán" ? 10 : 20));
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('quiz-screen').style.display = 'block';
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timeLeft--;
        document.getElementById('timer-display').innerText = Math.floor(timeLeft/60) + ":" + (timeLeft%60).toString().padStart(2, '0');
        if (timeLeft <= 0) { clearInterval(timerInterval); window.submitQuiz(); }
    }, 1000);
    window.renderQuiz();
};

// --- RENDER QUIZ ---
window.renderQuiz = function() {
    document.getElementById('quiz').innerHTML = window.currentQuizData.map((item, i) => {
        const speakerBtn = (currentSubject === "Tiếng anh") ? `<button onclick="window.speakText('${item.question.replace(/'/g, "\\'")}', ${i})">🔊</button>` : "";
        if (String(item.loai).trim().toLowerCase() === "voca") {
            return `<div class="quiz-card"><div>Câu ${i+1}: ${item.question} ${speakerBtn}</div><input type="text" id="input-${i}"><button onclick="window.checkTypedAnswer(${i}, '${item.correct}')">Kiểm tra</button><div id="feedback-${i}"></div></div>`;
        }
        return `<div class="quiz-card"><div>Câu ${i+1}: ${item.question} ${speakerBtn}</div>${['a','b','c','d'].map(key => `<div class="option-box" onclick="window.checkAnswer(${i}, '${key}', this)">${item[key] || ""}</div>`).join('')}</div>`;
    }).join('');
};

// --- NỘP BÀI & TỰ ĐỘNG LOAD XẾP HẠNG ---
window.submitQuiz = function() {
    clearInterval(timerInterval);
    const score = parseInt(document.getElementById('count-correct').innerText || 0);
    fetch("https://script.google.com/macros/s/AKfycbwrNmZYpd3oMQrWxsTQg5lkhaSg7zVa-wN-xm5YRkoFGwUv36Za739HkHNQ5ZQOl4L3Cw/exec", { 
        method: "POST", mode: "no-cors", headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ maHS: studentCode, score, total: window.currentQuizData.length, mon: currentSubject }) 
    }).then(() => {
        alert("Nộp bài thành công!");
        document.getElementById('quiz-screen').style.display = 'none';
        document.getElementById('start-screen').style.display = 'block';
        window.showRanking(); // Tự động load bảng xếp hạng
    });
};

// --- BẢNG XẾP HẠNG & THỐNG KÊ ---
window.showRanking = function() {
    const box = document.getElementById('ranking-content');
    box.innerHTML = "Đang tải bảng xếp hạng...";
    fetch("https://script.google.com/macros/s/AKfycbwrNmZYpd3oMQrWxsTQg5lkhaSg7zVa-wN-xm5YRkoFGwUv36Za739HkHNQ5ZQOl4L3Cw/exec?action=getRanking")
    .then(res => res.json()).then(data => {
        data.sort((a,b) => b.diem - a.diem);
        box.innerHTML = data.map((item, idx) => `<div>${idx+1}. ${item.maHS}: <b>${item.diem} điểm</b></div>`).join('');
    }).catch(() => box.innerHTML = "Không thể tải bảng xếp hạng.");
};

window.checkAnswer = function(i, key, el) {
    if (el.parentElement.dataset.answered) return;
    el.parentElement.dataset.answered = "true";
    const isCorrect = key.toLowerCase() === String(window.currentQuizData[i].correct).trim().toLowerCase();
    el.style.backgroundColor = isCorrect ? '#d4edda' : '#f8d7da';
    if (!isCorrect) wrongQuestions.push(window.currentQuizData[i]);
    document.getElementById(isCorrect ? 'count-correct' : 'count-wrong').innerText++;
};

window.checkTypedAnswer = function(i, correct) {
    const input = document.getElementById(`input-${i}`);
    const isCorrect = input.value.trim().toLowerCase() === String(correct).trim().toLowerCase();
    document.getElementById(`feedback-${i}`).innerText = isCorrect ? "✅ Đúng!" : "❌ Sai!";
    if (!isCorrect) wrongQuestions.push(window.currentQuizData[i]);
    document.getElementById(isCorrect ? 'count-correct' : 'count-wrong').innerText++;
    input.disabled = true;
};

window.reviewWrong = function() {
    if (wrongQuestions.length === 0) return alert("Không có câu sai!");
    window.currentQuizData = wrongQuestions;
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('quiz-screen').style.display = 'block';
    window.renderQuiz();
};

window.showWrongStats = function() {
    if (wrongQuestions.length === 0) return alert("Bạn chưa có dữ liệu câu sai!");
    const stats = {};
    wrongQuestions.forEach(q => stats[q.chuDe] = (stats[q.chuDe] || 0) + 1);
    let msg = "THỐNG KÊ CÂU SAI:\n";
    Object.keys(stats).forEach(k => msg += `${k}: ${stats[k]} câu\n`);
    alert(msg);
};

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('load-data-btn').onclick = window.loadData;
    document.getElementById('start-btn').onclick = window.startQuiz;
});
