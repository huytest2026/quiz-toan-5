window.allQuizData = [];
window.userPermissions = [];
window.currentQuizData = [];
let timerInterval;

// --- 1. Hàm tải dữ liệu ---
window.loadData = function() {
    const maHS = document.getElementById('student-code').value.trim();
    if (!maHS) return alert("Nhập mã học sinh!");
    const API_URL = "https://script.google.com/macros/s/AKfycbwrNmZYpd3oMQrWxsTQg5lkhaSg7zVa-wN-xm5YRkoFGwUv36Za739HkHNQ5ZQOl4L3Cw/exec";
    const script = document.createElement('script');
    script.src = `${API_URL}?ma=${encodeURIComponent(maHS)}&callback=handleQuizData`;
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
    const mon = document.getElementById('subject-select').value;
    const maHS = document.getElementById('student-code').value.trim();
    const container = document.getElementById('topic-container');
    if (!container || !mon) return;
    const allowed = window.userPermissions.filter(p => String(p.maHS) === maHS && p.mon === mon).map(p => p.chuDe);
    const topics = [...new Set(window.allQuizData.filter(i => i.mon === mon).map(i => i.chuDe))];
    container.innerHTML = topics.map(topic => {
        const isAllowed = allowed.includes(topic);
        return `<label style="display:block; margin:5px 0; opacity:${isAllowed ? '1' : '0.5'}">
            <input type="checkbox" name="topic" value="${topic}" ${isAllowed ? 'checked' : 'disabled'}> ${topic}
        </label>`;
    }).join('');
};

// --- 3. Hàm hiển thị (Có cả Trắc nghiệm & VOCA) ---
window.renderQuiz = function() {
    const quizDiv = document.getElementById('quiz');
    if (!quizDiv) return;
    
    quizDiv.innerHTML = window.currentQuizData.map((item, i) => {
        // Nếu là VOCA (dựa vào tên chủ đề hoặc dữ liệu đặc thù)
        if (item.chuDe.toLowerCase().includes('voca') || item.type === 'voca') {
            return `
            <div class="quiz-card" style="margin-bottom:20px; padding:15px; border:2px solid #007bff; border-radius:8px; background: #f0f7ff;">
                <button onclick="window.speak('${item.question.replace(/'/g, "\\'")}')" style="margin-bottom:5px; cursor:pointer;">🔊 Nghe từ</button>
                <h3 style="margin:5px 0;">${item.question}</h3>
                <p>Nghĩa: <b>${item.a}</b></p>
                <p>Ví dụ: <i>${item.b}</i></p>
            </div>`;
        }
        
        // Mặc định là Trắc nghiệm
        let options = [{k:'a',v:item.a}, {k:'b',v:item.b}, {k:'c',v:item.c}, {k:'d',v:item.d}].sort(() => Math.random() - 0.5);
        const cleanQuestion = item.question.replace(/_/g, " ");
        const speechText = `Câu ${i+1}: ${cleanQuestion}`;
        return `
        <div class="quiz-card" id="q-card-${i}" style="margin-bottom:15px; padding:10px; border:2px solid #ddd; border-radius:8px;">
            <button onclick="window.speak('${speechText.replace(/'/g, "\\'")}')" style="margin-bottom:5px; cursor:pointer;">🔊 Nghe câu hỏi</button>
            <b>Câu ${i+1}: ${item.question}</b><br>
            ${options.map(opt => `
                <div class="option-box" style="display:block; margin:5px 0; padding:5px; border:1px solid #eee; cursor:pointer;" 
                     onclick="window.checkAnswer(${i}, '${opt.k}', this, '${opt.v.replace(/'/g, "\\'")}')">
                    ${opt.v}
                </div>
            `).join('')}
        </div>`;
    }).join('');
};

window.speak = function(text) {
    window.speechSynthesis.cancel();
    const msg = new SpeechSynthesisUtterance(text);
    msg.lang = 'en-US';
    window.speechSynthesis.speak(msg);
};

// --- 4. Logic chấm điểm ---
window.checkAnswer = function(i, selectedKey, element, selectedText) {
    const questionData = window.currentQuizData[i];
    const correctValue = String(questionData.correct).trim();
    const currentSubject = document.getElementById('subject-select').value;
    let isCorrect = (selectedText.trim() === correctValue) || (selectedKey.toLowerCase() === correctValue.toLowerCase());
    element.style.backgroundColor = isCorrect ? '#d4edda' : '#f8d7da';
    const card = document.getElementById(`q-card-${i}`);
    card.querySelectorAll('.option-box').forEach(box => {
        if (currentSubject === 'Tiếng anh' && !isCorrect && box.innerText.trim() === correctValue) {
            box.style.backgroundColor = '#d4edda';
        }
        box.style.pointerEvents = 'none';
        box.style.opacity = '0.7';
    });
    let el = document.getElementById(isCorrect ? 'count-correct' : 'count-wrong');
    el.innerText = parseInt(el.innerText) + 1;
};

// --- 5. Bắt đầu và Nộp bài ---
window.startQuiz = function() {
    const mon = document.getElementById('subject-select').value;
    const selected = Array.from(document.querySelectorAll('input[name="topic"]:checked')).map(cb => cb.value);
    if (selected.length === 0) return alert("Chọn chủ đề!");
    window.currentQuizData = window.allQuizData.filter(i => i.mon === mon && selected.includes(i.chuDe)).sort(() => Math.random() - 0.5);
    let time = (mon === 'Toán' ? 15 : 10) * 60;
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
    location.reload();
};

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('load-data-btn').onclick = window.loadData;
    document.getElementById('start-btn').onclick = window.startQuiz;
});
