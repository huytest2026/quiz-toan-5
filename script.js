const API_URL = "https://script.google.com/macros/s/AKfycbylxSJcSDg0PoJmwV-agQKF60cD4WmdhVWPD6vHbG3k2-9CBAkjZpvqSgSmbqYaoXoxwQ/exec";

let score = 0;
let wrongQuestions = [];
let currentQuizData = []; // Dùng để hiển thị 10 câu
let allQuizData = [];     // Dùng để lưu 250 câu gốc

// Các biến màn hình
const startScreen = document.getElementById('start-screen');
const quizScreen = document.getElementById('quiz-screen');
const resultScreen = document.getElementById('result-screen');
const startBtn = document.getElementById('start-btn');
const submitBtn = document.getElementById('submit-btn');
const restartBtn = document.getElementById('restart-btn');

// 1. Tải dữ liệu gốc từ Google Sheets
function loadData() {
    fetch(API_URL)
        .then(res => res.json())
        .then(data => {
            allQuizData = data;
            console.log("Đã tải xong toàn bộ dữ liệu:", allQuizData.length);
        })
        .catch(err => console.error("Lỗi khi tải dữ liệu:", err));
}

// 2. Chọn ngẫu nhiên 10 câu từ 250 câu gốc
function generateQuiz() {
    if (allQuizData.length === 0) return;
    let shuffled = [...allQuizData].sort(() => Math.random() - 0.5);
    currentQuizData = shuffled.slice(0, 10);
    console.log("Đã chọn 10 câu ngẫu nhiên:", currentQuizData);
}

// 3. Hiển thị câu hỏi
function renderQuiz() {
    const quizContainer = document.getElementById('quiz');
    quizContainer.innerHTML = '';
    currentQuizData.forEach((item, index) => {
        quizContainer.innerHTML += `
            <div class="question">
                <p>${index + 1}. ${item.question}</p>
                <input type="radio" name="q${index}" value="${item.a}"> ${item.a}<br>
                <input type="radio" name="q${index}" value="${item.b}"> ${item.b}<br>
                <input type="radio" name="q${index}" value="${item.c}"> ${item.c}<br>
                <input type="radio" name="q${index}" value="${item.d}"> ${item.d}<br>
            </div>
        `;
    });
}

// 4. Xử lý nộp bài
function submitQuiz() {
    clearInterval(timerInterval);
    score = 0;
    wrongQuestions = [];
    currentQuizData.forEach((item, index) => {
        const selected = document.querySelector(`input[name="q${index}"]:checked`);
        if (selected && selected.value === item.correct) {
            score++;
        } else {
            wrongQuestions.push(item);
        }
    });

    quizScreen.style.display = 'none';
    resultScreen.style.display = 'block';

    document.getElementById('result').innerHTML = `
        Bạn làm đúng: ${score} / ${currentQuizData.length} câu.<br>
        ${wrongQuestions.length > 0 ? "<span style='color:red; font-size:0.8em;'>Bạn có " + wrongQuestions.length + " câu sai.</span>" : ""}
    `;

    let tenHocSinh = document.getElementById("student-name").value;
    let tongDiem = (score / currentQuizData.length) * 10; 

    fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
            ten: tenHocSinh,
            diem: tongDiem.toFixed(1),
            soCau: score + "/" + currentQuizData.length
        })
    }).then(res => console.log("Gửi điểm thành công")).catch(e => console.log("Lỗi:", e));
}

// 5. Đếm giờ
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

// SỰ KIỆN
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
    if(confirm("Bạn có chắc chắn nộp bài không?")) submitQuiz();
});

restartBtn.addEventListener('click', () => {
    location.reload(); // Tải lại trang để làm mới toàn bộ từ đầu
});

// Chạy lần đầu
loadData();
