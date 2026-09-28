import React from 'react';
import { Briefcase, ArrowUpRight, CheckCircle2, Clock, Building, DollarSign } from 'lucide-react';

export default function JobsView({ jobs, onSelectJobEmail }) {
  const getStageClass = (stage) => {
    switch (stage.toLowerCase()) {
      case 'interviewing':
      case 'virtual onsite':
        return 'interviewing';
      case 'assessment':
      case 'screening':
        return 'assessment';
      default:
        return 'applied';
    }
  };

  return (
    <div className="dashboard-container">
      {/* Header Summary */}
      <div className="section-top-bar">
        <div className="section-heading-group">
          <h2>Job Application Pipeline</h2>
          <span className="count-chip">{jobs.length} applications tracked</span>
        </div>
      </div>

      {/* Pipeline Table */}
      <div className="table-card">
        <table className="custom-data-table">
          <thead>
            <tr>
              <th>Company & Role</th>
              <th>Pipeline Stage</th>
              <th>Status</th>
              <th>Est. Salary</th>
              <th>Next Action</th>
              <th>Linked Thread</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => (
              <tr key={job.id}>
                <td>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.95rem' }}>
                      {job.company}
                    </span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                      {job.role}
                    </span>
                  </div>
                </td>
                <td>
                  <span className={`stage-badge ${getStageClass(job.stage)}`}>
                    {job.stage}
                  </span>
                </td>
                <td>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    {job.status_badge}
                  </span>
                </td>
                <td>
                  <span style={{ fontSize: '0.82rem', fontFamily: 'var(--font-mono)', color: '#34d399' }}>
                    {job.salary_range}
                  </span>
                </td>
                <td>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-main)', fontWeight: 500 }}>
                    {job.next_step}
                  </span>
                </td>
                <td>
                  <button 
                    className="btn btn-secondary"
                    style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                    onClick={() => onSelectJobEmail(job.email_ref_id)}
                  >
                    <span>View Email</span>
                    <ArrowUpRight size={12} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
