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
        let chosenValue = sel ? sel.value.trim().toUpperCase() : null; // Lấy 'A', 'B', 'C', hoặc 'D'
        
        // Lấy nội dung văn bản của đáp án đã chọn (ví dụ: "BIGGER")
        let chosenText = sel ? sel.parentElement.innerText.split(': ')[1].trim().toUpperCase() : "";
        
        choices.push(chosenText); // Lưu nội dung văn bản để hiển thị review
        
        let correctAnswer = String(item.correct).trim().toUpperCase();
        
        // LOGIC SO SÁNH: 
        // Nếu chọn đúng ký tự (A/B/C/D) HOẶC nội dung văn bản khớp với đáp án đúng -> TÍNH ĐÚNG
        if (chosenValue === correctAnswer || chosenText === correctAnswer) {
            score++;
        }
    });

    document.getElementById('quiz-screen').style.display = 'none';
    document.getElementById('result-screen').style.display = 'block';
    
    const selectedSubject = document.getElementById('subject-select').value;
    document.getElementById('result').innerHTML = `<h3>Kết quả môn ${selectedSubject}: ${score}/10 câu đúng.</h3>`;
    renderReview(choices);

    // Gửi kết quả
    fetch(API_URL, {
        method: "POST",
        mode: 'no-cors',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            ten: document.getElementById("student-name").value, 
            mon: selectedSubject,
            diem: score, 
            soCau: score + "/10" 
        })
    });
}

function renderReview(choices) {
    const cont = document.getElementById('review-section');
    if (!cont) return;
    let html = '<h4>Chi tiết bài làm:</h4>';
    
    currentQuizData.forEach((item, i) => {
        let sel = choices[i] || 'Chưa chọn';
        let cor = String(item.correct).trim();
        let isCorrect = (sel === cor);
        
        html += `<div style="border-bottom:1px solid #ccc; padding:10px 0;">
            <p><b>Câu ${i+1}:</b> ${item.question} 
            <span style="color:${isCorrect ? 'green' : 'red'}; font-weight:bold;">[${isCorrect ? 'ĐÚNG' : 'SAI'}]</span></p>
            <div style="font-size: 0.9em;">Đáp án đúng: <b>${cor}</b> | Bạn đã chọn: <b>${sel}</b></div>
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
