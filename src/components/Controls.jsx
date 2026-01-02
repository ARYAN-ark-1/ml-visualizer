import React from 'react';
import {
    FaPlay,
    FaPause,
    FaStepForward,
    FaStepBackward,
    FaRedo
} from 'react-icons/fa';

const Controls = React.memo(function Controls({
    isPlaying,
    onPlayPause,
    onStepForward,
    onStepBackward,
    onReset,
    currentStep,
    totalSteps,
    canStepForward,
    canStepBackward
}) {
    return (
        <div className="flex flex-wrap items-center justify-between bg-surface p-4 rounded-xl shadow-sm border border-border gap-4">

            {/* Playback Controls */}
            <div className="flex items-center gap-2 sm:gap-3">
                <button
                    onClick={onReset}
                    className="p-2.5 text-secondary hover:text-error hover:bg-background rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-error/20"
                    title="Reset"
                >
                    <FaRedo size={14} />
                </button>

                <div className="h-6 w-px bg-border mx-1"></div>

                <button
                    onClick={onStepBackward}
                    disabled={!canStepBackward}
                    className={`p-2.5 rounded-full transition-all focus:outline-none ${canStepBackward
                        ? 'text-secondary hover:text-primary hover:bg-background'
                        : 'text-muted/50 cursor-not-allowed'
                        }`}
                    title="Step Backward"
                >
                    <FaStepBackward size={16} />
                </button>

                <button
                    onClick={onPlayPause}
                    className="p-4 bg-accent text-white rounded-full hover:bg-accent-hover shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center justify-center w-12 h-12 focus:outline-none focus:ring-4 focus:ring-accent/20"
                    title={isPlaying ? "Pause" : "Play"}
                >
                    {isPlaying ? <FaPause size={14} /> : <FaPlay className="ml-1" size={14} />}
                </button>

                <button
                    onClick={onStepForward}
                    disabled={!canStepForward}
                    className={`p-2.5 rounded-full transition-all focus:outline-none ${canStepForward
                        ? 'text-secondary hover:text-primary hover:bg-background'
                        : 'text-muted/50 cursor-not-allowed'
                        }`}
                    title="Step Forward"
                >
                    <FaStepForward size={16} />
                </button>
            </div>

            {/* Progress Info */}
            <div className="flex flex-col items-end w-full sm:w-auto min-w-[140px] flex-grow sm:flex-grow-0">
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold text-muted uppercase tracking-wider">
                        Progress
                    </span>
                    <span className="text-sm font-mono text-secondary">
                        <span className="font-bold text-accent">{currentStep}</span>
                        <span className="text-muted">/</span>
                        <span>{totalSteps > 0 ? totalSteps : '--'}</span>
                    </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 bg-background border border-border rounded-full overflow-hidden">
                    <div
                        className="h-full bg-accent transition-all duration-300 ease-out"
                        style={{ width: totalSteps > 0 ? `${(currentStep / totalSteps) * 100}%` : '0%' }}
                    ></div>
                </div>
            </div>
        </div>
    );
});

export default Controls;
