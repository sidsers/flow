import api from "./api.js";

// ---- Projects ----
export const getProjects = () => api.get("/projects").then((r) => r.data);
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

// ---- Users ----
export const getUsers = () => api.get("/users").then((r) => r.data);

// ---- Comments ----
export const getComments = (issueId) =>
  api.get(`/comments?issue=${issueId}`).then((r) => r.data);
export const createComment = (issueId, text) =>
  api.post("/comments", { issue: issueId, text }).then((r) => r.data);
export const deleteComment = (id) =>
  api.delete(`/comments/${id}`).then((r) => r.data);
