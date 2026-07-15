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
    window.updateTopicList(); // Phục hồi hiển thị chủ đề
};

// --- 2. Hàm hiển thị chủ đề (Phục hồi) ---
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

// --- 3. Hàm hiển thị và logic làm bài ---
window.renderQuiz = function() {
    const quizDiv = document.getElementById('quiz');
    if (!quizDiv) return;
    quizDiv.innerHTML = window.currentQuizData.map((item, i) => {
        let options = [{k:'a',v:item.a}, {k:'b',v:item.b}, {k:'c',v:item.c}, {k:'d',v:item.d}].sort(() => Math.random() - 0.5);
        return `
        <div class="quiz-card" id="q-card-${i}" style="margin-bottom:15px; padding:10px; border:2px solid #ddd; border-radius:8px;">
            <b>Câu ${i+1}: ${item.question}</b><br>
            ${options.map(opt => `
                <label class="option-box" style="display:block; margin:5px 0; cursor:pointer;">
                    <input type="radio" name="q${i}" value="${opt.k}" onclick="window.checkAnswer(${i}, '${opt.k}')"> ${opt.v}
                </label>
            `).join('')}
        </div>`;
    }).join('');
};

window.checkAnswer = function(i, selectedKey) {
    const card = document.getElementById(`q-card-${i}`);
    
    // 1. Lấy đáp án đúng từ dữ liệu gốc
    const correctAnswer = window.currentQuizData[i].correct;
    
    // 2. Vô hiệu hóa tất cả input trong câu để không chọn lại
    card.querySelectorAll('input').forEach(input => input.disabled = true);
    
    // 3. So sánh chính xác (lưu ý: đảm bảo dữ liệu trong Google Sheets ở cột 'correct' 
    // phải khớp với giá trị 'a', 'b', 'c', 'd' tương ứng)
    const isCorrect = (selectedKey === String(correctAnswer).trim());
    
    // 4. Tô màu
    card.style.borderColor = isCorrect ? 'green' : 'red';
    
    // 5. Cập nhật điểm
    let el = document.getElementById(isCorrect ? 'count-correct' : 'count-wrong');
    el.innerText = parseInt(el.innerText) + 1;
};

// --- 4. Sự kiện và Khởi tạo ---
window.startQuiz = function() {
    const mon = document.getElementById('subject-select').value;
    const selected = Array.from(document.querySelectorAll('input[name="topic"]:checked')).map(cb => cb.value);
    if (selected.length === 0) return alert("Chọn chủ đề!");
    window.currentQuizData = window.allQuizData.filter(i => i.mon === mon && selected.includes(i.chuDe)).sort(() => Math.random() - 0.5).slice(0, mon === 'Toán' ? 10 : 20);
    
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
    alert("Nộp bài xong! Hệ thống tự làm mới.");
    location.reload();
};

// Gắn sự kiện (Dùng cách này để không bị mất chức năng)
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('load-data-btn').onclick = window.loadData;
    document.getElementById('start-btn').onclick = window.startQuiz;
});
