const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

// Helper to get or create visitorId
const getVisitorId = () => {
    let id = localStorage.getItem('visitorId');
    if (!id) {
        id = crypto.randomUUID();
        localStorage.setItem('visitorId', id);
    }
    return id;
};

// New Unified Streaming Function
export const runExperimentStream = async (algorithm, params, points, onStep, onError) => {
    try {
        const visitorId = getVisitorId();
        const response = await fetch(`${API_URL}/experiments/run`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ algorithm, params, points, visitorId }),
        });

        if (!response.body) throw new Error("ReadableStream not supported");

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop(); // Keep incomplete line

            for (const line of lines) {
                if (line.trim()) {
                    try {
                        const step = JSON.parse(line);
                        if (step.error) throw new Error(step.error);
                        onStep(step);
                    } catch (e) {
                        console.error("Parse error", e);
                    }
                }
            }
        }
    } catch (err) {
        if (onError) onError(err);
    }
};

export const trackVisit = async (visitorId) => {
    // Non-blocking fire-and-forget approach, returns promise for optional handling
    return fetch(`${API_URL}/telemetry`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ visitorId }),
    })
        .then(res => res.json())
        .catch(() => null);
};

export const getExperiment = async (id) => {
    const response = await fetch(`${API_URL}/experiments/${id}`);
    if (!response.ok) {
        throw new Error(`Failed to fetch experiment: ${response.statusText}`);
    }
    return response.json();
};
