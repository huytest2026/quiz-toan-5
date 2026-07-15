const API_URL = "https://script.google.com/macros/s/AKfycbwrNmZYpd3oMQrWxsTQg5lkhaSg7zVa-wN-xm5YRkoFGwUv36Za739HkHNQ5ZQOl4L3Cw/exec";

// Hàm gọi API qua JSONP để tránh lỗi CORS
function callAPI(url, callbackName) {
    const script = document.createElement('script');
    script.src = `${url}&callback=${callbackName}`;
    document.body.appendChild(script);
    script.onload = () => script.remove();
}

window.loadData = function() {
    const maHS = document.getElementById('student-code').value.trim();
    if (!maHS) return alert("Nhập mã!");
    callAPI(`${API_URL}?ma=${encodeURIComponent(maHS)}`, 'handleQuizData');
};

window.handleQuizData = function(data) {
    if (data.error) return alert(data.error);
    window.allQuizData = data.questions;
    window.userPermissions = data.permissions;
    alert("Tải thành công!");
    window.updateTopicList();
};

window.showRanking = function() {
    callAPI(`${API_URL}?action=getRanking`, 'handleRankingData');
};

window.handleRankingData = function(data) {
    document.getElementById('result-screen').style.display = 'none';
    document.getElementById('rank-board').style.display = 'block';
    document.getElementById('rank-body').innerHTML = data.map(i => `<tr><td>${i.ten}</td><td>${i.diem}</td></tr>`).join('');
};

// ... Các hàm renderQuiz, submitQuiz, updateTopicList giữ nguyên như cũ ...
