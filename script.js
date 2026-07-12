const API_URL = "https://script.google.com/macros/s/AKfycbylxSJcSDg0PoJmwV-agQKF60cD4WmdhVWPD6vHbG3k2-9CBAkjZpvqSgSmbqYaoXoxwQ/exec";

let score = 0;
let currentQuizData = [];
let allQuizData = [];
let timerInterval;

function loadData() {
    const script = document.createElement('script');
    script.src = API_URL + "?callback=handleData";
    document.body.appendChild(script);
}

function handleData(data) {
    allQuizData = data;
    console.log("Đã tải xong toàn bộ dữ liệu:", allQuizData.length);
}

function generateQuiz() {
    let shuffled = [...allQuizData].sort(() => Math.random() - 0.5);
    currentQuizData = shuffled.slice(0, 10);
}

function renderQuiz() {
    const quizContainer = document.getElementById('quiz');
    quizContainer.innerHTML = '';
    currentQuizData.forEach((item, index) => {
        quizContainer.innerHTML += `
            <div style="margin-bottom: 20px;">
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
    let userChoices = [];
    currentQuizData.forEach((item, index) => {
        const selected = document.querySelector(`input[name="q${index}"]:checked`);
        let val = selected ? selected.value.trim().toUpperCase() : null;
        userChoices.push(val);
        if (val === String(item.correct).trim().toUpperCase()) score++;
    });

    document.getElementById('quiz-screen').style.display = 'none';
    document.getElementById('result-screen').style.display = 'block';
    document.getElementById('result').innerHTML = `<h3>Kết quả: ${score} / 10 câu đúng.</h3>`;
    
    renderReview(userChoices);

    fetch(API_URL, {
        method: "POST",
        mode: 'no-cors',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ten: document.getElementById("student-name").value, diem: score, soCau: score + "/10" })
    });
}

function renderReview(userChoices) {
    const container = document.getElementById('review-section');
    if (!container) return;
    let html = '<h4>Chi tiết:</h4>';
    currentQuizData.forEach((item, i) => {
        let sel = userChoices[i];
        let cor = String(item.correct).trim().toUpperCase();
        html += `<div style="border-bottom:1px solid #ccc; padding:5px;">
            <p>Câu ${i+1}: ${item.question} <b>${sel===cor ? '[ĐÚNG]' : '[SAI]'}</b></p>
        </div>`;
    });
    container.innerHTML = html;
}

loadData();

document.getElementById('start-btn').addEventListener('click', () => {
    if (!document.getElementById("student-name").value.trim()) return alert("Nhập tên!");
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('quiz-screen').style.display = 'block';
    generateQuiz();
    renderQuiz();
    timerInterval = setInterval(() => {}, 1000);
});

document.getElementById('submit-btn').addEventListener('click', () => { if(confirm("Nộp bài?")) submitQuiz(); });
document.getElementById('restart-btn').addEventListener('click', () => location.reload());
