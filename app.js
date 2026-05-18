import { getSession } from './storage.js';
import { login, register, logout as authLogout, checkSession } from './auth.js';
import { getWorkouts, addWorkout, updateWorkout, getLastWeightAndReps } from './workouts.js';
import { getMuscleGroups, addMuscleGroup } from './exercises.js';
import { getPlan, savePlan, getBodyMeasures, addBodyMeasure, deleteBodyMeasure } from './body.js';
import { getStatsForExercise } from './stats.js';
import { setUIContext, renderWorkoutsList, updateMuscleGroupsSelect, updateExerciseSelectByMuscle, renderMuscleGroups, renderFavoritesList, populateExerciseSelects } from './ui.js';
import { getPhotoBase64, formatDate, escapeHtml } from './utils.js';

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
const measureDate = document.getElementById('measureDate');
const measureChest = document.getElementById('measureChest');
const measureBicepsL = document.getElementById('measureBicepsL');
const measureBicepsR = document.getElementById('measureBicepsR');
const measureWaist = document.getElementById('measureWaist');
const measureThighL = document.getElementById('measureThighL');
const measureThighR = document.getElementById('measureThighR');

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
    renderPlanUI();
    renderBodyMeasuresUI();
    updateChart();
}

function addSetRow(weight = 0, reps = 8) {
    const div = document.createElement('div');
    div.className = 'set-row';
    div.innerHTML = `<div class="field"><label>Вес (кг)</label><input type="number" class="set-weight" value="${weight}" step="2.5"></div>
        <div class="field"><label>Повторы</label><input type="number" class="set-reps" value="${reps}"></div>
        <button type="button" class="remove-set-btn">✖ Удалить</button>`;
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
        if (!isNaN(weight) && !isNaN(reps)) sets.push({ weight, reps });
    }
    if (sets.length === 0) {
        workoutError.innerText = 'Добавьте хотя бы один подход';
        return;
    }
    let photoUrl = null;
    if (workoutPhoto.files.length > 0) {
        photoUrl = await getPhotoBase64(workoutPhoto.files[0]);
    }
    const workout = { exercise, muscleGroup, date, sets, photoUrl };
    if (currentEditIndex !== null) {
        const workouts = getWorkouts(currentUser);
        workouts[currentEditIndex] = workout;
        updateWorkout(currentUser, currentEditIndex, workout);
        currentEditIndex = null;
    } else {
        addWorkout(currentUser, workout);
    }
    resetWorkoutForm();
    refreshAll();
    workoutError.innerText = '';
}

function resetWorkoutForm() {
    workoutForm.classList.add('hidden');
    setsContainer.innerHTML = '';
    workoutPhoto.value = '';
    photoPreview.innerHTML = '';
    currentEditIndex = null;
    addSetRow();
    workoutMuscleGroup.value = '';
    workoutExerciseSelect.innerHTML = '<option value="">-- Сначала выберите группу --</option>';
    workoutDate.value = formatDate();
}

function openEditWorkout(index) {
    const workouts = getWorkouts(currentUser);
    const workout = workouts[index];
    currentEditIndex = index;
    workoutMuscleGroup.value = workout.muscleGroup;
    updateExerciseSelectByMuscle(workoutExerciseSelect, workout.muscleGroup);
    setTimeout(() => { workoutExerciseSelect.value = workout.exercise; }, 50);
    workoutDate.value = workout.date;
    setsContainer.innerHTML = '';
    workout.sets.forEach(set => addSetRow(set.weight, set.reps));
    if (workout.photoUrl) photoPreview.innerHTML = `<img src="${workout.photoUrl}" style="max-width:100px;">`;
    workoutForm.classList.remove('hidden');
}

function updateChart() {
    const exercise = statsExerciseSelect.value;
    if (!exercise) {
        statsNumbers.innerHTML = '<div>Выберите упражнение</div>';
        if (statsChart) statsChart.destroy();
        return;
    }
    const stats = getStatsForExercise(currentUser, exercise, currentPeriod);
    if (!stats) {
        statsNumbers.innerHTML = '<div>Нет данных</div>';
        if (statsChart) statsChart.destroy();
        return;
    }
    statsNumbers.innerHTML = `<div class="stat-item"><div class="stat-value">${stats.totalVolume}</div><div>Объём (кг)</div></div>
        <div class="stat-item"><div class="stat-value">${stats.maxAll}</div><div>Макс вес</div></div>
        <div class="stat-item"><div class="stat-value">${stats.avgWeight.toFixed(1)}</div><div>Ср. вес</div></div>
        <div class="stat-item"><div class="stat-value">${stats.totalSets}</div><div>Подходов</div></div>`;
    if (statsChart) statsChart.destroy();
    statsChart = new Chart(statsChartCanvas, {
        type: 'line',
        data: { labels: stats.labels, datasets: [{ label: `${exercise} - макс. вес`, data: stats.maxWeights, borderColor: '#3b82f6', fill: false }] }
    });
}

function renderPlanUI() {
    const plan = getPlan(currentUser);
    const days = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];
    weekPlanContainer.innerHTML = days.map(day => `<div class="week-plan-day"><strong>${day}</strong><br>${plan[day] || '— Отдых —'}</div>`).join('');
}

function openPlanEditor() {
    const plan = getPlan(currentUser);
    const days = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];
    planDaysEditor.innerHTML = days.map(day => `<div><label>${day}</label><input type="text" id="plan_${day}" value="${escapeHtml(plan[day] || '')}"></div>`).join('');
    planEditor.classList.remove('hidden');
}

