const API_URL = "https://script.google.com/macros/s/AKfycbylxSJcSDg0PoJmwV-agQKF60cD4WmdhVWPD6vHbG3k2-9CBAkjZpvqSgSmbqYaoXoxwQ/exec";

let score = 0;
let currentQuizData = []; 
let allQuizData = [];     

const startScreen = document.getElementById('start-screen');
const quizScreen = document.getElementById('quiz-screen');
const resultScreen = document.getElementById('result-screen');
const startBtn = document.getElementById('start-btn');
const submitBtn = document.getElementById('submit-btn');
const restartBtn = document.getElementById('restart-btn');

function loadData() {
    fetch(API_URL)
        .then(res => res.json())
        .then(data => {
            allQuizData = data;
            console.log("Đã tải xong toàn bộ dữ liệu:", allQuizData.length);
        })
        .catch(err => console.error("Lỗi khi tải dữ liệu:", err));
}

function generateQuiz() {
    if (allQuizData.length === 0) return;
    let shuffled = [...allQuizData].sort(() => Math.random() - 0.5);
    currentQuizData = shuffled.slice(0, 10);
}

function renderQuiz() {
    const quizContainer = document.getElementById('quiz');
    quizContainer.innerHTML = '';
    currentQuizData.forEach((item, index) => {
        quizContainer.innerHTML += `
            <div class="question" style="margin-bottom: 20px;">
                <p><b>Câu ${index + 1}:</b> ${item.question}</p>
                <input type="radio" name="q${index}" value="A"> A: ${item.a}<br>
                <input type="radio" name="q${index}" value="B"> B: ${item.b}<br>
                <input type="radio" name="q${index}" value="C"> C: ${item.c}<br>
                <input type="radio" name="q${index}" value="D"> D: ${item.d}<br>
            </div>
        `;
    });
}

function submitQuiz() {
    clearInterval(timerInterval);
    score = 0;
    
    currentQuizData.forEach((item, index) => {
        const selected = document.querySelector(`input[name="q${index}"]:checked`);
        // So sánh giá trị đã chọn với đáp án từ Google Sheet
        if (selected && selected.value.trim().toUpperCase() === String(item.correct).trim().toUpperCase()) {
            score++;
        }
    });

    quizScreen.style.display = 'none';
    resultScreen.style.display = 'block';

    document.getElementById('result').innerHTML = `<h3>Kết quả: ${score} / 10 câu đúng.</h3>`;

    // Gửi điểm về Google Sheet
    // Gửi điểm về Google Sheet
    fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
            ten: document.getElementById("student-name").value,
            diem: score,
            soCau: score + "/10"
        })
    })
    .then(res => res.json())
    .then(data => console.log("Đã lưu điểm thành công:", data))
    .catch(e => console.error("Lỗi khi gửi:", e));
}

let timerInterval;
function startTimer() {
    let time = 15 * 60;
    timerInterval = setInterval(() => {
        time--;
        if (time <= 0) { submitQuiz(); }
    }, 1000);
}

startBtn.addEventListener('click', () => {
    if (document.getElementById("student-name").value.trim() === "") {
        alert("Vui lòng nhập tên!");
        return;
    }
    startScreen.style.display = 'none';
    quizScreen.style.display = 'block';
    generateQuiz();
    renderQuiz();
    startTimer();
});

submitBtn.addEventListener('click', () => {
    if(confirm("Nộp bài?")) submitQuiz();
});

restartBtn.addEventListener('click', () => { location.reload(); });

loadData();
