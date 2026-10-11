const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

// Fired whenever an admin-authenticated request comes back 401 (expired or
// invalid token) — AdminLayout registers a handler that logs out and
// redirects to /admin/login with an explanatory message.
let unauthorizedHandler = () => {};
export function setUnauthorizedHandler(fn) {
  unauthorizedHandler = fn;
}

async function handle(res) {
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail || detail;
    } catch {
      /* ignore */
    }
    if (res.status === 401) unauthorizedHandler();
    throw new Error(detail);
  }
  return res.json();
}

// ---- public reads ----
export const getChurchInfo = () => fetch(`${API_BASE}/api/church-info`).then(handle);
export const getMinistries = () => fetch(`${API_BASE}/api/ministries`).then(handle);
export const getEvents = () => fetch(`${API_BASE}/api/events`).then(handle);
export const getEvent = (id) => fetch(`${API_BASE}/api/events/${id}`).then(handle);
export const getMinistry = (id) => fetch(`${API_BASE}/api/ministries/${id}`).then(handle);
export const getLeaders = () => fetch(`${API_BASE}/api/leaders`).then(handle);
export const getActiveAnnouncements = () => fetch(`${API_BASE}/api/announcements/active`).then(handle);
export const getMedia = (kind = "") => fetch(`${API_BASE}/api/media${kind ? `?kind=${kind}` : ""}`).then(handle);
export const submitPrayerRequest = (payload) =>
  fetch(`${API_BASE}/api/prayer-requests`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).then(handle);
export const getSermons = () => fetch(`${API_BASE}/api/sermons`).then(handle);
export const getSermonsAdmin = (token) =>
  fetch(`${API_BASE}/api/sermons/admin`, { headers: authHeader(token) }).then(handle);
export const getSermon = (id) => fetch(`${API_BASE}/api/sermons/${id}`).then(handle);

export const getProvinces = () => fetch(`${API_BASE}/api/branches/provinces`).then(handle);

export const getBranches = (params = {}, token = null) => {
  const qs = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ""))
  ).toString();
  return fetch(`${API_BASE}/api/branches${qs ? `?${qs}` : ""}`, {
    headers: token ? authHeader(token) : {},
  }).then(handle);
};

export const getBranch = (slug) => fetch(`${API_BASE}/api/branches/${slug}`).then(handle);

export const getClusters = () => fetch(`${API_BASE}/api/clusters`).then(handle);

export const submitContact = (payload) =>
  fetch(`${API_BASE}/api/contact`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).then(handle);

