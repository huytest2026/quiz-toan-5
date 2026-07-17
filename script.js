// --- CÁC BIẾN TOÀN CỤC ---
let studentCode = "", currentSubject = "", timerInterval, timeLeft = 0, wrongQuestions = [];
window.allQuizData = []; window.userPermissions = []; window.currentQuizData = [];

// --- TẢI DỮ LIỆU ---
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

// --- HÀM CHẤM ĐIỂM HOÀN THIỆN ---
window.checkAnswer = function(i, selectedKey, element) {
    if (element.parentElement.dataset.answered) return;
    element.parentElement.dataset.answered = "true";

    const questionData = window.currentQuizData[i];
    const selectedText = String(questionData[selectedKey] || "").trim().toLowerCase();
    const rawCorrect = String(questionData.correct || "").trim().toLowerCase();
    
    let isCorrect = false;
    // So sánh đáp án
    if (['a', 'b', 'c', 'd'].includes(rawCorrect)) {
        isCorrect = (selectedKey.toLowerCase() === rawCorrect);
    } else {
        isCorrect = (selectedText === rawCorrect);
    }

    // Tô màu lựa chọn
    element.style.backgroundColor = isCorrect ? '#d4edda' : '#f8d7da';
    
    // Nếu sai, tự động tô màu đáp án đúng
    if (!isCorrect) {
        wrongQuestions.push(questionData);
        element.parentElement.querySelectorAll('.option-box').forEach(box => {
            const boxText = box.innerText.trim().toLowerCase();
            // So sánh nội dung đáp án đúng với nội dung hiển thị trong box
            if (boxText === rawCorrect || box.getAttribute('onclick').includes(`'${rawCorrect}'`)) {
                box.style.backgroundColor = '#d4edda';
            }
        });
    }

    // Cập nhật điểm
    let counter = document.getElementById(isCorrect ? 'count-correct' : 'count-wrong');
    counter.innerText = parseInt(counter.innerText) + 1;
};

// --- CÁC TÍNH NĂNG BỔ TRỢ ---
window.speakText = function(text, questionIndex) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance("Câu " + (questionIndex + 1) + ". " + text.replace(/_+/g, " "));
        utterance.lang = 'vi-VN';
        window.speechSynthesis.speak(utterance);
    }
};

window.renderQuiz = function() {
    document.getElementById('quiz').innerHTML = window.currentQuizData.map((item, i) => {
        const speakerBtn = (currentSubject === "Tiếng anh") ? `<button onclick="window.speakText('${item.question.replace(/'/g, "\\'")}', ${i})">🔊</button>` : "";
        if (String(item.loai).trim().toLowerCase() === "voca") {
            return `<div class="quiz-card"><div>Câu ${i+1}: ${item.question} ${speakerBtn}</div><input type="text" id="input-${i}"><button onclick="window.checkTypedAnswer(${i}, '${item.correct}')">Kiểm tra</button><div id="feedback-${i}"></div></div>`;
        }
        return `<div class="quiz-card"><div>Câu ${i+1}: ${item.question} ${speakerBtn}</div>${['a','b','c','d'].map(key => `<div class="option-box" style="padding:10px; border:1px solid #ddd; cursor:pointer;" onclick="window.checkAnswer(${i}, '${key}', this)">${item[key] || ""}</div>`).join('')}</div>`;
    }).join('');
};

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

window.submitQuiz = function() {
    clearInterval(timerInterval);
    const score = parseInt(document.getElementById('count-correct').innerText || 0);
    fetch("https://script.google.com/macros/s/AKfycbwrNmZYpd3oMQrWxsTQg5lkhaSg7zVa-wN-xm5YRkoFGwUv36Za739HkHNQ5ZQOl4L3Cw/exec", { 
        method: "POST", mode: "no-cors", headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ maHS: studentCode, score, total: window.currentQuizData.length, mon: currentSubject }) 
    }).then(() => {
        alert("Nộp bài thành công!");
        location.reload();
    });
};

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('load-data-btn').onclick = window.loadData;
    document.getElementById('start-btn').onclick = window.startQuiz;
});
