window.allQuizData = [];
window.currentQuizData = [];
window.wrongDetails = [];
window.correctCount = 0;
window.timerInterval = null;

// 1. Tải dữ liệu từ Google Sheet
window.loadData = async function() {
    try {
        const response = await fetch("https://script.google.com/macros/s/AKfycbwrNmZYpd3oMQrWxsTQg5lkhaSg7zVa-wN-xm5YRkoFGwUv36Za739HkHNQ5ZQOl4L3Cw/exec");
        window.allQuizData = await response.json();
        updateTopicList();
    } catch (e) { console.error("Lỗi tải dữ liệu:", e); }
};

// 2. Tự động cập nhật danh sách chủ đề theo môn học
window.updateTopicList = function() {
    const mon = document.getElementById('subject-select').value;
    const container = document.getElementById('topic-container');
    container.innerHTML = '';
    if (!mon) {
        container.innerHTML = '<p style="color: #888; font-size: 0.9em;">Hãy chọn môn trước...</p>';
        return;
    }
    const topics = [...new Set(window.allQuizData.filter(i => i.mon === mon).map(i => i.chuDe))];
    topics.forEach(topic => {
        container.innerHTML += `<label style="display:block; margin: 5px 0; cursor:pointer;"><input type="checkbox" name="topic" value="${topic}" checked> ${topic}</label>`;
    });
};

// 3. Quản lý bộ đếm thời gian
window.startTimer = function() {
    let timeLeft = 10 * 60; // 10 phút
    if (window.timerInterval) clearInterval(window.timerInterval);
    window.timerInterval = setInterval(() => {
        timeLeft--;
        let m = Math.floor(timeLeft / 60), s = timeLeft % 60;
        document.getElementById('timer-display').innerText = `${m}:${s < 10 ? '0' : ''}${s}`;
        if (timeLeft <= 0) { 
            clearInterval(window.timerInterval); 
            document.getElementById('submit-btn').click(); 
        }
    }, 1000);
};

// 4. Hiển thị danh sách câu hỏi (Hỗ trợ hiển thị thẻ <img> từ Sheet)
window.renderQuiz = function() {
    const quizDiv = document.getElementById('quiz');
    quizDiv.innerHTML = window.currentQuizData.map((item, i) => {
        let options = [{key:'a', val:item.a}, {key:'b', val:item.b}, {key:'c', val:item.c}, {key:'d', val:item.d}];
        options.sort(() => Math.random() - 0.5); // Trộn đáp án ngẫu nhiên
        
        return `<div class="quiz-card" style="margin-bottom:20px; padding:15px; border:1px solid #ddd; border-radius:8px; background:#fff; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
            <div class="question" style="margin-bottom:12px; font-size: 1.1em; line-height: 1.5;">
                <b>Câu ${i+1}:</b> 
                <div style="margin-top: 5px;">${item.question}</div> 
            </div>
            ${options.map(opt => `<label class="option-box" style="display:block; margin:8px 0; padding:10px; border:1px solid #eee; border-radius:5px; cursor:pointer; transition: background 0.2s;">
                <input type="radio" name="q${i}" value="${item.mon === 'Tiếng anh' ? opt.val : opt.key}" 
                onchange="updateLiveStatus(${i}, this.value, this.parentElement)"> ${opt.val}</label>`).join('')}
        </div>`;
    }).join('');
};

// 5. Cập nhật trạng thái Đúng/Sai trực tiếp khi làm bài
window.updateLiveStatus = function(index, selectedValue, element) {
    let item = window.currentQuizData[index];
    if (item.answered) return;
    item.answered = true;
    
    const isCorrect = String(selectedValue).trim().toLowerCase() === String(item.correct).trim().toLowerCase();
    if (isCorrect) {
        window.correctCount++;
        document.getElementById('count-correct').innerText = window.correctCount;
        element.style.backgroundColor = "#d4edda"; // Màu xanh lá nhẹ khi đúng
        element.style.borderColor = "#c3e6cb";
    } else {
        let currentWrong = parseInt(document.getElementById('count-wrong').innerText) || 0;
        document.getElementById('count-wrong').innerText = currentWrong + 1;
        element.style.backgroundColor = "#f8d7da"; // Màu đỏ nhẹ khi sai
        element.style.borderColor = "#f5c6cb";
        
        // Lưu lịch sử câu sai
        window.wrongDetails.push({ 
            chuDe: item.chuDe, 
            question: item.question, 
            a: item.a, 
            b: item.b, 
            c: item.c, 
            d: item.d, 
            correct: item.correct, 
            dapAnSai: selectedValue 
        });
    }
    // Khóa các lựa chọn còn lại của câu này
    element.closest('.quiz-card').querySelectorAll('label').forEach(l => l.style.pointerEvents = "none");
};

