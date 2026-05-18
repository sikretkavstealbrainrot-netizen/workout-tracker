import { getWorkouts } from './workouts.js';

export function getStatsForExercise(username, exerciseName, period) {
    const workouts = getWorkouts(username);
    const filtered = workouts.filter(w => w.exercise === exerciseName);
    if (filtered.length === 0) return null;
    
    const now = new Date();
    let fromDate = new Date();
    if (period === 'week') fromDate.setDate(now.getDate() - 7);
    else if (period === 'month') fromDate.setMonth(now.getMonth() - 1);
    else fromDate.setFullYear(now.getFullYear() - 1);
    
    const data = filtered
        .filter(w => new Date(w.date) >= fromDate)
        .sort((a, b) => new Date(a.date) - new Date(b.date));
    
    if (data.length === 0) return null;
    
    const labels = data.map(d => d.date);
    const maxWeights = data.map(d => Math.max(...d.sets.map(s => s.weight)));
    const totalVolume = data.reduce((sum, d) => sum + d.sets.reduce((vol, s) => vol + s.weight * s.reps, 0), 0);
    const avgWeight = data.reduce((sum, d) => sum + d.sets.reduce((wsum, s) => wsum + s.weight, 0) / d.sets.length, 0) / data.length;
    const maxAll = Math.max(...data.flatMap(d => d.sets.map(s => s.weight)));
    const totalSets = data.reduce((sum, d) => sum + d.sets.length, 0);
    
    return { labels, maxWeights, totalVolume, avgWeight, maxAll, totalSets, dataLength: data.length };
}
