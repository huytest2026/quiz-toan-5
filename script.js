const API_URL = "https://script.google.com/macros/s/AKfycbylxSJcSDg0PoJmwV-agQKF60cD4WmdhVWPD6vHbG3k2-9CBAkjZpvqSgSmbqYaoXoxwQ/exec";

let allQuizData = [];
let currentQuizData = [];
let timerInterval;
// Biến đếm trạng thái làm bài
let correctCount = 0;
let wrongCount = 0;

function loadData() {
    const script = document.createElement('script');
    script.src = API_URL + "?callback=handleData";
    document.body.appendChild(script);
}

function handleData(data) { allQuizData = data; }

function startTimer() {
    let time = 15 * 60;
    const timerDisplay = document.getElementById('timer-display');
    timerInterval = setInterval(() => {
        time--;
        let mins = Math.floor(time / 60);
        let secs = time % 60;
        timerDisplay.innerText = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
        if (time <= 0) { clearInterval(timerInterval); submitQuiz(); }
    }, 1000);
}

function generateQuiz() {
    const selectedSubject = document.getElementById('subject-select').value;
    const filteredData = allQuizData.filter(item => item.mon === selectedSubject);
    currentQuizData = [...filteredData].sort(() => Math.random() - 0.5).slice(0, 10);
    // Gán cờ để theo dõi việc đã chọn đáp án hay chưa
    currentQuizData.forEach(item => item.answered = false);
}

function renderQuiz() {
    const quizDiv = document.getElementById('quiz');
    quizDiv.innerHTML = '';
    currentQuizData.forEach((item, i) => {
        quizDiv.innerHTML += `
        <div class="quiz-card">
            <div class="question">Câu ${i+1}: ${item.question}</div>
            <div class="options-grid">
                ${['A','B','C','D'].map(opt => `
                    <label class="option-box">
                        <input type="radio" name="q${i}" value="${opt}" onchange="updateLiveStatus(${i}, '${opt}')"> 
                        ${opt}: ${item[opt.toLowerCase()]}
                    </label>
                `).join('')}
            </div>
        </div>`;
    });
}

// CẬP NHẬT TRẠNG THÁI TỨC THÌ
function updateLiveStatus(index, selectedValue) {
    let item = currentQuizData[index];
    if (item.answered) return; // Nếu đã chọn rồi thì không cộng dồn nữa

    item.answered = true;
    let correctAnswer = String(item.correct).trim().toUpperCase();
    let isCorrect = (["A","B","C","D"].includes(correctAnswer)) ? (selectedValue === correctAnswer) : (item[selectedValue.toLowerCase()].toUpperCase() === correctAnswer);
    
    if (isCorrect) {
        correctCount++;
        document.getElementById('count-correct').innerText = correctCount;
    } else {
        wrongCount++;
        document.getElementById('count-wrong').innerText = wrongCount;
    }
}

function submitQuiz() {
    clearInterval(timerInterval);
    // Logic gửi điểm giữ nguyên như cũ...
    let finalScore = correctCount; 
    document.getElementById('quiz-screen').style.display = 'none';
    document.getElementById('result-screen').style.display = 'block';
    document.getElementById('result').innerHTML = `<h3>Kết quả: ${finalScore}/10 câu đúng.</h3>`;
    
    // Gửi kết quả
    fetch(API_URL, {
        method: "POST", mode: 'no-cors',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            ten: document.getElementById("student-name").value, 
            mon: document.getElementById('subject-select').value,
            diem: finalScore 
        })
    });
}

document.getElementById('start-btn').addEventListener('click', () => {
    if (!document.getElementById("student-name").value.trim()) return alert("Nhập tên!");
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('quiz-screen').style.display = 'block';
    generateQuiz();
    renderQuiz();
    startTimer();
});

document.getElementById('submit-btn').addEventListener('click', () => { if(confirm("Nộp bài?")) submitQuiz(); });
loadData();
