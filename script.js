window.allQuizData = [];
window.currentQuizData = [];
window.wrongDetails = [];
window.correctCount = 0;
window.timerInterval = null;
const API_URL = "https://script.google.com/macros/s/AKfycbwrNmZYpd3oMQrWxsTQg5lkhaSg7zVa-wN-xm5YRkoFGwUv36Za739HkHNQ5ZQOl4L3Cw/exec";

// Hàm đọc văn bản
window.speakText = function(text) {
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/_+/g, ','); 
    const msg = new SpeechSynthesisUtterance(cleanText);
    msg.lang = 'en-US'; 
    msg.rate = 0.9;
    window.speechSynthesis.speak(msg);
};

// Hàm tải dữ liệu (Cập nhật phản hồi người dùng)
window.loadData = async function() {
    const maHS = document.getElementById('student-code').value.trim();
    if (!maHS) return alert("Vui lòng nhập mã học sinh!");
    
    const loadBtn = document.getElementById('load-data-btn');
    const originalText = loadBtn.innerText;
    loadBtn.innerText = "Đang tải...";
    loadBtn.disabled = true; // Chặn bấm nhiều lần
    
    try {
        const response = await fetch(`${API_URL}?ma=${encodeURIComponent(maHS)}`);
        const data = await response.json();
        
        if (data.error) {
            alert(data.error);
        } else {
            window.allQuizData = data;
            alert("Tải đề thành công!");
            window.updateTopicList();
        }
    } catch (e) { 
        console.error("Lỗi tải dữ liệu:", e); 
        alert("Không thể kết nối tới server!");
    } finally {
        loadBtn.innerText = originalText;
        loadBtn.disabled = false;
    }
};

// Cập nhật danh sách chủ đề
window.updateTopicList = function() {
    const mon = document.getElementById('subject-select').value;
    const container = document.getElementById('topic-container');
    if (!container) return;
    
    container.innerHTML = '';
    if (window.allQuizData.length === 0) {
        container.innerHTML = '<p style="color: #888; font-size: 0.9em;">Hãy nhập mã và bấm "Tải đề" trước...</p>';
        return;
    }
    
    if (!mon) {
        container.innerHTML = '<p style="color: #888; font-size: 0.9em;">Hãy chọn môn trước...</p>';
        return;
    }
    
    const topics = [...new Set(window.allQuizData.filter(i => i.mon === mon).map(i => i.chuDe))];
    topics.forEach(topic => {
        container.innerHTML += `<label style="display:block; margin:5px 0;"><input type="checkbox" name="topic" value="${topic}" checked> ${topic}</label>`;
    });
};

window.toggleTopics = function(selectAll) {
    document.querySelectorAll('input[name="topic"]').forEach(cb => cb.checked = selectAll);
};

window.showRanking = async function() {
    const rankBody = document.getElementById('rank-body');
    const rankBoard = document.getElementById('rank-board');
    if (rankBoard.style.display === 'block') {
        rankBoard.style.display = 'none';
    } else {
        rankBoard.style.display = 'block';
        rankBody.innerHTML = "<tr><td colspan='3'>Đang tải...</td></tr>";
        try {
            const response = await fetch(API_URL + "?action=getRanking");
            const ranking = await response.json();
            rankBody.innerHTML = ranking.slice(0, 10).map(r =>
                `<tr><td>${r.ten}</td><td>${r.diem}</td><td>${r.mon}</td></tr>`
            ).join('');
        } catch (e) {
            rankBody.innerHTML = "<tr><td colspan='3'>Lỗi tải bảng xếp hạng</td></tr>";
        }
    }
};

window.startTimer = function(minutes) {
    let timeLeft = minutes * 60;
    const timerDisplay = document.getElementById('timer-display');
    if (window.timerInterval) clearInterval(window.timerInterval);
    timerDisplay.innerText = `${minutes}:00`;
    window.timerInterval = setInterval(() => {
        timeLeft--;
        let m = Math.floor(timeLeft / 60), s = timeLeft % 60;
        timerDisplay.innerText = `${m}:${s < 10 ? '0' : ''}${s}`;
        if (timeLeft <= 0) {
            clearInterval(window.timerInterval);
            const submitBtn = document.getElementById('submit-btn');
            if (submitBtn) submitBtn.click();
        }
    }, 1000);
};

