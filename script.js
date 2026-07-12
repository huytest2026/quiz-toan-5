const API_URL = "https://script.google.com/macros/s/AKfycbylxSJcSDg0PoJmwV-agQKF60cD4WmdhVWPD6vHbG3k2-9CBAkjZpvqSgSmbqYaoXoxwQ/exec"; // Dán URL mới nhất tại đây

let score = 0;
let currentQuizData = []; 
let allQuizData = [];       

// --- Tải dữ liệu bằng JSONP ---
function loadData() {
    const script = document.createElement('script');
    script.src = API_URL + "?callback=handleData";
    document.body.appendChild(script);
}

function handleData(data) {
    allQuizData = data;
    console.log("Đã tải xong toàn bộ dữ liệu:", allQuizData.length);
}

// --- Logic Quiz ---
function generateQuiz() {
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
        if (selected && selected.value.trim().toUpperCase() === String(item.correct).trim().toUpperCase()) {
            score++;
        }
    });

    document.getElementById('quiz-screen').style.display = 'none';
    document.getElementById('result-screen').style.display = 'block';
    document.getElementById('result').innerHTML = `<h3>Kết quả: ${score} / 10 câu đúng.</h3>`;

    // Gửi dữ liệu không chặn bởi CORS
    const data = JSON.stringify({
        ten: document.getElementById("student-name").value,
        diem: score,
        soCau: score + "/10"
    });
    fetch(API_URL, {
    method: "POST",
    mode: 'no-cors', // Rất quan trọng để không bị chặn CORS
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
        ten: document.getElementById("student-name").value,
        diem: score,
        soCau: score + "/10"
    })
}).then(() => console.log("Đã gửi điểm xong!"));
}

// --- Khởi chạy ---
loadData();

document.getElementById('start-btn').addEventListener('click', () => {
    if (document.getElementById("student-name").value.trim() === "") return alert("Nhập tên!");
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('quiz-screen').style.display = 'block';
    generateQuiz();
    renderQuiz();
    // Start Timer...
});
// --- CÁC HÀM VÀ SỰ KIỆN BỊ THIẾU ---

let timerInterval;
function startTimer() {
    let time = 15 * 60;
    timerInterval = setInterval(() => {
        time--;
        if (time <= 0) { submitQuiz(); }
    }, 1000);
}

// Bắt sự kiện cho nút Bắt đầu (Cập nhật thêm startTimer)
document.getElementById('start-btn').addEventListener('click', () => {
    if (document.getElementById("student-name").value.trim() === "") return alert("Vui lòng nhập tên!");
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('quiz-screen').style.display = 'block';
    generateQuiz();
    renderQuiz();
    startTimer();
});

// Bắt sự kiện cho nút Nộp bài
document.getElementById('submit-btn').addEventListener('click', () => {
    if(confirm("Bạn có chắc chắn muốn nộp bài?")) {
        submitQuiz();
    }
});

// Bắt sự kiện cho nút Làm lại bài
document.getElementById('restart-btn').addEventListener('click', () => { 
    location.reload(); 
});
