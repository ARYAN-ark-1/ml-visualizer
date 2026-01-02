/**
 * Seeded Random Number Generator
 * Uses Mulberry32 algorithm for deterministic results.
 */
export default class Random {
    constructor(seed = Date.now()) {
        this.seed = seed;
    }

    /**
     * Returns a pseudo-random number between 0 (inclusive) and 1 (exclusive).
     */
    next() {
        let t = (this.seed += 0x6d2b79f5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }

    /**
     * Returns a pseudo-random float between min (inclusive) and max (exclusive).
     */
    nextFloat(min, max) {
        return this.next() * (max - min) + min;
    }

    /**
     * Returns a pseudo-random integer between min (inclusive) and max (exclusive).
     */
    nextInt(min, max) {
        return Math.floor(this.next() * (max - min) + min);
    }
}
