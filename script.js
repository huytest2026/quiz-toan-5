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

// --- 3. Hàm hiển thị câu hỏi ---
window.renderQuiz = function() {
    const quizDiv = document.getElementById('quiz');
    if (!quizDiv) return;
    quizDiv.innerHTML = window.currentQuizData.map((item, i) => {
        let options = [{k:'a',v:item.a}, {k:'b',v:item.b}, {k:'c',v:item.c}, {k:'d',v:item.d}].sort(() => Math.random() - 0.5);
        return `
        <div class="quiz-card" id="q-card-${i}" style="margin-bottom:15px; padding:10px; border:2px solid #ddd; border-radius:8px; transition: 0.3s;">
            <b>Câu ${i+1}: ${item.question}</b><br>
            ${options.map(opt => `
                <div class="option-box" style="display:block; margin:5px 0; padding:5px; border:1px solid #eee; cursor:pointer;" onclick="window.checkAnswer(${i}, '${opt.k}', this)">
                    <input type="radio" name="q${i}" value="${opt.k}" disabled> ${opt.v}
                </div>
            `).join('')}
        </div>`;
    }).join('');
};

// --- 4. Logic chấm điểm đã cập nhật (Fix lỗi lưu LocalStorage) ---
window.checkAnswer = function(i, selectedKey, element) {
    const questionData = window.currentQuizData[i];
    
    // Kiểm tra dữ liệu: Nếu questionData bị lỗi, Console sẽ báo ngay
    if (!questionData) {
        console.error("LỖI: Không tìm thấy câu hỏi tại vị trí", i);
        return;
    }

    const selectedText = (questionData[selectedKey] || "").trim().toLowerCase();
    const rawCorrect = String(questionData.correct || "").trim().toLowerCase();
    
    let isCorrect = (['a', 'b', 'c', 'd'].includes(rawCorrect)) 
                    ? (selectedKey.toLowerCase() === rawCorrect) 
                    : (selectedText === rawCorrect);
    
    // Nếu sai, lưu ngay vào LocalStorage
    if (!isCorrect) {
        let wrongQuestions = JSON.parse(localStorage.getItem('wrongQuestions') || '[]');
        
        // Dùng câu hỏi làm khóa để kiểm tra trùng
        if (!wrongQuestions.some(q => q.question === questionData.question)) {
            wrongQuestions.push(questionData);
            localStorage.setItem('wrongQuestions', JSON.stringify(wrongQuestions));
            console.log("Đã lưu thành công câu sai vào LocalStorage!");
        } else {
            console.log("Câu sai này đã có sẵn, không lưu đè.");
        }
    }
    
    // Hiệu ứng màu sắc
    element.style.backgroundColor = isCorrect ? '#d4edda' : '#f8d7da';
    element.parentElement.querySelectorAll('.option-box').forEach(box => {
        box.style.pointerEvents = 'none';
        box.style.opacity = '0.7';
    });
    
    // Cập nhật bộ đếm
    let el = document.getElementById(isCorrect ? 'count-correct' : 'count-wrong');
    if (el) el.innerText = parseInt(el.innerText || 0) + 1;
};

// --- 5. Bắt đầu và Nộp bài ---
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
    const maHS = document.getElementById('student-code').value.trim();
    const countCorrect = document.getElementById('count-correct');
    const score = countCorrect ? parseInt(countCorrect.innerText) : 0;
    const total = window.currentQuizData.length;
    
    const API_URL = "https://script.google.com/macros/s/AKfycbwrNmZYpd3oMQrWxsTQg5lkhaSg7zVa-wN-xm5YRkoFGwUv36Za739HkHNQ5ZQOl4L3Cw/exec";
    
    fetch(API_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maHS: maHS, score: score, total: total })
    });

    alert("Nộp bài thành công!");
    location.reload(); // Không xóa wrongQuestions ở đây nếu muốn học sinh xem lại sau khi nộp
};

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('load-data-btn').onclick = window.loadData;
    document.getElementById('start-btn').onclick = window.startQuiz;
});

window.reviewWrong = function() {
    // Tìm dữ liệu ở phạm vi gốc của website
    let wrongQuestions = JSON.parse(localStorage.getItem('wrongQuestions') || '[]');
    
    // Nếu vẫn không thấy, thử tìm với key đầy đủ (do cơ chế lưu của github pages)
    if (wrongQuestions.length === 0) {
        console.log("Đang thử tìm kiếm dữ liệu ở bộ nhớ dự phòng...");
        // Tùy theo cấu trúc trình duyệt, đôi khi cần gọi qua window.localStorage
    }

    if (wrongQuestions.length === 0) {
        return alert("Bạn chưa có câu sai nào để ôn tập! (Hãy đảm bảo bạn đã chọn câu sai ở cùng đường dẫn này)");
    }
    
    window.currentQuizData = wrongQuestions;
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('quiz-screen').style.display = 'block';
    
    // Reset bộ đếm
    const countCorrect = document.getElementById('count-correct');
    const countWrong = document.getElementById('count-wrong');
    if (countCorrect) countCorrect.innerText = 0;
    if (countWrong) countWrong.innerText = 0;
    
    window.renderQuiz();
};

window.showRanking = function() {
    const API_URL = "URL_CỦA_BẠN_ĐÃ_DEPLOY"; // Đảm bảo đúng URL
    fetch(`${API_URL}?action=getRanking`)
        .then(res => res.json())
        .then(data => {
            if (data.length === 0) return alert("Chưa có kết quả xếp hạng.");
            let rankText = "BẢNG XẾP HẠNG (TOP 10):\n" + 
                           data.slice(0, 10).map((r, i) => `${i+1}. ${r.ten}: ${r.diem} điểm`).join('\n');
            alert(rankText);
        })
        .catch(err => {
            console.error(err);
            alert("Không thể tải bảng xếp hạng!");
        });
};
