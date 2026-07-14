const API_URL = "https://script.google.com/macros/s/AKfycbwrNmZYpd3oMQrWxsTQg5lkhaSg7zVa-wN-xm5YRkoFGwUv36Za739HkHNQ5ZQOl4L3Cw/exec";
let allQuizData = [], currentQuizData = [], correctCount = 0, wrongCount = 0, timerInterval;
let wrongDetails = []; // Lưu danh sách câu sai

async function loadData() {
    try {
        const response = await fetch(API_URL);
        allQuizData = await response.json();
        updateTopicList();
    } catch (e) { console.error("Lỗi dữ liệu:", e); }
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
    let timeLeft = 10 * 60; // 10 phút
    timerInterval = setInterval(() => {
        timeLeft--;
        let m = Math.floor(timeLeft / 60), s = timeLeft % 60;
        document.getElementById('timer-display').innerText = `${m}:${s < 10 ? '0' : ''}${s}`;
        if (timeLeft <= 0) { clearInterval(timerInterval); document.getElementById('submit-btn').click(); }
    }, 1000);
}

window.renderQuiz = function() {
    const quizDiv = document.getElementById('quiz');
    quizDiv.innerHTML = currentQuizData.map((item, i) => {
        let options = [{key:'a', value:item.a}, {key:'b', value:item.b}, {key:'c', value:item.c}, {key:'d', value:item.d}];
        for (let j = options.length - 1; j > 0; j--) {
            const k = Math.floor(Math.random() * (j + 1));
            [options[j], options[k]] = [options[k], options[j]];
        }
        return `<div class="quiz-card">
            <div class="question">Câu ${i+1}: ${item.question}</div>
            ${options.map(opt => `
                <label class="option-box">
                    <input type="radio" name="q${i}" value="${item.mon === 'Tiếng anh' ? opt.value : opt.key}" 
                    onchange="updateLiveStatus(${i}, this.value, this.parentElement)"> ${opt.value}
                </label>`).join('')}
        </div>`;
    }).join('');
};

window.updateLiveStatus = function(index, selectedValue, element) {
    let item = currentQuizData[index];
    if (item.answered) return; 
    item.answered = true;
    const isCorrect = String(selectedValue).trim().toLowerCase() === String(item.correct).trim().toLowerCase();
    if (isCorrect) {
        correctCount++;
        document.getElementById('count-correct').innerText = correctCount;
        element.style.backgroundColor = "#d4edda";
    } else {
        wrongCount++;
        document.getElementById('count-wrong').innerText = wrongCount;
        element.style.backgroundColor = "#f8d7da";
        wrongDetails.push({ chuDe: item.chuDe, cauHoi: item.question, dapAnDung: item.correct, dapAnSai: selectedValue });
    }
    element.closest('.quiz-card').querySelectorAll('.option-box').forEach(opt => opt.style.pointerEvents = "none");
};

window.loadRanking = async function() {
    const response = await fetch(API_URL + "?action=getRanking");
    const data = await response.json();
    document.getElementById('rank-list').innerHTML = data.sort((a, b) => b.diem - a.diem).slice(0, 5)
        .map((r, i) => `<div>${i==0?'🥇':i==1?'🥈':i==2?'🥉':''} <b>${r.ten}</b>: ${r.diem}</div>`).join('');
    document.getElementById('rank-screen').style.display = 'block';
};

window.resetRanking = async function() {
    let password = prompt("Nhập mật khẩu quản trị:");
    if (password) {
        let res = await fetch(API_URL + "?action=reset&pass=" + encodeURIComponent(password));
        alert(await res.text());
        document.getElementById('rank-screen').style.display = 'none';
    }
};

document.addEventListener('DOMContentLoaded', () => {
    loadData();
    document.getElementById('start-btn').addEventListener('click', () => {
        const mon = document.getElementById('subject-select').value;
        const name = document.getElementById("student-name").value.trim();
        if (!mon || !name) return alert("Vui lòng chọn môn và nhập tên!");
        document.getElementById('start-screen').style.display = 'none';
        document.getElementById('quiz-screen').style.display = 'block';
        const topics = Array.from(document.querySelectorAll('input[name="topic"]:checked')).map(cb => cb.value);
        currentQuizData = allQuizData.filter(i => i.mon === mon && topics.includes(i.chuDe)).sort(() => Math.random() - 0.5).slice(0, 20);
        renderQuiz(); startTimer();
    });
    document.getElementById('submit-btn').onclick = () => {
        clearInterval(timerInterval);
        const name = document.getElementById("student-name").value;
        fetch(API_URL, { method: 'POST', body: JSON.stringify({ ten: name, diem: correctCount, soCau: 20, mon: document.getElementById('subject-select').value, wrongDetails: wrongDetails }) });
        alert("Đã nộp bài!"); location.reload();
    };
});
