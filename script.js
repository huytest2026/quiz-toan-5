đây code nhờ kiểm tra:// --- KHAI BÁO BIẾN ---
let studentCode = "";
let currentSubject = "";
let totalQuestions = 0;
let timerInterval;
let timeLeft = 0;
let wrongQuestions = [];

window.allQuizData = [];
window.userPermissions = [];
window.currentQuizData = [];

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
        let cleanText = text.replace(/_+/g, " "); 
        let fullText = "Câu " + (questionIndex + 1) + ". " + cleanText;
        const utterance = new SpeechSynthesisUtterance(fullText);
        utterance.lang = 'vi-VN'; 
        window.speechSynthesis.speak(utterance);
    }
};

// --- BẮT ĐẦU & ĐỒNG HỒ ---
window.startQuiz = function() {
    currentSubject = document.getElementById('subject-select').value;
    const selected = Array.from(document.querySelectorAll('input[name="topic"]:checked')).map(cb => cb.value);
    if (selected.length === 0) return alert("Vui lòng chọn ít nhất một chủ đề!");
    
    timeLeft = (currentSubject === "Toán") ? 15 * 60 : 10 * 60;
    wrongQuestions = []; 
    
    window.currentQuizData = window.allQuizData.filter(i => i.mon === currentSubject && selected.includes(i.chuDe)).sort(() => Math.random() - 0.5);
    totalQuestions = Math.min(window.currentQuizData.length, (currentSubject === "Toán" ? 10 : 20));
    window.currentQuizData = window.currentQuizData.slice(0, totalQuestions);
    
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('quiz-screen').style.display = 'block';
    document.getElementById('count-correct').innerText = "0";
    document.getElementById('count-wrong').innerText = "0";
    
    clearInterval(timerInterval);
    timerInterval = setInterval(updateTimer, 1000);
    window.renderQuiz();
};

function updateTimer() {
    const display = document.getElementById('timer-display');
    let m = Math.floor(timeLeft / 60);
    let s = timeLeft % 60;
    display.innerText = `${m}:${s < 10 ? '0' : ''}${s}`;
    if (timeLeft <= 0) { clearInterval(timerInterval); alert("Hết giờ!"); window.submitQuiz(); }
    timeLeft--;
}

// --- RENDER QUIZ ---
window.renderQuiz = function() {
    const quizDiv = document.getElementById('quiz');
    quizDiv.innerHTML = window.currentQuizData.map((item, i) => {
        const loai = String(item.loai || "").trim().toLowerCase();
        const safeQuestion = item.question.replace(/'/g, "\\'");
        // Điều kiện hiện nút loa
        const speakerBtn = (currentSubject === "Tiếng anh") 
            ? `<button class="speaker-btn" onclick="window.speakText('${safeQuestion}', ${i})">🔊</button>` 
            : "";
        
        if (loai === "voca") {
            return `<div class="quiz-card">
                <div>Câu ${i+1}: ${item.question} ${speakerBtn}</div>
                <input type="text" id="input-${i}" style="padding: 10px; width: 200px;"> 
                <button class="check-voca-btn" onclick="window.checkTypedAnswer(${i}, '${(item.correct || '').replace(/'/g, "\\'")}')">Kiểm tra</button>
                <div id="feedback-${i}"></div>
            </div>`;
        } else {
            return `<div class="quiz-card">
                <div>Câu ${i+1}: ${item.question} ${speakerBtn}</div>
                ${['a','b','c','d'].map(key => `<div class="option-box" onclick="window.checkAnswer(${i}, '${key}', this)">${item[key] || ""}</div>`).join('')}
            </div>`;
        }
    }).join('');
};

// --- NỘP BÀI & TỰ ĐỘNG LOAD XẾP HẠNG ---
window.submitQuiz = function() {
    clearInterval(timerInterval);
    const score = parseInt(document.getElementById('count-correct').innerText || 0);
    const API_URL = "https://script.google.com/macros/s/AKfycbwrNmZYpd3oMQrWxsTQg5lkhaSg7zVa-wN-xm5YRkoFGwUv36Za739HkHNQ5ZQOl4L3Cw/exec";
    
    fetch(API_URL, { 
        method: "POST", 
        mode: "no-cors", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ maHS: studentCode, score, total: totalQuestions, mon: currentSubject }) 
    })
    .then(() => {
        alert("Nộp bài thành công! Điểm: " + score + "/" + totalQuestions);
        document.getElementById('quiz-screen').style.display = 'none';
        document.getElementById('start-screen').style.display = 'block';
        
        // Tự động cập nhật bảng xếp hạng
        window.showRanking();
    });
};

