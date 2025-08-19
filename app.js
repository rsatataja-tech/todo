// App State
const state = {
    tasks: [],
    theme: 'light',
    sortBy: 'creation',
    notificationsEnabled: false,
    searchQuery: '',
    editingTaskId: null
};

// DOM Elements
const elements = {
    activeTasks: document.getElementById('activeTasks'),
    completedTasks: document.getElementById('completedTasks'),
    emptyState: document.getElementById('emptyState'),
    searchBar: document.getElementById('searchBar'),
    searchInput: document.getElementById('searchInput'),
    taskDialog: document.getElementById('taskDialog'),
    settingsDialog: document.getElementById('settingsDialog'),
    taskForm: document.getElementById('taskForm'),
    dialogTitle: document.getElementById('dialogTitle'),
    
    // Form fields
    taskTitle: document.getElementById('taskTitle'),
    taskDescription: document.getElementById('taskDescription'),
    taskDate: document.getElementById('taskDate'),
    taskTime: document.getElementById('taskTime'),
    taskPriority: document.getElementById('taskPriority'),
    tagInput: document.getElementById('tagInput'),
    tagList: document.getElementById('tagList'),
    subtaskList: document.getElementById('subtaskList'),
    recurringCheckbox: document.getElementById('recurringCheckbox'),
    recurringOptions: document.getElementById('recurringOptions'),
    recurringFrequency: document.getElementById('recurringFrequency'),
    frequencyOptions: document.getElementById('frequencyOptions'),
    
    // Buttons
    searchBtn: document.getElementById('searchBtn'),
    themeBtn: document.getElementById('themeBtn'),
    settingsBtn: document.getElementById('settingsBtn'),
    addTaskBtn: document.getElementById('addTaskBtn'),
    closeDialogBtn: document.getElementById('closeDialogBtn'),
    closeSearchBtn: document.getElementById('closeSearchBtn'),
    closeSettingsBtn: document.getElementById('closeSettingsBtn'),
    cancelBtn: document.getElementById('cancelBtn'),
    addSubtaskBtn: document.getElementById('addSubtaskBtn'),
    exportBtn: document.getElementById('exportBtn'),
    clearAllBtn: document.getElementById('clearAllBtn'),
    
    // Settings
    notificationsToggle: document.getElementById('notificationsToggle'),
    sortBy: document.getElementById('sortBy')
};

// Initialize App
function init() {
    loadState();
    setupEventListeners();
    updateTheme();
    renderTasks();
    checkNotificationPermission();
    setupServiceWorker();
}

// Load state from localStorage
function loadState() {
    const savedTasks = localStorage.getItem('tasks');
    const savedTheme = localStorage.getItem('theme');
    const savedSort = localStorage.getItem('sortBy');
    const savedNotifications = localStorage.getItem('notificationsEnabled');
    
    if (savedTasks) {
        state.tasks = JSON.parse(savedTasks);
    }
    if (savedTheme) {
        state.theme = savedTheme;
    }
    if (savedSort) {
        state.sortBy = savedSort;
        elements.sortBy.value = savedSort;
    }
    if (savedNotifications) {
        state.notificationsEnabled = savedNotifications === 'true';
        elements.notificationsToggle.checked = state.notificationsEnabled;
    }
}

// Save state to localStorage
function saveState() {
    localStorage.setItem('tasks', JSON.stringify(state.tasks));
    localStorage.setItem('theme', state.theme);
    localStorage.setItem('sortBy', state.sortBy);
    localStorage.setItem('notificationsEnabled', state.notificationsEnabled);
}

