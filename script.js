// --- KHAI BÁO BIẾN TOÀN CỤC ---
let studentCode = "";
let currentSubject = "";
let totalQuestions = 0;
let timerInterval;

window.allQuizData = [];
window.userPermissions = [];
window.currentQuizData = [];

// --- TÍNH NĂNG LOAD DỮ LIỆU (Sử dụng kỹ thuật JSONP để tránh lỗi CORB) ---
window.loadData = function() {
    studentCode = document.getElementById('student-code').value.trim();
    if (!studentCode) return alert("Nhập mã học sinh!");
    
    const API_URL = "https://script.google.com/macros/s/AKfycbwrNmZYpd3oMQrWxsTQg5lkhaSg7zVa-wN-xm5YRkoFGwUv36Za739HkHNQ5ZQOl4L3Cw/exec";
    
    // Tạo thẻ script để lấy dữ liệu (cách này vượt qua được CORB)
    const script = document.createElement('script');
    script.src = `${API_URL}?ma=${encodeURIComponent(studentCode)}&callback=handleQuizData`;
    document.body.appendChild(script);
    
    // Xử lý lỗi nếu không tải được
    script.onerror = function() {
        alert("Lỗi tải dữ liệu. Hãy đảm bảo bạn đã triển khai 'Bất kỳ ai' trên Google Apps Script.");
    };
};

// Hàm callback được gọi sau khi Google Apps Script trả dữ liệu về
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

// --- LOGIC HIỂN THỊ CÂU HỎI ---
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

// --- CÁC TÍNH NĂNG KHÁC ---
window.checkAnswer = function(i, selectedKey, element) { /* giữ nguyên logic cũ */ };
window.checkTypedAnswer = function(i, correctAnswer) { /* giữ nguyên logic cũ */ };
window.startQuiz = function() { /* giữ nguyên logic cũ */ };
window.submitQuiz = function() { /* giữ nguyên logic cũ */ };
window.showRanking = function() { /* giữ nguyên logic cũ */ };
window.speakText = function(text) { /* giữ nguyên logic cũ */ };
window.reviewWrong = function() { /* giữ nguyên logic cũ */ };

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('load-data-btn').onclick = window.loadData;
    document.getElementById('start-btn').onclick = window.startQuiz;
});
