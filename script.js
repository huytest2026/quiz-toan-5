// --- CÁC BIẾN TOÀN CỤC ---
let studentCode = "", currentSubject = "", timerInterval;
window.allQuizData = []; window.userPermissions = []; window.currentQuizData = [];

// --- HÀM NỘP BÀI (ĐÃ CẬP NHẬT ĐỂ CHẮC CHẮN CHẠY) ---
window.submitQuiz = function() {
    console.log("Đang thực hiện nộp bài...");
    clearInterval(timerInterval); // Dừng đồng hồ
    
    // Lấy điểm từ giao diện
    const scoreEl = document.getElementById('count-correct');
    const score = scoreEl ? parseInt(scoreEl.innerText || 0) : 0;
    
    // Thêm thông báo để biết chắc là hàm đã chạy
    alert("Đang gửi kết quả lên hệ thống, vui lòng chờ...");

    fetch("https://script.google.com/macros/s/AKfycbwrNmZYpd3oMQrWxsTQg5lkhaSg7zVa-wN-xm5YRkoFGwUv36Za739HkHNQ5ZQOl4L3Cw/exec", { 
        method: "POST", 
        mode: "no-cors", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ maHS: studentCode, score: score, total: window.currentQuizData.length, mon: currentSubject }) 
    })
    .then(() => {
        alert("Nộp bài thành công!");
        location.reload(); // Tải lại trang
    })
    .catch(err => {
        console.error("Lỗi:", err);
        alert("Lỗi kết nối, thử lại!");
    });
};

// --- CÁC HÀM CỐ ĐỊNH ---
window.updateTopicList = function() {
    const subjectSelect = document.getElementById('subject-select');
    const container = document.getElementById('topic-container');
    if (!subjectSelect || !container) return;
    currentSubject = subjectSelect.value;
    const allowed = window.userPermissions.filter(p => String(p.maHS) === studentCode && p.mon === currentSubject).map(p => p.chuDe);
    const topics = [...new Set(window.allQuizData.filter(i => i.mon === currentSubject).map(i => i.chuDe))];
    container.innerHTML = topics.map(topic => {
        const isAllowed = allowed.includes(topic);
        return `<label style="display:block; margin:5px 0; opacity:${isAllowed ? '1' : '0.5'}">
            <input type="checkbox" name="topic" value="${topic}" ${isAllowed ? 'checked' : 'disabled'}> ${topic}
        </label>`;
    }).join('');
};

// --- KHỞI TẠO ---
document.addEventListener('DOMContentLoaded', () => {
    // 1. Gán sự kiện bằng cách tìm trực tiếp
    const btnSubmit = document.getElementById('submit-btn');
    if (btnSubmit) {
        btnSubmit.addEventListener('click', function(e) {
            e.preventDefault(); // Ngăn hành động mặc định nếu có
            window.submitQuiz();
        });
    }
    
    // Gán các nút khác
    document.getElementById('load-data-btn').onclick = window.loadData;
    document.getElementById('start-btn').onclick = window.startQuiz;
    document.getElementById('subject-select').onchange = window.updateTopicList;
});
