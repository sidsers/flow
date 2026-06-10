import Membership from "../models/Membership.js";
import Project from "../models/Project.js";
import Issue from "../models/Issue.js";

// Org admins can see and do everything, everywhere.
export const isAdmin = (user) => user?.role === "admin";

// Find a user's membership row for a given space (or null).
export function membershipFor(userId, spaceId) {
  return Membership.findOne({ user: userId, space: spaceId });
}

// Can this user view/work inside this space?
// True if they're an org admin OR a member (any role) of the space.
export async function canAccessSpace(user, spaceId) {
  if (isAdmin(user)) return true;
  const m = await membershipFor(user._id, spaceId);
  return Boolean(m);
}

// Can this user MANAGE this space (invite, remove, change roles)?
// True if they're an org admin OR a lead of the space.
export async function canManageSpace(user, spaceId) {
  if (isAdmin(user)) return true;
  const m = await membershipFor(user._id, spaceId);
  return m?.role === "lead";
}

// Which space does a project belong to?
export async function spaceOfProject(projectId) {
  const p = await Project.findById(projectId).select("space");
  return p ? p.space : null;
}

// Can this user access the space that a project lives in?
export async function canAccessProject(user, projectId) {
  const spaceId = await spaceOfProject(projectId);
  if (!spaceId) return false;
  return canAccessSpace(user, spaceId);
}

// Can this user access the space that an issue (via its project) lives in?
export async function canAccessIssue(user, issueId) {
  const issue = await Issue.findById(issueId).select("project");
  if (!issue) return false;
  return canAccessProject(user, issue.project);
}
