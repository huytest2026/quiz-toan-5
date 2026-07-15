window.allQuizData = [];
window.userPermissions = [];
window.currentQuizData = [];
let timerInterval;

// 1. Hàm render câu hỏi (Đã thêm xáo trộn đáp án)
window.renderQuiz = function() {
    const quizDiv = document.getElementById('quiz');
    if (!quizDiv) return;

    quizDiv.innerHTML = window.currentQuizData.map((item, i) => {
        // Xáo trộn đáp án
        let options = ['a', 'b', 'c', 'd'].map(key => ({ key, val: item[key] }));
        options.sort(() => Math.random() - 0.5);

        return `
        <div class="quiz-card" id="q-card-${i}" style="margin-bottom:15px; padding:10px; border:2px solid #ddd; border-radius:8px;">
            <b>Câu ${i+1}: ${item.question}</b><br>
            ${options.map(opt => `
                <label class="option-box" style="display:block; margin:5px 0; padding:5px; cursor:pointer;">
                    <input type="radio" name="q${i}" value="${opt.key}" onclick="window.checkAnswer(${i}, '${opt.key}')"> ${opt.val}
                </label>
            `).join('')}
        </div>`;
    }).join('');
};

// 2. Hàm kiểm tra đáp án ngay lập tức
window.checkAnswer = function(i, selectedKey) {
    const card = document.getElementById(`q-card-${i}`);
    const inputs = card.querySelectorAll('input');
    
    // Vô hiệu hóa tất cả input trong câu này để không đổi được nữa
    inputs.forEach(input => input.disabled = true);

    const isCorrect = selectedKey === window.currentQuizData[i].correct;
    card.style.borderColor = isCorrect ? 'green' : 'red';
    
    // Cập nhật điểm
    let correct = parseInt(document.getElementById('count-correct').innerText);
    let wrong = parseInt(document.getElementById('count-wrong').innerText);
    if(isCorrect) document.getElementById('count-correct').innerText = correct + 1;
    else document.getElementById('count-wrong').innerText = wrong + 1;
};

// 3. Hàm xử lý bắt đầu bài làm (Xáo trộn câu hỏi + Thiết lập thời gian)
window.startQuiz = function() {
    const mon = document.getElementById('subject-select').value;
    const selectedTopics = Array.from(document.querySelectorAll('input[name="topic"]:checked')).map(cb => cb.value);
    if (selectedTopics.length === 0) return alert("Chọn ít nhất 1 chủ đề!");

    // Lọc và xáo trộn câu hỏi
    let filtered = window.allQuizData.filter(i => i.mon === mon && selectedTopics.includes(i.chuDe));
    window.currentQuizData = filtered.sort(() => Math.random() - 0.5).slice(0, mon === 'Toán' ? 10 : 20);

    // Thiết lập thời gian
    let time = (mon === 'Toán' ? 15 : 10) * 60;
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        time--;
        let min = Math.floor(time / 60);
        let sec = time % 60;
        document.getElementById('timer-display').innerText = `${min}:${sec < 10 ? '0' + sec : sec}`;
        if (time <= 0) { clearInterval(timerInterval); alert("Hết giờ!"); window.submitQuiz(); }
    }, 1000);

    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('quiz-screen').style.display = 'block';
    window.renderQuiz();
};

// Gắn sự kiện vào nút Bắt Đầu
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('start-btn').onclick = window.startQuiz;
    // ... các hàm loadData, updateTopicList, submitQuiz giữ nguyên như cũ ...
});
