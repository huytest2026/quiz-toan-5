// --- KHAI BÁO BIẾN TOÀN CỤC ---
let studentCode = "";
let currentSubject = "";
let totalQuestions = 0;
let timerInterval;
let timeLeft = 0;
let wrongQuestions = []; // Lưu danh sách câu sai

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

// --- CHỨC NĂNG ÂM THANH ---
window.speakText = function(text) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        window.speechSynthesis.speak(utterance);
    }
};

// --- BẮT ĐẦU KIỂM TRA & ĐỒNG HỒ ---
window.startQuiz = function() {
    currentSubject = document.getElementById('subject-select').value;
    const selected = Array.from(document.querySelectorAll('input[name="topic"]:checked')).map(cb => cb.value);
    if (selected.length === 0) return alert("Vui lòng chọn ít nhất một chủ đề!");
    
    // Thiết lập thời gian: Toán 15p, Tiếng Anh 10p
    timeLeft = (currentSubject === "Toán") ? 15 * 60 : 10 * 60;
    wrongQuestions = []; // Reset câu sai mỗi lần bắt đầu mới
    
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
    if (timeLeft <= 0) { 
        clearInterval(timerInterval); 
        alert("Hết giờ!");
        window.submitQuiz(); 
    }
    timeLeft--;
}

// --- RENDER GIAO DIỆN ---
window.renderQuiz = function() {
    const quizDiv = document.getElementById('quiz');
    quizDiv.innerHTML = window.currentQuizData.map((item, i) => {
        const loai = String(item.loai || "").trim().toLowerCase();
        const speakerBtn = `<button onclick="window.speakText('${item.question.replace(/'/g, "\\'")}')" style="margin-left:10px; cursor:pointer;">🔊</button>`;
        
        if (loai === "voca") {
            return `<div class="quiz-card" style="border:1px solid #ddd; padding:15px; margin:10px 0; border-radius:10px;">
                <div class="question" style="font-weight:bold;">Câu ${i+1}: ${item.question} ${speakerBtn}</div>
                <input type="text" id="input-${i}" placeholder="Nhập đáp án..." style="width:100%; padding:10px; margin:10px 0;">
                <button onclick="window.checkTypedAnswer(${i}, '${(item.correct || '').replace(/'/g, "\\'")}')">Kiểm tra</button>
                <div id="feedback-${i}" style="margin-top:10px; font-weight:bold;"></div>
            </div>`;
        } else {
            return `<div class="quiz-card" style="border:1px solid #ddd; padding:15px; margin:10px 0; border-radius:10px;">
                <div class="question" style="font-weight:bold;">Câu ${i+1}: ${item.question} ${speakerBtn}</div>
                <div class="options-grid" style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:10px;">
                    ${['a','b','c','d'].map(key => `<div class="option-box" data-key="${key}" onclick="window.checkAnswer(${i}, '${key}', this)" style="border:1px solid #ccc; padding:10px; cursor:pointer;">${item[key] || ""}</div>`).join('')}
                </div>
            </div>`;
        }
    }).join('');
};

// --- NỘP BÀI ---
window.submitQuiz = function() {
    clearInterval(timerInterval);
    const score = parseInt(document.getElementById('count-correct').innerText || 0);
    const API_URL = "https://script.google.com/macros/s/AKfycbwrNmZYpd3oMQrWxsTQg5lkhaSg7zVa-wN-xm5YRkoFGwUv36Za739HkHNQ5ZQOl4L3Cw/exec";
    
    fetch(API_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maHS: studentCode, score: score, total: totalQuestions, mon: currentSubject })
    })
    .then(() => {
        alert("Nộp bài thành công! Điểm: " + score + "/" + totalQuestions);
        document.getElementById('quiz-screen').style.display = 'none';
        document.getElementById('start-screen').style.display = 'block';
    });
};

// --- KIỂM TRA ĐÁP ÁN ---
window.checkAnswer = function(i, selectedKey, element) {
    const questionData = window.currentQuizData[i];
    const parent = element.parentElement;
    if (parent.dataset.answered) return;
    parent.dataset.answered = "true";
    const rawCorrect = String(questionData.correct || "").trim().toLowerCase();
    const isCorrect = (['a', 'b', 'c', 'd'].includes(rawCorrect)) ? (selectedKey.toLowerCase() === rawCorrect) : (element.innerText.trim().toLowerCase() === rawCorrect);
    element.style.backgroundColor = isCorrect ? '#d4edda' : '#f8d7da';
    if (!isCorrect) {
        wrongQuestions.push(questionData); // Lưu câu sai
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
    if (!isCorrect) wrongQuestions.push(window.currentQuizData[i]); // Lưu câu sai
    let el = document.getElementById(isCorrect ? 'count-correct' : 'count-wrong');
    if (el) el.innerText = parseInt(el.innerText || 0) + 1;
};

// --- XẾP HẠNG & ÔN TẬP ---
window.showRanking = function() {
    alert("Vui lòng thiết lập API lấy dữ liệu xếp hạng trong Apps Script!");
};

window.reviewWrong = function() {
    if (wrongQuestions.length === 0) return alert("Bạn chưa làm sai câu nào!");
    window.currentQuizData = wrongQuestions;
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('quiz-screen').style.display = 'block';
    window.renderQuiz();
};

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('load-data-btn').onclick = window.loadData;
    document.getElementById('start-btn').onclick = window.startQuiz;
    const submitBtn = document.getElementById('submit-btn');
    if (submitBtn) submitBtn.onclick = window.submitQuiz;
});
