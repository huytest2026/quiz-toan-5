const API_URL = "https://script.google.com/macros/s/AKfycbylxSJcSDg0PoJmwV-agQKF60cD4WmdhVWPD6vHbG3k2-9CBAkjZpvqSgSmbqYaoXoxwQ/exec";

let score = 0;
let wrongQuestions = [];
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
    wrongQuestions = [];
    
    currentQuizData.forEach((item, index) => {
        const selected = document.querySelector(`input[name="q${index}"]:checked`);
        // So sánh dùng toLowerCase để khớp A/a với A/a
        if (selected && selected.value.toLowerCase() === item.correct.toLowerCase()) {
            score++;
        } else {
            wrongQuestions.push(item);
        }
    });

    quizScreen.style.display = 'none';
    resultScreen.style.display = 'block';

    document.getElementById('result').innerHTML = `
        <h3>Kết quả: ${score} / ${currentQuizData.length} câu đúng.</h3>
    `;

    let tenHocSinh = document.getElementById("student-name").value;
    fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
            ten: tenHocSinh,
            diem: ((score / currentQuizData.length) * 10).toFixed(1),
            soCau: score + "/" + currentQuizData.length
        })
    }).catch(e => console.log("Lỗi:", e));
}

let timerInterval;
function startTimer() {
    let time = 15 * 60;
    timerInterval = setInterval(() => {
        time--;
        if (time <= 0) {
            clearInterval(timerInterval);
            submitQuiz();
        }
    }, 1000);
}

startBtn.addEventListener('click', () => {
    if (document.getElementById("student-name").value.trim() === "") {
        alert("Em vui lòng nhập tên trước khi làm bài!");
        return;
    }
    startScreen.style.display = 'none';
    quizScreen.style.display = 'block';
    generateQuiz();
    renderQuiz();
    startTimer();
});

submitBtn.addEventListener('click', () => {
    if(confirm("Bạn có chắc chắn muốn nộp bài không?")) submitQuiz();
});

restartBtn.addEventListener('click', () => { location.reload(); });

loadData();
