import { getData, saveData, setSession, clearSession } from './storage.js';

const DEFAULT_MUSCLE_GROUPS = ['Груди', 'Спина', 'Ноги', 'Сідниці', 'Плечі', 'Біцепс', 'Тріцепс', 'Прес'];

export function register(username, password) {
    const data = getData();
    if (data[username]) return { success: false, error: 'Имя уже занято' };
    if (username.length < 3 || password.length < 3) {
        return { success: false, error: 'Ник и пароль минимум 3 символа' };
    }
    
    const exercisesByMuscle = {};
    for (let g of DEFAULT_MUSCLE_GROUPS) {
        exercisesByMuscle[g] = [];
    }
    exercisesByMuscle['Груди'] = ['Жим лёжа', 'Жим гантелей'];
    exercisesByMuscle['Спина'] = ['Тяга штанги', 'Подтягивания'];
    exercisesByMuscle['Ноги'] = ['Приседания', 'Выпады'];
    exercisesByMuscle['Сідниці'] = ['Румунська тяга', 'Ягодичный мост'];
    exercisesByMuscle['Плечі'] = ['Жим штанги стоя', 'Махи гантелями'];
    exercisesByMuscle['Біцепс'] = ['Подъём штанги', 'Молотки'];
    exercisesByMuscle['Тріцепс'] = ['Французский жим', 'Разгибания'];
    exercisesByMuscle['Прес'] = ['Скручивания', 'Планка'];
    
    data[username] = {
        password: password,
        workouts: [],
        plan: {},
        bodyMeasures: [],
        exercisesByMuscle: exercisesByMuscle,
        muscleGroups: DEFAULT_MUSCLE_GROUPS,
        favorites: ['Жим лёжа', 'Приседания'],
        exerciseImages: {}
    };
    saveData(data);
    return { success: true };
}

export function login(username, password) {
    const data = getData();
    const user = data[username];
    if (user && user.password === password) {
        setSession(username);
        return { success: true, username };
    }
    return { success: false, error: 'Неверный логин или пароль' };
}

export function logout() {
    clearSession();
}

export function checkSession() {
    const session = getSession();
    if (session && session.username) {
        const data = getData();
        if (data[session.username]) {
            return { success: true, username: session.username };
        }
        clearSession();
    }
    return { success: false };
}
