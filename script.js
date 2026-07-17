// --- CÁC BIẾN TOÀN CỤC ---
// Đã cập nhật: Thêm localStorage để ghi nhớ mã học sinh
let studentCode = localStorage.getItem('savedStudentCode') || ""; 
let currentSubject = "", timerInterval, timeLeft = 0, wrongQuestions = [];
window.allQuizData = []; window.userPermissions = []; window.currentQuizData = [];

// --- TẢI DỮ LIỆU ---
window.loadData = function() {
    // Đã cập nhật: Ưu tiên mã từ ô input, nếu không có thì dùng mã đã lưu
    const inputCode = document.getElementById('student-code').value.trim();
    studentCode = inputCode || studentCode; 
    
    if (!studentCode) return alert("Nhập mã học sinh!");
    
    // Lưu mã vào trình duyệt để sử dụng cho các lần nộp bài/thi lại sau
    localStorage.setItem('savedStudentCode', studentCode);

    const API_URL = "https://script.google.com/macros/s/AKfycbwrNmZYpd3oMQrWxsTQg5lkhaSg7zVa-wN-xm5YRkoFGwUv36Za739HkHNQ5ZQOl4L3Cw/exec";
    const script = document.createElement('script');
    script.src = `${API_URL}?ma=${encodeURIComponent(studentCode)}&callback=handleQuizData`;
    document.body.appendChild(script);
};

