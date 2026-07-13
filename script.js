const API_URL = "https://script.google.com/macros/s/AKfycbylxSJcSDg0PoJmwV-agQKF60cD4WmdhVWPD6vHbG3k2-9CBAkjZpvqSgSmbqYaoXoxwQ/exec";

let allQuizData = [];
let currentQuizData = [];
let timerInterval;
let correctCount = 0;
let wrongCount = 0;

// Đưa hàm này ra ngoài DOMContentLoaded để HTML có thể gọi được
window.updateTopicList = function() {
    const mon = document.getElementById('subject-select').value;
    const container = document.getElementById('topic-container');
    container.innerHTML = ''; 

    if (!mon) {
        container.innerHTML = '<p style="color: #888; font-size: 0.9em;">Hãy chọn môn trước...</p>';
        return;
    }

    // Tự động tìm tên cột chủ đề (kiểm tra cả "chủ đề" và "Chủ đề")
    const topics = [...new Set(allQuizData
        .filter(i => i.mon === mon)
        .map(i => i['chủ đề'] || i['Chủ đề'] || "Chủ đề khác"))];
    
    topics.forEach(topic => {
        container.innerHTML += `
            <label style="display: block; margin: 5px 0; cursor: pointer;">
                <input type="checkbox" name="topic" value="${topic}" checked> ${topic}
            </label>
        `;
    });
};

document.addEventListener('DOMContentLoaded', () => {
    
    function saveResult(name, subject, score) {
        let history = JSON.parse(localStorage.getItem('quizHistory')) || [];
        history.push({ name, subject, score, date: new Date().toLocaleString() });
        localStorage.setItem('quizHistory', JSON.stringify(history));
    }

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
                <tbody>`;
        
        top5.forEach((item, index) => {
            let medal = (index === 0) ? "🥇" : (index === 1) ? "🥈" : (index === 2) ? "🥉" : index + 1;
            html += `<tr>
                        <td style="padding: 8px; font-size: 1.2em;">${medal}</td>
                        <td style="padding: 8px;">${item.name}</td>
                        <td style="padding: 8px; font-weight: bold; color: #28a745;">${item.score}/10</td>
                    </tr>`;
        });
        
        document.getElementById('rank-list').innerHTML = html + '</tbody></table>';
        document.getElementById('rank-screen').style.display = 'block';

        document.getElementById('clear-history-btn').addEventListener('click', () => {
            if (confirm("Bạn có chắc muốn xóa sạch bảng xếp hạng?")) {
                localStorage.removeItem('quizHistory');
                document.getElementById('rank-screen').style.display = 'none';
            }
        });
    });

    document.getElementById('start-btn').addEventListener('click', () => {
        if (!document.getElementById("student-name").value.trim()) return alert("Nhập tên!");
        if (document.querySelectorAll('input[name="topic"]:checked').length === 0) return alert("Vui lòng chọn ít nhất 1 chủ đề!");
        
        document.getElementById('start-screen').style.display = 'none';
        document.getElementById('quiz-screen').style.display = 'block';
        generateQuiz();
        renderQuiz();
        startTimer();
    });

    document.getElementById('submit-btn').addEventListener('click', () => { if(confirm("Nộp bài?")) submitQuiz(); });
    document.getElementById('restart-btn').addEventListener('click', () => location.reload());

    function loadData() {
        const script = document.createElement('script');
        script.src = API_URL + "?callback=handleData";
        document.body.appendChild(script);
    }
    
    window.handleData = function(data) { allQuizData = data; };
    console.log("Dữ liệu nhận được:", data[0]);

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
    const selectedTopics = Array.from(document.querySelectorAll('input[name="topic"]:checked'))
                                .map(cb => cb.value);

    const filteredData = allQuizData.filter(item => {
        const itemTopic = item['chủ đề'] || item['Chủ đề'] || "Chủ đề khác";
        return item.mon === selectedSubject && selectedTopics.includes(itemTopic);
    });

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
        let isCorrect = (selectedValue === correctAnswer);
        
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
                if (val === correctAnswer) { l.style.backgroundColor = "#d4edda"; l.style.border = "1px solid #28a745"; }
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
