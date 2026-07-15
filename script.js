window.allQuizData = [];
window.currentQuizData = [];
window.wrongDetails = [];
window.correctCount = 0;
window.timerInterval = null;

// Cấu hình API của bạn
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

// 1. Hàm tải dữ liệu từ Google Sheet
window.loadData = async function() {
    const maHS = document.getElementById('student-code').value.trim();
    if (!maHS) return alert("Vui lòng nhập mã học sinh!");
    
    const loadBtn = document.getElementById('load-data-btn');
    loadBtn.innerText = "Đang tải...";
    loadBtn.disabled = true;
    
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
        loadBtn.innerText = "Tải đề";
        loadBtn.disabled = false;
    }
};

// 2. Cập nhật danh sách chủ đề dựa trên Môn đã chọn
window.updateTopicList = function() {
    const mon = document.getElementById('subject-select').value;
    const container = document.getElementById('topic-container');
    if (!container) return;
    
    container.innerHTML = '';
    if (window.allQuizData.length === 0) {
        container.innerHTML = '<p>Hãy nhập mã và bấm "Tải đề" trước...</p>';
        return;
    }
    
    if (!mon) {
        container.innerHTML = '<p>Hãy chọn môn trước...</p>';
        return;
    }
    
    // Lọc các chủ đề duy nhất (Unique) theo môn
    const topics = [...new Set(window.allQuizData.filter(i => i.mon === mon).map(i => i.chuDe))];
    
    if (topics.length === 0) {
        container.innerHTML = '<p>Không có chủ đề cho môn này!</p>';
    } else {
        topics.forEach(topic => {
            container.innerHTML += `<label style="display:block; margin:5px 0;"><input type="checkbox" name="topic" value="${topic}" checked> ${topic}</label>`;
        });
    }
};

// 3. Xử lý hiển thị Quiz
window.renderQuiz = function() {
    const quizDiv = document.getElementById('quiz');
    if (!quizDiv) return;
    quizDiv.innerHTML = '';
    window.currentQuizData.forEach((item, i) => {
        let options = [{key:'a', val:item.a}, {key:'b', val:item.b}, {key:'c', val:item.c}, {key:'d', val:item.d}];
        options.sort(() => Math.random() - 0.5);
        const card = document.createElement('div');
        card.className = "quiz-card";
        
        let audioBtnHtml = item.mon === 'Tiếng anh' ? `<button type="button" class="speak-btn">🔊 Nghe</button>` : '';
        
        card.innerHTML = `
            <div class="question"><b>Câu ${i+1}: ${item.question}</b><br>${audioBtnHtml}</div>
            ${options.map(opt => `<label class="option-box">
                <input type="radio" name="q${i}" value="${item.mon === 'Tiếng anh' ? opt.val : opt.key}"
                onchange="updateLiveStatus(${i}, this.value, this.parentElement)"> ${opt.val}</label>`).join('')}
        `;
        quizDiv.appendChild(card);
        if (card.querySelector('.speak-btn')) {
            card.querySelector('.speak-btn').onclick = () => window.speakText(item.question);
        }
    });
};

// 4. Xử lý chấm điểm trực tiếp
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

// Khởi tạo sự kiện khi trang tải xong
document.addEventListener('DOMContentLoaded', () => {
    // Sự kiện nút Bắt đầu
    document.getElementById('start-btn').addEventListener('click', () => {
        const mon = document.getElementById('subject-select').value;
        const name = document.getElementById("student-name").value.trim();
        const topics = Array.from(document.querySelectorAll('input[name="topic"]:checked')).map(cb => cb.value);

        if (window.allQuizData.length === 0) return alert("Vui lòng tải đề trước!");
        if (!mon || !name || topics.length === 0) return alert("Vui lòng chọn môn, nhập tên và chọn ít nhất 1 chủ đề!");
        
        const config = mon === "Toán" ? { time: 15, count: 10 } : { time: 10, count: 20 };
        window.currentQuizData = window.allQuizData.filter(i => i.mon === mon && topics.includes(i.chuDe)).sort(() => Math.random() - 0.5).slice(0, config.count);
        
        document.getElementById('start-screen').style.display = 'none';
        document.getElementById('quiz-screen').style.display = 'block';
        window.renderQuiz();
        window.startTimer(config.time);
    });

    // Thêm các sự kiện khác nếu cần...
});