// --- XỬ LÝ ĐÁP ÁN ---
window.checkAnswer = function(i, selectedKey, element) {
    const questionData = window.currentQuizData[i];
    const parent = element.parentElement;
    if (parent.dataset.answered) return;
    parent.dataset.answered = "true";
    const rawCorrect = String(questionData.correct || "").trim().toLowerCase();
    const isCorrect = (['a', 'b', 'c', 'd'].includes(rawCorrect)) ? (selectedKey.toLowerCase() === rawCorrect) : (element.innerText.trim().toLowerCase() === rawCorrect);
    element.style.backgroundColor = isCorrect ? '#d4edda' : '#f8d7da';
    if (!isCorrect) wrongQuestions.push(questionData);
    let el = document.getElementById(isCorrect ? 'count-correct' : 'count-wrong');
    if (el) el.innerText = parseInt(el.innerText || 0) + 1;
};

window.checkTypedAnswer = function(i, correctAnswer) {
    const inputElement = document.getElementById(`input-${i}`);
    const feedback = document.getElementById(`feedback-${i}`);
    const isCorrect = inputElement.value.trim().toLowerCase() === String(correctAnswer).trim().toLowerCase();
    feedback.innerText = isCorrect ? "✅ Đúng!" : `❌ Sai! Đáp án: ${correctAnswer}`;
    if (!isCorrect) wrongQuestions.push(window.currentQuizData[i]);
    let el = document.getElementById(isCorrect ? 'count-correct' : 'count-wrong');
    if (el) el.innerText = parseInt(el.innerText || 0) + 1;
    inputElement.disabled = true;
};

// --- BẢNG XẾP HẠNG & THỐNG KÊ ---
window.showRanking = function() {
    const rankingContent = document.getElementById('ranking-content');
    rankingContent.innerHTML = "Đang tải bảng xếp hạng...";
    const API_URL = "https://script.google.com/macros/s/AKfycbwrNmZYpd3oMQrWxsTQg5lkhaSg7zVa-wN-xm5YRkoFGwUv36Za739HkHNQ5ZQOl4L3Cw/exec";
    
    fetch(`${API_URL}?action=getRanking`)
    .then(res => res.json())
    .then(data => {
        data.sort((a, b) => b.diem - a.diem);
        let list = data.map((item, idx) => {
            let medal = (idx === 0) ? "🥇 " : (idx === 1) ? "🥈 " : (idx === 2) ? "🥉 " : "";
            return `<div>${idx + 1}. ${medal}${item.maHS}: <b>${item.diem} điểm</b></div>`;
        }).join('');
        rankingContent.innerHTML = list || "Chưa có dữ liệu.";
    })
    .catch(() => { rankingContent.innerHTML = "Không lấy được xếp hạng!"; });
};

window.reviewWrong = function() {
    if (wrongQuestions.length === 0) return alert("Không có câu sai!");
    window.currentQuizData = wrongQuestions;
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('quiz-screen').style.display = 'block';
    window.renderQuiz();
};

window.showWrongStats = function() {
    if (wrongQuestions.length === 0) return alert("Bạn chưa có dữ liệu câu sai để thống kê!");
    const stats = {};
    wrongQuestions.forEach(q => stats[q.chuDe] = (stats[q.chuDe] || 0) + 1);
    const sortedStats = Object.keys(stats).map(chuDe => ({ chuDe: chuDe, count: stats[chuDe] })).sort((a, b) => b.count - a.count);
    let message = "THỐNG KÊ CÁC CHỦ ĐỀ CẦN ÔN TẬP:\n\n";
    sortedStats.forEach((item, index) => message += `${index + 1}. ${item.chuDe}: Sai ${item.count} câu\n`);
    alert(message);
};

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('load-data-btn').onclick = window.loadData;
    document.getElementById('start-btn').onclick = window.startQuiz;
});
