// --- CÁC BIẾN TOÀN CỤC ---
let studentCode = localStorage.getItem('savedStudentCode') || ""; // Lấy mã đã lưu từ trình duyệt
let currentSubject = "", timerInterval, timeLeft = 0, wrongQuestions = [];
window.allQuizData = []; window.userPermissions = []; window.currentQuizData = [];

// --- TẢI DỮ LIỆU ---
window.loadData = function() {
    // Nếu chưa có mã, lấy từ ô nhập. Nếu đã có mã thì dùng mã cũ
    const inputCode = document.getElementById('student-code').value.trim();
    studentCode = inputCode || studentCode; 
    
    if (!studentCode) return alert("Vui lòng nhập mã học sinh!");
    
    // Lưu mã vào trình duyệt để lần sau không cần nhập lại
    localStorage.setItem('savedStudentCode', studentCode);

    const API_URL = "https://script.google.com/macros/s/AKfycbwrNmZYpd3oMQrWxsTQg5lkhaSg7zVa-wN-xm5YRkoFGwUv36Za739HkHNQ5ZQOl4L3Cw/exec";
    const script = document.createElement('script');
    script.src = `${API_URL}?ma=${encodeURIComponent(studentCode)}&callback=handleQuizData`;
    document.body.appendChild(script);
};

// Tự động tải nếu đã có mã khi vào trang
document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('savedStudentCode')) {
        document.getElementById('student-code').value = localStorage.getItem('savedStudentCode');
        window.loadData();
    }
    document.getElementById('load-data-btn').onclick = window.loadData;
    // ... các sự kiện khác
});

window.handleQuizData = function(data) {
    if (data.error) return alert(data.error);
    window.allQuizData = data.questions || [];
    window.userPermissions = data.permissions || [];
    
    // Ẩn màn hình nhập mã, hiện màn hình chọn môn/chủ đề
    document.getElementById('student-code').style.display = 'none';
    document.getElementById('load-data-btn').style.display = 'none';
    document.getElementById('start-screen').style.display = 'block';
    
    window.updateTopicList();
};

// --- NỘP BÀI VÀ THI LẠI ---
window.submitQuiz = function() {
    clearInterval(timerInterval);
    const score = parseInt(document.getElementById('count-correct').innerText || 0);
    
    fetch("https://script.google.com/macros/s/AKfycbwrNmZYpd3oMQrWxsTQg5lkhaSg7zVa-wN-xm5YRkoFGwUv36Za739HkHNQ5ZQOl4L3Cw/exec", { 
        method: "POST", mode: "no-cors", headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ maHS: studentCode, score, total: window.currentQuizData.length, mon: currentSubject }) 
    }).then(() => {
        alert("Nộp bài thành công! Điểm: " + score);
        window.showRanking(); 
        
        // Quay về màn hình bắt đầu để thi lại, KHÔNG cần nhập mã vì mã đã lưu trong localStorage
        document.getElementById('quiz-screen').style.display = 'none';
        document.getElementById('start-screen').style.display = 'block';
        document.getElementById('count-correct').innerText = "0";
        document.getElementById('count-wrong').innerText = "0";
    });
};
