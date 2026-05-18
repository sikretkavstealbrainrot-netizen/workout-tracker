import { getData, saveData, setCurrentSession, clearSession } from './storage.js';

export function register(username, password) {
    const data = getData();
    if (data[username]) {
        return { success: false, error: 'Имя пользователя уже занято' };
    }
    if (username.length < 3 || password.length < 3) {
        return { success: false, error: 'Ник и пароль должны быть не менее 3 символов' };
    }
    
    const defaultMuscleGroups = ['Груди', 'Спина', 'Ноги', 'Сідниці', 'Плечі', 'Біцепс', 'Тріцепс', 'Прес'];
    const exercisesByMuscle = {};
    for (let g of defaultMuscleGroups) {
        exercisesByMuscle[g] = [];
    }
    exercisesByMuscle['Груди'] = ['Жим лёжа', 'Жим гантелей'];
    exercisesByMuscle['Спина'] = ['Тяга штанги', 'Подтягивания'];
    exercisesByMuscle['Ноги'] = ['Приседания', 'Выпады'];
    exercisesByMuscle['Сідниці'] = ['Румунська тяга', 'Ягодичный мост'];
    exercisesByMuscle['Плечі'] = ['Жим штанги стоя', 'Махи гантелями'];
    exercisesByMuscle['Біцепс'] = ['Подъём штанги на бицепс', 'Молотки'];
    exercisesByMuscle['Тріцепс'] = ['Французский жим', 'Разгибания на блоке'];
    exercisesByMuscle['Прес'] = ['Скручивания', 'Планка'];
    
    data[username] = {
        password: password,
        workouts: [],
        plan: {},
        bodyMeasures: [],
        exercisesByMuscle: exercisesByMuscle,
        muscleGroups: defaultMuscleGroups,
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
        setCurrentSession(username);
        return { success: true, username };
    }
    return { success: false, error: 'Неверное имя или пароль' };
}

export function logout() {
    clearSession();
}

export function checkSession() {
    const session = getCurrentSession();
    if (session && session.username) {
        const data = getData();
        if (data[session.username]) {
            return { success: true, username: session.username };
        }
        clearSession();
    }
    return { success: false };
}
