const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

async function handle(res) {
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail || detail;
    } catch {
      /* ignore */
    }
    throw new Error(detail);
  }
  return res.json();
}

// ---- public reads ----
export const getChurchInfo = () => fetch(`${API_BASE}/api/church-info`).then(handle);
export const getMinistries = () => fetch(`${API_BASE}/api/ministries`).then(handle);
export const getEvents = () => fetch(`${API_BASE}/api/events`).then(handle);
export const getSermons = () => fetch(`${API_BASE}/api/sermons`).then(handle);
export const getSermonsAdmin = (token) =>
  fetch(`${API_BASE}/api/sermons/admin`, { headers: authHeader(token) }).then(handle);

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

export const reorderServiceTimes = (token, ids) =>
  fetch(`${API_BASE}/api/service-times/reorder`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader(token) },
    body: JSON.stringify({ ids }),
  }).then(handle);

export const mediaUrl = (path) => (path ? `${API_BASE}${path}` : "");
