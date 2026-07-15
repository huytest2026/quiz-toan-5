// --- Khởi tạo biến toàn cục ---
window.allQuizData = [];
window.userPermissions = [];
window.currentQuizData = [];
const API_URL = "https://script.google.com/macros/s/AKfycbwrNmZYpd3oMQrWxsTQg5lkhaSg7zVa-wN-xm5YRkoFGwUv36Za739HkHNQ5ZQOl4L3Cw/exec";

// --- Hàm xử lý tải dữ liệu ---
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

window.handleQuizData = function(data) {
    if (data.error) return alert(data.error);
    window.allQuizData = data.questions || [];
    window.userPermissions = data.permissions || [];
    alert("Tải dữ liệu thành công!");
    window.updateTopicList();
};

window.loadData = function() {
    const maHS = document.getElementById('student-code').value.trim();
    if (!maHS) return alert("Nhập mã!");
    const script = document.createElement('script');
    script.src = `${API_URL}?ma=${encodeURIComponent(maHS)}&callback=handleQuizData`;
    document.body.appendChild(script);
    script.onload = () => script.remove();
};

// --- Hàm hiển thị câu hỏi ---
window.renderQuiz = function() {
    const quizDiv = document.getElementById('quiz');
    if (!quizDiv) return;
    quizDiv.innerHTML = window.currentQuizData.map((item, i) => `
        <div class="quiz-card" style="margin-bottom:15px; padding:10px; border:1px solid #ccc;">
            <b>Câu ${i+1}: ${item.question}</b><br>
            ${['a','b','c','d'].map(key => `
                <label style="display:block; cursor:pointer;">
                    <input type="radio" name="q${i}" value="${key}"> ${item[key]}
                </label>
            `).join('')}
        </div>`).join('');
};

// --- HÀM NỘP BÀI (Xử lý không bị đơ) ---
window.submitQuiz = function() {
    let score = 0;
    let answered = 0;
    
    window.currentQuizData.forEach((item, i) => {
        const selected = document.querySelector(`input[name="q${i}"]:checked`);
        if (selected) {
            answered++;
            if (selected.value === item.correct) {
                score++;
            }
        }
    });

    if (answered < window.currentQuizData.length) {
        if (!confirm("Bạn chưa hoàn thành hết các câu hỏi. Bạn có chắc muốn nộp bài?")) return;
    }

    // Hiển thị kết quả ngay lập tức
    alert(`Bài làm hoàn thành!\nSố câu đúng: ${score} / ${window.currentQuizData.length}`);
    
    // Reset màn hình
    document.getElementById('quiz-screen').style.display = 'none';
    document.getElementById('start-screen').style.display = 'block';
};

// --- Gắn sự kiện ---
document.addEventListener('DOMContentLoaded', () => {
    const loadBtn = document.getElementById('load-data-btn');
    if (loadBtn) loadBtn.onclick = window.loadData;

    const startBtn = document.getElementById('start-btn');
    if (startBtn) startBtn.onclick = () => {
        const mon = document.getElementById('subject-select').value;
        const selected = Array.from(document.querySelectorAll('input[name="topic"]:checked')).map(cb => cb.value);
        if (selected.length === 0) return alert("Chọn ít nhất 1 chủ đề!");
        
        window.currentQuizData = window.allQuizData.filter(i => i.mon === mon && selected.includes(i.chuDe)).sort(() => Math.random() - 0.5).slice(0, 10);
        document.getElementById('start-screen').style.display = 'none';
        document.getElementById('quiz-screen').style.display = 'block';
        window.renderQuiz();
    };

    const submitBtn = document.getElementById('submit-btn');
    if (submitBtn) submitBtn.onclick = window.submitQuiz;
});
