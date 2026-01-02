// Simplified FP-Growth Simulation for Visualization
// (Full FP-Growth is complex to verify in one shot, this provides the visual steps)

module.exports = function* runFPGrowth(transactions, params = { minSupport: 2 }) {
    const minSupport = params.minSupport || 2;

    // Step 1: Count Frequencies
    const counts = {};
    transactions.flat().forEach(item => {
        counts[item] = (counts[item] || 0) + 1;
    });

    // Step 2: Filter & Sort items by frequency
    const frequentItems = Object.entries(counts)
        .filter(([_, count]) => count >= minSupport)
        .sort((a, b) => b[1] - a[1])
        .map(([item]) => item);

    yield { phase: 'counting', counts, frequentItems };

    // Step 3: Build FP-Tree (Mock Step-by-Step)
    const root = { id: 'root', children: [] };

    // Process each transaction
    for (const tx of transactions) {
        // Sort transaction items by global frequency
        const sortedTx = tx
            .filter(item => frequentItems.includes(item))
            .sort((a, b) => counts[b] - counts[a]);

        if (sortedTx.length === 0) continue;

        // Insert into tree
        let currentNode = root;
        for (const item of sortedTx) {
            let child = currentNode.children.find(c => c.name === item);
            if (!child) {
                child = { name: item, count: 0, children: [] };
                currentNode.children.push(child);
            }
            child.count++;
            currentNode = child;
        }

        yield { phase: 'building', transaction: sortedTx, tree: JSON.parse(JSON.stringify(root)) };
    }

    // Step 4: Mining (Simplified: just returning final tree)
    yield { phase: 'mining', tree: root, frequentPatterns: frequentItems };

    yield {
        phase: 'complete',
        summary: {
            patterns: frequentItems.length
        }
    };
};