window.renderQuiz = function() {
    const quizDiv = document.getElementById('quiz');
    if (!quizDiv) return;
    quizDiv.innerHTML = '';
    window.currentQuizData.forEach((item, i) => {
        let options = [{key:'a', val:item.a}, {key:'b', val:item.b}, {key:'c', val:item.c}, {key:'d', val:item.d}];
        options.sort(() => Math.random() - 0.5);
        const card = document.createElement('div');
        card.className = "quiz-card";
        card.style.cssText = "margin-bottom:15px; padding:15px; border:1px solid #ddd; border-radius:8px;";
        
        let audioBtnHtml = item.mon === 'Tiếng anh' ? `<button type="button" class="speak-btn" style="margin: 10px 0; padding: 5px 10px; cursor: pointer; background: #28a745; color: white; border: none; border-radius: 4px;">🔊 Nghe câu hỏi</button>` : '';
        
        card.innerHTML = `
            <div class="question"><b>Câu ${i+1}: ${item.question}</b><br>${audioBtnHtml}</div>
            ${options.map(opt => `<label class="option-box" style="display:block; margin:5px 0; cursor:pointer;">
                <input type="radio" name="q${i}" value="${item.mon === 'Tiếng anh' ? opt.val : opt.key}"
                onchange="updateLiveStatus(${i}, this.value, this.parentElement)"> ${opt.val}</label>`).join('')}
        `;
        quizDiv.appendChild(card);
        if (card.querySelector('.speak-btn')) {
            card.querySelector('.speak-btn').onclick = () => window.speakText(item.question);
        }
    });
};

window.updateLiveStatus = function(index, selectedValue, element) {
    let item = window.currentQuizData[index];
    if (item.answered) return;
    item.answered = true;
    const isCorrect = String(selectedValue).trim().toLowerCase() === String(item.correct).trim().toLowerCase();
    const correctEl = document.getElementById('count-correct');
    const wrongEl = document.getElementById('count-wrong');
    if (isCorrect) {
        window.correctCount++;
        if (correctEl) correctEl.innerText = window.correctCount;
        element.style.backgroundColor = "#d4edda";
    } else {
        if (wrongEl) wrongEl.innerText = parseInt(wrongEl.innerText || 0) + 1;
        element.style.backgroundColor = "#f8d7da";
        window.wrongDetails.push({ ...item, dapAnSai: selectedValue });
    }
    element.closest('.quiz-card').querySelectorAll('label').forEach(l => l.style.pointerEvents = "none");
};

document.addEventListener('DOMContentLoaded', () => {
    const addSafeListener = (id, event, callback) => {
        const el = document.getElementById(id);
        if (el) el.addEventListener(event, callback);
    };

    // Nút Tải đề đã được gắn onclick trực tiếp trong HTML, 
    // nhưng vẫn giữ addSafeListener làm phương án dự phòng
    addSafeListener('load-data-btn', 'click', window.loadData);

    addSafeListener('start-btn', 'click', () => {
        if (window.allQuizData.length === 0) return alert("Vui lòng xác nhận Mã & Tải đề trước!");
        
        const mon = document.getElementById('subject-select').value;
        const name = document.getElementById("student-name").value.trim();
        if (!mon || !name) return alert("Vui lòng chọn môn và nhập tên!");
        
        const config = mon === "Toán" ? { time: 15, count: 10 } : { time: 10, count: 20 };
        window.correctCount = 0; window.wrongDetails = [];
        document.getElementById('count-correct').innerText = "0";
        document.getElementById('count-wrong').innerText = "0";
        document.getElementById('start-screen').style.display = 'none';
        document.getElementById('quiz-screen').style.display = 'block';
        
        const topics = Array.from(document.querySelectorAll('input[name="topic"]:checked')).map(cb => cb.value);
        window.currentQuizData = window.allQuizData.filter(i => i.mon === mon && topics.includes(i.chuDe)).sort(() => Math.random() - 0.5).slice(0, config.count);
        renderQuiz(); startTimer(config.time);
    });

    addSafeListener('submit-btn', 'click', () => {
        clearInterval(window.timerInterval);
        const name = document.getElementById("student-name").value;
        const mon = document.getElementById('subject-select').value;
        fetch(API_URL, { method: 'POST', body: JSON.stringify({ ten: name, diem: window.correctCount, soCau: (mon === "Toán"?10:20), mon: mon, wrongDetails: window.wrongDetails }) });
        document.getElementById('quiz-screen').style.display = 'none';
        document.getElementById('result-screen').style.display = 'block';
        document.getElementById('result').innerHTML = `<h3>Hoàn thành!</h3><p>Điểm: <b>${window.correctCount}</b></p>`;
    });

    addSafeListener('show-rank-btn', 'click', window.showRanking);
    addSafeListener('restart-btn', 'click', () => location.reload());
});
