// --- Khởi tạo biến ---
window.allQuizData = [];
window.userPermissions = [];
window.currentQuizData = [];
window.wrongDetails = [];
window.correctCount = 0;

// URL API đã triển khai
const API_URL = "https://script.google.com/macros/s/AKfycbwrNmZYpd3oMQrWxsTQg5lkhaSg7zVa-wN-xm5YRkoFGwUv36Za739HkHNQ5ZQOl4L3Cw/exec";

// --- 1. Tải dữ liệu từ Google Sheet ---
window.loadData = async function() {
    const maHS = document.getElementById('student-code').value.trim();
    if (!maHS) return alert("Vui lòng nhập mã học sinh!");
    
    const loadBtn = document.getElementById('load-data-btn');
    loadBtn.innerText = "Đang tải...";
    
    try {
        // Fetch với mode 'cors' để tránh lỗi chặn từ Google
        const response = await fetch(`${API_URL}?ma=${encodeURIComponent(maHS)}`, { method: 'GET', mode: 'cors' });
        const data = await response.json();
        
        if (data.error) {
            alert(data.error);
        } else {
            window.allQuizData = data.questions || [];
            window.userPermissions = data.permissions || [];
            alert("Tải dữ liệu thành công!");
            window.updateTopicList();
        }
    } catch (e) {
        alert("Lỗi kết nối server! Vui lòng kiểm tra lại quyền truy cập (Anyone).");
        console.error(e);
    } finally {
        loadBtn.innerText = "Xác nhận Mã & Tải đề";
    }
};

// --- 2. Cập nhật và phân quyền chủ đề ---
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

window.toggleTopics = (val) => document.querySelectorAll('input[name="topic"]:not(:disabled)').forEach(cb => cb.checked = val);

// --- 3. Render câu hỏi ---
window.renderQuiz = function() {
    const quizDiv = document.getElementById('quiz');
    quizDiv.innerHTML = window.currentQuizData.map((item, i) => `
        <div class="quiz-card"><b>Câu ${i+1}: ${item.question}</b><br>
        ${['a','b','c','d'].map(key => `<label class="option-box"><input type="radio" name="q${i}" value="${key}" onchange="updateLiveStatus(${i}, this.value, this.parentElement)"> ${item[key]}</label>`).join('')}
        </div>`).join('');
};

// --- 4. Chấm điểm trực tiếp ---
window.updateLiveStatus = function(idx, val, el) {
    let item = window.currentQuizData[idx];
    if (item.answered) return;
    item.answered = true;
    
    if (val.trim().toLowerCase() === String(item.correct).trim().toLowerCase()) {
        window.correctCount++;
        document.getElementById('count-correct').innerText = window.correctCount;
        el.style.backgroundColor = "#d4edda";
    } else {
        document.getElementById('count-wrong').innerText = parseInt(document.getElementById('count-wrong').innerText || 0) + 1;
        el.style.backgroundColor = "#f8d7da";
        window.wrongDetails.push(item); 
    }
    el.parentElement.querySelectorAll('label').forEach(l => l.style.pointerEvents = "none");
};

// --- 5. Nộp bài ---
window.submitQuiz = function() {
    document.getElementById('quiz-screen').style.display = 'none';
    document.getElementById('result-screen').style.display = 'block';
    
    const total = window.currentQuizData.length;
    const percent = total > 0 ? Math.round((window.correctCount / total) * 100) : 0;
    
    let html = `<h3>Kết quả: ${window.correctCount}/${total} (${percent}%)</h3>`;
    if (window.wrongDetails.length > 0) {
        html += `<button onclick="window.retryWrongQuestions()" style="padding:10px; background:#ffc107; border:none; cursor:pointer; border-radius:5px;">Làm lại ${window.wrongDetails.length} câu sai</button>`;
    }
    document.getElementById('result').innerHTML = html;
};

// --- 6. Làm lại câu sai ---
window.retryWrongQuestions = function() {
    window.currentQuizData = [...window.wrongDetails];
    window.wrongDetails = [];
    window.correctCount = 0;
    document.getElementById('count-correct').innerText = "0";
    document.getElementById('count-wrong').innerText = "0";
    document.getElementById('result-screen').style.display = 'none';
    document.getElementById('quiz-screen').style.display = 'block';
    window.renderQuiz();
};

// --- 7. Xem bảng xếp hạng ---
window.showRanking = async function() {
    try {
        const response = await fetch(`${API_URL}?action=getRanking`, { method: 'GET', mode: 'cors' });
        const data = await response.json();
        document.getElementById('result-screen').style.display = 'none';
        document.getElementById('rank-board').style.display = 'block';
        document.getElementById('rank-body').innerHTML = data.map(item => `<tr><td>${item.ten}</td><td>${item.diem}</td><td>${item.mon}</td></tr>`).join('');
    } catch (e) { alert("Không tải được bảng xếp hạng!"); }
};

// --- 8. Bắt đầu bài thi ---
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('start-btn').addEventListener('click', () => {
        const mon = document.getElementById('subject-select').value;
        const selected = Array.from(document.querySelectorAll('input[name="topic"]:checked')).map(cb => cb.value);
        if (selected.length === 0) return alert("Chọn ít nhất 1 chủ đề!");
        
        window.currentQuizData = window.allQuizData.filter(i => i.mon === mon && selected.includes(i.chuDe)).sort(() => Math.random() - 0.5).slice(0, 10);
        window.wrongDetails = [];
        window.correctCount = 0;
        
        document.getElementById('start-screen').style.display = 'none';
        document.getElementById('quiz-screen').style.display = 'block';
        window.renderQuiz();
    });
});
