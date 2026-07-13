const API_URL = "https://script.google.com/macros/s/AKfycbylxSJcSDg0PoJmwV-agQKF60cD4WmdhVWPD6vHbG3k2-9CBAkjZpvqSgSmbqYaoXoxwQ/exec";

let allQuizData = [];
let currentQuizData = [];
let timerInterval;
let correctCount = 0;
let wrongCount = 0;

document.addEventListener('DOMContentLoaded', () => {

    // --- CÁC HÀM XỬ LÝ ---
    function saveResult(name, subject, score) {
        let history = JSON.parse(localStorage.getItem('quizHistory')) || [];
        history.push({ name, subject, score, date: new Date().toLocaleString() });
        localStorage.setItem('quizHistory', JSON.stringify(history));
    }

    // --- GÁN SỰ KIỆN NÚT BẤM (ĐÃ CẬP NHẬT: HUY CHƯƠNG + XÓA LỊCH SỬ) ---
    document.getElementById('show-rank-btn').addEventListener('click', () => {
        let history = JSON.parse(localStorage.getItem('quizHistory')) || [];
        history.sort((a, b) => b.score - a.score);
        let top5 = history.slice(0, 5);
        
        let html = `
            <div style="margin-bottom: 10px; text-align: right;">
                <button id="clear-history-btn" style="padding: 5px 10px; cursor: pointer; background: #dc3545; color: white; border: none; border-radius: 4px; font-size: 0.8em;">Xóa lịch sử</button>
            </div>
            <table style="width:100%; border-collapse: collapse; margin-top: 10px; text-align: left;">
                <thead>
                    <tr style="border-bottom: 2px solid #eee;">
                        <th style="padding: 8px;">Hạng</th>
                        <th style="padding: 8px;">Tên</th>
                        <th style="padding: 8px;">Điểm</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        top5.forEach((item, index) => {
            let medal = "";
            if (index === 0) medal = "🥇";
            else if (index === 1) medal = "🥈";
            else if (index === 2) medal = "🥉";
            else medal = index + 1;

            html += `
                <tr style="border-bottom: 1px solid #f9f9f9;">
                    <td style="padding: 8px; font-size: 1.2em;">${medal}</td>
                    <td style="padding: 8px;">${item.name}</td>
                    <td style="padding: 8px; font-weight: bold; color: #28a745;">${item.score}/10</td>
                </tr>
            `;
        });
        
        html += '</tbody></table>';
        
        document.getElementById('rank-list').innerHTML = html;
        document.getElementById('rank-screen').style.display = 'block';

        // Gán sự kiện xóa dữ liệu
        document.getElementById('clear-history-btn').addEventListener('click', () => {
            if (confirm("Bạn có chắc muốn xóa sạch bảng xếp hạng?")) {
                localStorage.removeItem('quizHistory');
                document.getElementById('rank-screen').style.display = 'none';
                alert("Đã xóa dữ liệu!");
            }
        });
    });

    document.getElementById('start-btn').addEventListener('click', () => {
        if (!document.getElementById("student-name").value.trim()) return alert("Nhập tên!");
        document.getElementById('start-screen').style.display = 'none';
        document.getElementById('quiz-screen').style.display = 'block';
        generateQuiz();
        renderQuiz();
        startTimer();
    });

    document.getElementById('submit-btn').addEventListener('click', () => { if(confirm("Nộp bài?")) submitQuiz(); });
    document.getElementById('restart-btn').addEventListener('click', () => location.reload());

    // --- CÁC HÀM CƠ BẢN ---
    function loadData() {
        const script = document.createElement('script');
        script.src = API_URL + "?callback=handleData";
        document.body.appendChild(script);
    }
    
    window.handleData = function(data) { allQuizData = data; };

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
        currentQuizData.forEach(item => item.answered = false);
    }

    function renderQuiz() {
        const quizDiv = document.getElementById('quiz');
        quizDiv.innerHTML = '';
        currentQuizData.forEach((item, i) => {
            quizDiv.innerHTML += `
            <div class="quiz-card" style="margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 8px;">
                <div class="question" style="font-weight: bold; margin-bottom: 10px;">Câu ${i+1}: ${item.question}</div>
                <div class="options-grid">
                    ${['A','B','C','D'].map(opt => `
                        <label class="option-box" style="display: block; padding: 8px; margin: 5px 0; border: 1px solid #eee; cursor: pointer; border-radius: 4px;">
                            <input type="radio" name="q${i}" value="${opt}" onchange="updateLiveStatus(${i}, '${opt}')"> 
                            ${opt}: ${item[opt.toLowerCase()]}
                        </label>
                    `).join('')}
                </div>
            </div>`;
        });
    }

    window.updateLiveStatus = function(index, selectedValue) {
        let item = currentQuizData[index];
        if (item.answered) return; 

        item.answered = true;
        let correctAnswer = String(item.correct).trim().toUpperCase();
        let isCorrect = (["A","B","C","D"].includes(correctAnswer)) ? 
                        (selectedValue === correctAnswer) : 
                        (item[selectedValue.toLowerCase()].toUpperCase() === correctAnswer);
        
        const quizCards = document.querySelectorAll('.quiz-card');
        const labels = quizCards[index].querySelectorAll('label');

        if (isCorrect) {
            correctCount++;
            document.getElementById('count-correct').innerText = correctCount;
            labels.forEach(l => { if (l.querySelector('input').value === selectedValue) { l.style.backgroundColor = "#d4edda"; l.style.border = "1px solid #28a745"; }});
        } else {
            wrongCount++;
            document.getElementById('count-wrong').innerText = wrongCount;
            labels.forEach(l => {
                const val = l.querySelector('input').value;
                if (val === selectedValue) { l.style.backgroundColor = "#f8d7da"; l.style.border = "1px solid #dc3545"; }
                if (val === correctAnswer || l.innerText.includes(correctAnswer + ":")) { l.style.backgroundColor = "#d4edda"; l.style.border = "1px solid #28a745"; l.style.fontWeight = "bold"; }
            });
        }
        quizCards[index].querySelectorAll('input').forEach(input => input.disabled = true);
    };

    function submitQuiz() {
        clearInterval(timerInterval);
        const name = document.getElementById("student-name").value;
        const subject = document.getElementById('subject-select').value;
        saveResult(name, subject, correctCount);
        document.getElementById('quiz-screen').style.display = 'none';
        document.getElementById('result-screen').style.display = 'block';
        document.getElementById('result').innerHTML = `<h3>Kết quả của ${name}: ${correctCount}/10 câu đúng.</h3>`;
        fetch(API_URL, {
            method: "POST", mode: 'no-cors',
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ten: name, mon: subject, diem: correctCount })
        });
    }

    loadData();
});
