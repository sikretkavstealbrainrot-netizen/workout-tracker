import { getUserData, saveUserData } from './storage.js';
import { getLastSetForExercise } from './utils.js';

export function getWorkouts(username) {
    const userData = getUserData(username);
    return userData?.workouts || [];
}

export function saveWorkouts(username, workouts) {
    const userData = getUserData(username);
    userData.workouts = workouts;
    saveUserData(username, userData);
}

export function addWorkout(username, workout) {
    const workouts = getWorkouts(username);
    workouts.push(workout);
    saveWorkouts(username, workouts);
}

export function updateWorkout(username, index, workout) {
    const workouts = getWorkouts(username);
    workouts[index] = workout;
    saveWorkouts(username, workouts);
}

export function deleteWorkout(username, index) {
    const workouts = getWorkouts(username);
    workouts.splice(index, 1);
    saveWorkouts(username, workouts);
}

export function getLastWeightAndReps(username, exerciseName) {
    const workouts = getWorkouts(username);
    return getLastSetForExercise(workouts, exerciseName);
}
