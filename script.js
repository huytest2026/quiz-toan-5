const API_URL = "https://script.google.com/macros/s/AKfycbwrNmZYpd3oMQrWxsTQg5lkhaSg7zVa-wN-xm5YRkoFGwUv36Za739HkHNQ5ZQOl4L3Cw/exec";
let allQuizData = [], currentQuizData = [], correctCount = 0, wrongCount = 0, timerInterval;

async function loadData() {
    try {
        const response = await fetch(API_URL);
        allQuizData = await response.json();
        updateTopicList();
    } catch (e) { console.error("Lỗi tải dữ liệu:", e); }
}

window.updateTopicList = function() {
    const mon = document.getElementById('subject-select').value;
    const container = document.getElementById('topic-container');
    container.innerHTML = '';
    if (!mon) return;
    const topics = [...new Set(allQuizData.filter(i => i.mon === mon).map(i => i.chuDe))];
    topics.forEach(topic => {
        container.innerHTML += `<label style="display:block;"><input type="checkbox" name="topic" value="${topic}" checked> ${topic}</label>`;
    });
};

function startTimer() {
    let timeLeft = 15 * 60;
    timerInterval = setInterval(() => {
        timeLeft--;
        let m = Math.floor(timeLeft / 60), s = timeLeft % 60;
        document.getElementById('timer-display').innerText = `${m}:${s < 10 ? '0' : ''}${s}`;
        if (timeLeft <= 0) { clearInterval(timerInterval); document.getElementById('submit-btn').click(); }
    }, 1000);
}

window.renderQuiz = function() {
    const quizDiv = document.getElementById('quiz');
    quizDiv.innerHTML = currentQuizData.map((item, i) => `
        <div class="quiz-card">
            <div class="question">Câu ${i+1}: ${item.question}</div>
            ${['a','b','c','d'].map(key => `
                <label class="option-box">
                    <input type="radio" name="q${i}" value="${item.mon === 'Tiếng anh' ? item[key] : key}" 
                    onchange="updateLiveStatus(${i}, this.value, this.parentElement)"> 
                    ${item[key]}
                </label>
            `).join('')}
        </div>`).join('');
};

window.updateLiveStatus = function(index, selectedValue, element) {
    let item = currentQuizData[index];
    if (item.answered) return; 
    item.answered = true;

    const parentCard = element.closest('.quiz-card');
    const allOptions = parentCard.querySelectorAll('.option-box');
    const isCorrect = String(selectedValue).trim().toLowerCase() === String(item.correct).trim().toLowerCase();

    if (isCorrect) {
        correctCount++;
        document.getElementById('count-correct').innerText = correctCount;
        element.style.backgroundColor = "#d4edda";
        element.style.borderColor = "#28a745";
    } else {
        wrongCount++;
        document.getElementById('count-wrong').innerText = wrongCount;
        element.style.backgroundColor = "#f8d7da";
        element.style.borderColor = "#dc3545";
    }
    allOptions.forEach(opt => opt.style.pointerEvents = "none");
};

window.loadRanking = async function() {
    try {
        const response = await fetch(API_URL + "?action=getRanking");
        const data = await response.json();
        const list = document.getElementById('rank-list');
        
        const sortedData = data.sort((a, b) => b.diem - a.diem).slice(0, 5);
        list.innerHTML = sortedData.map((r, index) => {
            let medal = "";
            if (index === 0) medal = "🥇 ";
            else if (index === 1) medal = "🥈 ";
            else if (index === 2) medal = "🥉 ";
            return `<div style="margin-bottom: 8px;">${medal} <b>${r.ten}</b>: ${r.diem} điểm</div>`;
        }).join('');
            
        document.getElementById('rank-screen').style.display = 'block';
    } catch (e) { 
        console.error("Lỗi tải xếp hạng:", e);
        alert("Không thể tải bảng xếp hạng!"); 
    }
};

document.addEventListener('DOMContentLoaded', () => {
    loadData();
    document.getElementById('start-btn').addEventListener('click', () => {
        if (!document.getElementById("student-name").value.trim()) return alert("Nhập tên!");
        document.getElementById('start-screen').style.display = 'none';
        document.getElementById('quiz-screen').style.display = 'block';
        const mon = document.getElementById('subject-select').value;
        const topics = Array.from(document.querySelectorAll('input[name="topic"]:checked')).map(cb => cb.value);
        currentQuizData = allQuizData.filter(i => i.mon === mon && topics.includes(i.chuDe)).sort(() => Math.random() - 0.5).slice(0, 10);
        renderQuiz();
        startTimer();
    });

    document.getElementById('show-rank-btn').addEventListener('click', loadRanking);

    document.getElementById('submit-btn').onclick = () => {
        clearInterval(timerInterval);
        const name = document.getElementById("student-name").value;
        fetch(API_URL, { method: 'POST', body: JSON.stringify({ ten: name, diem: correctCount, soCau: 10, mon: document.getElementById('subject-select').value }) });
        document.getElementById('quiz-screen').style.display = 'none';
        document.getElementById('result-screen').style.display = 'block';
        document.getElementById('result').innerHTML = `<h3>Hoàn thành!</h3><p>Tên: ${name}</p><p>Điểm: <b>${correctCount}/10</b></p>`;
        document.getElementById('review-section').innerHTML = currentQuizData.map((q, i) => `<p>Câu ${i+1}: ${q.question} <br>Đáp án: <b>${q.correct}</b></p>`).join('');
    };

    document.getElementById('restart-btn').onclick = () => location.reload();
});
