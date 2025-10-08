import React from 'react';

const Achievements = ({ achievements, totalAchievements }) => {
    const earnedAchievements = achievements.filter(a => a.is_earned);
    const inProgressAchievements = achievements.filter(a => !a.is_earned && a.user_progress > 0);

    return (
        <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-transparent">
                <h6 className="mb-0">
                    <i className="fas fa-trophy text-warning me-2"></i>
                    Achievements
                    <span className="badge bg-warning text-dark ms-2">
                        {earnedAchievements.length}/{totalAchievements}
                    </span>
                </h6>
            </div>

            <div className="card-body">
                {/* Earned Achievements */}
                {earnedAchievements.length > 0 && (
                    <div className="mb-4">
                        <h6 className="text-success mb-3">
                            <i className="fas fa-check-circle me-2"></i>
                            Earned ({earnedAchievements.length})
                        </h6>
                        <div className="row g-2">
                            {earnedAchievements.map((achievement) => (
                                <div key={achievement.id} className="col-6">
                                    <div className="card border-success border-1">
                                        <div className="card-body p-2 text-center">
                                            <i className={`${achievement.icon} text-${achievement.color} fa-lg mb-1`}></i>
                                            <h6 className="card-title mb-1 small">{achievement.name}</h6>
                                            <small className="text-muted">{achievement.description}</small>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* In Progress Achievements */}
                {inProgressAchievements.length > 0 && (
                    <div className="mb-3">
                        <h6 className="text-primary mb-3">
                            <i className="fas fa-spinner me-2"></i>
                            In Progress ({inProgressAchievements.length})
                        </h6>
                        {inProgressAchievements.map((achievement) => (
                            <div key={achievement.id} className="mb-2">
                                <div className="d-flex justify-content-between align-items-center mb-1">
                                    <span className="small">
                                        <i className={`${achievement.icon} text-${achievement.color} me-2`}></i>
                                        {achievement.name}
                                    </span>
                                    <span className="small text-muted">
                                        {achievement.user_progress}/{achievement.requirement}
                                    </span>
                                </div>
                                <div className="progress" style={{ height: '4px' }}>
                                    <div
                                        className="progress-bar"
                                        role="progressbar"
                                        style={{ 
                                            width: `${(achievement.user_progress / achievement.requirement) * 100}%` 
                                        }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* No Achievements */}
                {earnedAchievements.length === 0 && inProgressAchievements.length === 0 && (
                    <div className="text-center text-muted py-4">
                        <i className="fas fa-trophy fa-2x mb-3"></i>
                        <p>No achievements yet.</p>
                        <small>Start reading and reviewing books to earn achievements!</small>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Achievements;