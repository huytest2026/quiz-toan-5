// Dán link Web App của bạn vào giữa hai dấu ngoặc kép bên dưới
const API_URL = "https://script.google.com/macros/s/AKfycbylxSJcSDg0PoJmwV-agQKF60cD4WmdhVWPD6vHbG3k2-9CBAkjZpvqSgSmbqYaoXoxwQ/exec";
let score = 0;
let wrongQuestions = [];
let currentQuizData = [];

// Các biến màn hình
const startScreen = document.getElementById('start-screen');
const quizScreen = document.getElementById('quiz-screen');
const resultScreen = document.getElementById('result-screen');
const startBtn = document.getElementById('start-btn');
const submitBtn = document.getElementById('submit-btn');
const restartBtn = document.getElementById('restart-btn');

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
        ${wrongQuestions.length > 0 ? "<span style='color:red; font-size:0.8em;'>Bạn có " + wrongQuestions.length + " câu sai/chưa làm. Sẽ xuất hiện lại ở lần sau!</span>" : ""}
    `;

    // GỬI DỮ LIỆU VỀ GOOGLE SHEET
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

startBtn.addEventListener('click', () => {
    let tenHocSinh = document.getElementById("student-name").value;
    if (tenHocSinh.trim() === "") {
        alert("Em vui lòng nhập tên trước khi làm bài nhé!");
        return;
    }
    startScreen.style.display = 'none';
    quizScreen.style.display = 'block';
    generateQuiz();
    renderQuiz();
    startTimer();
});

submitBtn.addEventListener('click', () => {
    if(confirm("Bạn có chắc chắn muốn nộp bài không?")) {
        submitQuiz();
    }
});

restartBtn.addEventListener('click', () => {
    resultScreen.style.display = 'none';
    quizScreen.style.display = 'block';
    // Logic ôn tập câu sai sẽ nằm ở đây
});

// Hàm tải dữ liệu từ Google Sheets
function loadData() {
    fetch(API_URL)
        .then(res => res.json())
        .then(data => {
            // Kiểm tra nếu dữ liệu là mảng thì gán trực tiếp
            currentQuizData = data; 
            console.log("Đã tải xong dữ liệu:", currentQuizData);
            // Sau khi tải xong mới bắt đầu cho làm bài
        })
        .catch(err => {
            console.error("Lỗi khi tải dữ liệu:", err);
            document.getElementById('quiz').innerHTML = "Không thể tải dữ liệu, hãy kiểm tra lại kết nối.";
        });
}

// Hàm tạo câu hỏi ngẫu nhiên
function generateQuiz() {
    currentQuizData.sort(() => Math.random() - 0.5);
}

// Hàm hiển thị câu hỏi lên màn hình
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

// Hàm đếm giờ
let timerInterval;
function startTimer() {
    let time = 15 * 60; // 15 phút
    timerInterval = setInterval(() => {
        time--;
        if (time <= 0) {
            clearInterval(timerInterval);
            submitQuiz();
        }
    }, 1000);
}

// Chạy hàm loadData ngay khi mở trang
loadData();
