// --- ĐỊNH NGHĨA CÁC HÀM TOÀN CỤC ---
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

window.submitQuiz = function() {
    clearInterval(timerInterval);
    const score = parseInt(document.getElementById('count-correct').innerText || 0);
    
    fetch("https://script.google.com/macros/s/AKfycbwrNmZYpd3oMQrWxsTQg5lkhaSg7zVa-wN-xm5YRkoFGwUv36Za739HkHNQ5ZQOl4L3Cw/exec", { 
        method: "POST", 
        mode: "no-cors", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ maHS: studentCode, score, total: window.currentQuizData.length, mon: currentSubject }) 
    }).then(() => {
        alert("Nộp bài thành công!");
        location.reload();
    });
};

// --- CÁC BIẾN & XỬ LÝ KHÁC ---
let studentCode = "", currentSubject = "", timerInterval;
window.allQuizData = []; window.userPermissions = []; window.currentQuizData = [];

window.handleQuizData = function(data) {
    if (data.error) return alert(data.error);
    window.allQuizData = data.questions || [];
    window.userPermissions = data.permissions || [];
    document.getElementById('student-code').style.display = 'none';
    alert("Tải dữ liệu thành công!");
    window.updateTopicList();
};

window.loadData = function() {
    studentCode = document.getElementById('student-code').value.trim();
    if (!studentCode) return alert("Nhập mã học sinh!");
    const API_URL = "https://script.google.com/macros/s/AKfycbwrNmZYpd3oMQrWxsTQg5lkhaSg7zVa-wN-xm5YRkoFGwUv36Za739HkHNQ5ZQOl4L3Cw/exec";
    const script = document.createElement('script');
    script.src = `${API_URL}?ma=${encodeURIComponent(studentCode)}&callback=handleQuizData`;
    document.body.appendChild(script);
};

// --- KHỞI TẠO SỰ KIỆN ---
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('load-data-btn').onclick = window.loadData;
    document.getElementById('start-btn').onclick = window.startQuiz;
    
    // Đảm bảo nút Nộp bài luôn hoạt động
    const btnSubmit = document.getElementById('submit-btn');
    if (btnSubmit) btnSubmit.onclick = window.submitQuiz;
});
