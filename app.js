import { getCurrentSession, clearSession } from './storage.js';
import { login, register, logout as authLogout } from './auth.js';
import { getWorkouts, addWorkout, updateWorkout, getLastWeightAndReps } from './workouts.js';
import { getMuscleGroups, getAllExerciseNames, getExerciseImage, setExerciseImage } from './exercises.js';
import { getPlan, savePlan, getBodyMeasures, addBodyMeasure, deleteBodyMeasure, renderPlan } from './body.js';
import { getStatsForExercise } from './stats.js';
import { setUIContext, renderWorkoutsList, updateMuscleGroupsSelect, updateExerciseSelectByMuscle, renderMuscleGroups, renderFavoritesList, populateExerciseSelects } from './ui.js';
import { getPhotoBase64, formatDate } from './utils.js';

// DOM элементы
const authPage = document.getElementById('authPage');
const appPage = document.getElementById('appPage');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const loginTabBtn = document.getElementById('loginTabBtn');
const registerTabBtn = document.getElementById('registerTabBtn');
const doLoginBtn = document.getElementById('doLoginBtn');
const doRegisterBtn = document.getElementById('doRegisterBtn');
const authError = document.getElementById('authError');
const regError = document.getElementById('regError');
const logoutBtn = document.getElementById('logoutBtn');
const currentUserSpan = document.getElementById('currentUser');
const workoutsListDiv = document.getElementById('workoutsList');
const workoutForm = document.getElementById('workoutForm');
const showWorkoutFormBtn = document.getElementById('showWorkoutFormBtn');
const saveWorkoutBtn = document.getElementById('saveWorkoutBtn');
const cancelWorkoutBtn = document.getElementById('cancelWorkoutBtn');
const workoutMuscleGroup = document.getElementById('workoutMuscleGroup');
const workoutExerciseSelect = document.getElementById('workoutExerciseSelect');
const workoutDate = document.getElementById('workoutDate');
const setsContainer = document.getElementById('setsContainer');
const addSetBtn = document.getElementById('addSetBtn');
const workoutPhoto = document.getElementById('workoutPhoto');
const photoPreview = document.getElementById('photoPreview');
const workoutError = document.getElementById('workoutError');
const statsExerciseSelect = document.getElementById('statsExerciseSelect');
const periodBtns = document.querySelectorAll('.period-stats-btn');
const statsChartCanvas = document.getElementById('statsChart');
const statsNumbers = document.getElementById('statsNumbers');
const musclesContainer = document.getElementById('musclesContainer');
const addGroupBtn = document.getElementById('addGroupBtn');
const newGroupName = document.getElementById('newGroupName');
const favoritesList = document.getElementById('favoritesList');
const weekPlanContainer = document.getElementById('weekPlanContainer');
const editPlanBtn = document.getElementById('editPlanBtn');
const planEditor = document.getElementById('planEditor');
const planDaysEditor = document.getElementById('planDaysEditor');
const savePlanBtn = document.getElementById('savePlanBtn');
const cancelPlanBtn = document.getElementById('cancelPlanBtn');
const addMeasureBtn = document.getElementById('addMeasureBtn');
const measureForm = document.getElementById('measureForm');
const saveMeasureBtn = document.getElementById('saveMeasureBtn');
const cancelMeasureBtn = document.getElementById('cancelMeasureBtn');
const measuresHistory = document.getElementById('measuresHistory');

let currentUser = null;
let currentEditIndex = null;
let statsChart = null;
let currentPeriod = 'week';

const tabs = document.querySelectorAll('[data-tab]');
const tabContents = {
    exercises: 'tabExercises',
    stats: 'tabStats',
    plan: 'tabPlan',
    body: 'tabBody',
    muscles: 'tabMuscles',
    favorites: 'tabFavorites'
};

