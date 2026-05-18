import { escapeHtml } from './utils.js';
import { getWorkouts, deleteWorkout } from './workouts.js';
import { getExercisesByMuscle, getMuscleGroups, getFavorites, toggleFavorite, addExerciseToGroup, getAllExerciseNames, getExerciseImage } from './exercises.js';

let currentUser = null;
let onEditCallback = null;

export function setUIContext(user, callback) {
    currentUser = user;
    onEditCallback = callback;
}

export function renderWorkoutsList(container, onRefresh) {
    const workouts = getWorkouts(currentUser);
    if (!workouts.length) {
        container.innerHTML = '<div class="form-card">Нет тренировок. Добавьте первую!</div>';
        return;
    }
    container.innerHTML = workouts.map((w, idx) => {
        const setsHtml = w.sets.map((s, i) => `<div>🔹 Подход ${i+1}: ${s.weight} кг × ${s.reps} повт</div>`).join('');
        const photoHtml = w.photoUrl ? `<div class="exercise-photo"><img src="${w.photoUrl}"></div>` : '';
        return `<div class="exercise-card">
            <div><strong>${escapeHtml(w.exercise)}</strong> 📅 ${w.date}</div>
            <div class="exercise-sets">${setsHtml}</div>
            ${photoHtml}
            <div><button class="edit-workout" data-idx="${idx}">✏️</button> <button class="delete-workout" data-idx="${idx}">🗑️</button></div>
        </div>`;
    }).join('');
    
    document.querySelectorAll('.edit-workout').forEach(btn => {
        btn.addEventListener('click', () => onEditCallback?.(parseInt(btn.dataset.idx)));
    });
    document.querySelectorAll('.delete-workout').forEach(btn => {
        btn.addEventListener('click', () => {
            if (confirm('Удалить?')) {
                deleteWorkout(currentUser, parseInt(btn.dataset.idx));
                onRefresh?.();
            }
        });
    });
}

export function updateMuscleGroupsSelect(select) {
    const groups = getMuscleGroups(currentUser);
    select.innerHTML = '<option value="">-- Выберите группу --</option>' + groups.map(g => `<option value="${escapeHtml(g)}">${escapeHtml(g)}</option>`).join('');
}

export function updateExerciseSelectByMuscle(select, muscleGroup) {
    const exercises = getExercisesByMuscle(currentUser);
    const list = exercises[muscleGroup] || [];
    select.innerHTML = '<option value="">-- Выберите упражнение --</option>' + list.map(ex => `<option value="${escapeHtml(ex)}">${escapeHtml(ex)}</option>`).join('');
}

export function renderMuscleGroups(container, onRefresh) {
    const groups = getMuscleGroups(currentUser);
    const byMuscle = getExercisesByMuscle(currentUser);
    const favs = getFavorites(currentUser);
    
    container.innerHTML = groups.map(muscle => {
        const exercises = byMuscle[muscle] || [];
        const exHtml = exercises.map(ex => `<div class="ex-item">
            <span>${escapeHtml(ex)}</span>
            <button class="favorite-star ${favs.includes(ex) ? 'active' : ''}" data-ex="${escapeHtml(ex)}">${favs.includes(ex) ? '★' : '☆'}</button>
        </div>`).join('');
        return `<div class="muscle-group">
            <div class="muscle-header" data-muscle="${muscle}">💪 ${escapeHtml(muscle)} <span>▼</span></div>
            <div class="muscle-exercises" id="muscle-${muscle.replace(/\s/g, '')}">
                ${exHtml || '<div>Нет упражнений</div>'}
                <div class="add-ex-to-group">
                    <input type="text" id="newEx-${muscle.replace(/\s/g, '')}" placeholder="Новое упражнение">
                    <button class="small-btn add-ex-btn" data-muscle="${muscle}">+ Добавить</button>
                </div>
            </div>
        </div>`;
    }).join('');
    
    document.querySelectorAll('.muscle-header').forEach(h => {
        h.addEventListener('click', () => {
            const id = `muscle-${h.dataset.muscle.replace(/\s/g, '')}`;
            document.getElementById(id).classList.toggle('show');
        });
    });
    document.querySelectorAll('.favorite-star').forEach(star => {
        star.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleFavorite(currentUser, star.dataset.ex);
            onRefresh?.();
        });
    });
    document.querySelectorAll('.add-ex-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const muscle = btn.dataset.muscle;
            const input = document.getElementById(`newEx-${muscle.replace(/\s/g, '')}`);
            const newEx = input.value.trim();
            if (newEx) {
                addExerciseToGroup(currentUser, muscle, newEx);
                input.value = '';
                onRefresh?.();
            }
        });
    });
}

export function renderFavoritesList(container) {
    const favs = getFavorites(currentUser);
    if (!favs.length) {
        container.innerHTML = '<div class="form-card">Нет избранных упражнений</div>';
        return;
    }
    container.innerHTML = favs.map(ex => `<div class="exercise-card"><div>⭐ ${escapeHtml(ex)}</div><button class="remove-fav" data-ex="${escapeHtml(ex)}">🗑️</button></div>`).join('');
    document.querySelectorAll('.remove-fav').forEach(btn => {
        btn.addEventListener('click', () => {
            toggleFavorite(currentUser, btn.dataset.ex);
            renderFavoritesList(container);
        });
    });
}

export function populateExerciseSelects(exerciseSelect, statsSelect) {
    const all = getAllExerciseNames(currentUser);
    const options = all.map(ex => `<option value="${escapeHtml(ex)}">${escapeHtml(ex)}</option>`).join('');
    if (exerciseSelect) exerciseSelect.innerHTML = options;
    if (statsSelect) statsSelect.innerHTML = options;
}
