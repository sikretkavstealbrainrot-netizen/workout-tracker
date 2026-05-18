import { escapeHtml } from './utils.js';
import { getWorkouts, deleteWorkout } from './workouts.js';
import { getExercisesByMuscle, getMuscleGroups, getFavorites, toggleFavorite, addExerciseToGroup, getAllExerciseNames, getExerciseImage } from './exercises.js';
import { getPlan, getBodyMeasures } from './body.js';

let currentUser = null;
let onEditCallback = null;

export function setUIContext(user, editCallback) {
    currentUser = user;
    onEditCallback = editCallback;
}

export async function renderWorkoutsList(container, onRefresh) {
    const workouts = getWorkouts(currentUser);
    if (!workouts.length) {
        container.innerHTML = '<div class="form-card">Нет тренировок. Добавьте первую!</div>';
        return;
    }
    container.innerHTML = workouts.map((w, idx) => {
        let setsHtml = w.sets.map((s, i) => `<div>🔹 Подход ${i+1}: ${s.weight} кг × ${s.reps} повт</div>`).join('');
        let photoHtml = w.photoUrl ? `<div class="exercise-photo"><img src="${w.photoUrl}" alt="фото"></div>` : '';
        return `<div class="exercise-card">
            <div class="exercise-info"><strong>${escapeHtml(w.exercise)}</strong> 📅 ${w.date}</div>
            <div class="exercise-sets">${setsHtml}</div>
            ${photoHtml}
            <div class="exercise-actions">
                <button class="edit-workout" data-idx="${idx}">✏️ Изменить</button>
                <button class="delete-workout" data-idx="${idx}">🗑️ Удалить</button>
            </div>
        </div>`;
    }).join('');
    
    document.querySelectorAll('.edit-workout').forEach(btn => {
        btn.addEventListener('click', () => {
            const idx = parseInt(btn.dataset.idx);
            if (onEditCallback) onEditCallback(idx);
        });
    });
    document.querySelectorAll('.delete-workout').forEach(btn => {
        btn.addEventListener('click', () => {
            const idx = parseInt(btn.dataset.idx);
            if (confirm('Удалить тренировку?')) {
                deleteWorkout(currentUser, idx);
                if (onRefresh) onRefresh();
            }
        });
    });
}

export function updateMuscleGroupsSelect(selectElement) {
    const groups = getMuscleGroups(currentUser);
    selectElement.innerHTML = '<option value="">-- Выберите группу --</option>' + 
        groups.map(g => `<option value="${escapeHtml(g)}">${escapeHtml(g)}</option>`).join('');
}

export function updateExerciseSelectByMuscle(selectElement, muscleGroup) {
    const exercises = getExercisesByMuscle(currentUser);
    const exercisesList = exercises[muscleGroup] || [];
    selectElement.innerHTML = '<option value="">-- Выберите упражнение --</option>' +
        exercisesList.map(ex => `<option value="${escapeHtml(ex)}">${escapeHtml(ex)}</option>`).join('');
}

export function renderMuscleGroups(container, onRefresh) {
    const groups = getMuscleGroups(currentUser);
    const byMuscle = getExercisesByMuscle(currentUser);
    const favs = getFavorites(currentUser);
    
    if (groups.length === 0) {
        container.innerHTML = '<div class="form-card">Нет групп мышц. Добавьте первую!</div>';
        return;
    }
    
    container.innerHTML = '';
    for (let muscle of groups) {
        const exercises = byMuscle[muscle] || [];
        const exHtml = exercises.map(ex => {
            const isFav = favs.includes(ex);
            const exerciseImage = getExerciseImage(currentUser, ex);
            return `<div class="ex-item">
                <span class="ex-name">${escapeHtml(ex)} ${exerciseImage ? '📷' : ''}</span>
                <button class="favorite-star ${isFav ? 'active' : ''}" data-ex="${escapeHtml(ex)}" title="${isFav ? 'Убрать из избранного' : 'Добавить в избранное'}">${isFav ? '★' : '☆'}</button>
            </div>`;
        }).join('');
        
        container.innerHTML += `<div class="muscle-group">
            <div class="muscle-header" data-muscle="${muscle}">
                <span>💪 ${escapeHtml(muscle)}</span>
                <span class="toggle-arrow">▼</span>
            </div>
            <div class="muscle-exercises" id="muscle-${muscle.replace(/\s/g, '')}">
                ${exHtml || '<div class="ex-item">Нет упражнений</div>'}
                <div class="add-ex-to-group">
                    <input type="text" placeholder="Название нового упражнения" id="newEx-${muscle.replace(/\s/g, '')}">
                    <button class="small-btn add-ex-btn" data-muscle="${muscle}">➕ Добавить</button>
                </div>
            </div>
        </div>`;
    }
    
    document.querySelectorAll('.muscle-header').forEach(header => {
        header.addEventListener('click', () => {
            const muscle = header.dataset.muscle;
            const div = document.getElementById(`muscle-${muscle.replace(/\s/g, '')}`);
            div.classList.toggle('show');
            const arrow = header.querySelector('.toggle-arrow');
            if (arrow) arrow.textContent = div.classList.contains('show') ? '▲' : '▼';
        });
    });
    
    document.querySelectorAll('.favorite-star').forEach(star => {
        star.addEventListener('click', (e) => {
            e.stopPropagation();
            const exName = star.dataset.ex;
            toggleFavorite(currentUser, exName);
            if (onRefresh) onRefresh();
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
                if (onRefresh) onRefresh();
            } else {
                alert('Введите название упражнения');
            }
        });
    });
}

export function renderFavoritesList(container) {
    const favs = getFavorites(currentUser);
    if (favs.length === 0) {
        container.innerHTML = '<div class="form-card">⭐ Нет избранных упражнений. Добавьте звезду в разделе "Группы мышц"</div>';
        return;
    }
    container.innerHTML = `<div class="exercises-grid">${favs.map(ex => `<div class="exercise-card"><div><strong>${escapeHtml(ex)}</strong></div><button class="remove-fav" data-ex="${escapeHtml(ex)}">🗑️ Убрать</button></div>`).join('')}</div>`;
    
    document.querySelectorAll('.remove-fav').forEach(btn => {
        btn.addEventListener('click', () => {
            const ex = btn.dataset.ex;
            toggleFavorite(currentUser, ex);
            renderFavoritesList(container);
        });
    });
}

export function populateExerciseSelects(exerciseSelect, statsSelect) {
    const allExercises = getAllExerciseNames(currentUser);
    const options = allExercises.map(ex => `<option value="${escapeHtml(ex)}">${escapeHtml(ex)}</option>`).join('');
    if (exerciseSelect) exerciseSelect.innerHTML = '<option value="">-- Выберите упражнение --</option>' + options;
    if (statsSelect) statsSelect.innerHTML = '<option value="">-- Выберите упражнение --</option>' + options;
}
