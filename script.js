const API_URL = "https://script.google.com/macros/s/AKfycbylxSJcSDg0PoJmwV-agQKF60cD4WmdhVWPD6vHbG3k2-9CBAkjZpvqSgSmbqYaoXoxwQ/exec";

let score = 0;
let wrongQuestions = [];
let currentQuizData = []; // 10 câu đang hiển thị
let allQuizData = [];     // 250 câu gốc

// Các biến màn hình
const startScreen = document.getElementById('start-screen');
const quizScreen = document.getElementById('quiz-screen');
const resultScreen = document.getElementById('result-screen');
const startBtn = document.getElementById('start-btn');
const submitBtn = document.getElementById('submit-btn');
const restartBtn = document.getElementById('restart-btn');

// 1. Tải toàn bộ dữ liệu từ Google Sheets
function loadData() {
    fetch(API_URL)
        .then(res => res.json())
        .then(data => {
            allQuizData = data;
            console.log("Đã tải xong toàn bộ dữ liệu:", allQuizData.length);
        })
        .catch(err => console.error("Lỗi khi tải dữ liệu:", err));
}

// 2. Chọn ngẫu nhiên 10 câu
function generateQuiz() {
    if (allQuizData.length === 0) return;
    let shuffled = [...allQuizData].sort(() => Math.random() - 0.5);
    currentQuizData = shuffled.slice(0, 10);
    console.log("Đang làm bài với 10 câu:", currentQuizData);
}

// 3. Hiển thị 10 câu lên màn hình
function renderQuiz() {
    const quizContainer = document.getElementById('quiz');
    quizContainer.innerHTML = '';
    currentQuizData.forEach((item, index) => {
        quizContainer.innerHTML += `
            <div class="question" style="margin-bottom: 20px;">
                <p><b>Câu ${index + 1}:</b> ${item.question}</p>
                <input type="radio" name="q${index}" value="${item.a}"> ${item.a}<br>
                <input type="radio" name="q${index}" value="${item.b}"> ${item.b}<br>
                <input type="radio" name="q${index}" value="${item.c}"> ${item.c}<br>
                <input type="radio" name="q${index}" value="${item.d}"> ${item.d}<br>
            </div>
        `;
    });
}

// 4. Xử lý nộp bài (Chỉ duyệt 10 câu trong currentQuizData)
function submitQuiz() {
    clearInterval(timerInterval);
    score = 0;
    wrongQuestions = [];
    
    // Chỉ duyệt 10 câu đang hiển thị
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
        <h3>Kết quả: ${score} / ${currentQuizData.length} câu đúng.</h3>
        ${wrongQuestions.length > 0 ? "<p style='color:red;'>Bạn làm sai " + wrongQuestions.length + " câu.</p>" : "<p style='color:green;'>Chúc mừng bạn đã làm đúng hết!</p>"}
    `;

    // Gửi điểm
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
    }).then(() => console.log("Gửi điểm thành công")).catch(e => console.log("Lỗi gửi điểm:", e));
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
    if(confirm("Bạn có chắc chắn muốn nộp bài không?")) submitQuiz();
});

restartBtn.addEventListener('click', () => {
    location.reload(); 
});

// Chạy lần đầu
loadData();
