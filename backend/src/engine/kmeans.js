// Real K-Means Implementation
// Calculates Euclidean distance and updates centroids until convergence

function getDistance(p1, p2) {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
}

function getCentroid(clusterPoints) {
    if (clusterPoints.length === 0) return null;
    let sumX = 0, sumY = 0;
    clusterPoints.forEach(p => { sumX += p.x; sumY += p.y; });
    return { x: sumX / clusterPoints.length, y: sumY / clusterPoints.length };
}

module.exports = function* runKMeans(rawPoints, params = { k: 3 }) {
    // Normalize points: handle both [x,y] arrays and {x,y} objects
    const points = rawPoints.map(p => Array.isArray(p) ? { x: p[0], y: p[1] } : p);

    const k = Math.min(params.k || 3, points.length);
    let iterations = 0;
    const maxIterations = 20;

    // Step 1: Initialize Centroids (Randomly pick k points)
    // We shuffle a copy of points to pick random initial centroids
    const shuffled = [...points].sort(() => 0.5 - Math.random());
    let centroids = shuffled.slice(0, k).map((p, i) => ({ ...p, id: i, isCentroid: true }));

    yield { points, centroids, phase: 'initialization' };

    let hasConverged = false;

    while (!hasConverged && iterations < maxIterations) {
        iterations++;
        hasConverged = true;

        // Step 2: Assign points to nearest centroid
        const assignments = points.map(point => {
            let minDist = Infinity;
            let clusterIndex = -1;

            centroids.forEach((centroid, index) => {
                const dist = getDistance(point, centroid);
                if (dist < minDist) {
                    minDist = dist;
                    clusterIndex = index;
                }
            });

            return { ...point, cluster: clusterIndex };
        });

        yield { points: assignments, centroids, phase: 'assignment' };

        // Step 3: Update Centroids
        const newCentroids = centroids.map((oldCentroid, index) => {
            const clusterPoints = assignments.filter(p => p.cluster === index);
            const newPos = getCentroid(clusterPoints);

            // If cluster is empty, keep old centroid or re-initialize (simplified here: keep old)
            if (!newPos) return oldCentroid;

            // Check convergence
            const shift = getDistance(oldCentroid, newPos);
            if (shift > 0.001) hasConverged = false; // Tighter tolerance

            return { ...newPos, id: index, isCentroid: true };
        });

        if (hasConverged && iterations > 1) {
            // If converged, we don't strictly need to yield "phase: update" if it's identical to assignment?
            // But usually we want to show the FINAL position.
            // Just break here? No, we need to update centroids one last time.
            centroids = newCentroids;
            yield { points: assignments, centroids, phase: 'converged' };
            break;
        }

        centroids = newCentroids;
        yield { points: assignments, centroids, phase: 'update' };
    }

    // Prepare Final Metrics
    // Calculate SSE (Sum of Squared Errors)
    let sse = 0;
    // Need final assignments
    const finalAssignments = points.map(point => {
        let minDist = Infinity;
        let clusterIndex = -1;
        centroids.forEach((centroid, index) => {
            const dist = getDistance(point, centroid);
            if (dist < minDist) {
                minDist = dist;
                clusterIndex = index;
            }
        });
        if (minDist !== Infinity) sse += (minDist ** 2);
        return { ...point, cluster: clusterIndex };
    });

    yield {
        phase: 'complete',
        summary: {
            clusters: centroids.length,
            sse: sse,
            iterations: iterations
        }
    };
};
