// Dán link Web App của bạn vào giữa hai dấu ngoặc kép bên dưới
const API_URL = "https://script.google.com/macros/s/AKfycbwneD1m_VFEed5xSKzDalVQLjGRdGOxjsX2qrQdf3gBvrmmEWUJX-GAJ8V0F8FJPyNLPA/exec";
let allQuestions = []; // Lưu toàn bộ câu hỏi từ Google Sheet
let wrongQuestions = []; // Lưu các câu làm sai
let currentQuizData = []; // 10 câu sẽ làm trong lần hiện tại
let timerInterval;
let timeLeft = 15 * 60; // 15 phút tính bằng giây

// Các thành phần HTML
const startScreen = document.getElementById('start-screen');
const quizScreen = document.getElementById('quiz-screen');
const resultScreen = document.getElementById('result-screen');
const startBtn = document.getElementById('start-btn');
const timeDisplay = document.getElementById('time');
const quizContainer = document.getElementById('quiz');

// 1. Tải dữ liệu 1 LẦN DUY NHẤT khi mở trang
async function loadData() {
    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        // Chỉ lấy những câu có nội dung hợp lệ
        allQuestions = data.filter(item => item.question && item.question !== ".");
        
        // Mở khóa nút Bắt đầu
        startBtn.innerText = "Bắt Đầu Làm Bài";
        startBtn.disabled = false;
    } catch (e) { 
        startBtn.innerText = "Lỗi kết nối. Hãy tải lại trang.";
        console.error(e);
    }
}

// 2. Thuật toán chọn 10 câu (Ưu tiên câu sai)
function generateQuiz() {
    currentQuizData = [];
    
    // Lấy tất cả câu sai lần trước (nếu có)
    let questionsPool = [...allQuestions];
    
    // Đưa câu sai vào danh sách làm bài trước (tối đa 10 câu)
    for (let i = 0; i < wrongQuestions.length && currentQuizData.length < 10; i++) {
        currentQuizData.push(wrongQuestions[i]);
        // Bỏ câu này khỏi Pool để không bị trùng
        questionsPool = questionsPool.filter(q => q.question !== wrongQuestions[i].question);
    }
    
    // Xáo trộn các câu còn lại
    questionsPool.sort(() => Math.random() - 0.5);
    
    // Lấp đầy cho đủ 10 câu
    let needed = 10 - currentQuizData.length;
    for (let i = 0; i < needed && i < questionsPool.length; i++) {
        currentQuizData.push(questionsPool[i]);
    }
    
    // Xáo trộn lần cuối để câu sai không luôn nằm ở đầu
    currentQuizData.sort(() => Math.random() - 0.5);
}

// 3. Hiển thị câu hỏi ra màn hình
function renderQuiz() {
    quizContainer.innerHTML = '';
    currentQuizData.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'quiz-item';
        div.innerHTML = `
            <div class="question">${index + 1}. ${item.question}</div>
            <div class="options">
                <label><input type="radio" name="q${index}" value="A"> A: ${item.a}</label>
                <label><input type="radio" name="q${index}" value="B"> B: ${item.b}</label>
                <label><input type="radio" name="q${index}" value="C"> C: ${item.c}</label>
                <label><input type="radio" name="q${index}" value="D"> D: ${item.d}</label>
            </div>
        `;
        quizContainer.appendChild(div);
    });
}

// 4. Xử lý thời gian (Đồng hồ đếm ngược)
function startTimer() {
    timeLeft = 15 * 60; // Đặt lại 15 phút
    timerInterval = setInterval(() => {
        timeLeft--;
        let minutes = Math.floor(timeLeft / 60);
        let seconds = timeLeft % 60;
        
        // Hiển thị dạng 15:00
        timeDisplay.innerText = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
        
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            submitQuiz(); // Hết giờ tự động nộp
            alert("Đã hết 15 phút! Hệ thống tự động nộp bài.");
        }
    }, 1000);
}

// 5. Xử lý Nộp bài & Chấm điểm
function submitQuiz() {
    clearInterval(timerInterval); // Dừng đồng hồ
    
    let score = 0;
    wrongQuestions = []; // Xóa danh sách câu sai cũ để cập nhật cái mới
    
    currentQuizData.forEach((item, index) => {
        const selected = document.querySelector(`input[name="q${index}"]:checked`);
        if (selected && selected.value === item.correct) {
            score++;
        } else {
            // Nếu sai hoặc không làm -> Thêm vào danh sách câu sai
            wrongQuestions.push(item); 
        }
    });
    
    // Chuyển màn hình
    quizScreen.style.display = 'none';
    resultScreen.style.display = 'block';
    
    document.getElementById('result').innerHTML = `
        Bạn làm đúng: ${score} / ${currentQuizData.length} câu.<br>
        ${wrongQuestions.length > 0 ? "<span style='color:red; font-size:0.8em;'>Bạn có " + wrongQuestions.length + " câu sai/chưa làm. Sẽ xuất hiện lại ở lần sau!</span>" : "<span style='color:green;'>Tuyệt vời! Bạn đã làm đúng hết!</span>"}
    `;
    // --- BẮT ĐẦU DÁN ĐOẠN CODE GỬI ĐIỂM VÀO ĐÂY ---
let tenHocSinhGhiNhan = document.getElementById("student-name").value;
let tongDiem = (score / currentQuizData.length) * 10; // Tính theo thang điểm 10

fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({
        ten: tenHocSinhGhiNhan,
        diem: tongDiem.toFixed(1), 
        soCau: score + "/" + currentQuizData.length
    })
}).then(res => console.log("Đã gửi điểm thành công!"))
  .catch(e => console.log("Lỗi gửi điểm: ", e));
}

// Bắt sự kiện các nút bấm
// Bắt sự kiện các nút bấm
startBtn.addEventListener('click', () => {
    
    // --- BẮT ĐẦU ĐOẠN CODE VỪA THÊM ---
    let tenHocSinh = document.getElementById("student-name").value;
    if (tenHocSinh.trim() === "") {
        alert("Em vui lòng nhập tên trước khi làm bài nhé!");
        return; // Dừng lại không cho làm bài nếu chưa nhập tên
    }
    // --- KẾT THÚC ĐOẠN CODE VỪA THÊM ---

    startScreen.style.display = 'none';
    resultScreen.style.display = 'none';
    quizScreen.style.display = 'block';

    generateQuiz();
    renderQuiz();
    startTimer();
});

document.getElementById('submit-btn').addEventListener('click', () => {
    if(confirm("Bạn có chắc chắn muốn nộp bài không?")) {
        submitQuiz();
    }
});

        // --- BẮT ĐẦU ĐOẠN CODE GỬI ĐIỂM VÀO ĐÂY ---
        let tenHocSinhGhiNhan = document.getElementById("student-name").value;
        let tongDiem = (score / 10) * 10; // Đổi sang thang điểm 10 (giả sử làm 10 câu)

        fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify({
                ten: tenHocSinhGhiNhan,
                diem: tongDiem, 
                soCau: score + "/10" 
            })
        }).then(res => console.log("Đã gửi điểm thành công!"))
          .catch(e => console.log("Lỗi gửi điểm: ", e));
        // --- KẾT THÚC ĐOẠN CODE GỬI ĐIỂM ---
    }
});

document.getElementById('restart-btn').addEventListener('click', () => {
    resultScreen.style.display = 'none';
    quizScreen.style.display = 'block';
    
    generateQuiz();
    renderQuiz();
    startTimer();
});

// Chạy hàm lấy dữ liệu ngay khi vừa mở web
loadData();
