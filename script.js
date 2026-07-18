// --- CÁC BIẾN TOÀN CỤC ---
let studentCode = "", currentSubject = "", timerInterval;
window.allQuizData = []; 
window.userPermissions = []; 
window.currentQuizData = [];

// --- 1. CÁC HÀM XỬ LÝ DỮ LIỆU ---
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
    const subjectSelect = document.getElementById('subject-select');
    const container = document.getElementById('topic-container');
    if (!subjectSelect || !container) return;
    
    currentSubject = subjectSelect.value;
    const allowed = window.userPermissions.filter(p => String(p.maHS) === studentCode && p.mon === currentSubject).map(p => p.chuDe);
    const topics = [...new Set(window.allQuizData.filter(i => i.mon === currentSubject).map(i => i.chuDe))];
    
    container.innerHTML = topics.map(topic => {
        const isAllowed = allowed.includes(topic);
        return `<label style="display:block; margin:5px 0; opacity:${isAllowed ? '1' : '0.5'}">
            <input type="checkbox" name="topic" value="${topic}" ${isAllowed ? 'checked' : 'disabled'}> ${topic}
        </label>`;
    }).join('');
};

// --- 2. HÀM QUẢN LÝ QUIZ ---
window.startQuiz = function() {
    const selected = Array.from(document.querySelectorAll('input[name="topic"]:checked')).map(cb => cb.value);
    if (selected.length === 0) return alert("Vui lòng chọn chủ đề!");
    
    window.currentQuizData = window.allQuizData.filter(i => i.mon === currentSubject && selected.includes(i.chuDe))
                                               .sort(() => Math.random() - 0.5)
                                               .slice(0, (currentSubject === "Toán" ? 10 : 20));
    
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('quiz-screen').style.display = 'block';
    
    window.renderQuiz();
};

window.renderQuiz = function() {
    const quizContainer = document.getElementById('quiz');
    quizContainer.innerHTML = window.currentQuizData.map((item, i) => {
        const optionsHTML = ['a','b','c','d'].map(key => {
            // Truyền giá trị thực để hàm checkAnswer so sánh chính xác
            const val = String(item[key] || "").trim();
            return `<div class="option-box" style="padding:10px; border:1px solid #ddd; cursor:pointer;" onclick="window.checkAnswer(${i}, this)">${val}</div>`;
        }).join('');
        return `<div class="quiz-card" style="margin-bottom:20px; padding:10px; border:1px solid #eee;"><div>Câu ${i+1}: ${item.question}</div>${optionsHTML}</div>`;
    }).join('');
};

// --- HÀM CHẤM ĐIỂM ĐÃ TỐI ƯU ---
window.checkTypedAnswer = function(i, correct) {
    const input = document.getElementById(`input-${i}`);
    const isCorrect = input.value.trim().toLowerCase() === String(correct).trim().toLowerCase();
    document.getElementById(`feedback-${i}`).innerText = isCorrect ? "✅ Đúng!" : "❌ Sai!";
    if (!isCorrect) wrongQuestions.push(window.currentQuizData[i]);
    document.getElementById(isCorrect ? 'count-correct' : 'count-wrong').innerText++;
    input.disabled = true;
};

// --- 3. HÀM NỘP BÀI ---
window.submitQuiz = function() {
    const score = parseInt(document.getElementById('count-correct').innerText || 0);
    alert("Đang gửi bài, vui lòng chờ...");
    
    fetch("https://script.google.com/macros/s/AKfycbwrNmZYpd3oMQrWxsTQg5lkhaSg7zVa-wN-xm5YRkoFGwUv36Za739HkHNQ5ZQOl4L3Cw/exec", { 
        method: "POST", 
        mode: "no-cors", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ maHS: studentCode, score, total: window.currentQuizData.length, mon: currentSubject }) 
    }).then(() => {
        alert("Nộp bài thành công!");
        location.reload();
    }).catch(err => alert("Lỗi nộp bài, hãy kiểm tra kết nối!"));
};

// --- 4. GẮN SỰ KIỆN TỰ ĐỘNG ---
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('load-data-btn').onclick = window.loadData;
    document.getElementById('start-btn').onclick = window.startQuiz;
    document.getElementById('submit-btn').onclick = window.submitQuiz;
    document.getElementById('subject-select').onchange = window.updateTopicList;
});
