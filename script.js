const API_URL = "https://script.google.com/macros/s/AKfycbylxSJcSDg0PoJmwV-agQKF60cD4WmdhVWPD6vHbG3k2-9CBAkjZpvqSgSmbqYaoXoxwQ/exec";

let allQuizData = [];
let currentQuizData = [];
let timerInterval;
let correctCount = 0;
let wrongCount = 0;

// Sử dụng fetch thay vì chèn thẻ script để dữ liệu ổn định hơn
async function loadData() {
    try {
        // Nếu API của bạn đang trả về dạng JSONP (có handleData), 
        // bạn có thể thử bỏ qua .json() và dùng cách cũ hoặc sửa lại API.
        // NHƯNG, cách tốt nhất là sửa API bên Google Apps Script.
        const response = await fetch(API_URL);
        const text = await response.text(); 
        
        // Loại bỏ phần "handleData(" và ")" nếu nó vẫn tồn tại
        const cleanJson = text.replace(/handleData\((.*)\)/, '$1');
        allQuizData = JSON.parse(cleanJson);
        
        console.log("Dữ liệu đã tải thành công:", allQuizData.length, "câu hỏi");
        updateTopicList(); // Gọi sau khi tải xong
    } catch (error) {
        console.error("Lỗi khi tải dữ liệu:", error);
    }
}

window.updateTopicList = function() {
    const mon = document.getElementById('subject-select').value;
    const container = document.getElementById('topic-container');
    container.innerHTML = ''; 

    if (!mon) return;

    // Lọc và hiển thị chủ đề dựa trên dữ liệu đã tải
    const topics = [...new Set(allQuizData
        .filter(i => i.mon === mon || i.Môn === mon)
        .map(i => i['Chủ đề'] || i['chủ đề'] || "Chủ đề khác"))];
    
    topics.forEach(topic => {
        container.innerHTML += `
            <label style="display: block; margin: 5px 0; cursor: pointer;">
                <input type="checkbox" name="topic" value="${topic}" checked> ${topic}
            </label>
        `;
    });
};

document.addEventListener('DOMContentLoaded', () => {
    // Nạp dữ liệu ngay khi trang tải xong
    loadData();

    function saveResult(name, subject, score) {
        let history = JSON.parse(localStorage.getItem('quizHistory')) || [];
        history.push({ name, subject, score, date: new Date().toLocaleString() });
        localStorage.setItem('quizHistory', JSON.stringify(history));
    }

    document.getElementById('show-rank-btn').addEventListener('click', () => {
        let history = JSON.parse(localStorage.getItem('quizHistory')) || [];
        history.sort((a, b) => b.score - a.score);
        let top5 = history.slice(0, 5);
        
        let html = `
            <div style="margin-bottom: 10px; text-align: right;">
                <button id="clear-history-btn" style="padding: 5px 10px; cursor: pointer; background: #dc3545; color: white; border: none; border-radius: 4px; font-size: 0.8em;">Xóa lịch sử</button>
            </div>
            <table style="width:100%; border-collapse: collapse; margin-top: 10px; text-align: left;">
                <thead>
                    <tr style="border-bottom: 2px solid #eee;">
                        <th style="padding: 8px;">Hạng</th>
                        <th style="padding: 8px;">Tên</th>
                        <th style="padding: 8px;">Điểm</th>
                    </tr>
                </thead>
                <tbody>`;
        
        top5.forEach((item, index) => {
            let medal = (index === 0) ? "🥇" : (index === 1) ? "🥈" : (index === 2) ? "🥉" : index + 1;
            html += `<tr>
                        <td style="padding: 8px; font-size: 1.2em;">${medal}</td>
                        <td style="padding: 8px;">${item.name}</td>
                        <td style="padding: 8px; font-weight: bold; color: #28a745;">${item.score}/10</td>
                    </tr>`;
        });
        
        document.getElementById('rank-list').innerHTML = html + '</tbody></table>';
        document.getElementById('rank-screen').style.display = 'block';

        document.getElementById('clear-history-btn').addEventListener('click', () => {
            if (confirm("Bạn có chắc muốn xóa sạch bảng xếp hạng?")) {
                localStorage.removeItem('quizHistory');
                document.getElementById('rank-screen').style.display = 'none';
            }
        });
    });

    document.getElementById('start-btn').addEventListener('click', () => {
        if (!document.getElementById("student-name").value.trim()) return alert("Nhập tên!");
        if (document.querySelectorAll('input[name="topic"]:checked').length === 0) return alert("Vui lòng chọn ít nhất 1 chủ đề!");
        
        document.getElementById('start-screen').style.display = 'none';
        document.getElementById('quiz-screen').style.display = 'block';
        generateQuiz();
        renderQuiz();
        startTimer();
    });

    // ... (Giữ nguyên các hàm còn lại: startTimer, generateQuiz, renderQuiz, updateLiveStatus, submitQuiz)
    // Lưu ý: Đảm bảo trong generateQuiz bạn sử dụng logic lọc tương tự như updateTopicList
});
