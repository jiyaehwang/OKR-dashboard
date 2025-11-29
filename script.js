// localStorage 키
const STORAGE_KEY = 'okr_dashboard_data';

// 전역 변수
let objectives = [];

// DOM 요소
const objectiveInput = document.getElementById('objectiveInput');
const deadlineInput = document.getElementById('deadlineInput');
const addObjectiveBtn = document.getElementById('addObjectiveBtn');
const objectivesContainer = document.getElementById('objectivesContainer');
const progressChart = document.getElementById('progressChart');

// 초기화
function init() {
    loadFromStorage();
    renderObjectives();
    renderProgressChart();
    setupEventListeners();
}

// 이벤트 리스너 설정
function setupEventListeners() {
    addObjectiveBtn.addEventListener('click', addObjective);
    objectiveInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addObjective();
        }
    });
}

// 날짜 포맷팅
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

// 남은 일수 계산
function getDaysLeft(deadline) {
    if (!deadline) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadlineDate = new Date(deadline);
    deadlineDate.setHours(0, 0, 0, 0);
    const diffTime = deadlineDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
}

// 목표 추가
function addObjective() {
    const title = objectiveInput.value.trim();
    const deadline = deadlineInput.value;
    
    if (!title) {
        alert('목표를 입력해주세요.');
        return;
    }

    const today = new Date();
    const createdDate = today.toISOString().split('T')[0];

    const newObjective = {
        id: Date.now().toString(),
        title: title,
        createdDate: createdDate,
        deadline: deadline || null,
        keyResults: [],
        completedCount: 0
    };

    objectives.push(newObjective);
    objectiveInput.value = '';
    deadlineInput.value = '';
    saveToStorage();
    renderObjectives();
    renderProgressChart();
}

// 목표 삭제
function deleteObjective(objectiveId) {
    if (confirm('정말 이 목표를 삭제하시겠습니까?')) {
        objectives = objectives.filter(obj => obj.id !== objectiveId);
        saveToStorage();
        renderObjectives();
        renderProgressChart();
    }
}

// Key Result 추가
function addKeyResult(objectiveId, inputElement) {
    const text = inputElement.value.trim();
    if (!text) {
        alert('세부 실천사항을 입력해주세요.');
        return;
    }

    const objective = objectives.find(obj => obj.id === objectiveId);
    if (objective) {
        const newKeyResult = {
            id: Date.now().toString(),
            text: text,
            completed: false
        };
        objective.keyResults.push(newKeyResult);
        inputElement.value = '';
        saveToStorage();
        renderObjectives();
        renderProgressChart();
    }
}

// Key Result 체크박스 토글
function toggleKeyResult(objectiveId, keyResultId) {
    const objective = objectives.find(obj => obj.id === objectiveId);
    if (objective) {
        const keyResult = objective.keyResults.find(kr => kr.id === keyResultId);
        if (keyResult) {
            keyResult.completed = !keyResult.completed;
            objective.completedCount = objective.keyResults.filter(kr => kr.completed).length;
            saveToStorage();
            renderObjectives();
            renderProgressChart();
        }
    }
}

// 달성률 계산
function calculateProgress(objective) {
    if (objective.keyResults.length === 0) return 0;
    return Math.round((objective.completedCount / objective.keyResults.length) * 100);
}

// Key Results 섹션 토글
function toggleKeyResults(objectiveId) {
    const section = document.getElementById(`key-results-${objectiveId}`);
    const button = document.querySelector(`[onclick="toggleKeyResults('${objectiveId}')"]`);
    
    if (section.classList.contains('expanded')) {
        section.classList.remove('expanded');
        button.textContent = '세부사항 보기';
    } else {
        section.classList.add('expanded');
        button.textContent = '세부사항 숨기기';
    }
}

