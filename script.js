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

// Bắt đầu làm bài
function startTimer() {
    let time = 15 * 60; // 15 phút
    const timerDisplay = document.getElementById('timer-display');
    const warningSound = document.getElementById('warning-sound');

    timerInterval = setInterval(() => {
        time--;
        let mins = Math.floor(time / 60);
        let secs = time % 60;
        timerDisplay.innerText = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

        // Cảnh báo 1 phút cuối
        if (time === 60 && warningSound) {
            warningSound.play();
            alert("Cảnh báo: Chỉ còn 1 phút nữa là hết giờ!");
        }

        if (time <= 0) {
            clearInterval(timerInterval);
            alert("Đã hết giờ!");
            submitQuiz();
        }
    }, 1000);
}

function generateQuiz() {
    currentQuizData = [...allQuizData].sort(() => Math.random() - 0.5).slice(0, 10);
}

function renderQuiz() {
    const quizDiv = document.getElementById('quiz');
    quizDiv.innerHTML = '';
    currentQuizData.forEach((item, i) => {
        quizDiv.innerHTML += `<div><p><b>Câu ${i+1}:</b> ${item.question}</p>
        <input type="radio" name="q${i}" value="A"> A: ${item.a}<br>
        <input type="radio" name="q${i}" value="B"> B: ${item.b}<br>
        <input type="radio" name="q${i}" value="C"> C: ${item.c}<br>
        <input type="radio" name="q${i}" value="D"> D: ${item.d}<br></div>`;
    });
}

function submitQuiz() {
    clearInterval(timerInterval);
    score = 0;
    let choices = [];
    currentQuizData.forEach((item, i) => {
        const sel = document.querySelector(`input[name="q${i}"]:checked`);
        let val = sel ? sel.value.trim().toUpperCase() : null;
        choices.push(val);
        if (val === String(item.correct).trim().toUpperCase()) score++;
    });

    document.getElementById('quiz-screen').style.display = 'none';
    document.getElementById('result-screen').style.display = 'block';
    document.getElementById('result').innerHTML = `<h3>Kết quả: ${score}/10 câu đúng.</h3>`;
    renderReview(choices);

    fetch(API_URL, {
        method: "POST",
        mode: 'no-cors',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ten: document.getElementById("student-name").value, diem: score, soCau: score + "/10" })
    });
}

function renderReview(choices) {
    const cont = document.getElementById('review-section');
    if (!cont) return;
    let html = '<h4>Chi tiết bài làm:</h4>';
    currentQuizData.forEach((item, i) => {
        let isCorrect = (choices[i] === String(item.correct).trim().toUpperCase());
        html += `<div style="border-bottom:1px solid #ccc; padding:5px;">Câu ${i+1}: ${isCorrect ? '<b style="color:green">ĐÚNG</b>' : '<b style="color:red">SAI</b>'}</div>`;
    });
    cont.innerHTML = html;
}

// Gán sự kiện
document.getElementById('start-btn').addEventListener('click', () => {
    if (!document.getElementById("student-name").value.trim()) return alert("Nhập tên trước khi bắt đầu!");
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('quiz-screen').style.display = 'block';
    generateQuiz();
    renderQuiz();
    startTimer();
});

document.getElementById('submit-btn').addEventListener('click', () => { if(confirm("Nộp bài?")) submitQuiz(); });
document.getElementById('restart-btn').addEventListener('click', () => location.reload());

loadData();
