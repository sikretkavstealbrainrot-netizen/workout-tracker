import { getUserData, saveUserData } from './storage.js';

export function getMuscleGroups(username) {
    const userData = getUserData(username);
    return userData?.muscleGroups || [];
}

export function getExercisesByMuscle(username) {
    const userData = getUserData(username);
    return userData?.exercisesByMuscle || {};
}

export function saveExercisesByMuscle(username, data) {
    const userData = getUserData(username);
    userData.exercisesByMuscle = data;
    saveUserData(username, userData);
}

export function addMuscleGroup(username, groupName) {
    if (!groupName || groupName.trim() === '') return false;
    const groups = getMuscleGroups(username);
    if (!groups.includes(groupName)) {
        groups.push(groupName);
        const userData = getUserData(username);
        userData.muscleGroups = groups;
        userData.exercisesByMuscle[groupName] = [];
        saveUserData(username, userData);
        return true;
    }
    return false;
}

export function addExerciseToGroup(username, muscleGroup, exerciseName) {
    const exercises = getExercisesByMuscle(username);
    if (!exercises[muscleGroup]) exercises[muscleGroup] = [];
    if (!exercises[muscleGroup].includes(exerciseName)) {
        exercises[muscleGroup].push(exerciseName);
        saveExercisesByMuscle(username, exercises);
        return true;
    }
    return false;
}

export function getFavorites(username) {
    const userData = getUserData(username);
    return userData?.favorites || [];
}

export function toggleFavorite(username, exerciseName) {
    const userData = getUserData(username);
    let favs = userData.favorites || [];
    if (favs.includes(exerciseName)) {
        favs = favs.filter(f => f !== exerciseName);
    } else {
        favs.push(exerciseName);
    }
    userData.favorites = favs;
    saveUserData(username, userData);
    return favs;
}

export function getAllExerciseNames(username) {
    const byMuscle = getExercisesByMuscle(username);
    const names = [];
    for (let g in byMuscle) {
        names.push(...byMuscle[g]);
    }
    return [...new Set(names)];
}

export function getExerciseImage(username, exerciseName) {
    const userData = getUserData(username);
    return userData?.exerciseImages?.[exerciseName] || null;
}

export function setExerciseImage(username, exerciseName, imageUrl) {
    const userData = getUserData(username);
    if (!userData.exerciseImages) userData.exerciseImages = {};
    userData.exerciseImages[exerciseName] = imageUrl;
    saveUserData(username, userData);
}
