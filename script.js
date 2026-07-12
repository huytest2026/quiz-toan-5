const API_URL = "https://script.google.com/macros/s/AKfycbylxSJcSDg0PoJmwV-agQKF60cD4WmdhVWPD6vHbG3k2-9CBAkjZpvqSgSmbqYaoXoxwQ/exec";

let score = 0;
let currentQuizData = [];
let allQuizData = [];
let timerInterval;

// Tải dữ liệu
function loadData() {
    const script = document.createElement('script');
    script.src = API_URL + "?callback=handleData";
    document.body.appendChild(script);
}

function handleData(data) {
    allQuizData = data;
    console.log("Dữ liệu đã tải:", allQuizData.length);
}

// Bắt đầu làm bài và đếm ngược
function startTimer() {
    let time = 15 * 60; // 15 phút
    const timerDisplay = document.getElementById('timer-display');
    const warningSound = document.getElementById('warning-sound');

    timerInterval = setInterval(() => {
        time--;
        let mins = Math.floor(time / 60);
        let secs = time % 60;
        timerDisplay.innerText = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

        if (time === 60 && warningSound) {
            warningSound.play();
            alert("Cảnh báo: Chỉ còn 1 phút nữa là hết giờ!");
        }

        if (time <= 0) {
            clearInterval(timerInterval);
            alert("Đã hết giờ làm bài!");
            submitQuiz();
        }
    }, 1000);
}

// Lọc câu hỏi theo môn học
function generateQuiz() {
    const selectedSubject = document.getElementById('subject-select').value;
    const filteredData = allQuizData.filter(item => item.mon === selectedSubject);
    
    if (filteredData.length === 0) {
        alert("Hiện tại chưa có câu hỏi cho môn này!");
        location.reload();
        return;
    }
    currentQuizData = [...filteredData].sort(() => Math.random() - 0.5).slice(0, 10);
}

function renderQuiz() {
    const quizDiv = document.getElementById('quiz');
    quizDiv.innerHTML = '';
    
    currentQuizData.forEach((item, i) => {
        quizDiv.innerHTML += `
        <div class="quiz-card">
            <div class="question">Câu ${i+1}: ${item.question}</div>
            <div class="options-grid">
                <label class="option-box"><input type="radio" name="q${i}" value="A"> A: ${item.a}</label>
                <label class="option-box"><input type="radio" name="q${i}" value="B"> B: ${item.b}</label>
                <label class="option-box"><input type="radio" name="q${i}" value="C"> C: ${item.c}</label>
                <label class="option-box"><input type="radio" name="q${i}" value="D"> D: ${item.d}</label>
            </div>
        </div>`;
    });
}

// CẬP NHẬT: So sánh dựa trên nội dung đáp án
function submitQuiz() {
    clearInterval(timerInterval);
    score = 0;
    let choices = [];
    
    currentQuizData.forEach((item, i) => {
        const sel = document.querySelector(`input[name="q${i}"]:checked`);
        // Lấy ký tự đã chọn (A, B, C, D)
        let chosenValue = sel ? sel.value.trim().toUpperCase() : "";
        // Lấy nội dung chữ đã chọn (ví dụ: "BIGGER")
        let chosenText = sel ? sel.parentElement.innerText.split(': ')[1].trim().toLowerCase() : "";
        
        let correctAnswer = String(item.correct).trim().toLowerCase();
        
        // CẬP NHẬT LOGIC:
        // Nếu đáp án đúng trong Sheet là A/B/C/D, so sánh với chosenValue
        // Nếu đáp án đúng trong Sheet là văn bản, so sánh với chosenText
        let isCorrect = false;
        if (["A", "B", "C", "D"].includes(correctAnswer.toUpperCase())) {
            isCorrect = (chosenValue === correctAnswer.toUpperCase());
        } else {
            isCorrect = (chosenText === correctAnswer);
        }

        if (isCorrect) score++;
        choices.push({ text: chosenText.toUpperCase(), correct: isCorrect });
    });

    // ... (Giữ nguyên phần hiển thị kết quả và fetch)
    document.getElementById('quiz-screen').style.display = 'none';
    document.getElementById('result-screen').style.display = 'block';
    
    const selectedSubject = document.getElementById('subject-select').value;
    document.getElementById('result').innerHTML = `<h3>Kết quả môn ${selectedSubject}: ${score}/10 câu đúng.</h3>`;
    renderReview(choices);
    // ...
}
function renderReview(choices) {
    const cont = document.getElementById('review-section');
    if (!cont) return;
    let html = '<h4>Chi tiết bài làm:</h4>';
    
    currentQuizData.forEach((item, i) => {
        let isCorrect = choices[i].correct;
        let userAnswer = choices[i].text || 'Chưa chọn';
        let cor = String(item.correct).trim().toUpperCase();
        
        html += `<div style="border-bottom:1px solid #ccc; padding:10px 0;">
            <p><b>Câu ${i+1}:</b> ${item.question} 
            <span style="color:${isCorrect ? 'green' : 'red'}; font-weight:bold;">[${isCorrect ? 'ĐÚNG' : 'SAI'}]</span></p>
            <div style="font-size: 0.9em;">Đáp án đúng: <b>${cor}</b> | Bạn đã chọn: <b>${userAnswer}</b></div>
        </div>`;
    });
    cont.innerHTML = html;
}

// Gán sự kiện
document.getElementById('start-btn').addEventListener('click', () => {
    if (!document.getElementById("student-name").value.trim()) return alert("Vui lòng nhập tên!");
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('quiz-screen').style.display = 'block';
    generateQuiz();
    renderQuiz();
    startTimer();
});

document.getElementById('submit-btn').addEventListener('click', () => { if(confirm("Bạn có chắc muốn nộp bài?")) submitQuiz(); });
document.getElementById('restart-btn').addEventListener('click', () => location.reload());

loadData();