// 목표 렌더링
function renderObjectives() {
    if (objectives.length === 0) {
        objectivesContainer.innerHTML = '<div class="empty-state">목표를 추가하여 시작하세요! 🎯</div>';
        return;
    }

    objectivesContainer.innerHTML = objectives.map(objective => {
        const progress = calculateProgress(objective);
        const createdDate = formatDate(objective.createdDate);
        const daysLeft = objective.deadline ? getDaysLeft(objective.deadline) : null;
        const deadlineText = objective.deadline ? formatDate(objective.deadline) : '마감일 미설정';
        
        // 진행률에 따라 색상 결정
        const progressColor = progress >= 70 ? 'purple' : 'orange';
        
        const keyResultsHTML = objective.keyResults.map(kr => `
            <li class="key-result-item ${kr.completed ? 'completed' : ''}">
                <input 
                    type="checkbox" 
                    class="key-result-checkbox" 
                    ${kr.completed ? 'checked' : ''}
                    onchange="toggleKeyResult('${objective.id}', '${kr.id}')"
                >
                <span class="key-result-text">${escapeHtml(kr.text)}</span>
            </li>
        `).join('');

        return `
            <div class="objective-card">
                <div class="objective-date">${createdDate}</div>
                <h3 class="objective-title">${escapeHtml(objective.title)}</h3>
                
                <div class="progress-info">
                    <span class="progress-text">Progress</span>
                    <span class="progress-percent">${progress}%</span>
                </div>
                <div class="progress-bar-container">
                    <div class="progress-bar ${progressColor}" style="width: ${progress}%"></div>
                </div>
                
                ${daysLeft !== null ? `
                    <div class="deadline-badge ${progressColor}">
                        ${daysLeft > 0 ? `${daysLeft} days left` : daysLeft === 0 ? 'Today' : `${Math.abs(daysLeft)} days overdue`}
                    </div>
                ` : ''}
                
                <div class="card-actions">
                    <button class="key-results-toggle" onclick="toggleKeyResults('${objective.id}')">
                        세부사항 보기
                    </button>
                    <button class="btn-delete" onclick="deleteObjective('${objective.id}')">삭제</button>
                </div>
                
                <div class="key-results-section" id="key-results-${objective.id}">
                    <div class="add-key-result-section">
                        <input 
                            type="text" 
                            class="key-result-input" 
                            placeholder="세부 실천사항을 입력하세요..."
                            onkeypress="if(event.key==='Enter') addKeyResult('${objective.id}', this)"
                        >
                        <button 
                            class="btn-add-kr" 
                            onclick="addKeyResult('${objective.id}', this.previousElementSibling)"
                        >
                            추가
                        </button>
                    </div>
                    <ul class="key-results-list">
                        ${keyResultsHTML || '<li style="color: #adb5bd; padding: 10px; font-size: 13px; text-align: center;">세부 실천사항이 없습니다.</li>'}
                    </ul>
                </div>
            </div>
        `;
    }).join('');
}

// 진행률 차트 렌더링
function renderProgressChart() {
    // 최근 7일간의 데이터 생성
    const today = new Date();
    const weekData = [];
    
    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        // 해당 날짜에 생성된 목표들의 평균 진행률 계산
        const dayObjectives = objectives.filter(obj => {
            const objDate = new Date(obj.createdDate).toISOString().split('T')[0];
            return objDate <= dateStr;
        });
        
        let totalProgress = 0;
        let count = 0;
        
        dayObjectives.forEach(obj => {
            const progress = calculateProgress(obj);
            totalProgress += progress;
            count++;
        });
        
        const avgProgress = count > 0 ? Math.round(totalProgress / count) : 0;
        weekData.push(avgProgress);
    }
    
    const maxValue = Math.max(...weekData, 1);
    
    progressChart.innerHTML = weekData.map((value, index) => {
        const height = maxValue > 0 ? (value / maxValue) * 100 : 0;
        return `
            <div class="chart-bar" style="height: ${height}%">
                <span class="chart-bar-value">${value}%</span>
            </div>
        `;
    }).join('');
}

// HTML 이스케이프 (XSS 방지)
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// localStorage에 저장
function saveToStorage() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(objectives));
    } catch (error) {
        console.error('저장 실패:', error);
    }
}

// localStorage에서 불러오기
function loadFromStorage() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            objectives = JSON.parse(stored);
            // completedCount 재계산
            objectives.forEach(obj => {
                obj.completedCount = obj.keyResults.filter(kr => kr.completed).length;
                // 기존 데이터에 createdDate가 없으면 추가
                if (!obj.createdDate) {
                    obj.createdDate = new Date().toISOString().split('T')[0];
                }
            });
        }
    } catch (error) {
        console.error('불러오기 실패:', error);
        objectives = [];
    }
}

// 전역 함수로 등록 (인라인 이벤트 핸들러용)
window.deleteObjective = deleteObjective;
window.addKeyResult = addKeyResult;
window.toggleKeyResult = toggleKeyResult;
window.toggleKeyResults = toggleKeyResults;

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', init);