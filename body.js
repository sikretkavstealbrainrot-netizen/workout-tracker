import { getUserData, saveUserData } from './storage.js';

export function getPlan(username) {
    const userData = getUserData(username);
    return userData?.plan || {};
}

export function savePlan(username, plan) {
    const userData = getUserData(username);
    userData.plan = plan;
    saveUserData(username, userData);
}

export function getBodyMeasures(username) {
    const userData = getUserData(username);
    return userData?.bodyMeasures || [];
}

export function saveBodyMeasures(username, measures) {
    const userData = getUserData(username);
    userData.bodyMeasures = measures;
    saveUserData(username, userData);
}

export function addBodyMeasure(username, measure) {
    const measures = getBodyMeasures(username);
    measures.push(measure);
    saveBodyMeasures(username, measures);
}

export function deleteBodyMeasure(username, date) {
    let measures = getBodyMeasures(username);
    measures = measures.filter(m => m.date !== date);
    saveBodyMeasures(username, measures);
}

export function renderPlan(container, username) {
    const plan = getPlan(username);
    const days = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];
    container.innerHTML = days.map(day => `<div class="week-plan-day"><strong>${day}</strong><br>${plan[day] || '— Отдых —'}</div>`).join('');
}
