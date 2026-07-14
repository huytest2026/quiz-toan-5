window.allQuizData = [];
window.currentQuizData = [];
window.correctCount = 0;
window.wrongCount = 0; // Thêm biến đếm sai
window.timerInterval = null;

// Hàm an toàn để cập nhật text
function safeUpdateText(id, value) {
    const el = document.getElementById(id);
    if (el) el.innerText = value;
}

window.loadData = async function() {
    try {
        const response = await fetch("https://script.google.com/macros/s/AKfycbwrNmZYpd3oMQrWxsTQg5lkhaSg7zVa-wN-xm5YRkoFGwUv36Za739HkHNQ5ZQOl4L3Cw/exec");
        window.allQuizData = await response.json();
        updateTopicList();
    } catch (e) { console.error("Lỗi tải dữ liệu:", e); }
};

window.updateTopicList = function() {
    const mon = document.getElementById('subject-select')?.value;
    const container = document.getElementById('topic-container');
    if (!container) return;
    container.innerHTML = '';
    if (!mon) return;
    const topics = [...new Set(window.allQuizData.filter(i => i.mon === mon).map(i => i.chuDe))];
    topics.forEach(topic => {
        container.innerHTML += `<label style="display:block; margin:5px 0; cursor:pointer;"><input type="checkbox" name="topic" value="${topic}" checked> ${topic}</label>`;
    });
};

window.toggleTopics = function(selectAll) {
    document.querySelectorAll('input[name="topic"]').forEach(cb => cb.checked = selectAll);
};

window.updateLiveStatus = function(index, selectedValue, element) {
    let item = window.currentQuizData[index];
    if (item.answered) return;
    item.answered = true;
    
    const isCorrect = String(selectedValue).trim().toLowerCase() === String(item.correct).trim().toLowerCase();
    if (isCorrect) {
        window.correctCount++;
        safeUpdateText('count-correct', window.correctCount);
        element.style.backgroundColor = "#d4edda";
    } else {
        window.wrongCount++;
        safeUpdateText('count-wrong', window.wrongCount);
        element.style.backgroundColor = "#f8d7da";
    }
    // Vô hiệu hóa các lựa chọn khác
    element.closest('.quiz-card').querySelectorAll('label').forEach(l => l.style.pointerEvents = "none");
};

document.addEventListener('DOMContentLoaded', () => {
    loadData();

    // Gán sự kiện an toàn
    const startBtn = document.getElementById('start-btn');
    if (startBtn) {
        startBtn.addEventListener('click', () => {
            const mon = document.getElementById('subject-select').value;
            const name = document.getElementById("student-name")?.value.trim();
            if (!mon || !name) return alert("Vui lòng chọn môn và nhập tên!");
            
            // Logic bắt đầu bài thi...
            document.getElementById('start-screen').style.display = 'none';
            document.getElementById('quiz-screen').style.display = 'block';
            // ... (thêm code renderQuiz và startTimer ở đây)
        });
    }

    const submitBtn = document.getElementById('submit-btn');
    if (submitBtn) {
        submitBtn.addEventListener('click', () => {
            // Logic nộp bài...
        });
    }
});
