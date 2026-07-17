// --- CÁC BIẾN TOÀN CỤC ---
let studentCode = localStorage.getItem('savedStudentCode') || ""; 
let currentSubject = "", timerInterval, timeLeft = 0, wrongQuestions = [];
window.allQuizData = []; window.userPermissions = []; window.currentQuizData = [];

// --- TẢI DỮ LIỆU ---
window.loadData = function() {
    const inputCode = document.getElementById('student-code').value.trim();
    studentCode = inputCode || studentCode; 
    
    if (!studentCode) return alert("Vui lòng nhập mã học sinh!");
    localStorage.setItem('savedStudentCode', studentCode); // Lưu mã để dùng lại

    const API_URL = "https://script.google.com/macros/s/AKfycbwrNmZYpd3oMQrWxsTQg5lkhaSg7zVa-wN-xm5YRkoFGwUv36Za739HkHNQ5ZQOl4L3Cw/exec";
    const script = document.createElement('script');
    script.src = `${API_URL}?ma=${encodeURIComponent(studentCode)}&callback=handleQuizData`;
    document.body.appendChild(script);
};

window.handleQuizData = function(data) {
    if (data.error) return alert(data.error);
    window.allQuizData = data.questions || [];
    window.userPermissions = data.permissions || [];
    
    // Ẩn ô nhập mã sau khi đã tải thành công
    document.getElementById('student-code').parentElement.style.display = 'none';
    alert("Tải dữ liệu thành công!");
    window.updateTopicList();
};

// --- XẾP HẠNG ---
window.getRanking = function() {
    // Gọi API để lấy bảng xếp hạng (cần thay thế link API thực tế của bảng xếp hạng)
    console.log("Đang tải bảng xếp hạng...");
    document.getElementById('ranking-container').innerHTML = "Đang tải dữ liệu xếp hạng...";
};

// --- CHẤM ĐIỂM ---
window.checkAnswer = function(i, selectedKey, element, isRight) {
    if (element.parentElement.dataset.answered) return;
    element.parentElement.dataset.answered = "true";
    element.style.backgroundColor = isRight ? '#d4edda' : '#f8d7da';
    
    if (!isRight) {
        wrongQuestions.push(window.currentQuizData[i]);
        element.parentElement.querySelectorAll('.option-box').forEach(box => {
            if (box.dataset.isCorrect === "true") box.style.backgroundColor = '#d4edda';
        });
    }
    let counter = document.getElementById(isRight ? 'count-correct' : 'count-wrong');
    counter.innerText = parseInt(counter.innerText) + 1;
};

// --- BẮT ĐẦU THI ---
window.startQuiz = function() {
    currentSubject = document.getElementById('subject-select').value;
    const selected = Array.from(document.querySelectorAll('input[name="topic"]:checked')).map(cb => cb.value);
    if (selected.length === 0) return alert("Vui lòng chọn chủ đề!");
    
    // Cấu hình: Tiếng anh (20 câu/10p), Toán (10 câu/15p)
    const isMath = (currentSubject === "Toán");
    timeLeft = isMath ? 900 : 600;
    const limit = isMath ? 10 : 20;
    
    wrongQuestions = [];
    window.currentQuizData = window.allQuizData.filter(i => i.mon === currentSubject && selected.includes(i.chuDe)).sort(() => Math.random() - 0.5).slice(0, limit);
    
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

// --- NỘP BÀI ---
window.submitQuiz = function() {
    clearInterval(timerInterval);
    const score = parseInt(document.getElementById('count-correct').innerText || 0);
    
    fetch("https://script.google.com/macros/s/AKfycbwrNmZYpd3oMQrWxsTQg5lkhaSg7zVa-wN-xm5YRkoFGwUv36Za739HkHNQ5ZQOl4L3Cw/exec", { 
        method: "POST", mode: "no-cors", headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ maHS: studentCode, score, total: window.currentQuizData.length, mon: currentSubject }) 
    }).then(() => {
        alert("Nộp bài thành công!");
        window.getRanking(); // Tự động cập nhật bảng xếp hạng
        
        // Trở về màn hình chọn bài để thi lại
        document.getElementById('quiz-screen').style.display = 'none';
        document.getElementById('start-screen').style.display = 'block';
    });
};

// --- KHỞI TẠO ---
document.addEventListener('DOMContentLoaded', () => {
    // Tự động tải nếu đã có mã từ trước
    if (localStorage.getItem('savedStudentCode')) {
        document.getElementById('student-code').value = localStorage.getItem('savedStudentCode');
        window.loadData();
    }
    document.getElementById('load-data-btn').onclick = window.loadData;
    document.getElementById('start-btn').onclick = window.startQuiz;
    document.getElementById('submit-btn').onclick = window.submitQuiz;
});
