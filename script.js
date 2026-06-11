/* ================= LÓGICA DE METAS PERSONALIZÁVEIS ================= */
const defaultTasks = [
    { id: 'oracao', name: 'Tempo para oração' },
    { id: 'palavra', name: 'Leitura da Palavra' },
    { id: 'anotar', name: 'Anotação' },
    { id: 'renuncia', name: 'Renúncia / Sacrifício' },
    { id: 'intercessao', name: 'Intercessão pelo congresso' }
];

let tasksList = JSON.parse(localStorage.getItem('jejumCustomTasks')) || defaultTasks;
let totalTasks = 25 * tasksList.length;

const weeksConfig = [
    { title: 'SEMANA 1', startDay: 1, endDay: 7 },
    { title: 'SEMANA 2', startDay: 8, endDay: 14 },
    { title: 'SEMANA 3', startDay: 15, endDay: 21 },
    { title: 'SEMANA 4 (RETA FINAL)', startDay: 22, endDay: 25 }
];

function loadProgress() { 
    return JSON.parse(localStorage.getItem('jejumProgresso')) || {}; 
}

function saveProgress(data) { 
    localStorage.setItem('jejumProgresso', JSON.stringify(data)); 
    updateDashboard(data); 
}

/* ================= FUNÇÕES DO DASHBOARD E CARTÕES ================= */
function updateDashboard(data) {
    const percentEl = document.getElementById('global-percent');
    if (!percentEl) return; 

    let completedTasks = 0;
    for (let i = 1; i <= 25; i++) {
        tasksList.forEach(t => {
            if (data[`d${i}-${t.id}`]) completedTasks++;
        });
    }

    const percentage = Math.round((completedTasks / totalTasks) * 100) || 0;
    percentEl.innerText = percentage + '%';
    
    document.getElementById('global-bar').style.width = percentage + '%';
    document.getElementById('global-text').innerText = `${completedTasks} de ${totalTasks} atividades`;

    let fullDays = 0;
    for (let i = 1; i <= 25; i++) {
        let tasksDoneInDay = 0;
        tasksList.forEach(t => { if (data[`d${i}-${t.id}`]) tasksDoneInDay++; });
        if (tasksDoneInDay === tasksList.length) fullDays++;
    }
    
    document.getElementById('days-completed').innerText = fullDays;
}

function updateCardCounterAndStyle(day, data) {
    const counterEl = document.getElementById(`counter-d${day}`);
    if (!counterEl) return;

    let count = 0;
    tasksList.forEach(t => { if(data[`d${day}-${t.id}`]) count++; });
    counterEl.innerText = `${count}/${tasksList.length}`;
    
    const card = document.getElementById(`card-d${day}`);
    if(card) { count === tasksList.length ? card.classList.add('completed') : card.classList.remove('completed'); }
}

function renderJejumInterface() {
    const container = document.getElementById('weeks-container');
    if (!container) return; 

    const state = loadProgress();
    const verses = [ "Consagre ao Senhor tudo o que você faz, e os seus planos serão bem-sucedidos.", "Tudo posso naquele que me fortalece." ];
    document.getElementById('daily-verse').innerText = `"${verses[0]}"`;

    weeksConfig.forEach((week, index) => {
        const weekBtn = document.createElement('button');
        weekBtn.className = `week-btn ${index === 0 ? 'active' : ''}`;
        weekBtn.innerHTML = `${week.title} <span class="week-icon">▼</span>`;
        
        const weekContent = document.createElement('div');
        weekContent.className = `week-content ${index === 0 ? 'active' : ''}`;
        
        weekBtn.addEventListener('click', () => {
            weekBtn.classList.toggle('active');
            weekContent.classList.toggle('active');
        });

        for (let i = week.startDay; i <= week.endDay; i++) {
            const card = document.createElement('div');
            card.className = 'day-card';
            card.id = `card-d${i}`;
            
            let tasksHtml = tasksList.map(t => {
                const taskId = `d${i}-${t.id}`;
                return `<label class="task-label"><input type="checkbox" id="${taskId}" ${state[taskId] ? 'checked' : ''}><span class="task-text">${t.name}</span></label>`;
            }).join('');

            card.innerHTML = `<div class="day-header"><span>DIA ${i}</span><span class="progress-indicator" id="counter-d${i}">0/${tasksList.length}</span></div><div class="tasks-grid">${tasksHtml}</div>`;
            weekContent.appendChild(card);
        }
        container.appendChild(weekBtn);
        container.appendChild(weekContent);
        for (let i = week.startDay; i <= week.endDay; i++) updateCardCounterAndStyle(i, state);
    });
    updateDashboard(state);
}

