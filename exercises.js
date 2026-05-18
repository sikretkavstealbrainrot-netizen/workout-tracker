import { getUserData, saveUserData } from './storage.js';

export function getExercisesByMuscle(username) {
    const userData = getUserData(username);
    return userData?.exercisesByMuscle || {};
}

export function saveExercisesByMuscle(username, exercisesByMuscle) {
    const userData = getUserData(username);
    userData.exercisesByMuscle = exercisesByMuscle;
    saveUserData(username, userData);
}

export function getMuscleGroups(username) {
    const userData = getUserData(username);
    return userData?.muscleGroups || [];
}

export function saveMuscleGroups(username, groups) {
    const userData = getUserData(username);
    userData.muscleGroups = groups;
    saveUserData(username, userData);
}

export function addMuscleGroup(username, groupName) {
    const groups = getMuscleGroups(username);
    if (!groups.includes(groupName)) {
        groups.push(groupName);
        saveMuscleGroups(username, groups);
        const exercisesByMuscle = getExercisesByMuscle(username);
        exercisesByMuscle[groupName] = [];
        saveExercisesByMuscle(username, exercisesByMuscle);
    }
}

export function addExerciseToGroup(username, muscleGroup, exerciseName) {
    const exercisesByMuscle = getExercisesByMuscle(username);
    if (!exercisesByMuscle[muscleGroup]) {
        exercisesByMuscle[muscleGroup] = [];
    }
    if (!exercisesByMuscle[muscleGroup].includes(exerciseName)) {
        exercisesByMuscle[muscleGroup].push(exerciseName);
        saveExercisesByMuscle(username, exercisesByMuscle);
    }
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
    let names = [];
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