window.handleQuizData = function(data) {
    if (data.error) return alert(data.error);
    window.allQuizData = data.questions || [];
    window.userPermissions = data.permissions || [];
    
    // Ẩn vùng chứa ô nhập mã (tương thích với HTML đã chỉnh)
    const loginSection = document.getElementById('login-section');
    if (loginSection) {
        loginSection.style.display = 'none';
    } else {
        document.getElementById('student-code').style.display = 'none';
        const loadBtn = document.getElementById('load-data-btn');
        if (loadBtn) loadBtn.style.display = 'none';
    }
    
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

// --- HÀM CHẤM ĐIỂM (HIỂN THỊ MÀU XANH KHI SAI) ---
window.checkAnswer = function(i, selectedKey, element, isRight) {
    if (element.parentElement.dataset.answered) return;
    element.parentElement.dataset.answered = "true";

    // 1. Tô màu lựa chọn của học sinh (đỏ nếu sai, xanh nếu đúng)
    element.style.backgroundColor = isRight ? '#d4edda' : '#f8d7da';
    
    // 2. Nếu chọn sai, tự động tìm đáp án đúng và tô xanh
    if (!isRight) {
        wrongQuestions.push(window.currentQuizData[i]);
        element.parentElement.querySelectorAll('.option-box').forEach(box => {
            // Kiểm tra thuộc tính đã đánh dấu sẵn từ lúc render
            if (box.dataset.isCorrect === "true") {
                box.style.backgroundColor = '#d4edda';
            }
        });
    }

    // 3. Cập nhật điểm
    let counter = document.getElementById(isRight ? 'count-correct' : 'count-wrong');
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

window.checkTypedAnswer = function(i, correct) {
    const input = document.getElementById(`input-${i}`);
    const isCorrect = input.value.trim().toLowerCase() === String(correct).trim().toLowerCase();
    document.getElementById(`feedback-${i}`).innerText = isCorrect ? "✅ Đúng!" : "❌ Sai!";
    if (!isCorrect) wrongQuestions.push(window.currentQuizData[i]);
    document.getElementById(isCorrect ? 'count-correct' : 'count-wrong').innerText++;
    input.disabled = true;
};

// Đã cập nhật (Giữ chỗ cho các nút chức năng trong HTML)
window.reviewWrong = function() { alert("Tính năng ôn tập câu sai đang được xử lý!"); };
window.showWrongStats = function() { alert("Tính năng thống kê lỗi sai đang được xử lý!"); };

window.renderQuiz = function() {
    document.getElementById('quiz').innerHTML = window.currentQuizData.map((item, i) => {
        const speakerBtn = (currentSubject === "Tiếng anh") ? `<button onclick="window.speakText('${item.question.replace(/'/g, "\\'")}', ${i})">🔊</button>` : "";
        
        // Vẽ các ô lựa chọn và đánh dấu sẵn đáp án đúng vào data-is-correct
        const optionsHTML = ['a','b','c','d'].map(key => {
            const isRight = (String(item[key]).trim().toLowerCase() === String(item.correct).trim().toLowerCase());
            return `<div class="option-box" style="padding:10px; border:1px solid #ddd; cursor:pointer;" 
                         onclick="window.checkAnswer(${i}, '${key}', this, ${isRight})" 
                         data-is-correct="${isRight}">
                         ${item[key] || ""}
                    </div>`;
        }).join('');

        if (String(item.loai).trim().toLowerCase() === "voca") {
            return `<div class="quiz-card"><div>Câu ${i+1}: ${item.question} ${speakerBtn}</div><input type="text" id="input-${i}"><button onclick="window.checkTypedAnswer(${i}, '${item.correct}')">Kiểm tra</button><div id="feedback-${i}"></div></div>`;
        }
        return `<div class="quiz-card"><div>Câu ${i+1}: ${item.question} ${speakerBtn}</div>${optionsHTML}</div>`;
    }).join('');
};

window.startQuiz = function() {
    currentSubject = document.getElementById('subject-select').value;
    const selected = Array.from(document.querySelectorAll('input[name="topic"]:checked')).map(cb => cb.value);
    if (selected.length === 0) return alert("Vui lòng chọn chủ đề!");
    
    // Đã cập nhật: Cấu hình chuẩn Tiếng Anh (20 câu/10p), Toán (10 câu/15p)
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

// Đã cập nhật thêm hàm getRanking để gọi sau khi nộp bài
window.getRanking = function() {
    const rankingContent = document.getElementById('ranking-content');
    if (rankingContent) {
        rankingContent.innerHTML = "Đang tải dữ liệu xếp hạng mới nhất...";
        // Thêm API gọi bảng xếp hạng của bạn vào đây
    }
};

window.submitQuiz = function() {
    clearInterval(timerInterval);
    const score = parseInt(document.getElementById('count-correct').innerText || 0);
    
    fetch("https://script.google.com/macros/s/AKfycbwrNmZYpd3oMQrWxsTQg5lkhaSg7zVa-wN-xm5YRkoFGwUv36Za739HkHNQ5ZQOl4L3Cw/exec", { 
        method: "POST", mode: "no-cors", headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ maHS: studentCode, score, total: window.currentQuizData.length, mon: currentSubject }) 
    }).then(() => {
        alert("Nộp bài thành công!");
        
        // Đã cập nhật: Gọi xếp hạng và cho phép thi lại thay vì reload trang
        window.getRanking(); 
        
        document.getElementById('quiz-screen').style.display = 'none';
        document.getElementById('start-screen').style.display = 'block';
        
        // Reset điểm hiển thị để bắt đầu vòng mới
        document.getElementById('count-correct').innerText = "0";
        document.getElementById('count-wrong').innerText = "0";
    });
};

document.addEventListener('DOMContentLoaded', () => {
    // Đã cập nhật: Tự động chạy loadData nếu trình duyệt đã nhớ mã học sinh
    if (localStorage.getItem('savedStudentCode')) {
        const studentInput = document.getElementById('student-code');
        if(studentInput) studentInput.value = localStorage.getItem('savedStudentCode');
        window.loadData();
    }
    
    document.getElementById('load-data-btn').onclick = window.loadData;
    document.getElementById('start-btn').onclick = window.startQuiz;
    
    // Gắn sự kiện cho nút nộp bài (trước đó bạn gắn trực tiếp trong HTML)
    const submitBtn = document.getElementById('submit-btn');
    if (submitBtn) submitBtn.onclick = window.submitQuiz;
});
