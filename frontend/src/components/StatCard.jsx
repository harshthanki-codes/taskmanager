export default function StatCard({ label, value, sub, accent = '#7c6af7' }) {
  return (
    <div className="stat-card">
      <p className="stat-label">{label}</p>
      <p className="stat-value">{value ?? '—'}</p>
      {sub && <p className="stat-sub">{sub}</p>}

      <style>{`
        .stat-card {
          background: #fff;
          border-radius: 12px;
          padding: 1.25rem 1.5rem;
          border: 1px solid #ede9fe20;
          border-left: 4px solid ${accent};
          box-shadow: 0 1px 3px rgba(0,0,0,0.04);
        }

        .stat-label {
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #888;
          margin: 0 0 0.5rem;
        }

        .stat-value {
          font-size: 2rem;
          font-weight: 700;
          color: #1a1a2e;
          margin: 0;
          line-height: 1.1;
        }

        .stat-sub {
          font-size: 12px;
          color: #aaa;
          margin: 0.4rem 0 0;
        }
      `}</style>
    </div>
  );
}
