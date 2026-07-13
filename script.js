const API_URL = "https://script.google.com/macros/s/AKfycbwrNmZYpd3oMQrWxsTQg5lkhaSg7zVa-wN-xm5YRkoFGwUv36Za739HkHNQ5ZQOl4L3Cw/exec";

let allQuizData = [];
let currentQuizData = [];
let correctCount = 0;
let wrongCount = 0;

// --- 1. TẢI DỮ LIỆU CÂU HỎI ---
async function loadData() {
    try {
        // Thêm chế độ 'cors' để hỗ trợ trình duyệt
        const response = await fetch(API_URL, { method: 'GET', mode: 'cors' });
        allQuizData = await response.json(); 
        updateTopicList();
    } catch (error) { 
        console.error("Lỗi tải câu hỏi:", error);
        alert("Không thể kết nối máy chủ. Hãy thử lại sau!");
    }
}

window.updateTopicList = function() {
    const mon = document.getElementById('subject-select').value;
    const container = document.getElementById('topic-container');
    container.innerHTML = ''; 
    if (!mon) return;

    const filteredBySubject = allQuizData.filter(i => i.mon === mon);
    const topics = [...new Set(filteredBySubject.map(i => i.chuDe).filter(t => t && t.trim() !== ""))];
    
    topics.forEach(topic => {
        container.innerHTML += `<label style="display: block; margin: 5px 0; cursor: pointer;"><input type="checkbox" name="topic" value="${topic}" checked> ${topic}</label>`;
    });
};

// --- 2. XỬ LÝ QUẢN LÝ MÀN HÌNH ---
window.generateQuiz = function() {
    const selectedSubject = document.getElementById('subject-select').value;
    const selectedTopics = Array.from(document.querySelectorAll('input[name="topic"]:checked')).map(cb => cb.value);
    const filteredData = allQuizData.filter(item => item.mon === selectedSubject && selectedTopics.includes(item.chuDe));
    
    currentQuizData = [...filteredData].sort(() => Math.random() - 0.5).slice(0, 10);
    currentQuizData.forEach(item => item.answered = false);
    correctCount = 0; wrongCount = 0;
};

window.renderQuiz = function() {
    const quizDiv = document.getElementById('quiz');
    quizDiv.innerHTML = '';
    currentQuizData.forEach((item, i) => {
        quizDiv.innerHTML += `
            <div class="quiz-card" style="margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 8px;">
                <div class="question" style="font-weight: bold; margin-bottom: 10px;">Câu ${i+1}: ${item.question}</div>
                ${['a','b','c','d'].map(key => `
                    <label class="option-box" style="display: block; padding: 8px; margin: 5px 0; border: 1px solid #eee; cursor: pointer;">
                        <input type="radio" name="q${i}" value="${item.mon === 'Tiếng anh' ? item[key] : key}" onchange="updateLiveStatus(${i}, this.value)"> 
                        ${item[key]}
                    </label>
                `).join('')}
            </div>`;
    });
};

window.updateLiveStatus = function(index, selectedValue) {
    let item = currentQuizData[index];
    if (item.answered) return; 
    item.answered = true;

    if (String(selectedValue).trim().toLowerCase() === String(item.correct).trim().toLowerCase()) {
        correctCount++;
        document.getElementById('count-correct').innerText = correctCount;
    } else {
        wrongCount++;
        document.getElementById('count-wrong').innerText = wrongCount;
    }
};

// --- 3. BẢNG XẾP HẠNG & LƯU ĐIỂM ---
window.loadRanking = async function() {
    try {
        const response = await fetch(API_URL + "?action=getRanking", { method: 'GET', mode: 'cors' });
        const data = await response.json();
        const list = document.getElementById('rank-list');
        list.innerHTML = data.sort((a, b) => b.diem - a.diem).slice(0, 5)
            .map(r => `<div>${r.ten}: <b>${r.diem} điểm</b></div>`).join('');
        document.getElementById('rank-screen').style.display = 'block';
    } catch (e) { alert("Không thể tải bảng xếp hạng!"); }
};

async function saveResult(ten, diem, mon) {
    await fetch(API_URL, {
        method: 'POST',
        mode: 'no-cors', // Sử dụng no-cors để tránh chặn từ Google Apps Script
        body: JSON.stringify({ ten, diem, soCau: 10, mon })
    });
}

// --- 4. KHỞI TẠO SỰ KIỆN ---
document.addEventListener('DOMContentLoaded', () => {
    loadData();

    document.getElementById('start-btn').addEventListener('click', () => {
        const nameInput = document.getElementById("student-name");
        if (!nameInput.value.trim()) return alert("Vui lòng nhập tên!");
        document.getElementById('start-screen').style.display = 'none';
        document.getElementById('quiz-screen').style.display = 'block';
        generateQuiz();
        renderQuiz();
    });

    document.getElementById('show-rank-btn').addEventListener('click', loadRanking);

    document.getElementById('submit-btn').onclick = function() {
        const studentName = document.getElementById("student-name").value;
        const mon = document.getElementById('subject-select').value;
        
        saveResult(studentName, correctCount, mon);
        
        document.getElementById('quiz-screen').style.display = 'none';
        document.getElementById('result-screen').style.display = 'block';
        document.getElementById('result').innerHTML = `<h3>Chúc mừng ${studentName}!</h3><p>Kết quả của bạn là: <b>${correctCount}/10</b></p>`;
    };

    document.getElementById('restart-btn').addEventListener('click', () => {
        location.reload(); // Reload là cách an toàn nhất để reset mọi thứ sau khi làm xong
    });
});
