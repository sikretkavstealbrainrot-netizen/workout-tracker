const STORAGE_KEY = 'fitness_pro_v4';
const SESSION_KEY = 'fitness_session';

export function getData() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {};
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

export function getSession() {
    const session = localStorage.getItem(SESSION_KEY);
    return session ? JSON.parse(session) : null;
}

export function setSession(username) {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ username, timestamp: Date.now() }));
}

export function clearSession() {
    localStorage.removeItem(SESSION_KEY);
}
