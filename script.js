// --- ĐỊNH NGHĨA CÁC HÀM TRƯỚC (Để tránh lỗi is not a function) ---
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
    const quizContainer = document.getElementById('quiz');
    quizContainer.innerHTML = window.currentQuizData.map((item, i) => {
        const optionsHTML = ['a','b','c','d'].map(key => {
            const isRight = (String(item[key]).trim().toLowerCase() === String(item.correct).trim().toLowerCase());
            return `<div class="option-box" style="padding:10px; border:1px solid #ddd; cursor:pointer;" onclick="window.checkAnswer(${i}, '${key}', this, ${isRight})" data-is-correct="${isRight}">${item[key] || ""}</div>`;
        }).join('');
        return `<div class="quiz-card" style="margin-bottom:20px;"><div>Câu ${i+1}: ${item.question}</div>${optionsHTML}</div>`;
    }).join('');
};

window.checkAnswer = function(i, selectedKey, element, isRight) {
    if (element.parentElement.dataset.answered) return;
    element.parentElement.dataset.answered = "true";
    element.style.backgroundColor = isRight ? '#d4edda' : '#f8d7da';
    if (!isRight) {
        element.parentElement.querySelectorAll('.option-box').forEach(box => {
            if (box.dataset.isCorrect === "true") box.style.backgroundColor = '#d4edda';
        });
    }
    let counter = document.getElementById(isRight ? 'count-correct' : 'count-wrong');
    if(counter) counter.innerText = parseInt(counter.innerText) + 1;
};

// --- CÁC BIẾN & XỬ LÝ CHÍNH ---
let studentCode = "", currentSubject = "", timerInterval;
window.allQuizData = []; window.userPermissions = []; window.currentQuizData = [];

window.loadData = function() {
    studentCode = document.getElementById('student-code').value.trim();
    if (!studentCode) return alert("Nhập mã học sinh!");
    const API_URL = "https://script.google.com/macros/s/AKfycbwrNmZYpd3oMQrWxsTQg5lkhaSg7zVa-wN-xm5YRkoFGwUv36Za739HkHNQ5ZQOl4L3Cw/exec";
    const script = document.createElement('script');
    script.src = `${API_URL}?ma=${encodeURIComponent(studentCode)}&callback=handleQuizData`;
    document.body.appendChild(script);
};

window.handleQuizData = function(data) {
    window.allQuizData = data.questions || [];
    window.userPermissions = data.permissions || [];
    document.getElementById('student-code').style.display = 'none';
    alert("Tải dữ liệu thành công!");
    window.updateTopicList();
};

window.startQuiz = function() {
    currentSubject = document.getElementById('subject-select').value;
    const selected = Array.from(document.querySelectorAll('input[name="topic"]:checked')).map(cb => cb.value);
    if (selected.length === 0) return alert("Vui lòng chọn chủ đề!");
    
    window.currentQuizData = window.allQuizData.filter(i => i.mon === currentSubject && selected.includes(i.chuDe)).sort(() => Math.random() - 0.5).slice(0, (currentSubject === "Toán" ? 10 : 20));
    
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('quiz-screen').style.display = 'block';
    
    window.renderQuiz();
};

window.submitQuiz = function() {
    alert("Nộp bài thành công!");
    location.reload();
};

// --- KHỞI TẠO SỰ KIỆN AN TOÀN ---
document.addEventListener('DOMContentLoaded', () => {
    // Gắn trực tiếp onclick vào phần tử thay vì qua biến để tránh mất kết nối
    document.getElementById('load-data-btn').onclick = window.loadData;
    document.getElementById('start-btn').onclick = window.startQuiz;
    document.getElementById('submit-btn').onclick = window.submitQuiz; // Nút nộp bài
    document.getElementById('subject-select').onchange = window.updateTopicList;
});