// ---- admin auth ----
export const adminLogin = (username, password) =>
  fetch(`${API_BASE}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  }).then(handle);

const authHeader = (token) => ({ Authorization: `Bearer ${token}` });

export const getAdminMe = (token) => fetch(`${API_BASE}/api/admin/me`, { headers: authHeader(token) }).then(handle);

export const getMessages = (token) =>
  fetch(`${API_BASE}/api/contact`, { headers: authHeader(token) }).then(handle);

export const markMessageRead = (token, id) =>
  fetch(`${API_BASE}/api/contact/${id}/read`, { method: "PUT", headers: authHeader(token) }).then(handle);

export const deleteMessage = (token, id) =>
  fetch(`${API_BASE}/api/contact/${id}`, { method: "DELETE", headers: authHeader(token) }).then(handle);

export const changePassword = (token, current_password, new_password) =>
  fetch(`${API_BASE}/api/admin/password`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeader(token) },
    body: JSON.stringify({ current_password, new_password }),
  }).then(handle);

export const updateChurchInfo = (token, payload) =>
  fetch(`${API_BASE}/api/church-info`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeader(token) },
    body: JSON.stringify(payload),
  }).then(handle);

export const uploadFounderPhoto = (token, file) => {
  const fd = new FormData();
  fd.append("photo", file);
  return fetch(`${API_BASE}/api/church-info/founder-photo`, {
    method: "POST",
    headers: authHeader(token),
    body: fd,
  }).then(handle);
};

export const uploadChurchPhoto = (token, file) => {
  const fd = new FormData();
  fd.append("photo", file);
  return fetch(`${API_BASE}/api/church-info/church-photo`, {
    method: "POST",
    headers: authHeader(token),
    body: fd,
  }).then(handle);
};

// ---- admin writes (multipart, so an optional file can ride along) ----
function toFormData(fields) {
  const fd = new FormData();
  Object.entries(fields).forEach(([key, value]) => {
    if (value !== undefined && value !== null) fd.append(key, value);
  });
  return fd;
}

export const createMinistry = (token, fields) =>
  fetch(`${API_BASE}/api/ministries`, {
    method: "POST",
    headers: authHeader(token),
    body: toFormData(fields),
  }).then(handle);

export const updateMinistry = (token, id, fields) =>
  fetch(`${API_BASE}/api/ministries/${id}`, {
    method: "PUT",
    headers: authHeader(token),
    body: toFormData(fields),
  }).then(handle);

export const deleteMinistry = (token, id) =>
  fetch(`${API_BASE}/api/ministries/${id}`, { method: "DELETE", headers: authHeader(token) }).then(handle);

export const createEvent = (token, fields) =>
  fetch(`${API_BASE}/api/events`, {
    method: "POST",
    headers: authHeader(token),
    body: toFormData(fields),
  }).then(handle);

export const deleteEvent = (token, id) =>
  fetch(`${API_BASE}/api/events/${id}`, { method: "DELETE", headers: authHeader(token) }).then(handle);

export const createSermon = (token, fields) =>
  fetch(`${API_BASE}/api/sermons`, {
    method: "POST",
    headers: authHeader(token),
    body: toFormData(fields),
  }).then(handle);

export const updateSermon = (token, id, fields) =>
  fetch(`${API_BASE}/api/sermons/${id}`, {
    method: "PUT",
    headers: authHeader(token),
    body: toFormData(fields),
  }).then(handle);

export const deleteSermon = (token, id) =>
  fetch(`${API_BASE}/api/sermons/${id}`, { method: "DELETE", headers: authHeader(token) }).then(handle);

// ---- service times (JSON, admin only) ----
export const createServiceTime = (token, payload) =>
  fetch(`${API_BASE}/api/service-times`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader(token) },
    body: JSON.stringify(payload),
  }).then(handle);

export const updateServiceTime = (token, id, payload) =>
  fetch(`${API_BASE}/api/service-times/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeader(token) },
    body: JSON.stringify(payload),
  }).then(handle);

export const deleteServiceTime = (token, id) =>
  fetch(`${API_BASE}/api/service-times/${id}`, { method: "DELETE", headers: authHeader(token) }).then(handle);

// ---- branches & clusters (multipart, admin writes) ----
export const createBranch = (token, fields) =>
  fetch(`${API_BASE}/api/branches`, {
    method: "POST",
    headers: authHeader(token),
    body: toFormData(fields),
  }).then(handle);

export const updateBranch = (token, id, fields) =>
  fetch(`${API_BASE}/api/branches/${id}`, {
    method: "PUT",
    headers: authHeader(token),
    body: toFormData(fields),
  }).then(handle);

export const deleteBranch = (token, id) =>
  fetch(`${API_BASE}/api/branches/${id}`, { method: "DELETE", headers: authHeader(token) }).then(handle);

export const createCluster = (token, fields) =>
  fetch(`${API_BASE}/api/clusters`, {
    method: "POST",
    headers: authHeader(token),
    body: toFormData(fields),
  }).then(handle);

export const updateCluster = (token, id, fields) =>
  fetch(`${API_BASE}/api/clusters/${id}`, {
    method: "PUT",
    headers: authHeader(token),
    body: toFormData(fields),
  }).then(handle);

export const deleteCluster = (token, id) =>
  fetch(`${API_BASE}/api/clusters/${id}`, { method: "DELETE", headers: authHeader(token) }).then(handle);

export const reorderServiceTimes = (token, ids) =>
  fetch(`${API_BASE}/api/service-times/reorder`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader(token) },
    body: JSON.stringify({ ids }),
  }).then(handle);

export const mediaUrl = (path) => {
  if (!path) return "";
  // Already a usable URL (a local blob: preview, or already-absolute) — pass through.
  if (/^(https?:|blob:|data:)/.test(path)) return path;
  return `${API_BASE}${path}`;
};

// ---- livestream ----
export const getLiveStatus = () => fetch(`${API_BASE}/api/live-status`).then(handle);

export const getLivestreamSettings = (token) =>
  fetch(`${API_BASE}/api/livestream`, { headers: authHeader(token) }).then(handle);

