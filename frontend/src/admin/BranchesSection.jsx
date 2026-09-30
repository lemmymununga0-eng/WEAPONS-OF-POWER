import { Suspense, lazy, useEffect, useMemo, useState } from "react";
import {
  getBranches,
  createBranch,
  updateBranch,
  deleteBranch,
  getClusters,
  createCluster,
  updateCluster,
  deleteCluster,
  getProvinces,
  mediaUrl,
} from "../api/client.js";
import { compressImage } from "../lib/imageCompress.js";
import { parseGoogleMapsLink } from "../lib/googleMapsLink.js";
import { COUNTRIES } from "../lib/countries.js";
import BranchCard from "../components/locations/BranchCard.jsx";

const MapPicker = lazy(() => import("./MapPicker.jsx"));

const EMPTY_FORM = {
  name: "",
  country: "Zambia",
  province: "",
  town: "",
  cluster_id: "",
  address: "",
  directions_note: "",
  latitude: null,
  longitude: null,
  is_headquarters: false,
  service_times: "",
  pastor_name: "",
  pastor_title: "Pastor",
  pastor_phone: "",
  pastor_whatsapp: "",
  pastor_email: "",
  show_pastor_contacts: true,
  active: true,
  sort_order: 0,
};

export default function BranchesSection({ token, onNotice }) {
  const [tab, setTab] = useState("branches");
  const [branches, setBranches] = useState([]);
  const [clusters, setClusters] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [search, setSearch] = useState("");
  const [provinceFilter, setProvinceFilter] = useState("");

  const reload = () => {
    getBranches({ include_inactive: true }, token).then(setBranches);
    getClusters().then(setClusters);
    getProvinces().then(setProvinces);
  };

  useEffect(reload, []); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredBranches = useMemo(() => {
    return branches.filter((b) => {
      if (provinceFilter && b.province !== provinceFilter) return false;
      if (search) {
        const needle = search.toLowerCase();
        if (!`${b.name} ${b.town} ${b.pastor_name}`.toLowerCase().includes(needle)) return false;
      }
      return true;
    });
  }, [branches, search, provinceFilter]);

  return (
    <div className="admin-card">
      <div className="admin-tabs">
        <button type="button" className={tab === "branches" ? "active" : ""} onClick={() => setTab("branches")}>
          Branches
        </button>
        <button type="button" className={tab === "clusters" ? "active" : ""} onClick={() => setTab("clusters")}>
          Clusters
        </button>
      </div>

      {tab === "branches" ? (
        <BranchesTab
          branches={filteredBranches}
          clusters={clusters}
          provinces={provinces}
          search={search}
          setSearch={setSearch}
          provinceFilter={provinceFilter}
          setProvinceFilter={setProvinceFilter}
          token={token}
          reload={reload}
          onNotice={onNotice}
        />
      ) : (
        <ClustersTab clusters={clusters} token={token} reload={reload} onNotice={onNotice} />
      )}
    </div>
  );
}

// ---------------- Branches tab ----------------

