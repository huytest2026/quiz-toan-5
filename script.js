// --- CÁC BIẾN TOÀN CỤC ---
let studentCode = localStorage.getItem('savedStudentCode') || ""; 
let currentSubject = "", timerInterval, timeLeft = 0, wrongQuestions = [];
window.allQuizData = []; window.userPermissions = []; window.currentQuizData = [];

// --- TẢI DỮ LIỆU ---
window.loadData = function() {
    const inputCode = document.getElementById('student-code').value.trim();
    studentCode = inputCode || studentCode; 
    
    if (!studentCode) return alert("Vui lòng nhập mã học sinh!");
    localStorage.setItem('savedStudentCode', studentCode); // Lưu mã để dùng lại lần sau

    const API_URL = "https://script.google.com/macros/s/AKfycbwrNmZYpd3oMQrWxsTQg5lkhaSg7zVa-wN-xm5YRkoFGwUv36Za739HkHNQ5ZQOl4L3Cw/exec";
    const script = document.createElement('script');
    script.src = `${API_URL}?ma=${encodeURIComponent(studentCode)}&callback=handleQuizData`;
    document.body.appendChild(script);
};

window.handleQuizData = function(data) {
    if (data.error) return alert(data.error);
    window.allQuizData = data.questions || [];
    window.userPermissions = data.permissions || [];
    
    // Ẩn vùng nhập mã (xử lý linh hoạt theo cấu trúc thẻ HTML của bạn)
    const loginSection = document.getElementById('login-section');
    if (loginSection) {
        loginSection.style.display = 'none';
    } else {
        const studentCodeEl = document.getElementById('student-code');
        if (studentCodeEl && studentCodeEl.parentElement) {
            studentCodeEl.parentElement.style.display = 'none';
        }
    }
    
    alert("Tải dữ liệu thành công!");
    window.updateTopicList();
};

// --- CẬP NHẬT DANH SÁCH CHỦ ĐỀ ---
window.updateTopicList = function() {
    currentSubject = document.getElementById('subject-select').value;
    const container = document.getElementById('topic-container');
    if (!container || !currentSubject) return;
    
    const allowed = window.userPermissions.filter(p => String(p.maHS) === studentCode && p.mon === currentSubject).map(p => p.chuDe);
    const topics = [...new Set(window.allQuizData.filter(i => i.mon === currentSubject).map(i => i.chuDe))];
    
    container.innerHTML = topics.map(topic => {
        const isAllowed = allowed.includes(topic);
        return `<label style="display:block; margin:5px 0; opacity:${isAllowed ? '1' : '0.5'}">
            <input type="checkbox" name="topic" value="${topic}" ${isAllowed ? 'checked' : ''} ${isAllowed ? '' : 'disabled'}> ${topic}
        </label>`;
    }).join('');
};

// --- HIỂN THỊ CÂU HỎI RA MÀN HÌNH ---
window.renderQuiz = function() {
    const quizContainer = document.getElementById('quiz');
    if (!quizContainer) return;
    
    quizContainer.innerHTML = window.currentQuizData.map((item, i) => {
        const speakerBtn = (currentSubject === "Tiếng anh") ? `<button type="button" onclick="window.speakText('${item.question.replace(/'/g, "\\'")}', ${i})">🔊</button>` : "";
        
        // Tạo các ô lựa chọn và gắn sẵn data-is-correct để chấm điểm
        const optionsHTML = ['a','b','c','d'].map(key => {
            const isRight = (String(item[key]).trim().toLowerCase() === String(item.correct).trim().toLowerCase());
            return `<div class="option-box" style="padding:10px; border:1px solid #ddd; cursor:pointer; margin: 5px 0; border-radius: 5px;" 
                         onclick="window.checkAnswer(${i}, '${key}', this, ${isRight})" 
                         data-is-correct="${isRight}">
                         ${item[key] || ""}
                    </div>`;
        }).join('');

        if (String(item.loai).trim().toLowerCase() === "voca") {
            return `<div class="quiz-card" style="margin-bottom:20px; padding:15px; border:1px solid #eee; border-radius:8px;"><div>Câu ${i+1}: ${item.question} ${speakerBtn}</div><input type="text" id="input-${i}" style="margin-top:10px; padding:5px;"><button type="button" onclick="window.checkTypedAnswer(${i}, '${item.correct}')" style="margin-left:5px;">Kiểm tra</button><div id="feedback-${i}" style="margin-top:5px; font-weight:bold;"></div></div>`;
        }
        return `<div class="quiz-card" style="margin-bottom:20px; padding:15px; border:1px solid #eee; border-radius:8px;"><div>Câu ${i+1}: ${item.question} ${speakerBtn}</div><div style="margin-top:10px;">${optionsHTML}</div></div>`;
    }).join('');
};

