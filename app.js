// Simplified working version
const state = {
    tasks: JSON.parse(localStorage.getItem('tasks') || '[]'),
    theme: localStorage.getItem('theme') || 'light'
};

document.addEventListener('DOMContentLoaded', function() {
    // Theme
    document.documentElement.setAttribute('data-theme', state.theme);
    
    // Add task button
    document.getElementById('addTaskBtn').addEventListener('click', function() {
        const title = prompt('Enter task title:');
        if (title) {
            const task = {
                id: Date.now().toString(),
                title: title,
                completed: false,
                priority: 'medium',
                tags: [],
                subtasks: []
            };
            state.tasks.push(task);
            localStorage.setItem('tasks', JSON.stringify(state.tasks));
            renderTasks();
        }
    });
    
    // Theme button
    document.getElementById('themeBtn').addEventListener('click', function() {
        state.theme = state.theme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', state.theme);
        localStorage.setItem('theme', state.theme);
        this.querySelector('.material-icons').textContent = 
            state.theme === 'light' ? 'dark_mode' : 'light_mode';
    });
    
    renderTasks();
});

function renderTasks() {
    const activeTasks = state.tasks.filter(t => !t.completed);
    const completedTasks = state.tasks.filter(t => t.completed);
    
    document.getElementById('activeTasks').innerHTML = activeTasks.map(task => `
        <div class="task-card ${task.priority}-priority">
            <div class="task-header">
                <div class="task-checkbox" onclick="toggleTask('${task.id}')"></div>
                <div class="task-content">
                    <div class="task-title">${task.title}</div>
                </div>
            </div>
        </div>
    `).join('');
    
    document.getElementById('completedTasks').innerHTML = completedTasks.map(task => `
        <div class="task-card completed">
            <div class="task-header">
                <div class="task-checkbox checked" onclick="toggleTask('${task.id}')"></div>
                <div class="task-content">
                    <div class="task-title">${task.title}</div>
                </div>
            </div>
        </div>
    `).join('');
    
    document.getElementById('emptyState').classList.toggle('hidden', state.tasks.length > 0);
}

window.toggleTask = function(taskId) {
    const task = state.tasks.find(t => t.id === taskId);
    if (task) {
        task.completed = !task.completed;
        localStorage.setItem('tasks', JSON.stringify(state.tasks));
        renderTasks();
    }
};
