// Khai báo các biến toàn cục
let studentCode = "", currentSubject = "", allQuizData = [], userPermissions = [], currentQuizData = [];

// Hàm load dữ liệu
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
    alert("Dữ liệu đã sẵn sàng!");
    updateTopicList();
};

function updateTopicList() {
    const subjectSelect = document.getElementById('subject-select');
    const container = document.getElementById('topic-container');
    currentSubject = subjectSelect.value;
    const allowed = userPermissions.filter(p => String(p.maHS) === studentCode && p.mon === currentSubject).map(p => p.chuDe);
    const topics = [...new Set(allQuizData.filter(i => i.mon === currentSubject).map(i => i.chuDe))];
    
    container.innerHTML = topics.map(topic => `
        <label style="display:block; margin:5px 0; opacity:${allowed.includes(topic) ? '1' : '0.5'}">
            <input type="checkbox" name="topic" value="${topic}" ${allowed.includes(topic) ? 'checked' : 'disabled'}> ${topic}
        </label>`).join('');
}

window.startQuiz = function() {
    const selected = Array.from(document.querySelectorAll('input[name="topic"]:checked')).map(cb => cb.value);
    if (selected.length === 0) return alert("Chọn chủ đề trước!");
    
    currentQuizData = allQuizData.filter(i => i.mon === currentSubject && selected.includes(i.chuDe))
                                 .sort(() => Math.random() - 0.5).slice(0, 20);
    
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('quiz-screen').style.display = 'block';
    renderQuiz();
};

function renderQuiz() {
    const quizContainer = document.getElementById('quiz');
    quizContainer.innerHTML = currentQuizData.map((item, i) => {
        // Tạo các option và lưu đáp án đúng vào thuộc tính data
        const options = ['a','b','c','d'].map(key => 
            `<div class="option-box" style="padding:10px; border:1px solid #ccc; margin:5px; cursor:pointer;" 
                  data-ans="${item[key]}" data-correct="${item.correct}">
                  ${item[key]}
            </div>`).join('');
        return `<div class="quiz-card" style="margin-bottom:20px;"><div>Câu ${i+1}: ${item.question}</div>${options}</div>`;
    }).join('');

    // Gán sự kiện click cho tất cả các option sau khi đã render xong
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
            
            const counter = document.getElementById(isRight ? 'count-correct' : 'count-wrong');
            counter.innerText = parseInt(counter.innerText) + 1;
        };
    });
}