// --- CHẤM ĐIỂM (TÔ XANH ĐÁP ÁN ĐÚNG KHI CHỌN SAI) ---
window.checkAnswer = function(i, selectedKey, element, isRight) {
    if (element.parentElement.dataset.answered) return;
    element.parentElement.dataset.answered = "true";
    
    // Tô màu ô người dùng chọn (Xanh nếu đúng / Đỏ nếu sai)
    element.style.backgroundColor = isRight ? '#d4edda' : '#f8d7da';
    
    // Nếu chọn sai, tự động tìm và tô xanh ô đáp án đúng thông qua thuộc tính data-is-correct
    if (!isRight) {
        wrongQuestions.push(window.currentQuizData[i]);
        element.parentElement.querySelectorAll('.option-box').forEach(box => {
            if (box.dataset.isCorrect === "true") box.style.backgroundColor = '#d4edda';
        });
    }
    
    let counter = document.getElementById(isRight ? 'count-correct' : 'count-wrong');
    if (counter) counter.innerText = parseInt(counter.innerText) + 1;
};

// --- BẮT ĐẦU THI ---
window.startQuiz = function() {
    currentSubject = document.getElementById('subject-select').value;
    const selected = Array.from(document.querySelectorAll('input[name="topic"]:checked')).map(cb => cb.value);
    if (selected.length === 0) return alert("Vui lòng chọn chủ đề!");
    
    // Cấu hình chuẩn: Tiếng Anh (20 câu/10 phút = 600s), Toán (10 câu/15 phút = 900s)
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
        const timerDisplay = document.getElementById('timer-display');
        if (timerDisplay) {
            timerDisplay.innerText = Math.floor(timeLeft/60) + ":" + (timeLeft%60).toString().padStart(2, '0');
        }
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
        window.getRanking(); // Tự động cập nhật bảng xếp hạng hiển thị ngay phía dưới
        
        // Trở về màn hình chọn bài để tiếp tục ôn luyện mà không cần nhập lại mã
        document.getElementById('quiz-screen').style.display = 'none';
        document.getElementById('start-screen').style.display = 'block';
        
        // Reset bộ đếm điểm hiển thị về 0 để chuẩn bị cho lượt thi kế tiếp
        document.getElementById('count-correct').innerText = "0";
        document.getElementById('count-wrong').innerText = "0";
    });
};

// --- CẬP NHẬT BẢNG XẾP HẠNG TỰ ĐỘNG ---
window.getRanking = function() {
    console.log("Đang tải bảng xếp hạng...");
    const rankingContent = document.getElementById('ranking-content');
    if (rankingContent) {
        rankingContent.innerHTML = "Đang tải dữ liệu xếp hạng mới nhất...";
        // Thêm logic gọi API riêng của bảng xếp hạng vào đây nếu bạn có link riêng
    }
};

// --- CÁC TÍNH NĂNG BỔ TRỢ KHÁC (Cần thiết cho Tiếng Anh / Câu viết) ---
window.speakText = function(text, questionIndex) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance("Câu " + (questionIndex + 1) + ". " + text.replace(/_+/g, " "));
        utterance.lang = 'vi-VN';
        window.speechSynthesis.speak(utterance);
    }
};

window.checkTypedAnswer = function(i, correct) {
    const input = document.getElementById(`input-${i}`);
    if (!input) return;
    const isCorrect = input.value.trim().toLowerCase() === String(correct).trim().toLowerCase();
    const feedback = document.getElementById(`feedback-${i}`);
    if (feedback) feedback.innerText = isCorrect ? "✅ Đúng!" : "❌ Sai!";
    if (!isCorrect) wrongQuestions.push(window.currentQuizData[i]);
    
    let counter = document.getElementById(isCorrect ? 'count-correct' : 'count-wrong');
    if (counter) counter.innerText = parseInt(counter.innerText) + 1;
    input.disabled = true;
};

// Các hàm bổ trợ nút bấm giao diện để tránh lỗi click
window.reviewWrong = function() { alert("Tính năng ôn tập câu sai đang được xử lý dữ liệu!"); };
window.showWrongStats = function() { alert("Tính năng thống kê lỗi sai đang được xử lý dữ liệu!"); };

// --- KHỞI TẠO HỆ THỐNG BAN ĐẦU ---
document.addEventListener('DOMContentLoaded', () => {
    // Tự động kiểm tra nếu bộ nhớ trình duyệt đã lưu mã học sinh trước đó
    if (localStorage.getItem('savedStudentCode')) {
        const studentInput = document.getElementById('student-code');
        if (studentInput) studentInput.value = localStorage.getItem('savedStudentCode');
        window.loadData(); // Tự động tải luôn dữ liệu đề thi
    }
    
    document.getElementById('load-data-btn').onclick = window.loadData;
    document.getElementById('start-btn').onclick = window.startQuiz;
    
    const submitBtn = document.getElementById('submit-btn');
    if (submitBtn) submitBtn.onclick = window.submitQuiz;
});