export const updateLivestreamSettings = (token, payload) =>
  fetch(`${API_BASE}/api/livestream`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeader(token) },
    body: JSON.stringify(payload),
  }).then(handle);

// ---- admin: events/ministries (include unpublished/inactive), leaders, announcements, media, prayer ----
export const getEventsAdmin = (token) => fetch(`${API_BASE}/api/events/admin`, { headers: authHeader(token) }).then(handle);
export const updateEvent = (token, id, fields) =>
  fetch(`${API_BASE}/api/events/${id}`, { method: "PUT", headers: authHeader(token), body: toFormData(fields) }).then(handle);
export const getMinistriesAdmin = (token) =>
  fetch(`${API_BASE}/api/ministries/admin`, { headers: authHeader(token) }).then(handle);

const jsonHeaders = (token) => ({ "Content-Type": "application/json", ...authHeader(token) });

export const getLeadersAdmin = (token) => fetch(`${API_BASE}/api/admin/leaders`, { headers: authHeader(token) }).then(handle);
export const createLeader = (token, fields) =>
  fetch(`${API_BASE}/api/admin/leaders`, { method: "POST", headers: authHeader(token), body: toFormData(fields) }).then(handle);
export const updateLeader = (token, id, fields) =>
  fetch(`${API_BASE}/api/admin/leaders/${id}`, { method: "PUT", headers: authHeader(token), body: toFormData(fields) }).then(handle);
export const deleteLeader = (token, id) =>
  fetch(`${API_BASE}/api/admin/leaders/${id}`, { method: "DELETE", headers: authHeader(token) }).then(handle);

export const getAnnouncementsAdmin = (token) =>
  fetch(`${API_BASE}/api/admin/announcements`, { headers: authHeader(token) }).then(handle);
export const createAnnouncement = (token, payload) =>
  fetch(`${API_BASE}/api/admin/announcements`, { method: "POST", headers: jsonHeaders(token), body: JSON.stringify(payload) }).then(handle);
export const updateAnnouncement = (token, id, payload) =>
  fetch(`${API_BASE}/api/admin/announcements/${id}`, { method: "PUT", headers: jsonHeaders(token), body: JSON.stringify(payload) }).then(handle);
export const deleteAnnouncement = (token, id) =>
  fetch(`${API_BASE}/api/admin/announcements/${id}`, { method: "DELETE", headers: authHeader(token) }).then(handle);

export const getMediaAdmin = (token) => fetch(`${API_BASE}/api/admin/media`, { headers: authHeader(token) }).then(handle);
export const createMedia = (token, fields) =>
  fetch(`${API_BASE}/api/admin/media`, { method: "POST", headers: authHeader(token), body: toFormData(fields) }).then(handle);
export const updateMedia = (token, id, fields) =>
  fetch(`${API_BASE}/api/admin/media/${id}`, { method: "PUT", headers: authHeader(token), body: toFormData(fields) }).then(handle);
export const deleteMedia = (token, id) =>
  fetch(`${API_BASE}/api/admin/media/${id}`, { method: "DELETE", headers: authHeader(token) }).then(handle);

export const getPrayerRequests = (token, params = {}) => {
  const qs = new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([, v]) => v))).toString();
  return fetch(`${API_BASE}/api/admin/prayer-requests${qs ? `?${qs}` : ""}`, { headers: authHeader(token) }).then(handle);
};
export const setPrayerStatus = (token, id, status) =>
  fetch(`${API_BASE}/api/admin/prayer-requests/${id}`, { method: "PUT", headers: jsonHeaders(token), body: JSON.stringify({ status }) }).then(handle);
export const deletePrayerRequest = (token, id) =>
  fetch(`${API_BASE}/api/admin/prayer-requests/${id}`, { method: "DELETE", headers: authHeader(token) }).then(handle);

export const getUsers = (token) => fetch(`${API_BASE}/api/admin/users`, { headers: authHeader(token) }).then(handle);
export const createUser = (token, payload) =>
  fetch(`${API_BASE}/api/admin/users`, { method: "POST", headers: jsonHeaders(token), body: JSON.stringify(payload) }).then(handle);
export const updateUser = (token, id, payload) =>
  fetch(`${API_BASE}/api/admin/users/${id}`, { method: "PUT", headers: jsonHeaders(token), body: JSON.stringify(payload) }).then(handle);