function refreshAll() {
    if (!currentUser) return;
    renderWorkoutsList(workoutsListDiv, () => refreshAll());
    renderMuscleGroups(musclesContainer, () => refreshAll());
    renderFavoritesList(favoritesList);
    populateExerciseSelects(workoutExerciseSelect, statsExerciseSelect);
    updateMuscleGroupsSelect(workoutMuscleGroup);
    if (workoutMuscleGroup.value) {
        updateExerciseSelectByMuscle(workoutExerciseSelect, workoutMuscleGroup.value);
    }
    renderPlan(weekPlanContainer, currentUser);
    renderBodyMeasures();
    updateChart();
}

function addSetRow(weight = 0, reps = 8) {
    const div = document.createElement('div');
    div.className = 'set-row';
    div.innerHTML = `
        <div class="field"><label>Вес (кг)</label><input type="number" class="set-weight" value="${weight}" step="2.5"></div>
        <div class="field"><label>Повторы</label><input type="number" class="set-reps" value="${reps}"></div>
        <button type="button" class="remove-set-btn">✖ Удалить</button>
    `;
    div.querySelector('.remove-set-btn').addEventListener('click', () => div.remove());
    setsContainer.appendChild(div);
}

async function saveWorkout() {
    const muscleGroup = workoutMuscleGroup.value;
    const exercise = workoutExerciseSelect.value;
    const date = workoutDate.value;
    
    if (!muscleGroup || !exercise || !date) {
        workoutError.innerText = 'Заполните все поля';
        return;
    }
    
    const setRows = document.querySelectorAll('#setsContainer .set-row');
    const sets = [];
    for (let row of setRows) {
        const weight = parseFloat(row.querySelector('.set-weight').value);
        const reps = parseInt(row.querySelector('.set-reps').value);
        if (!isNaN(weight) && !isNaN(reps)) {
            sets.push({ weight, reps });
        }
    }
    
    if (sets.length === 0) {
        workoutError.innerText = 'Добавьте хотя бы один подход';
        return;
    }
    
    let photoUrl = null;
    if (workoutPhoto.files.length > 0) {
        photoUrl = await getPhotoBase64(workoutPhoto.files[0]);
        if (photoUrl) {
            setExerciseImage(currentUser, exercise, photoUrl);
        }
    }
    
    const workout = { exercise, muscleGroup, date, sets, photoUrl };
    
    if (currentEditIndex !== null) {
        updateWorkout(currentUser, currentEditIndex, workout);
        currentEditIndex = null;
    } else {
        addWorkout(currentUser, workout);
    }
    
    resetWorkoutForm();
    refreshAll();
}

function resetWorkoutForm() {
    workoutForm.classList.add('hidden');
    setsContainer.innerHTML = '';
    workoutPhoto.value = '';
    photoPreview.innerHTML = '';
    workoutError.innerText = '';
    currentEditIndex = null;
    addSetRow();
}

function openEditWorkout(index) {
    const workouts = getWorkouts(currentUser);
    const workout = workouts[index];
    currentEditIndex = index;
    workoutMuscleGroup.value = workout.muscleGroup;
    updateExerciseSelectByMuscle(workoutExerciseSelect, workout.muscleGroup);
    setTimeout(() => {
        workoutExerciseSelect.value = workout.exercise;
    }, 10);
    workoutDate.value = workout.date;
    setsContainer.innerHTML = '';
    workout.sets.forEach(set => addSetRow(set.weight, set.reps));
    if (workout.photoUrl) {
        photoPreview.innerHTML = `<img src="${workout.photoUrl}" style="max-width:100px;">`;
    }
    workoutForm.classList.remove('hidden');
}

