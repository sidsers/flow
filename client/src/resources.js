import api from "./api.js";

// ---- Projects ----
export const getProjects = (spaceId) =>
  api.get(`/projects?space=${spaceId}`).then((r) => r.data);
export const createProject = (data) =>
  api.post("/projects", data).then((r) => r.data);
export const deleteProject = (id) =>
  api.delete(`/projects/${id}`).then((r) => r.data);

// ---- Issues ----
export const getIssues = (projectId) =>
  api.get(`/issues?project=${projectId}`).then((r) => r.data);
export const createIssue = (data) =>
  api.post("/issues", data).then((r) => r.data);
export const updateIssue = (id, data) =>
  api.put(`/issues/${id}`, data).then((r) => r.data);
export const deleteIssue = (id) =>
  api.delete(`/issues/${id}`).then((r) => r.data);

// ---- Comments ----
export const getComments = (issueId) =>
  api.get(`/comments?issue=${issueId}`).then((r) => r.data);
export const createComment = (issueId, text) =>
  api.post("/comments", { issue: issueId, text }).then((r) => r.data);
export const deleteComment = (id) =>
  api.delete(`/comments/${id}`).then((r) => r.data);

// ---- Spaces ----
export const getSpaces = () => api.get("/spaces").then((r) => r.data);
export const createSpace = (data) =>
  api.post("/spaces", data).then((r) => r.data);
export const getMembers = (spaceId) =>
  api.get(`/spaces/${spaceId}/members`).then((r) => r.data);
export const inviteToSpace = (spaceId, email, role) =>
  api.post(`/spaces/${spaceId}/invite`, { email, role }).then((r) => r.data);
export const updateMemberRole = (spaceId, userId, role) =>
  api.put(`/spaces/${spaceId}/members/${userId}`, { role }).then((r) => r.data);
export const removeMember = (spaceId, userId) =>
  api.delete(`/spaces/${spaceId}/members/${userId}`).then((r) => r.data);
export const cancelInvite = (spaceId, inviteId) =>
  api.delete(`/spaces/${spaceId}/invites/${inviteId}`).then((r) => r.data);

// ---- Org admin: users ----
export const getUsers = () => api.get("/users").then((r) => r.data);
export const setUserRole = (userId, role) =>
  api.put(`/users/${userId}/role`, { role }).then((r) => r.data);

// ---- Attachments (images on tasks) ----
export const getAttachments = (issueId) =>
  api.get(`/attachments?issue=${issueId}`).then((r) => r.data);
export const createAttachment = (issueId, dataUrl, filename) =>
  api
    .post("/attachments", { issue: issueId, dataUrl, filename })
    .then((r) => r.data);
export const deleteAttachment = (id) =>
  api.delete(`/attachments/${id}`).then((r) => r.data);
