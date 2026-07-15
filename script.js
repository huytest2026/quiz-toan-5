// --- Khởi tạo biến toàn cục ---
window.allQuizData = [];
window.userPermissions = [];
window.currentQuizData = [];

const API_URL = "https://script.google.com/macros/s/AKfycbwrNmZYpd3oMQrWxsTQg5lkhaSg7zVa-wN-xm5YRkoFGwUv36Za739HkHNQ5ZQOl4L3Cw/exec";

// --- Hàm gọi API theo chuẩn JSONP để vượt CORS ---
window.callAPI = function(url, callbackName) {
    const script = document.createElement('script');
    script.src = `${url}&callback=${callbackName}`;
    document.body.appendChild(script);
    script.onload = () => script.remove();
};

// --- 1. Hàm cập nhật danh sách chủ đề (Phải định nghĩa sớm) ---
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

// --- 2. Hàm xử lý dữ liệu trả về từ API ---
window.handleQuizData = function(data) {
    if (data.error) return alert(data.error);
    window.allQuizData = data.questions || [];
    window.userPermissions = data.permissions || [];
    alert("Tải dữ liệu thành công!");
    // Gọi hàm updateTopicList sau khi đã có dữ liệu
    window.updateTopicList();
};

// --- 3. Hàm tải dữ liệu ---
window.loadData = function() {
    const maHS = document.getElementById('student-code').value.trim();
    if (!maHS) return alert("Nhập mã!");
    window.callAPI(`${API_URL}?ma=${encodeURIComponent(maHS)}`, 'handleQuizData');
};

// --- 4. Các hàm chức năng khác ---
window.renderQuiz = function() {
    const quizDiv = document.getElementById('quiz');
    if (!quizDiv) return;
    quizDiv.innerHTML = window.currentQuizData.map((item, i) => `
        <div class="quiz-card"><b>Câu ${i+1}: ${item.question}</b><br>
        ${['a','b','c','d'].map(key => `<label class="option-box"><input type="radio" name="q${i}" value="${key}" onchange="updateLiveStatus(${i}, this.value, this.parentElement)"> ${item[key]}</label>`).join('')}
        </div>`).join('');
};

// --- Gắn sự kiện sau khi trang tải xong ---
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
});
