const API_URL = "https://script.google.com/macros/s/AKfycbwrNmZYpd3oMQrWxsTQg5lkhaSg7zVa-wN-xm5YRkoFGwUv36Za739HkHNQ5ZQOl4L3Cw/exec";
let allQuizData = [], currentQuizData = [], correctCount = 0, wrongDetails = [];

// Hàm làm lại câu sai
window.retryWrongQuestions = async function() {
    const name = document.getElementById("student-name").value.trim();
    if (!name) return alert("Nhập tên trước khi làm lại câu sai!");
    const res = await fetch(API_URL + "?action=getWrong&name=" + encodeURIComponent(name));
    const data = await res.json();
    if (data.length === 0) return alert("Bạn chưa có câu sai nào!");
    
    currentQuizData = data;
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('quiz-screen').style.display = 'block';
    renderQuiz();
};

window.updateLiveStatus = function(index, selectedValue, element) {
    let item = currentQuizData[index];
    if (item.answered) return;
    item.answered = true;
    const isCorrect = String(selectedValue).trim().toLowerCase() === String(item.correct).trim().toLowerCase();
    
    if (isCorrect) {
        correctCount++;
        element.style.backgroundColor = "#d4edda";
    } else {
        element.style.backgroundColor = "#f8d7da";
        // Ghi lại lỗi nếu là lần làm bài bình thường
        wrongDetails.push({ ...item, question: item.question, dapAnSai: selectedValue });
    }
    element.closest('.quiz-card').querySelectorAll('.option-box').forEach(opt => opt.style.pointerEvents = "none");
};

// ... Các hàm renderQuiz, loadRanking, startTimer giữ nguyên như cũ ...

// Đăng ký sự kiện
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    // Nút làm lại (Cần thêm <button id="retry-btn"> trong HTML)
    document.getElementById('retry-btn')?.addEventListener('click', retryWrongQuestions);
    
    document.getElementById('start-btn').addEventListener('click', () => {
        // ... (giữ nguyên logic lấy quiz ngẫu nhiên)
    });
});
