const tasksList = [
    { id: 'oracao', name: 'Tempo para oração' },
    { id: 'palavra', name: 'Leitura da Palavra' },
    { id: 'anotar', name: 'Anotar e Compartilhar' },
    { id: 'renuncia', name: 'Renúncia / Sacrifício' },
    { id: 'intercessao', name: 'Intercessão pelo congresso' }
];

const weeksConfig = [
    { title: 'SEMANA 1', startDay: 1, endDay: 7 },
    { title: 'SEMANA 2', startDay: 8, endDay: 14 },
    { title: 'SEMANA 3', startDay: 15, endDay: 21 },
    { title: 'SEMANA 4 (RETA FINAL)', startDay: 22, endDay: 25 }
];

// Lista de versículos para o painel (muda a cada dia ou recarregamento)
const verses = [
    { text: "Consagre ao Senhor tudo o que você faz, e os seus planos serão bem-sucedidos.", ref: "Provérbios 16:3" },
    { text: "Busquem, pois, em primeiro lugar o Reino de Deus e a sua justiça, e todas essas coisas lhes serão acrescentadas.", ref: "Mateus 6:33" },
    { text: "Tudo posso naquele que me fortalece.", ref: "Filipenses 4:13" },
    { text: "Deleite-se no Senhor, e ele atenderá aos desejos do seu coração.", ref: "Salmos 37:4" },
    { text: "O Senhor é a minha força e o meu escudo; nele o meu coração confia.", ref: "Salmos 28:7" }
];

const totalTasks = 25 * tasksList.length;
const container = document.getElementById('weeks-container');

function loadProgress() {
    const saved = localStorage.getItem('jejumProgresso');
    return saved ? JSON.parse(saved) : {};
}

function saveProgress(data) {
    localStorage.setItem('jejumProgresso', JSON.stringify(data));
    updateDashboard(data);
}

// Atualiza o Dashboard do topo
function updateDashboard(data) {
    // 1. Calcular Progresso Geral
    const completedTasks = Object.keys(data).filter(key => data[key] === true).length;
    const percentage = Math.round((completedTasks / totalTasks) * 100);
    
    document.getElementById('global-percent').innerText = percentage + '%';
    document.getElementById('global-bar').style.width = percentage + '%';
    document.getElementById('global-text').innerText = `${completedTasks} de 125 atividades`;

    // 2. Calcular Dias Completos
    let fullDays = 0;
    for (let i = 1; i <= 25; i++) {
        let tasksDoneInDay = 0;
        tasksList.forEach(task => {
            if (data[`d${i}-${task.id}`]) tasksDoneInDay++;
        });
        if (tasksDoneInDay === 5) fullDays++;
    }
    document.getElementById('days-completed').innerText = fullDays;
}

function updateCardCounterAndStyle(day, data) {
    let count = 0;
    tasksList.forEach(task => {
        if(data[`d${day}-${task.id}`]) count++;
    });
    
    document.getElementById(`counter-d${day}`).innerText = `${count}/5`;
    
    const card = document.getElementById(`card-d${day}`);
    if (count === 5) {
        card.classList.add('completed');
    } else {
        card.classList.remove('completed');
    }
}

function renderInterface() {
    const state = loadProgress();
    
    // Sortear Versículo Diário
    const randomVerse = verses[Math.floor(Math.random() * verses.length)];
    document.getElementById('daily-verse').innerText = `"${randomVerse.text}"`;
    document.getElementById('daily-ref').innerText = `— ${randomVerse.ref}`;

    weeksConfig.forEach((week, index) => {
        const weekBtn = document.createElement('button');
        weekBtn.className = 'week-btn';
        weekBtn.innerHTML = `${week.title} <span class="week-icon">▼</span>`;
        
        const weekContent = document.createElement('div');
        weekContent.className = 'week-content';
        
        if(index === 0) {
            weekBtn.classList.add('active');
            weekContent.classList.add('active');
        }

        weekBtn.addEventListener('click', () => {
            weekBtn.classList.toggle('active');
            weekContent.classList.toggle('active');
        });

        for (let i = week.startDay; i <= week.endDay; i++) {
            const card = document.createElement('div');
            card.className = 'day-card';
            card.id = `card-d${i}`;
            
            let tasksHtml = '';
            tasksList.forEach(task => {
                const taskId = `d${i}-${task.id}`;
                const isChecked = state[taskId] ? 'checked' : '';
                
                tasksHtml += `
                    <label class="task-label">
                        <input type="checkbox" id="${taskId}" ${isChecked}>
                        <span class="task-text">${task.name}</span>
                    </label>
                `;
            });

            card.innerHTML = `
                <div class="day-header">
                    <span>DIA ${i}</span>
                    <span class="progress-indicator" id="counter-d${i}">0/5</span>
                </div>
                <div class="tasks-grid">
                    ${tasksHtml}
                </div>
            `;
            
            weekContent.appendChild(card);
        }

        container.appendChild(weekBtn);
        container.appendChild(weekContent);
        
        for (let i = week.startDay; i <= week.endDay; i++) {
            updateCardCounterAndStyle(i, state);
        }
    });

    updateDashboard(state);
}

document.addEventListener('change', (e) => {
    if (e.target.type === 'checkbox') {
        const state = loadProgress();
        state[e.target.id] = e.target.checked;
        saveProgress(state);
        
        const dayMatch = e.target.id.match(/d(\d+)-/);
        if (dayMatch) {
            updateCardCounterAndStyle(dayMatch[1], state);
        }
    }
});

// Ação do Botão de Compartilhar
document.getElementById('btn-share').addEventListener('click', () => {
    const state = loadProgress();
    const completedTasks = Object.keys(state).filter(key => state[key] === true).length;
    const percentage = Math.round((completedTasks / totalTasks) * 100);
    
    let fullDays = 0;
    for (let i = 1; i <= 25; i++) {
        let tasksDoneInDay = 0;
        tasksList.forEach(task => { if (state[`d${i}-${task.id}`]) tasksDoneInDay++; });
        if (tasksDoneInDay === 5) fullDays++;
    }
    
    const text = `🔥 Já completei *${percentage}%* do Jejum com Propósito! Foram *${fullDays} dias* completos. Bora buscar a Deus juntos! 🙌`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
});

// Iniciar a aplicação
renderInterface();