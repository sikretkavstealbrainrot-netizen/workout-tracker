export function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, (m) => {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

export function getPhotoBase64(file) {
    return new Promise((resolve) => {
        if (!file) return resolve(null);
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => resolve(null);
    });
}

export function formatDate(date = new Date()) {
    return date.toISOString().slice(0, 10);
}

export function getLastSetForExercise(workouts, exerciseName) {
    const lastWorkout = [...workouts]
        .filter(w => w.exercise === exerciseName)
        .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
    if (lastWorkout && lastWorkout.sets.length > 0) {
        const lastSet = lastWorkout.sets[lastWorkout.sets.length - 1];
        return { weight: lastSet.weight, reps: lastSet.reps };
    }
    return { weight: 0, reps: 8 };
}
