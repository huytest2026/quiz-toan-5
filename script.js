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
}

function generateQuiz() {
    currentQuizData = [...allQuizData].sort(() => Math.random() - 0.5).slice(0, 10);
}

function renderQuiz() {
    const qC = document.getElementById('quiz');
    qC.innerHTML = '';
    currentQuizData.forEach((item, i) => {
        qC.innerHTML += `<div><p><b>Câu ${i+1}:</b> ${item.question}</p>
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
    document.getElementById('result').innerHTML = `<h3>Kết quả: ${score}/10</h3>`;
    renderReview(choices);
}

function renderReview(choices) {
    const cont = document.getElementById('review-section');
    if (!cont) return;
    let html = '<h4>Chi tiết:</h4>';
    currentQuizData.forEach((item, i) => {
        let isCorrect = (choices[i] === String(item.correct).trim().toUpperCase());
        html += `<div style="border-bottom:1px solid #ccc;">Câu ${i+1}: ${isCorrect ? 'ĐÚNG' : 'SAI'}</div>`;
    });
    cont.innerHTML = html;
}

loadData();
document.getElementById('start-btn').addEventListener('click', () => {
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('quiz-screen').style.display = 'block';
    generateQuiz();
    renderQuiz();
});
document.getElementById('submit-btn').addEventListener('click', submitQuiz);
