import React, { useState, useEffect } from 'react';

const SecurityDashboard = ({ user }) => {
  const [securityData, setSecurityData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [auditLogs, setAuditLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);

  useEffect(() => {
    fetchSecurityData();
    fetchAuditLogs();
  }, []);

  const fetchSecurityData = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/admin/security/dashboard/', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setSecurityData(data);
      }
    } catch (error) {
      console.error('Error fetching security data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    setLogsLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/admin/security/audit-logs/', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setAuditLogs(data.logs || []);
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLogsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mt-4">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p>Loading security dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Security Dashboard</h2>
        <button className="btn btn-outline-primary" onClick={fetchSecurityData}>
          <i className="fas fa-sync-alt me-2"></i>
          Refresh
        </button>
      </div>

      {/* Security Metrics */}
      {securityData && (
        <div className="row mb-4">
          <div className="col-md-3 mb-3">
            <div className="card text-white bg-primary">
              <div className="card-body text-center">
                <h5>Total Events</h5>
                <h2>{securityData.metrics?.total_events || 0}</h2>
              </div>
            </div>
          </div>
          <div className="col-md-3 mb-3">
            <div className="card text-white bg-warning">
              <div className="card-body text-center">
                <h5>Recent Events</h5>
                <h2>{securityData.metrics?.recent_events || 0}</h2>
              </div>
            </div>
          </div>
          <div className="col-md-3 mb-3">
            <div className="card text-white bg-danger">
              <div className="card-body text-center">
                <h5>Permission Denials</h5>
                <h2>{securityData.metrics?.permission_denials || 0}</h2>
              </div>
            </div>
          </div>
          <div className="col-md-3 mb-3">
            <div className="card text-white bg-success">
              <div className="card-body text-center">
                <h5>Role Changes</h5>
                <h2>{securityData.metrics?.role_changes || 0}</h2>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Audit Logs */}
      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Security Audit Logs</h5>
          <button 
            className="btn btn-sm btn-outline-secondary" 
            onClick={fetchAuditLogs}
            disabled={logsLoading}
          >
            {logsLoading ? 'Loading...' : 'Refresh Logs'}
          </button>
        </div>
        <div className="card-body">
          {logsLoading ? (
            <div className="text-center py-3">
              <div className="spinner-border spinner-border-sm" role="status">
                <span className="visually-hidden">Loading logs...</span>
              </div>
            </div>
          ) : auditLogs.length === 0 ? (
            <p className="text-muted text-center py-3">No security events logged yet.</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Action</th>
                    <th>Description</th>
                    <th>IP Address</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log, index) => (
                    <tr key={index}>
                      <td>
                        <strong>{log.user || 'System'}</strong>
                      </td>
                      <td>
                        <span className={`badge ${
                          log.action_type === 'permission_denied' ? 'bg-danger' :
                          log.action_type === 'role_change' ? 'bg-warning' : 'bg-info'
                        }`}>
                          {log.action_type}
                        </span>
                      </td>
                      <td>{log.description}</td>
                      <td>
                        <code>{log.ip_address || 'N/A'}</code>
                      </td>
                      <td>
                        <small>
                          {new Date(log.timestamp).toLocaleString()}
                        </small>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SecurityDashboard;