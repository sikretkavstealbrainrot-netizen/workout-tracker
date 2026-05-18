const STORAGE_KEY = 'fitness_pro_v3';
const SESSION_KEY = 'fitness_current_session';

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
    const session = localStorage.getItem(SESSION_KEY);
    return session ? JSON.parse(session) : null;
}

export function setCurrentSession(username) {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ username, timestamp: Date.now() }));
}

export function clearSession() {
    localStorage.removeItem(SESSION_KEY);
}