// 6. Tính năng "Làm lại câu sai" (Spaced Repetition)
window.retryWrongQuestions = async function() {
    const name = document.getElementById("student-name").value.trim();
    if (!name) return alert("Vui lòng nhập tên trước khi làm lại câu sai!");
    
    try {
        const res = await fetch(`https://script.google.com/macros/s/AKfycbwrNmZYpd3oMQrWxsTQg5lkhaSg7zVa-wN-xm5YRkoFGwUv36Za739HkHNQ5ZQOl4L3Cw/exec?action=getWrong&name=${encodeURIComponent(name)}`);
        window.currentQuizData = await res.json();
        
        if (!window.currentQuizData || window.currentQuizData.length === 0) {
            return alert("Tuyệt vời! Bạn không có câu sai nào trong hệ thống hoặc chưa từng làm bài.");
        }
        
        // Reset bộ đếm
        window.correctCount = 0; window.wrongDetails = [];
        document.getElementById('count-correct').innerText = "0";
        document.getElementById('count-wrong').innerText = "0";
        
        document.getElementById('start-screen').style.display = 'none';
        document.getElementById('quiz-screen').style.display = 'block';
        
        renderQuiz(); 
        startTimer();
    } catch (e) {
        alert("Có lỗi xảy ra khi tải danh sách câu sai!");
    }
};

// Gán tất cả sự kiện khi DOM sẵn sàng để chống đơ nút bấm
document.addEventListener('DOMContentLoaded', () => {
    window.loadData();

    // Sự kiện Nút "Bắt Đầu Làm Bài"
    const startBtn = document.getElementById('start-btn');
    if (startBtn) {
        startBtn.addEventListener('click', () => {
            const mon = document.getElementById('subject-select').value;
            const name = document.getElementById("student-name").value.trim();
            if (!mon || !name) return alert("Vui lòng chọn môn học và nhập Họ và Tên!");
            
            window.correctCount = 0; window.wrongDetails = [];
            document.getElementById('count-correct').innerText = "0";
            document.getElementById('count-wrong').innerText = "0";
            
            document.getElementById('start-screen').style.display = 'none';
            document.getElementById('quiz-screen').style.display = 'block';
            
            const topics = Array.from(document.querySelectorAll('input[name="topic"]:checked')).map(cb => cb.value);
            window.currentQuizData = window.allQuizData.filter(i => i.mon === mon && topics.includes(i.chuDe)).sort(() => Math.random() - 0.5).slice(0, 20);
            
            if(window.currentQuizData.length === 0) {
                alert("Không tìm thấy câu hỏi nào thuộc chủ đề đã chọn!");
                location.reload();
                return;
            }
            
            renderQuiz(); 
            startTimer();
        });
    }

    // Sự kiện Nút "Nộp bài"
    const submitBtn = document.getElementById('submit-btn');
    if (submitBtn) {
        submitBtn.addEventListener('click', () => {
            clearInterval(window.timerInterval);
            const name = document.getElementById("student-name").value.trim();
            const mon = document.getElementById('subject-select').value;
            
            // Gửi dữ liệu điểm số và danh sách lỗi lên Google Sheet
            fetch("https://script.google.com/macros/s/AKfycbwrNmZYpd3oMQrWxsTQg5lkhaSg7zVa-wN-xm5UZkoFGwUv36Za739HkHNQ5ZQOl4L3Cw/exec", { 
                method: 'POST', 
                body: JSON.stringify({ 
                    ten: name, 
                    diem: window.correctCount, 
                    soCau: window.currentQuizData.length, 
                    mon: mon, 
                    wrongDetails: window.wrongDetails 
                }) 
            }).catch(e => console.error("Lỗi gửi dữ liệu:", e));
            
            // Chuyển sang màn hình kết quả
            document.getElementById('quiz-screen').style.display = 'none';
            document.getElementById('result-screen').style.display = 'block';
            document.getElementById('result').innerHTML = `<h3 style="color:#28a745;">Hoàn thành bài kiểm tra!</h3><p>Họ và tên: <b>${name}</b></p><p>Số câu đúng của em: <b style="font-size:1.3em; color:#28a745;">${window.correctCount}/${window.currentQuizData.length}</b></p>`;
            
            // Hiển thị phần xem lại đáp án đúng
            const reviewSection = document.getElementById('review-section');
            if (reviewSection) {
                reviewSection.innerHTML = '<h4 style="margin-top:0;">Xem lại đáp án đúng các câu đã làm:</h4>' + window.currentQuizData.map((q, i) => `
                    <div style="margin-bottom:10px; padding:8px; border-bottom:1px dashed #eee;">
                        <b>Câu ${i+1}:</b> ${q.question}<br>
                        <span style="color:#28a745;">Đáp án đúng: <b>${q.correct.toUpperCase()}</b></span>
                    </div>
                `).join('');
            }
        });
    }

    // Sự kiện Nút "Làm lại bài" ở màn hình Kết quả
    const restartBtn = document.getElementById('restart-btn');
    if (restartBtn) {
        restartBtn.addEventListener('click', () => {
            location.reload();
        });
    }
});
