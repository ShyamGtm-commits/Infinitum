import React, { useState } from 'react';

const ReportGeneration = () => {
    const [reportType, setReportType] = useState('monthly');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [generating, setGenerating] = useState(false);

    const generateReport = async () => {
        setGenerating(true);
        try {
            const params = new URLSearchParams();
            params.append('type', reportType);
            if (startDate) params.append('start_date', startDate);
            if (endDate) params.append('end_date', endDate);

            const response = await fetch(`http://localhost:8000/api/admin/reports/pdf/?${params}`, {
                credentials: 'include',
            });

            if (response.ok) {
                // Create a blob from the PDF stream
                const blob = await response.blob();
                // Create a URL for the blob
                const url = window.URL.createObjectURL(blob);
                // Create a temporary link element
                const a = document.createElement('a');
                a.href = url;
                a.download = `library_report_${new Date().toISOString().split('T')[0]}.pdf`;
                document.body.appendChild(a);
                a.click();
                // Clean up
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            } else {
                console.error('Failed to generate report');
                alert('Failed to generate report. Please try again.');
            }
        } catch (error) {
            console.error('Error generating report', error);
            alert('Error generating report. Please try again.');
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div>
            <div className="card mb-4">
                <div className="card-header">
                    <h5 className="mb-0">Generate Report</h5>
                </div>
                <div className="card-body">
                    <div className="row mb-3">
                        <div className="col-md-6">
                            <label className="form-label">Report Type</label>
                            <select
                                className="form-select"
                                value={reportType}
                                onChange={(e) => setReportType(e.target.value)}
                            >
                                <option value="monthly">Monthly Report</option>
                                <option value="custom">Custom Date Range</option>
                            </select>
                        </div>
                    </div>

                    {reportType === 'custom' && (
                        <div className="row mb-3">
                            <div className="col-md-6">
                                <label className="form-label">Start Date</label>
                                <input
                                    type="date"
                                    className="form-control"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                />
                            </div>
                            <div className="col-md-6">
                                <label className="form-label">End Date</label>
                                <input
                                    type="date"
                                    className="form-control"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                />
                            </div>
                        </div>
                    )}

                    <button
                        className="btn btn-primary"
                        onClick={generateReport}
                        disabled={generating}
                    >
                        {generating ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                Generating...
                            </>
                        ) : (
                            <>
                                <i className="fas fa-file-pdf me-2"></i>Generate PDF Report
                            </>
                        )}
                    </button>
                </div>
            </div>

            <div className="card">
                <div className="card-header">
                    <h5 className="mb-0">Report Types</h5>
                </div>
                <div className="card-body">
                    <div className="row">
                        <div className="col-md-6">
                            <div className="card mb-3">
                                <div className="card-body">
                                    <h6 className="card-title">Monthly Report</h6>
                                    <p className="card-text">
                                        Generates a comprehensive report of all library activities for the current month,
                                        including books borrowed, returned, and fines collected.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-6">
                            <div className="card mb-3">
                                <div className="card-body">
                                    <h6 className="card-title">Custom Date Range</h6>
                                    <p className="card-text">
                                        Generate a report for a specific date range. Useful for analyzing library performance
                                        during specific periods like semesters or special events.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportGeneration;