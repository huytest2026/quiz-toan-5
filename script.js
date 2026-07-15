window.allQuizData = [];
window.userPermissions = [];
window.currentQuizData = [];
window.wrongDetails = [];
window.correctCount = 0;
window.timerInterval = null;

const API_URL = "https://script.google.com/macros/s/AKfycbwrNmZYpd3oMQrWxsTQg5lkhaSg7zVa-wN-xm5YRkoFGwUv36Za739HkHNQ5ZQOl4L3Cw/exec";

// Hàm đọc văn bản (Cho Tiếng Anh)
window.speakText = function(text) {
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/_+/g, ','); 
    const msg = new SpeechSynthesisUtterance(cleanText);
    msg.lang = 'en-US'; 
    msg.rate = 0.9;
    window.speechSynthesis.speak(msg);
};

// 1. Tải cả đề và phân quyền
window.loadData = async function() {
    const maHS = document.getElementById('student-code').value.trim();
    if (!maHS) return alert("Vui lòng nhập mã học sinh!");
    
    const loadBtn = document.getElementById('load-data-btn');
    loadBtn.innerText = "Đang tải...";
    loadBtn.disabled = true;
    
    try {
        const response = await fetch(`${API_URL}?ma=${encodeURIComponent(maHS)}`);
        const data = await response.json();
        
        // Giả định API trả về { questions: [...], permissions: [...] }
        window.allQuizData = data.questions || [];
        window.userPermissions = data.permissions || [];
        
        alert("Tải dữ liệu thành công!");
        window.updateTopicList();
    } catch (e) { 
        alert("Không thể kết nối tới server!");
    } finally {
        loadBtn.innerText = "Xác nhận Mã & Tải đề";
        loadBtn.disabled = false;
    }
};

// 2. Cập nhật danh sách chủ đề (Chỉ cho tương tác với phần được phân quyền)
window.updateTopicList = function() {
    const mon = document.getElementById('subject-select').value;
    const maHS = document.getElementById('student-code').value.trim();
    const container = document.getElementById('topic-container');
    if (!container) return;
    
    container.innerHTML = '';
    if (!mon) return container.innerHTML = '<p>Hãy chọn môn trước...</p>';

    const allowedTopics = window.userPermissions
        .filter(p => p.maHS === maHS && p.mon === mon)
        .map(p => p.chuDe);

    const allAvailableTopics = [...new Set(window.allQuizData.filter(i => i.mon === mon).map(i => i.chuDe))];
    
    allAvailableTopics.forEach(topic => {
        const isAllowed = allowedTopics.includes(topic);
        container.innerHTML += `
            <label style="display:block; margin:5px 0; opacity: ${isAllowed ? '1' : '0.5'}; cursor: ${isAllowed ? 'pointer' : 'not-allowed'}">
                <input type="checkbox" name="topic" value="${topic}" ${isAllowed ? 'checked' : 'disabled'}> 
                ${topic} ${isAllowed ? '' : '(Chưa được cấp quyền)'}
            </label>`;
    });
};

// 3. Nút Chọn/Bỏ chọn chỉ tác động phần được phân quyền
window.toggleTopics = function(selectAll) {
    const checkboxes = document.querySelectorAll('input[name="topic"]:not(:disabled)');
    checkboxes.forEach(cb => {
        cb.checked = selectAll;
    });
};

// 4. Xử lý Nộp bài
window.submitQuiz = function() {
    clearInterval(window.timerInterval);
    document.getElementById('quiz-screen').style.display = 'none';
    document.getElementById('result-screen').style.display = 'block';
    
    const total = window.currentQuizData.length;
    document.getElementById('result').innerHTML = `
        <h3>Kết quả của bạn</h3>
        <p>Số câu đúng: <b>${window.correctCount}/${total}</b></p>
    `;
};

// 5. Render câu hỏi
window.renderQuiz = function() {
    const quizDiv = document.getElementById('quiz');
    quizDiv.innerHTML = '';
    window.currentQuizData.forEach((item, i) => {
        let options = [{key:'a', val:item.a}, {key:'b', val:item.b}, {key:'c', val:item.c}, {key:'d', val:item.d}];
        const card = document.createElement('div');
        card.className = "quiz-card";
        card.innerHTML = `<b>Câu ${i+1}: ${item.question}</b><br>
            ${options.map(o => `<label class="option-box"><input type="radio" name="q${i}" value="${o.key}" onchange="updateLiveStatus(${i}, this.value, this.parentElement)"> ${o.val}</label>`).join('')}`;
        quizDiv.appendChild(card);
    });
};

window.updateLiveStatus = function(index, selectedValue, element) {
    let item = window.currentQuizData[index];
    if (item.answered) return;
    item.answered = true;
    
    if (selectedValue.trim().toLowerCase() === String(item.correct).trim().toLowerCase()) {
        window.correctCount++;
        element.style.backgroundColor = "#d4edda";
    } else {
        element.style.backgroundColor = "#f8d7da";
    }
    element.parentElement.querySelectorAll('label').forEach(l => l.style.pointerEvents = "none");
};

// 6. Khởi tạo
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('start-btn').addEventListener('click', () => {
        const mon = document.getElementById('subject-select').value;
        const selectedTopics = Array.from(document.querySelectorAll('input[name="topic"]:checked')).map(cb => cb.value);
        
        if (selectedTopics.length === 0) return alert("Vui lòng chọn chủ đề!");
        
        window.currentQuizData = window.allQuizData.filter(i => i.mon === mon && selectedTopics.includes(i.chuDe)).sort(() => Math.random() - 0.5).slice(0, 10);
        
        document.getElementById('start-screen').style.display = 'none';
        document.getElementById('quiz-screen').style.display = 'block';
        window.renderQuiz();
    });

    document.getElementById('submit-btn').addEventListener('click', window.submitQuiz);
});