function updateChart() {
    const exercise = statsExerciseSelect.value;
    if (!exercise) return;
    
    const stats = getStatsForExercise(currentUser, exercise, currentPeriod);
    if (!stats || stats.dataLength === 0) {
        statsNumbers.innerHTML = '<div>Нет данных за период</div>';
        if (statsChart) statsChart.destroy();
        return;
    }
    
    statsNumbers.innerHTML = `
        <div class="stat-item"><div class="stat-value">${stats.totalVolume}</div><div>Объём (кг)</div></div>
        <div class="stat-item"><div class="stat-value">${stats.maxAll}</div><div>Макс вес (кг)</div></div>
        <div class="stat-item"><div class="stat-value">${stats.avgWeight.toFixed(1)}</div><div>Ср. вес (кг)</div></div>
        <div class="stat-item"><div class="stat-value">${stats.totalSets}</div><div>Всего подходов</div></div>
    `;
    
    if (statsChart) statsChart.destroy();
    statsChart = new Chart(statsChartCanvas, {
        type: 'line',
        data: {
            labels: stats.labels,
            datasets: [{
                label: `${exercise} - макс. вес (кг)`,
                data: stats.maxWeights,
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59,130,246,0.1)',
                fill: true,
                tension: 0.2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true
        }
    });
}

function renderBodyMeasures() {
    const measures = getBodyMeasures(currentUser);
    if (measures.length === 0) {
        measuresHistory.innerHTML = '<div>Нет замеров</div>';
        return;
    }
    measuresHistory.innerHTML = measures.sort((a, b) => new Date(b.date) - new Date(a.date)).map(m => `
        <div class="exercise-card">
            <div><b>${m.date}</b>: Груд. ${m.chest}см, Биц(л) ${m.bicepsL}см, Биц(п) ${m.bicepsR}см, Талия ${m.waist}см, Бедро(л) ${m.thighL}см, Бедро(п) ${m.thighR}см</div>
            <button class="delete-measure" data-date="${m.date}">🗑️</button>
        </div>
    `).join('');
    
    document.querySelectorAll('.delete-measure').forEach(btn => {
        btn.addEventListener('click', () => {
            deleteBodyMeasure(currentUser, btn.dataset.date);
            renderBodyMeasures();
        });
    });
}

function saveBodyMeasure() {
    const date = document.getElementById('measureDate').value;
    if (!date) return;
    const measure = {
        date,
        chest: parseFloat(document.getElementById('measureChest').value) || 0,
        bicepsL: parseFloat(document.getElementById('measureBicepsL').value) || 0,
        bicepsR: parseFloat(document.getElementById('measureBicepsR').value) || 0,
        waist: parseFloat(document.getElementById('measureWaist').value) || 0,
        thighL: parseFloat(document.getElementById('measureThighL').value) || 0,
        thighR: parseFloat(document.getElementById('measureThighR').value) || 0
    };
    addBodyMeasure(currentUser, measure);
    measureForm.classList.add('hidden');
    renderBodyMeasures();
}

function openPlanEditor() {
    const plan = getPlan(currentUser);
    const days = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];
    planDaysEditor.innerHTML = days.map(day => `
        <div><label>${day}</label><input type="text" id="plan_${day}" value="${plan[day] || ''}" placeholder="Группа мышц"></div>
    `).join('');
    planEditor.classList.remove('hidden');
}

function savePlanChanges() {
    const days = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];
    const newPlan = {};
    days.forEach(day => {
        newPlan[day] = document.getElementById(`plan_${day}`).value;
    });
    savePlan(currentUser, newPlan);
    planEditor.classList.add('hidden');
    renderPlan(weekPlanContainer, currentUser);
}

function onLoginSuccess(username) {
    currentUser = username;
    setUIContext(currentUser, openEditWorkout);
    currentUserSpan.innerText = username;
    authPage.classList.add('hidden');
    appPage.classList.remove('hidden');
    
    workoutDate.value = formatDate();
    document.getElementById('measureDate').value = formatDate();
    setsContainer.innerHTML = '';
    addSetRow();
    
    refreshAll();
    
    workoutMuscleGroup.addEventListener('change', () => {
        updateExerciseSelectByMuscle(workoutExerciseSelect, workoutMuscleGroup.value);
        const lastData = getLastWeightAndReps(currentUser, workoutExerciseSelect.value);
        if (lastData && setsContainer.children.length > 0) {
            const firstRow = setsContainer.children[0];
            firstRow.querySelector('.set-weight').value = lastData.weight;
            firstRow.querySelector('.set-reps').value = lastData.reps;
        }
    });
    
    workoutExerciseSelect.addEventListener('change', () => {
        const lastData = getLastWeightAndReps(currentUser, workoutExerciseSelect.value);
        if (lastData && setsContainer.children.length > 0) {
            const firstRow = setsContainer.children[0];
            firstRow.querySelector('.set-weight').value = lastData.weight;
            firstRow.querySelector('.set-reps').value = lastData.reps;
        }
    });
}

