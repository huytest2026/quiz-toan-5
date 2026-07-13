const API_URL = "https://script.google.com/macros/s/AKfycbwrNmZYpd3oMQrWxsTQg5lkhaSg7zVa-wN-xm5YRkoFGwUv36Za739HkHNQ5ZQOl4L3Cw/exec";

let allQuizData = [];
let currentQuizData = [];
let timerInterval;
let correctCount = 0;
let wrongCount = 0;

// --- HÀM TẢI DỮ LIỆU ---
async function loadData() {
    try {
        const response = await fetch(API_URL);
        const text = await response.text(); 
        const cleanJson = text.replace(/handleData\((.*)\)/, '$1');
        allQuizData = JSON.parse(cleanJson);
        updateTopicList();
    } catch (error) { console.error("Lỗi tải dữ liệu:", error); }
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
                        <input type="radio" name="q${i}" 
                               value="${item.mon === 'Tiếng anh' ? item[key] : key}" 
                               onchange="updateLiveStatus(${i}, this.value)"> 
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

    let correctAns = String(item.correct).trim().toLowerCase();
    let selectedAns = String(selectedValue).trim().toLowerCase();

    if (selectedAns === correctAns) {
        correctCount++;
        document.getElementById('count-correct').innerText = correctCount;
    } else {
        wrongCount++;
        document.getElementById('count-wrong').innerText = wrongCount;
    }
};

// --- KHỞI TẠO VÀ SỰ KIỆN ---
document.addEventListener('DOMContentLoaded', () => {
    loadData();

    // Nút bắt đầu
    document.getElementById('start-btn').addEventListener('click', () => {
        if (!document.getElementById("student-name").value.trim()) return alert("Nhập tên!");
        if (document.querySelectorAll('input[name="topic"]:checked').length === 0) return alert("Chọn ít nhất 1 chủ đề!");
        
        document.getElementById('start-screen').style.display = 'none';
        document.getElementById('quiz-screen').style.display = 'block';
        generateQuiz();
        renderQuiz();
    });

    // Nút nộp bài (Đã cập nhật để quay về màn hình đầu)
    const submitBtn = document.getElementById('submit-btn');
    if (submitBtn) {
        submitBtn.onclick = function() {
            if (typeof timerInterval !== 'undefined') clearInterval(timerInterval);
            const totalScore = correctCount;
            const studentName = document.getElementById("student-name").value;
            
            alert(`Bạn đã hoàn thành bài thi!\nTên: ${studentName}\nĐiểm: ${totalScore}/10`);

            // Quay về màn hình chọn tên thay vì reload
            document.getElementById('quiz-screen').style.display = 'none';
            document.getElementById('start-screen').style.display = 'block';
            
            // Reset các thông số hiển thị
            document.getElementById('count-correct').innerText = "0";
            document.getElementById('count-wrong').innerText = "0";
        };
    }
});
