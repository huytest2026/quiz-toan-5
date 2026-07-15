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

// --- 3. Hàm hiển thị và Logic chấm điểm ---
window.renderQuiz = function() {
    const quizDiv = document.getElementById('quiz');
    if (!quizDiv) return;
    quizDiv.innerHTML = window.currentQuizData.map((item, i) => {
        let options = [{k:'a',v:item.a}, {k:'b',v:item.b}, {k:'c',v:item.c}, {k:'d',v:item.d}].sort(() => Math.random() - 0.5);
        return `
        <div class="quiz-card" id="q-card-${i}" style="margin-bottom:15px; padding:10px; border:2px solid #ddd; border-radius:8px; transition: 0.3s;">
            <b>Câu ${i+1}: ${item.question}</b><br>
            ${options.map(opt => `
                <label class="option-box" style="display:block; margin:5px 0; cursor:pointer;">
                    <input type="radio" name="q${i}" value="${opt.k}" onclick="window.checkAnswer(${i}, '${opt.k}')"> ${opt.v}
                </label>
            `).join('')}
        </div>`;
    }).join('');
};

window.checkAnswer = function(i, selectedKey, element) {
    // 1. Tìm thẻ div bao quanh đáp án được chọn (element chính là cái bạn vừa click)
    // 2. Lấy dữ liệu câu hỏi
    const questionData = window.currentQuizData[i];
    const selectedText = questionData[selectedKey].trim().toLowerCase();
    const rawCorrect = String(questionData.correct).trim().toLowerCase();
    
    // 3. Logic xác định đúng/sai
    let isCorrect = false;
    if (['a', 'b', 'c', 'd'].includes(rawCorrect)) {
        isCorrect = (selectedKey.toLowerCase() === rawCorrect);
    } else {
        isCorrect = (selectedText === rawCorrect);
    }
    
    // 4. CHỈ TÔ MÀU ĐÁP ÁN ĐƯỢC CHỌN (element)
    element.style.backgroundColor = isCorrect ? '#d4edda' : '#f8d7da'; // Xanh nếu đúng, Đỏ nếu sai
    
    // 5. Khóa tất cả các lựa chọn của câu đó lại để không chọn tiếp
    const card = document.getElementById(`q-card-${i}`);
    card.querySelectorAll('.option-box').forEach(box => {
        box.style.pointerEvents = 'none'; // Ngắt tương tác
    });
    
    // 6. Cập nhật điểm
    let el = document.getElementById(isCorrect ? 'count-correct' : 'count-wrong');
    el.innerText = parseInt(el.innerText) + 1;
};
// --- 4. Sự kiện Bắt đầu thi ---
window.startQuiz = function() {
    const mon = document.getElementById('subject-select').value;
    const selected = Array.from(document.querySelectorAll('input[name="topic"]:checked')).map(cb => cb.value);
    if (selected.length === 0) return alert("Chọn chủ đề!");
    
    window.currentQuizData = window.allQuizData.filter(i => i.mon === mon && selected.includes(i.chuDe))
                                             .sort(() => Math.random() - 0.5)
                                             .slice(0, mon === 'Toán' ? 10 : 20);
    
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
    alert("Nộp bài xong! Hệ thống sẽ tải lại.");
    location.reload();
};

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('load-data-btn').onclick = window.loadData;
    document.getElementById('start-btn').onclick = window.startQuiz;
});
