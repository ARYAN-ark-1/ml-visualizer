function getDistance(p1, p2) {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
}

module.exports = function* runHierarchical(rawPoints) {
    // Normalize points: handle both [x,y] arrays and {x,y} objects
    const points = rawPoints.map(p => Array.isArray(p) ? { x: p[0], y: p[1] } : p);

    // Initial state: Each point is a cluster
    let clusters = points.map((p, i) => ({
        id: i,
        points: [p],
        centroid: p,
        children: []
    }));

    yield { clusters, phase: 'initialization' };

    while (clusters.length > 1) {
        // Find closest pair
        let minDist = Infinity;
        let mergePair = [-1, -1];

        for (let i = 0; i < clusters.length; i++) {
            for (let j = i + 1; j < clusters.length; j++) {
                const dist = getDistance(clusters[i].centroid, clusters[j].centroid);
                if (dist < minDist) {
                    minDist = dist;
                    mergePair = [i, j];
                }
            }
        }

        const [idx1, idx2] = mergePair;
        const c1 = clusters[idx1];
        const c2 = clusters[idx2];

        // Merge
        const newCentroid = {
            x: (c1.centroid.x + c2.centroid.x) / 2,
            y: (c1.centroid.y + c2.centroid.y) / 2
        };

        const newCluster = {
            id: `merge_${c1.id}_${c2.id}`,
            points: [...c1.points, ...c2.points],
            centroid: newCentroid,
            children: [c1, c2]
        };

        // Remove old clusters and add new one
        clusters = clusters.filter((_, idx) => idx !== idx1 && idx !== idx2);
        clusters.push(newCluster);

        yield { clusters, phase: 'merge', merged: [c1.id, c2.id] };
    }

    yield {
        phase: 'complete',
        summary: {
            clusters: clusters.length,
            totalPoints: points.length
        }
    };
};
