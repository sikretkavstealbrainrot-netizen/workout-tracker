const STORAGE_KEY = 'fitness_pro_v3';

export function getData() {
    let d = localStorage.getItem(STORAGE_KEY);
    return d ? JSON.parse(d) : {};
}

export function saveData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getUserData(username) {
    const data = getData();
    return data[username] || null;
}

export function saveUserData(username, userData) {
    const data = getData();
    data[username] = userData;
    saveData(data);
}

export function getCurrentSession() {
    const session = localStorage.getItem('fitness_current_session');
    return session ? JSON.parse(session) : null;
}

export function setCurrentSession(username) {
    localStorage.setItem('fitness_current_session', JSON.stringify({ username, timestamp: Date.now() }));
}

export function clearSession() {
    localStorage.removeItem('fitness_current_session');
}