document.addEventListener('change', (e) => {
    if (e.target.type === 'checkbox') {
        const state = loadProgress();
        state[e.target.id] = e.target.checked;
        saveProgress(state);
        const match = e.target.id.match(/d(\d+)-/);
        if (match) updateCardCounterAndStyle(match[1], state);
    }
});

/* ================= LÓGICA DO MODAL DE EDIÇÃO DE METAS ================= */
const editModal = document.getElementById('edit-modal');
const btnEditTasks = document.getElementById('btn-edit-tasks');
const btnCloseEditModal = document.getElementById('close-edit-modal');
const btnSaveEdit = document.getElementById('btn-save-edit');
const editTaskList = document.getElementById('edit-task-list');
const newTaskInput = document.getElementById('new-task-input');
const btnAddTask = document.getElementById('btn-add-task');
const btnRestoreDefaults = document.getElementById('btn-restore-defaults');

let tempTasksList = [];

function renderEditTasks() {
    if (!editTaskList) return;
    editTaskList.innerHTML = '';
    tempTasksList.forEach((task, index) => {
        const li = document.createElement('li');
        li.className = 'edit-task-item';
        li.innerHTML = `
            <span>${task.name}</span>
            <span class="delete-task-btn" onclick="removeTempTask(${index})">X</span>
        `;
        editTaskList.appendChild(li);
    });
}


window.removeTempTask = function(index) {
    tempTasksList.splice(index, 1);
    renderEditTasks();
};

// Botão Restaurar Padrões
if (btnRestoreDefaults) {
    btnRestoreDefaults.addEventListener('click', () => {
        const confirmRestore = confirm("Tem certeza que deseja apagar suas metas personalizadas e voltar para as 5 originais do congresso?");
        
        if (confirmRestore) {
            tempTasksList = JSON.parse(JSON.stringify(defaultTasks));
            renderEditTasks();
        }
    });
}

if (btnAddTask) {
    btnAddTask.addEventListener('click', () => {
        const val = newTaskInput.value.trim();
        if (val) {
            const newId = 'custom_' + Date.now();
            tempTasksList.push({ id: newId, name: val });
            newTaskInput.value = '';
            renderEditTasks();
        }
    });
}


if (btnEditTasks) {
    btnEditTasks.addEventListener('click', () => {
        
        tempTasksList = JSON.parse(JSON.stringify(tasksList)); 
        renderEditTasks();
        editModal.style.display = 'flex'; 
    });
}

if (btnCloseEditModal) {
    btnCloseEditModal.addEventListener('click', () => {
        editModal.style.display = 'none'; 
    });
}

if (btnSaveEdit) {
    btnSaveEdit.addEventListener('click', () => {
        tasksList = tempTasksList; 
        localStorage.setItem('jejumCustomTasks', JSON.stringify(tasksList));
        editModal.style.display = 'none'; 
        location.reload(); 
    });
}

/* ================= COMPARTILHAR NO WHATSAPP ================= */
const btnShare = document.getElementById('btn-share');
if (btnShare) {
    btnShare.addEventListener('click', () => {
        const state = loadProgress();
        let completedTasks = 0;
        for (let i = 1; i <= 25; i++) {
            tasksList.forEach(t => { if (state[`d${i}-${t.id}`]) completedTasks++; });
        }
        const percentage = Math.round((completedTasks / totalTasks) * 100) || 0;
        
        let fullDays = 0;
        for (let i = 1; i <= 25; i++) {
            let tasksDoneInDay = 0;
            tasksList.forEach(task => { if (state[`d${i}-${task.id}`]) tasksDoneInDay++; });
            if (tasksDoneInDay === tasksList.length) fullDays++;
        }
        
        const text = `🔥 Já completei *${percentage}%* do Jejum com Propósito! Foram *${fullDays} dias* completos. Bora buscar a Deus juntos! 🙌`;
        const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
        window.open(whatsappUrl, '_blank');
    });
}

/* Inicializa a página */
renderJejumInterface();