// Setup Event Listeners
function setupEventListeners() {
    // Header buttons
    elements.searchBtn.addEventListener('click', toggleSearch);
    elements.themeBtn.addEventListener('click', toggleTheme);
    elements.settingsBtn.addEventListener('click', () => showDialog(elements.settingsDialog));
    
    // Search
    elements.searchInput.addEventListener('input', handleSearch);
    elements.closeSearchBtn.addEventListener('click', toggleSearch);
    
    // Task dialog
    elements.addTaskBtn.addEventListener('click', () => openTaskDialog());
    elements.closeDialogBtn.addEventListener('click', () => hideDialog(elements.taskDialog));
    elements.cancelBtn.addEventListener('click', () => hideDialog(elements.taskDialog));
    elements.taskForm.addEventListener('submit', handleTaskSubmit);
    
    // Settings dialog
    elements.closeSettingsBtn.addEventListener('click', () => hideDialog(elements.settingsDialog));
    elements.notificationsToggle.addEventListener('change', handleNotificationToggle);
    elements.sortBy.addEventListener('change', handleSortChange);
    elements.exportBtn.addEventListener('click', exportTasks);
    elements.clearAllBtn.addEventListener('click', clearAllTasks);
    
    // Tags
    elements.tagInput.addEventListener('keypress', handleTagInput);
    
    // Subtasks
    elements.addSubtaskBtn.addEventListener('click', addSubtaskInput);
    
    // Recurring
    elements.recurringCheckbox.addEventListener('change', handleRecurringToggle);
    elements.recurringFrequency.addEventListener('change', updateFrequencyOptions);
    
    // Close dialogs on background click
    elements.taskDialog.addEventListener('click', (e) => {
        if (e.target === elements.taskDialog) {
            hideDialog(elements.taskDialog);
        }
    });
    
    elements.settingsDialog.addEventListener('click', (e) => {
        if (e.target === elements.settingsDialog) {
            hideDialog(elements.settingsDialog);
        }
    });
}

// Theme Management
function toggleTheme() {
    state.theme = state.theme === 'light' ? 'dark' : 'light';
    updateTheme();
    saveState();
}

function updateTheme() {
    document.documentElement.setAttribute('data-theme', state.theme);
    elements.themeBtn.querySelector('.material-icons').textContent = 
        state.theme === 'light' ? 'dark_mode' : 'light_mode';
}

// Search Functionality
function toggleSearch() {
    elements.searchBar.classList.toggle('hidden');
    if (!elements.searchBar.classList.contains('hidden')) {
        elements.searchInput.focus();
    } else {
        elements.searchInput.value = '';
        state.searchQuery = '';
        renderTasks();
    }
}

function handleSearch(e) {
    state.searchQuery = e.target.value.toLowerCase();
    renderTasks();
}

// Task Dialog
function openTaskDialog(taskId = null) {
    state.editingTaskId = taskId;
    
    if (taskId) {
        const task = state.tasks.find(t => t.id === taskId);
        if (task) {
            elements.dialogTitle.textContent = 'Edit Task';
            populateForm(task);
        }
    } else {
        elements.dialogTitle.textContent = 'Add Task';
        resetForm();
    }
    
    showDialog(elements.taskDialog);
}

function populateForm(task) {
    elements.taskTitle.value = task.title;
    elements.taskDescription.value = task.description || '';
    elements.taskDate.value = task.dueDate || '';
    elements.taskTime.value = task.dueTime || '';
    elements.taskPriority.value = task.priority;
    
    // Tags
    elements.tagList.innerHTML = '';
    task.tags.forEach(tag => addTagChip(tag));
    
    // Subtasks
    elements.subtaskList.innerHTML = '';
    task.subtasks.forEach(subtask => addSubtaskInput(subtask));
    
    // Recurring
    if (task.recurring) {
        elements.recurringCheckbox.checked = true;
        elements.recurringOptions.classList.remove('hidden');
        elements.recurringFrequency.value = task.recurring.frequency;
        updateFrequencyOptions();
        
        // Set recurring values based on frequency
        setTimeout(() => {
            if (task.recurring.frequency === 'minutes' || task.recurring.frequency === 'hours') {
                const preset = document.querySelector(`.preset-btn[data-value="${task.recurring.interval}"]`);
                if (preset) {
                    preset.click();
                } else {
                    document.getElementById('customInterval').value = task.recurring.interval;
                }
            } else if (task.recurring.frequency === 'days') {
                document.getElementById('daysInterval').value = task.recurring.interval;
            } else if (task.recurring.frequency === 'weeks') {
                document.getElementById('weeksInterval').value = task.recurring.interval;
                task.recurring.selectedDays.forEach(day => {
                    const dayBtn = document.querySelector(`.day-btn[data-day="${day}"]`);
                    if (dayBtn) dayBtn.classList.add('selected');
                });
            }
            // Add similar logic for monthly and yearly
        }, 100);
    }
}

function resetForm() {
    elements.taskForm.reset();
    elements.tagList.innerHTML = '';
    elements.subtaskList.innerHTML = '';
    elements.recurringOptions.classList.add('hidden');
}