function logout() {
    authLogout();
    currentUser = null;
    authPage.classList.remove('hidden');
    appPage.classList.add('hidden');
}

// События
doLoginBtn.addEventListener('click', () => {
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    const res = login(username, password);
    if (res.success) {
        onLoginSuccess(username);
    } else {
        authError.innerText = res.error;
    }
});

doRegisterBtn.addEventListener('click', () => {
    const username = document.getElementById('regUsername').value.trim();
    const password = document.getElementById('regPassword').value;
    const res = register(username, password);
    if (res.success) {
        regError.innerText = '✅ Аккаунт создан! Теперь войдите.';
        loginTabBtn.click();
        document.getElementById('loginUsername').value = username;
    } else {
        regError.innerText = res.error;
    }
});

logoutBtn.addEventListener('click', logout);

loginTabBtn.addEventListener('click', () => {
    loginTabBtn.classList.add('active');
    registerTabBtn.classList.remove('active');
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
    authError.innerText = '';
    regError.innerText = '';
});

registerTabBtn.addEventListener('click', () => {
    registerTabBtn.classList.add('active');
    loginTabBtn.classList.remove('active');
    loginForm.classList.add('hidden');
    registerForm.classList.remove('hidden');
    authError.innerText = '';
    regError.innerText = '';
});

tabs.forEach(btn => {
    btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        for (let t in tabContents) {
            document.getElementById(tabContents[t]).classList.add('hidden');
        }
        document.getElementById(tabContents[tab]).classList.remove('hidden');
        tabs.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    });
});

showWorkoutFormBtn.addEventListener('click', () => {
    resetWorkoutForm();
    workoutForm.classList.remove('hidden');
});

addSetBtn.addEventListener('click', () => addSetRow());
saveWorkoutBtn.addEventListener('click', saveWorkout);
cancelWorkoutBtn.addEventListener('click', resetWorkoutForm);

periodBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        periodBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentPeriod = btn.dataset.period;
        updateChart();
    });
});

statsExerciseSelect.addEventListener('change', updateChart);
editPlanBtn.addEventListener('click', openPlanEditor);
savePlanBtn.addEventListener('click', savePlanChanges);
cancelPlanBtn.addEventListener('click', () => planEditor.classList.add('hidden'));
addMeasureBtn.addEventListener('click', () => measureForm.classList.remove('hidden'));
saveMeasureBtn.addEventListener('click', saveBodyMeasure);
cancelMeasureBtn.addEventListener('click', () => measureForm.classList.add('hidden'));

addGroupBtn.addEventListener('click', () => {
    const groupName = newGroupName.value.trim();
    if (groupName) {
        const { addMuscleGroup } = require('./exercises.js');
        addMuscleGroup(currentUser, groupName);
        newGroupName.value = '';
        refreshAll();
    }
});

workoutPhoto.addEventListener('change', (e) => {
    if (e.target.files.length) {
        const reader = new FileReader();
        reader.onload = (ev) => {
            photoPreview.innerHTML = `<img src="${ev.target.result}" style="max-width:100px;">`;
        };
        reader.readAsDataURL(e.target.files[0]);
    } else {
        photoPreview.innerHTML = '';
    }
});

// Проверка сохранённой сессии
const session = getCurrentSession();
if (session && session.username) {
    const userData = getUserData(session.username);
    if (userData) {
        onLoginSuccess(session.username);
    } else {
        clearSession();
        authPage.classList.remove('hidden');
        appPage.classList.add('hidden');
    }
} else {
    authPage.classList.remove('hidden');
    appPage.classList.add('hidden');
}

if (window.Telegram && window.Telegram.WebApp) {
    window.Telegram.WebApp.ready();
    window.Telegram.WebApp.expand();
}
