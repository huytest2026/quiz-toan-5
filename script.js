window.allQuizData = [];
window.userPermissions = [];
window.currentQuizData = [];
window.correctCount = 0;
window.timerInterval = null;

const API_URL = "https://script.google.com/macros/s/AKfycbwrNmZYpd3oMQrWxsTQg5lkhaSg7zVa-wN-xm5YRkoFGwUv36Za739HkHNQ5ZQOl4L3Cw/exec";

// 1. Tải dữ liệu và phân quyền
window.loadData = async function() {
    const maHS = document.getElementById('student-code').value.trim();
    if (!maHS) return alert("Vui lòng nhập mã học sinh!");
    
    const loadBtn = document.getElementById('load-data-btn');
    loadBtn.innerText = "Đang tải...";
    loadBtn.disabled = true;
    
    try {
        const response = await fetch(`${API_URL}?ma=${encodeURIComponent(maHS)}`);
        const data = await response.json();
        
        window.allQuizData = data.questions || [];
        window.userPermissions = data.permissions || [];
        
        alert("Tải dữ liệu thành công!");
        window.updateTopicList();
    } catch (e) { 
        alert("Lỗi kết nối server!");
    } finally {
        loadBtn.innerText = "Xác nhận Mã & Tải đề";
        loadBtn.disabled = false;
    }
};

// 2. Cập nhật danh sách chủ đề (Chặn các phần không được phân quyền)
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

    const allTopics = [...new Set(window.allQuizData.filter(i => i.mon === mon).map(i => i.chuDe))];
    
    allTopics.forEach(topic => {
        const isAllowed = allowedTopics.includes(topic);
        container.innerHTML += `
            <label style="display:block; margin:5px 0; opacity: ${isAllowed ? '1' : '0.5'}; cursor: ${isAllowed ? 'pointer' : 'not-allowed'}">
                <input type="checkbox" name="topic" value="${topic}" ${isAllowed ? 'checked' : 'disabled'}> 
                ${topic} ${isAllowed ? '' : '(Chưa được cấp quyền)'}
            </label>`;
    });
};

// 3. Nút Chọn/Bỏ chọn (Chỉ tác động phần được phép)
window.toggleTopics = function(selectAll) {
    const checkboxes = document.querySelectorAll('input[name="topic"]:not(:disabled)');
    checkboxes.forEach(cb => cb.checked = selectAll);
};

// 4. Render bài thi
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

// 5. Chấm điểm trực tiếp
window.updateLiveStatus = function(index, selectedValue, element) {
    let item = window.currentQuizData[index];
    if (item.answered) return;
    item.answered = true;
    
    const isCorrect = String(selectedValue).trim().toLowerCase() === String(item.correct).trim().toLowerCase();
    if (isCorrect) {
        window.correctCount++;
        document.getElementById('count-correct').innerText = window.correctCount;
        element.style.backgroundColor = "#d4edda";
    } else {
        document.getElementById('count-wrong').innerText = parseInt(document.getElementById('count-wrong').innerText) + 1;
        element.style.backgroundColor = "#f8d7da";
    }
    element.parentElement.querySelectorAll('label').forEach(l => l.style.pointerEvents = "none");
};

// 6. Nộp bài và đánh giá
window.submitQuiz = function() {
    clearInterval(window.timerInterval);
    const total = window.currentQuizData.length;
    const percent = Math.round((window.correctCount / total) * 100);
    
    let feedback = percent >= 70 ? "Giỏi lắm!" : "Cần cố gắng hơn!";
    
    document.getElementById('quiz-screen').style.display = 'none';
    document.getElementById('result-screen').style.display = 'block';
    document.getElementById('result').innerHTML = `<h3>Kết quả: ${window.correctCount}/${total}</h3><p>${feedback}</p>`;
};

// 7. Khởi tạo sự kiện chính
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
});