// Form Submission
function handleTaskSubmit(e) {
    e.preventDefault();
    
    const taskData = {
        id: state.editingTaskId || generateId(),
        title: elements.taskTitle.value.trim(),
        description: elements.taskDescription.value.trim(),
        dueDate: elements.taskDate.value,
        dueTime: elements.taskTime.value,
        priority: elements.taskPriority.value,
        tags: getTagsFromForm(),
        subtasks: getSubtasksFromForm(),
        completed: false,
        createdAt: state.editingTaskId ? 
            state.tasks.find(t => t.id === state.editingTaskId).createdAt : 
            new Date().toISOString(),
        recurring: getRecurringData()
    };
    
    if (state.editingTaskId) {
        // Update existing task
        const index = state.tasks.findIndex(t => t.id === state.editingTaskId);
        if (index !== -1) {
            state.tasks[index] = { ...state.tasks[index], ...taskData };
        }
    } else {
        // Add new task
        state.tasks.push(taskData);
    }
    
    saveState();
    renderTasks();
    hideDialog(elements.taskDialog);
    
    // Schedule notification if needed
    if (taskData.dueDate && taskData.dueTime && state.notificationsEnabled) {
        scheduleNotification(taskData);
    }
    
    // Handle recurring task
    if (taskData.recurring && !state.editingTaskId) {
        scheduleNextRecurrence(taskData);
    }
}

// Tags Management
function handleTagInput(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        const tag = e.target.value.trim();
        if (tag) {
            addTagChip(tag);
            e.target.value = '';
        }
    }
}

function addTagChip(tag) {
    const chip = document.createElement('div');
    chip.className = 'tag-chip';
    chip.innerHTML = `
        ${tag}
        <span class="remove-tag" onclick="removeTag(this)">×</span>
    `;
    elements.tagList.appendChild(chip);
}

function removeTag(element) {
    element.parentElement.remove();
}

function getTagsFromForm() {
    return Array.from(elements.tagList.querySelectorAll('.tag-chip'))
        .map(chip => chip.textContent.trim().slice(0, -1));
}

// Subtasks Management
function addSubtaskInput(subtask = null) {
    const div = document.createElement('div');
    div.className = 'subtask-input-group';
    div.innerHTML = `
        <input type="text" placeholder="Subtask" value="${subtask ? subtask.title : ''}" data-completed="${subtask ? subtask.completed : false}">
        <button type="button" class="icon-btn" onclick="removeSubtask(this)">
            <span class="material-icons">close</span>
        </button>
    `;
    elements.subtaskList.appendChild(div);
}

function removeSubtask(element) {
    element.parentElement.remove();
}

function getSubtasksFromForm() {
    return Array.from(elements.subtaskList.querySelectorAll('input'))
        .map(input => ({
            id: generateId(),
            title: input.value.trim(),
            completed: input.dataset.completed === 'true'
        }))
        .filter(subtask => subtask.title);
}

// Recurring Tasks
function handleRecurringToggle(e) {
    if (e.target.checked) {
        elements.recurringOptions.classList.remove('hidden');
        updateFrequencyOptions();
    } else {
        elements.recurringOptions.classList.add('hidden');
    }
}

function updateFrequencyOptions() {
    const frequency = elements.recurringFrequency.value;
    let optionsHTML = '';
    
    switch(frequency) {
        case 'minutes':
        case 'hours':
            const unit = frequency === 'minutes' ? 'min' : 'hour';
            const presets = frequency === 'minutes' ? 
                [1, 2, 5, 10, 15, 30, 60] : 
                [1, 2, 3, 6, 12, 24];
            
            optionsHTML = `
                <div class="preset-buttons">
                    ${presets.map(val => `
                        <button type="button" class="preset-btn" data-value="${val}">
                            Every ${val} ${unit}${val > 1 ? 's' : ''}
                        </button>
                    `).join('')}
                </div>
                <div class="form-group">
                    <label for="customInterval">Custom interval</label>
                    <input type="number" id="customInterval" min="1" placeholder="Enter value">
                </div>
            `;
            break;
            
        case 'days':
            optionsHTML = `
                <div class="form-group">
                    <label for="daysInterval">Every X days</label>
                    <input type="number" id="daysInterval" min="1" value="1">
                </div>
            `;
            break;
            
        case 'weeks':
            optionsHTML = `
                <div class="form-group">
                    <label for="weeksInterval">Every X weeks</label>
                    <input type="number" id="weeksInterval" min="1" value="1">
                </div>
                <div class="form-group">
                    <label>Select days</label>
                    <div class="day-selector">
                        <button type="button" class="day-btn" data-day="0" title="Sunday">S</button>
                        <button type="button" class="day-btn" data-day="1" title="Monday">M</button>
                        <button type="button" class="day-btn" data-day="2" title="Tuesday">T</button>
                        <button type="button" class="day-btn" data-day="3" title="Wednesday">W</button>
                        <button type="button" class="day-btn" data-day="4" title="Thursday">T</button>
                        <button type="button" class="day-btn" data-day="5" title="Friday">F</button>
                        <button type="button" class="day-btn" data-day="6" title="Saturday">S</button>
                    </div>
                </div>
            `;
            break;
            
        case 'monthly':
            optionsHTML = `
                <div class="form-group">
                    <label for="monthsInterval">Every X months</label>
                    <input type="number" id="monthsInterval" min="1" value="1">
                </div>
                <div class="form-group">
                    <label for="monthDay">On day</label>
                    <select id="monthDay">
                        <option value="1">1st</option>
                        <option value="15">15th</option>
                        <option value="last">Last day</option>
                    </select>
                </div>
            `;
            break;
            
        case 'yearly':
            optionsHTML = `
                <div class="form-group">
                    <label for="yearsInterval">Every X years</label>
                    <input type="number" id="yearsInterval" min="1" value="1">
                </div>
            `;
            break;
    }
    
    elements.frequencyOptions.innerHTML = optionsHTML;
    
    // Add event listeners to new elements
    if (frequency === 'minutes' || frequency === 'hours') {
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                document.getElementById('customInterval').value = '';
            });
        });
        
        document.getElementById('customInterval')?.addEventListener('input', function() {
            document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
        });
    }
    
    if (frequency === 'weeks') {
        document.querySelectorAll('.day-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                this.classList.toggle('selected');
            });
        });
    }
}