function savePlanChanges() {
    const days = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];
    const newPlan = {};
    days.forEach(day => { newPlan[day] = document.getElementById(`plan_${day}`).value; });
    savePlan(currentUser, newPlan);
    planEditor.classList.add('hidden');
    renderPlanUI();
}

function renderBodyMeasuresUI() {
    const measures = getBodyMeasures(currentUser);
    if (!measures.length) {
        measuresHistory.innerHTML = '<div>Нет замеров</div>';
        return;
    }
    measuresHistory.innerHTML = measures.sort((a,b)=>new Date(b.date)-new Date(a.date)).map(m => `<div class="exercise-card"><div><b>${m.date}</b>: Груд. ${m.chest}см, Биц ${m.bicepsL}/${m.bicepsR}см, Тал. ${m.waist}см, Бедр ${m.thighL}/${m.thighR}см</div><button class="delete-measure" data-date="${m.date}">🗑️</button></div>`).join('');
    document.querySelectorAll('.delete-measure').forEach(btn => {
        btn.addEventListener('click', () => {
            deleteBodyMeasure(currentUser, btn.dataset.date);
            renderBodyMeasuresUI();
        });
    });
}

function saveBodyMeasure() {
    const date = measureDate.value;
    if (!date) { alert('Выберите дату'); return; }
    const measure = {
        date, chest: parseFloat(measureChest.value)||0, bicepsL: parseFloat(measureBicepsL.value)||0,
        bicepsR: parseFloat(measureBicepsR.value)||0, waist: parseFloat(measureWaist.value)||0,
        thighL: parseFloat(measureThighL.value)||0, thighR: parseFloat(measureThighR.value)||0
    };
    addBodyMeasure(currentUser, measure);
    measureForm.classList.add('hidden');
    renderBodyMeasuresUI();
}

function onLoginSuccess(username) {
    currentUser = username;
    setUIContext(currentUser, openEditWorkout);
    currentUserSpan.innerText = username;
    authPage.classList.add('hidden');
    appPage.classList.remove('hidden');
    workoutDate.value = formatDate();
    measureDate.value = formatDate();
    addSetRow();
    refreshAll();
    workoutMuscleGroup.addEventListener('change', () => updateExerciseSelectByMuscle(workoutExerciseSelect, workoutMuscleGroup.value));
}

function logout() {
    authLogout();
    currentUser = null;
    authPage.classList.remove('hidden');
    appPage.classList.add('hidden');
    if (statsChart) statsChart.destroy();
}

// СОБЫТИЯ
doLoginBtn.onclick = () => {
    const res = login(document.getElementById('loginUsername').value.trim(), document.getElementById('loginPassword').value);
    res.success ? onLoginSuccess(res.username) : authError.innerText = res.error;
};
doRegisterBtn.onclick = () => {
    const res = register(document.getElementById('regUsername').value.trim(), document.getElementById('regPassword').value);
    if (res.success) {
        regError.innerText = '✅ Аккаунт создан! Войдите.';
        loginTabBtn.click();
    } else regError.innerText = res.error;
};
logoutBtn.onclick = logout;
loginTabBtn.onclick = () => { loginForm.classList.remove('hidden'); registerForm.classList.add('hidden'); loginTabBtn.classList.add('active'); registerTabBtn.classList.remove('active'); };
registerTabBtn.onclick = () => { registerForm.classList.remove('hidden'); loginForm.classList.add('hidden'); registerTabBtn.classList.add('active'); loginTabBtn.classList.remove('active'); };
tabs.forEach(btn => btn.onclick = () => {
    for (let t in tabContents) document.getElementById(tabContents[t]).classList.add('hidden');
    document.getElementById(tabContents[btn.dataset.tab]).classList.remove('hidden');
    tabs.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
});
showWorkoutFormBtn.onclick = () => { resetWorkoutForm(); workoutForm.classList.remove('hidden'); };
addSetBtn.onclick = () => addSetRow();
saveWorkoutBtn.onclick = saveWorkout;
cancelWorkoutBtn.onclick = resetWorkoutForm;
periodBtns.forEach(b => b.onclick = () => {
    periodBtns.forEach(bb => bb.classList.remove('active'));
    b.classList.add('active');
    currentPeriod = b.dataset.period;
    updateChart();
});
statsExerciseSelect.onchange = updateChart;
editPlanBtn.onclick = openPlanEditor;
savePlanBtn.onclick = savePlanChanges;
cancelPlanBtn.onclick = () => planEditor.classList.add('hidden');
addMeasureBtn.onclick = () => measureForm.classList.remove('hidden');
saveMeasureBtn.onclick = saveBodyMeasure;
cancelMeasureBtn.onclick = () => measureForm.classList.add('hidden');
addGroupBtn.onclick = () => {
    const name = newGroupName.value.trim();
    if (name) {
        addMuscleGroup(currentUser, name);
        newGroupName.value = '';
        refreshAll();
        updateMuscleGroupsSelect(workoutMuscleGroup);
    } else alert('Введите название');
};
workoutPhoto.onchange = (e) => {
    if (e.target.files.length) {
        const reader = new FileReader();
        reader.onload = (ev) => photoPreview.innerHTML = `<img src="${ev.target.result}" style="max-width:100px;">`;
        reader.readAsDataURL(e.target.files[0]);
    } else photoPreview.innerHTML = '';
};

// СЕССИЯ
const sessionCheck = checkSession();
if (sessionCheck.success) onLoginSuccess(sessionCheck.username);
else { authPage.classList.remove('hidden'); appPage.classList.add('hidden'); }

if (window.Telegram?.WebApp) { window.Telegram.WebApp.ready(); window.Telegram.WebApp.expand(); }
