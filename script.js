window.allQuizData = [];
window.userPermissions = [];
window.currentQuizData = [];
window.correctCount = 0;
window.timerInterval = null;

const API_URL = "https://script.google.com/macros/s/AKfycbwrNmZYpd3oMQrWxsTQg5lkhaSg7zVa-wN-xm5YRkoFGwUv36Za739HkHNQ5ZQOl4L3Cw/exec";

// 1. Tải dữ liệu
window.loadData = async function() {
    const maHS = document.getElementById('student-code').value.trim();
    if (!maHS) return alert("Vui lòng nhập mã học sinh!");
    
    const loadBtn = document.getElementById('load-data-btn');
    loadBtn.innerText = "Đang tải...";
    try {
        const response = await fetch(`${API_URL}?ma=${encodeURIComponent(maHS)}`);
        const data = await response.json();
        window.allQuizData = data.questions || [];
        window.userPermissions = data.permissions || [];
        alert("Tải dữ liệu thành công!");
        window.updateTopicList();
    } catch (e) { alert("Lỗi kết nối!"); } finally { loadBtn.innerText = "Xác nhận Mã & Tải đề"; }
};

// 2. Phân quyền chủ đề
window.updateTopicList = function() {
    const mon = document.getElementById('subject-select').value;
    const maHS = document.getElementById('student-code').value.trim();
    const container = document.getElementById('topic-container');
    if (!container || !mon) return;

    const allowed = window.userPermissions.filter(p => p.maHS === maHS && p.mon === mon).map(p => p.chuDe);
    const topics = [...new Set(window.allQuizData.filter(i => i.mon === mon).map(i => i.chuDe))];
    
    container.innerHTML = topics.map(topic => {
        const isAllowed = allowed.includes(topic);
        return `<label style="display:block; margin:5px 0; opacity:${isAllowed ? '1' : '0.5'}">
            <input type="checkbox" name="topic" value="${topic}" ${isAllowed ? 'checked' : 'disabled'}> ${topic}
        </label>`;
    }).join('');
};

window.toggleTopics = (val) => document.querySelectorAll('input[name="topic"]:not(:disabled)').forEach(cb => cb.checked = val);

// 3. Chấm điểm & Nộp bài
window.updateLiveStatus = function(idx, val, el) {
    let item = window.currentQuizData[idx];
    if (item.answered) return;
    item.answered = true;
    if (val.trim().toLowerCase() === String(item.correct).trim().toLowerCase()) {
        window.correctCount++;
        document.getElementById('count-correct').innerText = window.correctCount;
        el.style.backgroundColor = "#d4edda";
    } else {
        document.getElementById('count-wrong').innerText = parseInt(document.getElementById('count-wrong').innerText) + 1;
        el.style.backgroundColor = "#f8d7da";
    }
    el.parentElement.querySelectorAll('label').forEach(l => l.style.pointerEvents = "none");
};

window.submitQuiz = function() {
    clearInterval(window.timerInterval);
    const total = window.currentQuizData.length;
    document.getElementById('quiz-screen').style.display = 'none';
    document.getElementById('result-screen').style.display = 'block';
    document.getElementById('result').innerHTML = `<h3>Kết quả: ${window.correctCount}/${total} câu đúng</h3>`;
};

// 4. Khởi chạy
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('start-btn').addEventListener('click', () => {
        const mon = document.getElementById('subject-select').value;
        const selected = Array.from(document.querySelectorAll('input[name="topic"]:checked')).map(cb => cb.value);
        if (selected.length === 0) return alert("Chọn chủ đề!");
        window.currentQuizData = window.allQuizData.filter(i => i.mon === mon && selected.includes(i.chuDe)).sort(() => Math.random() - 0.5).slice(0, 10);
        document.getElementById('start-screen').style.display = 'none';
        document.getElementById('quiz-screen').style.display = 'block';
        
        // Render
        const quizDiv = document.getElementById('quiz');
        quizDiv.innerHTML = window.currentQuizData.map((item, i) => `
            <div class="quiz-card"><b>Câu ${i+1}: ${item.question}</b><br>
            ${['a','b','c','d'].map(key => `<label class="option-box"><input type="radio" name="q${i}" value="${key}" onchange="updateLiveStatus(${i}, this.value, this.parentElement)"> ${item[key]}</label>`).join('')}
            </div>`).join('');
    });
});