function getRecurringData() {
    if (!elements.recurringCheckbox.checked) return null;
    
    const frequency = elements.recurringFrequency.value;
    let interval = 1;
    let selectedDays = [];
    
    switch(frequency) {
        case 'minutes':
        case 'hours':
            const activePreset = document.querySelector('.preset-btn.active');
            if (activePreset) {
                interval = parseInt(activePreset.dataset.value);
            } else {
                const custom = document.getElementById('customInterval');
                interval = custom.value ? parseInt(custom.value) : 1;
            }
            break;
            
        case 'days':
            interval = parseInt(document.getElementById('daysInterval').value) || 1;
            break;
            
        case 'weeks':
            interval = parseInt(document.getElementById('weeksInterval').value) || 1;
            selectedDays = Array.from(document.querySelectorAll('.day-btn.selected'))
                .map(btn => parseInt(btn.dataset.day));
            break;
            
        case 'monthly':
            interval = parseInt(document.getElementById('monthsInterval').value) || 1;
            break;
            
        case 'yearly':
            interval = parseInt(document.getElementById('yearsInterval').value) || 1;
            break;
    }
    
    return {
        frequency,
        interval,
        selectedDays,
        lastCompleted: null
    };
}

// Task Rendering
function renderTasks() {
    const activeTasks = [];
    const completedTasks = [];
    
    // Filter and sort tasks
    let filteredTasks = state.tasks;
    if (state.searchQuery) {
        filteredTasks = state.tasks.filter(task => 
            task.title.toLowerCase().includes(state.searchQuery) ||
            (task.description && task.description.toLowerCase().includes(state.searchQuery)) ||
            task.tags.some(tag => tag.toLowerCase().includes(state.searchQuery))
        );
    }
    
    // Sort tasks
    filteredTasks.sort((a, b) => {
        switch(state.sortBy) {
            case 'dueDate':
                if (!a.dueDate) return 1;
                if (!b.dueDate) return -1;
                return new Date(a.dueDate + ' ' + (a.dueTime || '00:00')) - 
                       new Date(b.dueDate + ' ' + (b.dueTime || '00:00'));
            case 'priority':
                const priorityOrder = { high: 0, medium: 1, low: 2 };
                return priorityOrder[a.priority] - priorityOrder[b.priority];
            case 'alphabetical':
                return a.title.localeCompare(b.title);
            default: // creation
                return new Date(b.createdAt) - new Date(a.createdAt);
        }
    });
    
    // Separate active and completed
    filteredTasks.forEach(task => {
        if (task.completed) {
            completedTasks.push(task);
        } else {
            activeTasks.push(task);
        }
    });
    
    // Render tasks
    elements.activeTasks.innerHTML = activeTasks.map(task => createTaskCard(task)).join('');
    elements.completedTasks.innerHTML = completedTasks.map(task => createTaskCard(task)).join('');
    
    // Show/hide empty state
    elements.emptyState.classList.toggle('hidden', state.tasks.length > 0);
    
    // Add swipe listeners
    setupSwipeGestures();
}

function createTaskCar
