// Dán link Web App của bạn vào giữa hai dấu ngoặc kép bên dưới
const API_URL = "https://script.google.com/macros/s/AKfycbwneD1m_VFEed5xSKzDalVQLjGRdGOxjsX2qrQdf3gBvrmmEWUJX-GAJ8V0F8FJPyNLPA/exec";
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

// Các hàm khác như loadData, generateQuiz, renderQuiz... giữ nguyên không đổi
