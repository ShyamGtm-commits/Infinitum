import React, { useState } from 'react';

const ReadingGoals = ({ goals, onCreateGoal }) => {
    const [showGoalForm, setShowGoalForm] = useState(false);
    const [goalType, setGoalType] = useState('books');
    const [target, setTarget] = useState('');
    const [period, setPeriod] = useState('monthly');
    const [loading, setLoading] = useState(false);

    const handleCreateGoal = async (e) => {
        e.preventDefault();
        if (!target || target <= 0) return;

        setLoading(true);
        try {
            await onCreateGoal({ goal_type: goalType, target: parseInt(target), period });
            setShowGoalForm(false);
            setTarget('');
        } catch (error) {
            console.error('Error creating goal:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-transparent d-flex justify-content-between align-items-center">
                <h6 className="mb-0">
                    <i className="fas fa-bullseye text-primary me-2"></i>
                    Reading Goals
                </h6>
                <button
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => setShowGoalForm(!showGoalForm)}
                >
                    <i className="fas fa-plus me-1"></i>
                    New Goal
                </button>
            </div>

            <div className="card-body">
                {/* Goal Creation Form */}
                {showGoalForm && (
                    <div className="card mb-3 border-primary">
                        <div className="card-body">
                            <h6 className="card-title">Create New Goal</h6>
                            <form onSubmit={handleCreateGoal}>
                                <div className="row g-2 mb-3">
                                    <div className="col-md-4">
                                        <select
                                            className="form-select form-select-sm"
                                            value={goalType}
                                            onChange={(e) => setGoalType(e.target.value)}
                                        >
                                            <option value="books">Books Read</option>
                                            <option value="pages">Pages Read</option>
                                        </select>
                                    </div>
                                    <div className="col-md-4">
                                        <select
                                            className="form-select form-select-sm"
                                            value={period}
                                            onChange={(e) => setPeriod(e.target.value)}
                                        >
                                            <option value="monthly">This Month</option>
                                            <option value="yearly">This Year</option>
                                        </select>
                                    </div>
                                    <div className="col-md-4">
                                        <input
                                            type="number"
                                            className="form-control form-control-sm"
                                            placeholder="Target"
                                            value={target}
                                            onChange={(e) => setTarget(e.target.value)}
                                            min="1"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="d-flex gap-2">
                                    <button
                                        type="submit"
                                        className="btn btn-primary btn-sm"
                                        disabled={loading}
                                    >
                                        {loading ? 'Creating...' : 'Create Goal'}
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-outline-secondary btn-sm"
                                        onClick={() => setShowGoalForm(false)}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Goals List */}
                {goals.length === 0 ? (
                    <div className="text-center text-muted py-4">
                        <i className="fas fa-bullseye fa-2x mb-3"></i>
                        <p>No active goals set yet.</p>
                        <small>Set a reading goal to track your progress!</small>
                    </div>
                ) : (
                    goals.map((goal) => (
                        <div key={goal.id} className="mb-3">
                            <div className="d-flex justify-content-between align-items-center mb-1">
                                <span className="fw-semibold">
                                    {goal.goal_type} Goal ({goal.period})
                                </span>
                                <span className="text-muted small">
                                    {goal.progress.completed} / {goal.progress.target}
                                </span>
                            </div>
                            <div className="progress" style={{ height: '8px' }}>
                                <div
                                    className="progress-bar"
                                    role="progressbar"
                                    style={{ width: `${goal.progress.percentage}%` }}
                                    aria-valuenow={goal.progress.percentage}
                                    aria-valuemin="0"
                                    aria-valuemax="100"
                                ></div>
                            </div>
                            <small className="text-muted">
                                {goal.progress.percentage}% complete
                            </small>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ReadingGoals;