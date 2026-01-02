module.exports = function* runApriori(transactions, params = { minSupport: 2 }) {
    const minSupport = params.minSupport || 2;

    // Helper to count frequency
    const getSupport = (itemset, txs) => {
        let count = 0;
        txs.forEach(tx => {
            // Check if every item in itemset exists in the transaction
            const hasAll = itemset.every(item => tx.includes(item));
            if (hasAll) count++;
        });
        return count;
    };

    // Phase 1: 1-itemsets
    const itemCounts = {};
    transactions.flat().forEach(item => {
        itemCounts[item] = (itemCounts[item] || 0) + 1;
    });

    // Valid 1-itemsets (L1)
    let currentL = Object.entries(itemCounts)
        .filter(([_, count]) => count >= minSupport)
        .map(([item]) => [item])
        .sort(); // Sort itemsets

    // Yield Initial State
    yield {
        level: 1,
        candidates: Object.keys(itemCounts).map(k => [k]).sort(),
        frequent: currentL
    };

    let k = 2;
    while (currentL.length > 0) {
        // Generate Candidates (Join Step) L(k-1) x L(k-1)
        const candidates = [];
        const len = currentL.length;

        for (let i = 0; i < len; i++) {
            for (let j = i + 1; j < len; j++) {
                const setA = currentL[i];
                const setB = currentL[j];

                // Join Condition: First k-2 items must match
                // For k=2, slice(0,0) is empty, so always joins (correct)
                const prefixA = setA.slice(0, k - 2).join('|');
                const prefixB = setB.slice(0, k - 2).join('|');

                if (prefixA === prefixB) {
                    // Combine and Sort
                    const combined = [...new Set([...setA, ...setB])].sort();

                    // Prune Step 1: Subsets check (Optional optimization, skipping for simplicity/speed on small data)
                    // But we MUST ensure it is size k
                    if (combined.length === k) {
                        // Check if duplicate before pushing? 
                        // Since we iterate i and j > i and sets are sorted, we should produce unique candidates naturally?
                        // Actually, for k>2, (A,B,C) from (A,B) and (A,C)? Yes.
                        // Is it possible to generate duplicates? (A,B,C) from (A,B) and (B,C)? 
                        // Our prefix check handles the join condition (A is common).

                        // Just to be safe, stringify to check unique
                        const candStr = JSON.stringify(combined);
                        if (!candidates.some(c => JSON.stringify(c) === candStr)) {
                            candidates.push(combined);
                        }
                    }
                }
            }
        }

        if (candidates.length === 0) break;

        // Count Support for Candidates
        const validFrequent = [];
        for (const cand of candidates) {
            const support = getSupport(cand, transactions);
            if (support >= minSupport) {
                validFrequent.push(cand);
            }
        }

        yield { level: k, candidates, frequent: validFrequent };
        currentL = validFrequent;
        k++;
    }

    yield {
        phase: 'complete',
        summary: {
            maxK: k - 1,
            frequentItemsetsCount: currentL.length
        }
    };
};
