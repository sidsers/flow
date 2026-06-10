import { useState } from "react";
import { STATUSES } from "./IssueModal.jsx";

// Colors for the priority dot on each card.
const PRIORITY_COLOR = {
  low: "#639922",
  medium: "#185FA5",
  high: "#BA7517",
  urgent: "#A32D2D",
};

// Initials for an assignee's little avatar.
function initials(name) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function Board({ issues, onMove, onOpen }) {
  // Tracks which column you're hovering a card over (for the highlight).
  const [dragOverCol, setDragOverCol] = useState(null);

  // When you start dragging a card, remember which issue it is.
  function handleDragStart(e, issueId) {
    e.dataTransfer.setData("issueId", issueId);
    e.dataTransfer.effectAllowed = "move";
  }

  // When you drop a card into a column, tell the parent to move it.
  function handleDrop(e, statusKey) {
    e.preventDefault();
    const issueId = e.dataTransfer.getData("issueId");
    setDragOverCol(null);
    const issue = issues.find((i) => i._id === issueId);
    if (issue && issue.status !== statusKey) {
      onMove(issue, statusKey);
    }
  }

  return (
    <section className="board">
      {STATUSES.map((col) => {
        const colIssues = issues.filter((i) => i.status === col.key);
        return (
          <div
            key={col.key}
            className={`column ${dragOverCol === col.key ? "drag-over" : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverCol(col.key);
            }}
            onDragLeave={() => setDragOverCol(null)}
            onDrop={(e) => handleDrop(e, col.key)}
          >
            <div className="column-head">
              <span>{col.label}</span>
              <span className="count">{colIssues.length}</span>
            </div>

            <div className="column-body">
              {colIssues.length === 0 && (
                <div className="empty-card">Drop tasks here</div>
              )}

              {colIssues.map((issue) => (
                <div
                  key={issue._id}
                  className="issue-card"
                  draggable
                  onDragStart={(e) => handleDragStart(e, issue._id)}
                  onClick={() => onOpen(issue)}
                >
                  <p className="issue-title">{issue.title}</p>
                  <div className="issue-meta">
                    <span className="issue-label">
                      <span
                        className="priority-dot"
                        style={{
                          background:
                            PRIORITY_COLOR[issue.priority] || "#888780",
                        }}
                        title={issue.priority}
                      />
                      {issue.label}
                    </span>
                    {issue.assignee ? (
                      <span
                        className="mini-avatar"
                        title={issue.assignee.name}
                      >
                        {initials(issue.assignee.name)}
                      </span>
                    ) : (
                      <span className="mini-avatar unassigned" title="Unassigned">
                        ?
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </section>
  );
}