function BranchesTab({ branches, clusters, provinces, search, setSearch, provinceFilter, setProvinceFilter, token, reload, onNotice }) {
  const [editingId, setEditingId] = useState(null); // null = list view, 0 = new, id = editing
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const editing = branches.find((b) => b.id === editingId) || (editingId === 0 ? null : undefined);

  const handleDelete = async (id) => {
    await deleteBranch(token, id);
    setConfirmDeleteId(null);
    reload();
    onNotice("Branch removed.");
  };

  if (editingId !== null) {
    return (
      <BranchEditor
        branch={editingId === 0 ? null : editing}
        clusters={clusters}
        provinces={provinces}
        token={token}
        onCancel={() => setEditingId(null)}
        onSaved={() => {
          setEditingId(null);
          reload();
          onNotice(editingId === 0 ? "Branch added." : "Branch updated.");
        }}
      />
    );
  }

  return (
    <>
      <h2>Branches</h2>
      <div className="admin-form-grid" style={{ marginBottom: 4 }}>
        <div className="field">
          <label>Search</label>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name, town, pastor" />
        </div>
        <div className="field">
          <label>Province</label>
          <select value={provinceFilter} onChange={(e) => setProvinceFilter(e.target.value)}>
            <option value="">All provinces</option>
            {provinces.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="admin-list">
        {branches.length === 0 && <p className="empty-note">No branches match.</p>}
        {branches.map((b) => (
          <div className="admin-list-row" key={b.id}>
            <div className="info">
              <b>
                {b.name} {b.is_headquarters && <span className="hq-badge">HQ</span>}
                {!b.active && <span className="hidden-badge">Hidden</span>}
                {(b.latitude == null || b.longitude == null) && <span className="warn-badge">No map pin</span>}
              </b>
              <span>
                {b.pastor_title} {b.pastor_name} · {[b.town, b.province].filter(Boolean).join(", ") || "No location set"}
              </span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="link-btn" style={{ color: "var(--accent)" }} onClick={() => setEditingId(b.id)}>
                Edit
              </button>
              {confirmDeleteId === b.id ? (
                <>
                  <button className="link-btn" onClick={() => handleDelete(b.id)}>
                    Confirm remove
                  </button>
                  <button className="link-btn" style={{ color: "var(--ink-muted)" }} onClick={() => setConfirmDeleteId(null)}>
                    Cancel
                  </button>
                </>
              ) : (
                <button className="link-btn" onClick={() => setConfirmDeleteId(b.id)}>
                  Remove
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 16 }}>
        <button className="btn btn-primary" type="button" onClick={() => setEditingId(0)}>
          Add Branch
        </button>
      </div>
    </>
  );
}

function BranchEditor({ branch, clusters, provinces, token, onCancel, onSaved }) {
  const [form, setForm] = useState(() => (branch ? { ...branch, cluster_id: branch.cluster_id ?? "" } : EMPTY_FORM));
  const [branchPhotoFile, setBranchPhotoFile] = useState(null);
  const [pastorPhotoFile, setPastorPhotoFile] = useState(null);
  const [branchPhotoPreview, setBranchPhotoPreview] = useState(branch?.branch_photo ? mediaUrl(branch.branch_photo) : "");
  const [pastorPhotoPreview, setPastorPhotoPreview] = useState(branch?.pastor_photo ? mediaUrl(branch.pastor_photo) : "");
  const [removeBranchPhoto, setRemoveBranchPhoto] = useState(false);
  const [removePastorPhoto, setRemovePastorPhoto] = useState(false);
  const [mapsLinkInput, setMapsLinkInput] = useState("");
  const [mapsLinkError, setMapsLinkError] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  const setBool = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.checked }));

  const handleCountryChange = (e) => {
    const country = e.target.value;
    setForm((f) => ({ ...f, country, province: country === "Zambia" ? f.province : "" }));
  };

  const handlePhoto = async (which, file) => {
    if (!file) return;
    const compressed = await compressImage(file);
    const url = URL.createObjectURL(compressed);
    if (which === "branch") {
      setBranchPhotoFile(compressed);
      setBranchPhotoPreview(url);
      setRemoveBranchPhoto(false);
    } else {
      setPastorPhotoFile(compressed);
      setPastorPhotoPreview(url);
      setRemovePastorPhoto(false);
    }
  };

  const applyMapsLink = () => {
    try {
      const { lat, lng } = parseGoogleMapsLink(mapsLinkInput);
      setForm((f) => ({ ...f, latitude: lat, longitude: lng }));
      setMapsLinkError("");
    } catch (err) {
      setMapsLinkError(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.name.trim() || !form.pastor_name.trim()) {
      setError("Name and pastor name are required.");
      return;
    }
    if (form.country === "Zambia" && !form.province) {
      setError("Province is required for a Zambian branch.");
      return;
    }

    const fields = {
      name: form.name,
      country: form.country,
      province: form.province || "",
      town: form.town || "",
      address: form.address || "",
      directions_note: form.directions_note || "",
      is_headquarters: form.is_headquarters,
      service_times: form.service_times || "",
      pastor_name: form.pastor_name,
      pastor_title: form.pastor_title || "Pastor",
      pastor_phone: form.pastor_phone || "",
      pastor_whatsapp: form.pastor_whatsapp || "",
      pastor_email: form.pastor_email || "",
      show_pastor_contacts: form.show_pastor_contacts,
      active: form.active,
      sort_order: form.sort_order || 0,
    };
    if (form.latitude != null && form.longitude != null) {
      fields.latitude = form.latitude;
      fields.longitude = form.longitude;
    }
    if (form.cluster_id) {
      fields.cluster_id = form.cluster_id;
    } else if (branch) {
      fields.cluster_id = 0; // explicitly clear on edit
    }
    if (branchPhotoFile) fields.branch_photo = branchPhotoFile;
    if (pastorPhotoFile) fields.pastor_photo = pastorPhotoFile;
    if (removeBranchPhoto) fields.remove_branch_photo = true;
    if (removePastorPhoto) fields.remove_pastor_photo = true;

    setSaving(true);
    try {
      if (branch) {
        await updateBranch(token, branch.id, fields);
      } else {
        await createBranch(token, fields);
      }
      onSaved();
    } catch (err) {
      setError(err.message || "Could not save branch");
    } finally {
      setSaving(false);
    }
  };

  const previewBranch = {
    ...form,
    id: branch?.id || 0,
    slug: branch?.slug || "",
    branch_photo: removeBranchPhoto ? "" : branchPhotoPreview,
    pastor_photo: removePastorPhoto ? "" : pastorPhotoPreview,
  };

  return (
    <div>
      <h2>{branch ? "Edit Branch" : "Add Branch"}</h2>
      <div className="branch-editor-grid">
        <form className="admin-form-grid" onSubmit={handleSubmit}>
          <div className="field">
            <label>Branch name *</label>
            <input value={form.name} onChange={set("name")} required />
          </div>
          <div className="field">
            <label>Country</label>
            <select value={form.country} onChange={handleCountryChange}>
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {form.country === "Zambia" ? (
            <div className="field">
              <label>Province *</label>
              <select value={form.province || ""} onChange={set("province")}>
                <option value="">Select a province</option>
                {provinces.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="field">
              <label>Region</label>
              <input value={form.province || ""} onChange={set("province")} placeholder="e.g. Eastern Cape" />
            </div>
          )}

          <div className="field">
            <label>Town</label>
            <input value={form.town || ""} onChange={set("town")} />
          </div>
          <div className="field">
            <label>Cluster</label>
            <select value={form.cluster_id || ""} onChange={set("cluster_id")}>
              <option value="">No cluster</option>
              {clusters.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="field" style={{ gridColumn: "1 / -1" }}>
            <label>Address</label>
            <input value={form.address || ""} onChange={set("address")} />
          </div>
          <div className="field" style={{ gridColumn: "1 / -1" }}>
            <label>Directions note</label>
            <input value={form.directions_note || ""} onChange={set("directions_note")} placeholder="e.g. Opposite the market" />
          </div>

          <div className="field" style={{ gridColumn: "1 / -1" }}>
            <label>Service times (one per line)</label>
            <textarea value={form.service_times || ""} onChange={set("service_times")} />
          </div>

          <div className="field">
            <label>Pastor / leader name *</label>
            <input value={form.pastor_name} onChange={set("pastor_name")} required />
          </div>
          <div className="field">
            <label>Title</label>
            <input value={form.pastor_title || ""} onChange={set("pastor_title")} placeholder="Pastor, Bishop, Overseer…" />
          </div>
          <div className="field">
            <label>Pastor phone</label>
            <input type="tel" value={form.pastor_phone || ""} onChange={set("pastor_phone")} placeholder="0971234567" />
          </div>
          <div className="field">
            <label>Pastor WhatsApp</label>
            <input type="tel" value={form.pastor_whatsapp || ""} onChange={set("pastor_whatsapp")} placeholder="0971234567" />
          </div>
          <div className="field">
            <label>Pastor email</label>
            <input type="email" value={form.pastor_email || ""} onChange={set("pastor_email")} />
          </div>

          <div className="field">
            <label>
              <input type="checkbox" checked={!!form.show_pastor_contacts} onChange={setBool("show_pastor_contacts")} /> Show
              pastor contacts publicly
            </label>
          </div>
          <div className="field">
            <label>
              <input type="checkbox" checked={!!form.is_headquarters} onChange={setBool("is_headquarters")} /> This is the
              headquarters
            </label>
          </div>
          <div className="field">
            <label>
              <input type="checkbox" checked={!!form.active} onChange={setBool("active")} /> Visible on the public site
            </label>
          </div>

          <div className="field" style={{ gridColumn: "1 / -1" }}>
            <label>Branch photo</label>
            {branchPhotoPreview && !removeBranchPhoto && (
              <img className="admin-photo-preview" src={branchPhotoPreview} alt="Branch preview" />
            )}
            <input type="file" accept="image/*" onChange={(e) => handlePhoto("branch", e.target.files?.[0])} />
            {branch?.branch_photo && !branchPhotoFile && (
              <label className="checkbox-inline">
                <input
                  type="checkbox"
                  checked={removeBranchPhoto}
                  onChange={(e) => setRemoveBranchPhoto(e.target.checked)}
                />{" "}
                Remove current photo
              </label>
            )}
          </div>

          <div className="field" style={{ gridColumn: "1 / -1" }}>
            <label>Pastor photo</label>
            {pastorPhotoPreview && !removePastorPhoto && (
              <img className="admin-photo-preview round" src={pastorPhotoPreview} alt="Pastor preview" />
            )}
            <input type="file" accept="image/*" onChange={(e) => handlePhoto("pastor", e.target.files?.[0])} />
            {branch?.pastor_photo && !pastorPhotoFile && (
              <label className="checkbox-inline">
                <input
                  type="checkbox"
                  checked={removePastorPhoto}
                  onChange={(e) => setRemovePastorPhoto(e.target.checked)}
                />{" "}
                Remove current photo
              </label>
            )}
          </div>

          <div className="field" style={{ gridColumn: "1 / -1" }}>
            <label>Map pin</label>
            <Suspense fallback={<div className="map-loading">Loading map…</div>}>
              <MapPicker
                lat={form.latitude}
                lng={form.longitude}
                onChange={(lat, lng) => setForm((f) => ({ ...f, latitude: lat, longitude: lng }))}
              />
            </Suspense>
            <div className="maps-link-row">
              <input
                value={mapsLinkInput}
                onChange={(e) => setMapsLinkInput(e.target.value)}
                placeholder="Paste a Google Maps link or lat,lng"
              />
              <button type="button" className="btn btn-outline on-light" onClick={applyMapsLink}>
                Set pin
              </button>
              {(form.latitude != null || form.longitude != null) && (
                <button
                  type="button"
                  className="link-btn"
                  onClick={() => setForm((f) => ({ ...f, latitude: null, longitude: null }))}
                >
                  Clear pin
                </button>
              )}
            </div>
            {mapsLinkError && <span className="form-status error">{mapsLinkError}</span>}
            {form.latitude != null && (
              <span className="empty-note">
                {form.latitude.toFixed?.(5) ?? form.latitude}, {form.longitude.toFixed?.(5) ?? form.longitude}
              </span>
            )}
          </div>

          {error && <span className="form-status error">{error}</span>}

          <div style={{ gridColumn: "1 / -1", display: "flex", gap: 10 }}>
            <button className="btn btn-primary" type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save Branch"}
            </button>
            <button className="btn btn-outline on-light" type="button" onClick={onCancel}>
              Cancel
            </button>
          </div>
        </form>

        <div className="branch-preview-pane">
          <span className="eyebrow">Live preview</span>
          <div style={{ pointerEvents: "none", marginTop: 10 }}>
            <BranchCard branch={previewBranch} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------- Clusters tab ----------------

function ClustersTab({ clusters, token, reload, onNotice }) {
  const [form, setForm] = useState({ name: "", province: "", overseer_name: "", overseer_phone: "", description: "" });
  const [editingId, setEditingId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const startEdit = (cluster) => {
    setEditingId(cluster.id);
    setForm({
      name: cluster.name,
      province: cluster.province,
      overseer_name: cluster.overseer_name,
      overseer_phone: cluster.overseer_phone,
      description: cluster.description,
    });
  };

  const resetForm = () => {
    setEditingId(null);
    setForm({ name: "", province: "", overseer_name: "", overseer_phone: "", description: "" });
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    if (editingId) {
      await updateCluster(token, editingId, form);
      onNotice("Cluster updated.");
    } else {
      await createCluster(token, form);
      onNotice("Cluster added.");
    }
    resetForm();
    reload();
  };

  const handleDelete = async (id) => {
    await deleteCluster(token, id);
    setConfirmDeleteId(null);
    reload();
    onNotice("Cluster removed. Its branches were kept and just detached from it.");
  };

  return (
    <>
      <h2>Clusters</h2>
      <div className="admin-list">
        {clusters.length === 0 && <p className="empty-note">No clusters yet.</p>}
        {clusters.map((c) => (
          <div className="admin-list-row" key={c.id}>
            <div className="info">
              <b>{c.name}</b>
              <span>
                {c.province} {c.overseer_name && `· Overseer: ${c.overseer_name}`}
              </span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="link-btn" style={{ color: "var(--accent)" }} onClick={() => startEdit(c)}>
                Edit
              </button>
              {confirmDeleteId === c.id ? (
                <>
                  <button className="link-btn" onClick={() => handleDelete(c.id)}>
                    Confirm remove (detaches branches)
                  </button>
                  <button className="link-btn" style={{ color: "var(--ink-muted)" }} onClick={() => setConfirmDeleteId(null)}>
                    Cancel
                  </button>
                </>
              ) : (
                <button className="link-btn" onClick={() => setConfirmDeleteId(c.id)}>
                  Remove
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <form className="admin-form-grid" onSubmit={submit} style={{ marginTop: 16 }}>
        <div className="field">
          <label>Cluster name</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="field">
          <label>Province</label>
          <input value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value })} />
        </div>
        <div className="field">
          <label>Overseer name</label>
          <input value={form.overseer_name} onChange={(e) => setForm({ ...form, overseer_name: e.target.value })} />
        </div>
        <div className="field">
          <label>Overseer phone</label>
          <input value={form.overseer_phone} onChange={(e) => setForm({ ...form, overseer_phone: e.target.value })} />
        </div>
        <div className="field" style={{ gridColumn: "1 / -1" }}>
          <label>Description</label>
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <div style={{ gridColumn: "1 / -1", display: "flex", gap: 10 }}>
          <button className="btn btn-primary" type="submit">
            {editingId ? "Save Cluster" : "Add Cluster"}
          </button>
          {editingId && (
            <button className="btn btn-outline on-light" type="button" onClick={resetForm}>
              Cancel
            </button>
          )}
        </div>
      </form>
    </>
  );
}
