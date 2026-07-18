let studentCode = "", currentSubject = "", allQuizData = [], userPermissions = [], currentQuizData = [];

window.loadData = function() {
    studentCode = document.getElementById('student-code').value.trim();
    if (!studentCode) return alert("Nhập mã học sinh!");
    const script = document.createElement('script');
    script.src = `https://script.google.com/macros/s/AKfycbwrNmZYpd3oMQrWxsTQg5lkhaSg7zVa-wN-xm5YRkoFGwUv36Za739HkHNQ5ZQOl4L3Cw/exec?ma=${encodeURIComponent(studentCode)}&callback=handleQuizData`;
    document.body.appendChild(script);
};

window.handleQuizData = function(data) {
    allQuizData = data.questions || [];
    userPermissions = data.permissions || [];
    document.getElementById('student-code').style.display = 'none';
    alert("Dữ liệu đã tải xong!");
    updateTopicList();
};

function updateTopicList() {
    const container = document.getElementById('topic-container');
    const topics = [...new Set(allQuizData.filter(i => i.mon === document.getElementById('subject-select').value).map(i => i.chuDe))];
    container.innerHTML = topics.map(topic => `<label><input type="checkbox" name="topic" value="${topic}"> ${topic}</label>`).join('');
}

window.startQuiz = function() {
    const selected = Array.from(document.querySelectorAll('input[name="topic"]:checked')).map(cb => cb.value);
    if (selected.length === 0) return alert("Chọn chủ đề!");
    
    currentQuizData = allQuizData.filter(i => selected.includes(i.chuDe)).sort(() => Math.random() - 0.5).slice(0, 20);
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('quiz-screen').style.display = 'block';
    renderQuiz();
};

function renderQuiz() {
    const quizContainer = document.getElementById('quiz');
    quizContainer.innerHTML = currentQuizData.map((item, i) => {
        const options = ['a','b','c','d'].map(key => 
            `<div class="option-box" style="padding:10px; border:1px solid #ccc; margin:5px; cursor:pointer;" 
                  data-ans="${item[key]}" data-correct="${item.correct}">
                  ${item[key]}
            </div>`).join('');
        return `<div class="quiz-card" style="margin-bottom:20px;"><div>Câu ${i+1}: ${item.question}</div>${options}</div>`;
    }).join('');

    // TỰ ĐỘNG GÁN SỰ KIỆN CLICK (Không cần sửa HTML)
    document.querySelectorAll('.option-box').forEach(box => {
        box.onclick = function() {
            if (this.parentElement.dataset.answered) return;
            this.parentElement.dataset.answered = "true";
            const isRight = this.dataset.ans.trim() === this.dataset.correct.trim();
            this.style.backgroundColor = isRight ? '#d4edda' : '#f8d7da';
            if (!isRight) {
                Array.from(this.parentElement.children).forEach(child => {
                    if (child.dataset.ans.trim() === this.dataset.correct.trim()) child.style.backgroundColor = '#d4edda';
                });
            }
        };
    });
}
