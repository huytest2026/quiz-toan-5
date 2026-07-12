const API_URL = "https://script.google.com/macros/s/AKfycbylxSJcSDg0PoJmwV-agQKF60cD4WmdhVWPD6vHbG3k2-9CBAkjZpvqSgSmbqYaoXoxwQ/exec"; 

let score = 0;
let currentQuizData = []; 
let allQuizData = [];  
let timerInterval; 

// --- Tải dữ liệu ---
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

// --- HÀM TÍNH ĐIỂM & LƯU ĐÁP ÁN ---
function submitQuiz() {
    clearInterval(timerInterval);
    score = 0;
    
    let userChoices = []; 

    currentQuizData.forEach((item, index) => {
        const selected = document.querySelector(`input[name="q${index}"]:checked`);
        let selectedValue = selected ? selected.value.trim().toUpperCase() : null; 
        userChoices.push(selectedValue);

        if (selectedValue === String(item.correct).trim().toUpperCase()) {
            score++;
        }
    });

    document.getElementById('quiz-screen').style.display = 'none';
    document.getElementById('result-screen').style.display = 'block';
    document.getElementById('result').innerHTML = `<h3>Kết quả: ${score} / 10 câu đúng.</h3>`;

    renderReview(userChoices);

    const data = JSON.stringify({
        ten: document.getElementById("student-name").value,
        diem: score,
        soCau: score + "/10"
    });

    fetch(API_URL, {
        method: "POST",
        mode: 'no-cors',
        headers: { "Content-Type": "application/json" },
        body: data
    }).then(() => console.log("Đã gửi điểm xong!"));
}

// --- HÀM HIỂN THỊ CHI TIẾT ---
function renderReview(userChoices) {
    const reviewContainer = document.getElementById('review-section');
    if (!reviewContainer) return;

    let reviewHTML = '<h4 style="color: #333; margin-bottom: 15px;">Chi Tiết Bài Làm:</h4>';

    currentQuizData.forEach((item, index) => {
        let selected = userChoices[index];
        let correct = String(item.correct).trim().toUpperCase();
        let isCorrect = (selected === correct);

        let statusColor = isCorrect ? 'green' : 'red';
        let statusText = isCorrect ? 'ĐÚNG' : 'SAI';

        reviewHTML += `
            <div style="border-bottom: 1px dashed #ccc; padding-bottom: 10px; margin-bottom: 15px;">
                <p><b>Câu ${index + 1}:</b> ${item.question} <span style="color: ${statusColor}; font-weight: bold;">[${statusText}]</span></p>
        `;

        ['A', 'B', 'C', 'D'].forEach(opt => {
            let optionText = item[opt.toLowerCase()]; 
            let style = 'margin-left: 10px;';
            if (opt === correct) style += 'color: green; font-weight: bold;';
            else if (opt === selected) style += 'color: red; text-decoration: line-through;';
            reviewHTML += `<div style="${style}">${opt}: ${optionText}</div>`;
        });
        reviewHTML += `</div>`;
    });
    reviewContainer.innerHTML = reviewHTML;
}

// --- KHỞI CHẠY ---
loadData();

function startTimer() {
    let time = 15 * 60;
    timerInterval = setInterval(() => {
        time--;
        if (time <= 0) { submitQuiz(); }
    }, 1000);
}

document.getElementById('start-btn').addEventListener('click', () => {
    if (document.getElementById("student-name").value.trim() === "") return alert("Vui lòng nhập tên!");
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('quiz-screen').style.display = 'block';
    generateQuiz();
    renderQuiz();
    startTimer();
});

document.getElementById('submit-btn').addEventListener('click', () => {
    if(confirm("Bạn có chắc chắn muốn nộp bài?")) submitQuiz();
});

document.getElementById('restart-btn').addEventListener('click', () => location.reload());
