import React, { useState, useContext, useEffect, useMemo } from "react";
import axios from "axios";
import GeneralContext from "../GeneralContext";
import KiteDatePicker from "../common/KiteDatePicker";
import "./NomineeModal.css";

const API_BASE = "http://localhost:3002";

const createDefaultNominee = (index, allocation = 100) => ({
  id: index + 1,
  fullName: "",
  relationship: "Spouse",
  dob: "",
  isMinor: false,
  guardian: {
    fullName: "",
    relationship: "Father",
    idType: "PAN",
    idNumber: "",
    phone: "",
    address: "",
  },
  idType: "PAN",
  idNumber: "",
  email: "",
  phone: "",
  address: "",
  sameAddressAsUser: false,
  allocation: allocation,
});

const NomineeModal = ({ isOpen, onClose }) => {
  const { currentUser, showToast, updateUser, refreshPortfolio } = useContext(GeneralContext);

  const [mode, setMode] = useState("add"); // "add" | "view"
  const [activeTab, setActiveTab] = useState(0); // 0, 1, 2
  const [nominees, setNominees] = useState([createDefaultNominee(0, 100)]);
  const [declared, setDeclared] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Real dynamic user profile details loaded from DB session
  const [dematDetails, setDematDetails] = useState({
    demat: currentUser?.demat || "",
    pan: currentUser?.pan || "",
  });
  const [userAddress, setUserAddress] = useState(currentUser?.address || "");

  const activeUserId = currentUser?.userId || localStorage.getItem("zerodha_userId") || "ZU9344";

  // Fetch dynamic user nominee records & demat data from database
  useEffect(() => {
    if (isOpen && activeUserId) {
      axios
        .get(`${API_BASE}/getNominee`, { params: { userId: activeUserId } })
        .then((res) => {
          if (res.data) {
            setDematDetails({
              demat: res.data.demat || currentUser?.demat || "",
              pan: res.data.pan || currentUser?.pan || "",
            });
            if (res.data.address) {
              setUserAddress(res.data.address);
            }
          }
          if (Array.isArray(res.data?.nominees) && res.data.nominees.length > 0) {
            setNominees(
              res.data.nominees.map((n, i) => ({
                id: i + 1,
                fullName: n.fullName || "",
                relationship: n.relationship || "Spouse",
                dob: n.dob || "",
                isMinor: !!n.isMinor,
                guardian: n.guardian || {
                  fullName: "",
                  relationship: "Father",
                  idType: "PAN",
                  idNumber: "",
                  phone: "",
                  address: "",
                },
                idType: n.idType || "PAN",
                idNumber: n.idNumber || n.pan || "",
                email: n.email || "",
                phone: n.phone || "",
                address: n.address || "",
                sameAddressAsUser: false,
                allocation: n.allocation || 100,
              }))
            );
            if (res.data?.nomineeStatus === "VERIFIED") {
              setMode("view");
            }
          } else if (res.data?.nominee?.fullName && res.data.nominee.fullName !== "Opted out") {
            setNominees([
              {
                id: 1,
                fullName: res.data.nominee.fullName,
                relationship: res.data.nominee.relationship || "Spouse",
                dob: res.data.nominee.dob || "",
                isMinor: !!res.data.nominee.isMinor,
                guardian: res.data.nominee.guardian || {
                  fullName: "",
                  relationship: "Father",
                  idType: "PAN",
                  idNumber: "",
                  phone: "",
                  address: "",
                },
                idType: res.data.nominee.idType || "PAN",
                idNumber: res.data.nominee.idNumber || res.data.nominee.pan || "",
                email: res.data.nominee.email || "",
                phone: res.data.nominee.phone || "",
                address: res.data.nominee.address || "",
                sameAddressAsUser: false,
                allocation: res.data.nominee.allocation || 100,
              },
            ]);
            if (res.data?.nomineeStatus === "VERIFIED") {
              setMode("view");
            }
          }
        })
        .catch(() => {});
    }
  }, [isOpen, activeUserId, currentUser]);

  const totalAllocation = useMemo(() => {
    return nominees.reduce((acc, n) => acc + (Number(n.allocation) || 0), 0);
  }, [nominees]);

  const isAllocationValid = Math.round(totalAllocation) === 100;

  if (!isOpen) return null;

  // Active nominee updater helper
  const updateActiveNominee = (patch) => {
    setNominees((prev) =>
      prev.map((n, idx) => (idx === activeTab ? { ...n, ...patch } : n))
    );
  };

  const updateActiveGuardian = (patch) => {
    setNominees((prev) =>
      prev.map((n, idx) =>
        idx === activeTab ? { ...n, guardian: { ...n.guardian, ...patch } } : n
      )
    );
  };

  // Add a nominee tab (up to 3)
  const handleAddNomineeTab = () => {
    if (nominees.length >= 3) {
      showToast("Limit Reached", "SEBI permits maximum 3 nominees per demat account.", "error");
      return;
    }
    const remainingAlloc = Math.max(0, 100 - totalAllocation);
    const newNominee = createDefaultNominee(nominees.length, remainingAlloc);
    setNominees((prev) => [...prev, newNominee]);
    setActiveTab(nominees.length);
  };

  // Remove nominee tab
  const handleRemoveNomineeTab = (e, index) => {
    e.stopPropagation();
    if (nominees.length <= 1) return;
    const removedAlloc = nominees[index]?.allocation || 0;
    const nextNominees = nominees.filter((_, idx) => idx !== index);
    if (nextNominees[0]) {
      nextNominees[0].allocation = Math.min(100, nextNominees[0].allocation + removedAlloc);
    }
    setNominees(nextNominees);
    setActiveTab((prev) => Math.max(0, prev >= nextNominees.length ? nextNominees.length - 1 : prev));
  };

  // Equal split allocation helper
  const handleSplitEqually = () => {
    const count = nominees.length;
    if (count === 1) {
      setNominees((prev) => [{ ...prev[0], allocation: 100 }]);
    } else if (count === 2) {
      setNominees((prev) => [
        { ...prev[0], allocation: 50 },
        { ...prev[1], allocation: 50 },
      ]);
    } else if (count === 3) {
      setNominees((prev) => [
        { ...prev[0], allocation: 34 },
        { ...prev[1], allocation: 33 },
        { ...prev[2], allocation: 33 },
      ]);
    }
    showToast("Allocation Adjusted", "Allocations split equally across nominees.", "info");
  };

  // Address prefill toggle from dynamic user profile
  const handleToggleSameAddress = (checked) => {
    const registeredAddr = userAddress || currentUser?.address || "";
    if (checked && !registeredAddr) {
      showToast(
        "No Address On File",
        "No registered address found in profile. Please enter nominee address manually.",
        "info"
      );
    }
    updateActiveNominee({
      sameAddressAsUser: checked,
      address: checked ? registeredAddr : "",
    });
  };

  // Submit all nominees
  const handleSubmitAllNominees = async (e) => {
    e.preventDefault();

    // 1. Check allocations
    if (!isAllocationValid) {
      showToast(
        "Allocation Mismatch",
        `Total allocation must be exactly 100% (currently ${totalAllocation}%).`,
        "error"
      );
      return;
    }

    // 2. Validate each nominee
    for (let i = 0; i < nominees.length; i++) {
      const n = nominees[i];
      const nomineeNum = i + 1;

      if (!n.fullName.trim()) {
        setActiveTab(i);
        showToast("Missing Name", `Please enter full legal name for Nominee ${nomineeNum}.`, "error");
        return;
      }
      if (!n.dob) {
        setActiveTab(i);
        showToast("Missing DOB", `Please provide date of birth for Nominee ${nomineeNum}.`, "error");
        return;
      }
      if (n.isMinor) {
        if (!n.guardian?.fullName?.trim()) {
          setActiveTab(i);
          showToast(
            "Guardian Required",
            `Nominee ${nomineeNum} is a minor. Guardian legal name is mandatory.`,
            "error"
          );
          return;
        }
      }

      // Check ID format
      if (n.idType === "PAN" && n.idNumber.trim()) {
        const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
        if (!panRegex.test(n.idNumber.trim().toUpperCase())) {
          setActiveTab(i);
          showToast(
            "Invalid PAN",
            `Nominee ${nomineeNum}: PAN format is invalid. Please verify the 10 characters.`,
            "error"
          );
          return;
        }
      } else if (n.idType === "AADHAAR_LAST4" && n.idNumber.trim()) {
        const aadhaarRegex = /^[0-9]{4}$/;
        if (!aadhaarRegex.test(n.idNumber.trim())) {
          setActiveTab(i);
          showToast(
            "Invalid Aadhaar",
            `Nominee ${nomineeNum}: Please enter the last 4 digits of Aadhaar.`,
            "error"
          );
          return;
        }
      }
    }

    if (!declared) {
      showToast("Declaration Required", "Please accept the SEBI CDSL nomination declaration.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await axios.post(`${API_BASE}/addNominee`, {
        userId: activeUserId,
        nominees,
        optOut: false,
      });

      if (res.data?.success) {
        showToast(
          "Nominees Registered",
          `Successfully registered ${nominees.length} nominee(s) with CDSL Demat records!`,
          "success"
        );
        updateUser({ nomineeStatus: "VERIFIED", nominee: nominees[0] });
        if (refreshPortfolio) refreshPortfolio();
        setMode("view");
      }
    } catch (err) {
      showToast("Registration Failed", err.response?.data?.message || err.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Opt-out flow
  const handleOptOut = async () => {
    if (
      !window.confirm(
        "Are you sure you want to opt out of nomination? SEBI recommends adding nominees to protect account holdings."
      )
    )
      return;

    setIsSubmitting(true);
    try {
      const res = await axios.post(`${API_BASE}/addNominee`, {
        userId: activeUserId,
        optOut: true,
      });
      if (res.data?.success) {
        showToast("Nomination Opted Out", "Opt-out declaration recorded with CDSL.", "info");
        updateUser({ nomineeStatus: "OPTED_OUT", nominee: null });
        if (refreshPortfolio) refreshPortfolio();
        onClose();
      }
    } catch (err) {
      showToast("Error", err.response?.data?.message || err.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const curr = nominees[activeTab] || nominees[0];

  return (
    <div className="nominee-modal-overlay" onClick={onClose}>
      <div className="nominee-modal-box" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="nominee-modal-header">
          <div>
            <div className="nominee-header-meta">
              <span className="nominee-sebi-pill">SEBI MANDATE</span>
              <span className="nominee-boid-pill">
                BO ID: {dematDetails.demat || "Allocating Demat BO ID..."}
              </span>
            </div>
            <h3 className="nominee-modal-title">
              {mode === "view"
                ? "Demat Account Nominee Records (CDSL Synced)"
                : "Add Nominee to CDSL Demat Account"}
            </h3>
          </div>
          <button className="nominee-modal-close-btn" onClick={onClose} aria-label="Close">
            &times;
          </button>
        </div>

        {/* Compliance Notice Banner */}
        <div className="nominee-compliance-notice">
          <div className="compliance-info-left">
            <i className="fa-solid fa-shield-halved compliance-shield-icon"></i>
            <span>
              <strong>Circular SEBI/HO/MIRSD/RTAMB/CIR:</strong> Register up to 3 nominees for securities held in Demat.
            </span>
          </div>
          {mode === "add" && (
            <div className={`allocation-summary-pill ${isAllocationValid ? "valid" : "invalid"}`}>
              <span>Total: {totalAllocation}%</span>
              {!isAllocationValid && (
                <button
                  type="button"
                  className="add-nominee-pill-btn"
                  onClick={handleSplitEqually}
                  title="Split equally across nominees"
                  style={{ padding: "2px 6px", fontSize: "10.5px" }}
                >
                  Split
                </button>
              )}
            </div>
          )}
        </div>

        {/* =================================================================
            MODE: VIEW EXISTING NOMINEES
            ================================================================= */}
        {mode === "view" ? (
          <div className="nominee-view-container">
            <div className="cdsl-certificate-card">
              <div className="certificate-header">
                <div className="cert-title-group">
                  <h4>CENTRAL DEPOSITORY SERVICES (INDIA) LIMITED</h4>
                  <span>Demat Account Nomination Acknowledgment</span>
                </div>
                <div className="cert-stamp-badge">
                  <i className="fa-solid fa-circle-check"></i>
                  VERIFIED &amp; COMPLIANT
                </div>
              </div>

              <div className="certificate-nominees-list">
                {nominees.map((n, idx) => (
                  <div key={idx} className="cert-nominee-row">
                    <div className="cert-nominee-title">
                      <div>
                        <span className="nominee-display-name">{n.fullName}</span>
                        <span className="nominee-display-rel">({n.relationship})</span>
                        {n.isMinor && (
                          <span
                            style={{
                              marginLeft: "8px",
                              fontSize: "11px",
                              color: "#b45309",
                              background: "#fef3c7",
                              padding: "2px 6px",
                              borderRadius: "3px",
                              fontWeight: 600,
                            }}
                          >
                            Minor
                          </span>
                        )}
                      </div>
                      <span className="nominee-display-alloc">{n.allocation}% Share</span>
                    </div>

                    <div className="cert-details-grid">
                      <div className="cert-field">
                        <span className="cert-field-lbl">Date of Birth</span>
                        <span className="cert-field-val">{n.dob || "—"}</span>
                      </div>
                      <div className="cert-field">
                        <span className="cert-field-lbl">ID Proof ({n.idType || "PAN"})</span>
                        <span className="cert-field-val">{n.idNumber || n.pan || "On File"}</span>
                      </div>
                      <div className="cert-field">
                        <span className="cert-field-lbl">Mobile / Email</span>
                        <span className="cert-field-val">
                          {n.phone || n.email ? `${n.phone || ""} ${n.email || ""}` : "Registered"}
                        </span>
                      </div>
                    </div>

                    {n.isMinor && n.guardian?.fullName && (
                      <div className="cert-guardian-banner">
                        <strong>Guardian:</strong> {n.guardian.fullName} ({n.guardian.relationship})
                        {n.guardian.idNumber && ` | ID: ${n.guardian.idNumber}`}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="nominee-modal-footer" style={{ padding: "16px 0 0 0" }}>
              <div className="footer-left">
                <span style={{ fontSize: "12px", color: "#64748b" }}>
                  CDSL Demat BO ID: <strong>{dematDetails.demat || "Allocated"}</strong>
                </span>
              </div>
              <div className="footer-right">
                <button
                  type="button"
                  className="btn-kite-secondary"
                  onClick={() => setMode("add")}
                >
                  Modify Nominees
                </button>
                <button type="button" className="btn-kite-primary" onClick={onClose}>
                  Done
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* =================================================================
             MODE: ADD / EDIT NOMINEES FORM
             ================================================================= */
          <form onSubmit={handleSubmitAllNominees} style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
            {/* Multi-Nominee Tabs Bar */}
            <div className="nominee-tabs-bar">
              <div className="nominee-tab-buttons">
                {nominees.map((n, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`nominee-tab-btn ${activeTab === idx ? "active" : ""}`}
                    onClick={() => setActiveTab(idx)}
                  >
                    <span>{n.fullName.trim() ? n.fullName.split(" ")[0] : `Nominee ${idx + 1}`}</span>
                    <span className="tab-alloc-badge">{n.allocation}%</span>
                    {nominees.length > 1 && (
                      <span
                        className="remove-nominee-btn"
                        onClick={(e) => handleRemoveNomineeTab(e, idx)}
                        title="Remove nominee"
                      >
                        &times;
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {nominees.length < 3 && (
                <button
                  type="button"
                  className="add-nominee-pill-btn"
                  onClick={handleAddNomineeTab}
                >
                  <i className="fa-solid fa-plus"></i> Add Nominee {nominees.length + 1}
                </button>
              )}
            </div>

            {/* Scrollable Form Body */}
            <div className="nominee-scroll-body">
              {/* Section 1: Nominee Legal Identity */}
              <div className="form-section-title">
                <i className="fa-solid fa-user-check"></i>
                <span>Nominee Identity ({activeTab + 1} of {nominees.length})</span>
              </div>

              <div className="nominee-grid">
                <div className="nominee-form-group">
                  <label className="nominee-form-label">
                    Nominee Legal Name <span className="label-required">*</span>
                  </label>
                  <input
                    type="text"
                    className="nominee-input-field"
                    placeholder="As per official Govt ID proof"
                    value={curr.fullName}
                    onChange={(e) => updateActiveNominee({ fullName: e.target.value })}
                    required
                    autoFocus
                  />
                </div>

                <div className="nominee-form-group">
                  <label className="nominee-form-label">
                    Relationship with Account Holder <span className="label-required">*</span>
                  </label>
                  <select
                    className="nominee-input-field"
                    value={curr.relationship}
                    onChange={(e) => updateActiveNominee({ relationship: e.target.value })}
                  >
                    <option value="Spouse">Spouse</option>
                    <option value="Father">Father</option>
                    <option value="Mother">Mother</option>
                    <option value="Son">Son</option>
                    <option value="Daughter">Daughter</option>
                    <option value="Brother">Brother</option>
                    <option value="Sister">Sister</option>
                    <option value="Grandson">Grandson</option>
                    <option value="Granddaughter">Granddaughter</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="nominee-form-group">
                  <label className="nominee-form-label">
                    Date of Birth <span className="label-required">*</span>
                  </label>
                  <KiteDatePicker
                    value={curr.dob}
                    placeholder="DD-MM-YYYY (e.g. 15 Aug 1996)"
                    onChange={(newDob) => {
                      let isMinorAuto = curr.isMinor;
                      if (newDob) {
                        const parts = newDob.split("-");
                        if (parts.length === 3) {
                          const birth = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
                          const today = new Date();
                          let age = today.getFullYear() - birth.getFullYear();
                          const m = today.getMonth() - birth.getMonth();
                          if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
                          isMinorAuto = age < 18;
                        }
                      }
                      updateActiveNominee({ dob: newDob, isMinor: isMinorAuto });
                    }}
                  />
                </div>

                {/* ID Proof Selection */}
                <div className="nominee-form-group">
                  <label className="nominee-form-label">
                    ID Proof Type
                  </label>
                  <select
                    className="nominee-input-field"
                    value={curr.idType}
                    onChange={(e) => updateActiveNominee({ idType: e.target.value, idNumber: "" })}
                  >
                    <option value="PAN">PAN Card (Recommended)</option>
                    <option value="AADHAAR_LAST4">Aadhaar (Last 4 Digits)</option>
                    <option value="PASSPORT">Passport</option>
                    <option value="VOTER_ID">Voter ID</option>
                    <option value="NONE">None / Form 60</option>
                  </select>
                </div>

                {curr.idType !== "NONE" && (
                  <div className="nominee-form-group full-col">
                    <label className="nominee-form-label">
                      {curr.idType === "PAN" && "Nominee PAN Number"}
                      {curr.idType === "AADHAAR_LAST4" && "Last 4 Digits of Aadhaar Card"}
                      {curr.idType === "PASSPORT" && "Passport File Number"}
                      {curr.idType === "VOTER_ID" && "Voter ID Card Number"}
                      <span className="label-hint">
                        {curr.idType === "PAN" && "10-character alphanumeric"}
                        {curr.idType === "AADHAAR_LAST4" && "4 numeric digits only"}
                      </span>
                    </label>
                    <input
                      type="text"
                      className="nominee-input-field"
                      placeholder={
                        curr.idType === "PAN"
                          ? "10-digit alphanumeric PAN"
                          : curr.idType === "AADHAAR_LAST4"
                          ? "Last 4 digits"
                          : "Enter document ID"
                      }
                      maxLength={curr.idType === "AADHAAR_LAST4" ? 4 : 20}
                      value={curr.idNumber}
                      onChange={(e) =>
                        updateActiveNominee({
                          idNumber: curr.idType === "PAN" ? e.target.value.toUpperCase() : e.target.value,
                        })
                      }
                    />
                  </div>
                )}
              </div>

              {/* Section 2: Minor Nominee Toggle Switch */}
              <div className="minor-toggle-card">
                <div className="minor-toggle-info">
                  <span className="minor-toggle-title">Is Nominee a Minor (Under 18)?</span>
                  <span className="minor-toggle-desc">
                    SEBI circular mandates guardian information if the nominated beneficiary is under 18 years of age.
                  </span>
                </div>
                <div className="toggle-switch-pills">
                  <button
                    type="button"
                    className={`toggle-pill-btn ${!curr.isMinor ? "active" : ""}`}
                    onClick={() => updateActiveNominee({ isMinor: false })}
                  >
                    No
                  </button>
                  <button
                    type="button"
                    className={`toggle-pill-btn ${curr.isMinor ? "active" : ""}`}
                    onClick={() => updateActiveNominee({ isMinor: true })}
                  >
                    Yes
                  </button>
                </div>
              </div>

              {/* Guardian Card (Expands when Minor is Yes) */}
              {curr.isMinor && (
                <div className="guardian-box">
                  <div className="guardian-box-header">
                    <i className="fa-solid fa-user-shield"></i>
                    <span>Guardian Details (Mandatory for Minor Nominee)</span>
                  </div>
                  <div className="nominee-grid">
                    <div className="nominee-form-group">
                      <label className="nominee-form-label">
                        Guardian Full Name <span className="label-required">*</span>
                      </label>
                      <input
                        type="text"
                        className="nominee-input-field"
                        placeholder="Guardian legal name"
                        value={curr.guardian.fullName}
                        onChange={(e) => updateActiveGuardian({ fullName: e.target.value })}
                        required={curr.isMinor}
                      />
                    </div>
                    <div className="nominee-form-group">
                      <label className="nominee-form-label">
                        Guardian Relationship <span className="label-required">*</span>
                      </label>
                      <select
                        className="nominee-input-field"
                        value={curr.guardian.relationship}
                        onChange={(e) => updateActiveGuardian({ relationship: e.target.value })}
                      >
                        <option value="Father">Father</option>
                        <option value="Mother">Mother</option>
                        <option value="Court Appointed Legal Guardian">Court Appointed Guardian</option>
                      </select>
                    </div>
                    <div className="nominee-form-group">
                      <label className="nominee-form-label">Guardian PAN / ID Proof</label>
                      <input
                        type="text"
                        className="nominee-input-field"
                        placeholder="Guardian PAN (10 characters)"
                        value={curr.guardian.idNumber}
                        onChange={(e) => updateActiveGuardian({ idNumber: e.target.value.toUpperCase() })}
                      />
                    </div>
                    <div className="nominee-form-group">
                      <label className="nominee-form-label">Guardian Mobile</label>
                      <input
                        type="tel"
                        className="nominee-input-field"
                        placeholder="10-digit mobile"
                        value={curr.guardian.phone}
                        onChange={(e) => updateActiveGuardian({ phone: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Section 3: Contact & Address Details */}
              <div className="form-section-title">
                <i className="fa-solid fa-address-book"></i>
                <span>Communication &amp; Address</span>
              </div>

              <div className="nominee-grid">
                <div className="nominee-form-group">
                  <label className="nominee-form-label">
                    Mobile Number <span className="label-hint">For CDSL SMS alerts</span>
                  </label>
                  <input
                    type="tel"
                    className="nominee-input-field"
                    placeholder="10-digit mobile number"
                    maxLength={10}
                    value={curr.phone}
                    onChange={(e) => updateActiveNominee({ phone: e.target.value.replace(/\D/g, "") })}
                  />
                </div>

                <div className="nominee-form-group">
                  <label className="nominee-form-label">
                    Email Address <span className="label-hint">For electronic CAS</span>
                  </label>
                  <input
                    type="email"
                    className="nominee-input-field"
                    placeholder="nominee@example.com"
                    value={curr.email}
                    onChange={(e) => updateActiveNominee({ email: e.target.value })}
                  />
                </div>

                <div className="nominee-form-group full-col">
                  <label className="address-prefill-row">
                    <input
                      type="checkbox"
                      checked={curr.sameAddressAsUser}
                      onChange={(e) => handleToggleSameAddress(e.target.checked)}
                    />
                    <span>Same as my registered Demat address</span>
                  </label>
                  <textarea
                    rows={2}
                    className="nominee-input-field"
                    style={{ height: "auto", padding: "8px 12px", resize: "none" }}
                    placeholder="Flat / House no, Street, Area, City, State, PIN code"
                    value={curr.address}
                    onChange={(e) => updateActiveNominee({ address: e.target.value, sameAddressAsUser: false })}
                  />
                </div>
              </div>

              {/* Section 4: Share Allocation % */}
              <div className="form-section-title">
                <i className="fa-solid fa-chart-pie"></i>
                <span>Share Allocation (%)</span>
              </div>

              <div className="allocation-controls">
                <input
                  type="range"
                  min="1"
                  max="100"
                  className="allocation-slider"
                  value={curr.allocation}
                  onChange={(e) => updateActiveNominee({ allocation: Number(e.target.value) })}
                />
                <div className="allocation-num-wrap">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    className="allocation-num-input"
                    value={curr.allocation}
                    onChange={(e) => updateActiveNominee({ allocation: Number(e.target.value) })}
                  />
                  <span className="allocation-pct-symbol">%</span>
                </div>
                {nominees.length > 1 && (
                  <button
                    type="button"
                    className="btn-kite-secondary"
                    style={{ padding: "6px 12px", fontSize: "12px" }}
                    onClick={handleSplitEqually}
                  >
                    Split Equally
                  </button>
                )}
              </div>

              {/* Declaration Checkbox */}
              <div className="nominee-declaration-box">
                <input
                  type="checkbox"
                  id="nomineeDeclarationCheck"
                  checked={declared}
                  onChange={(e) => setDeclared(e.target.checked)}
                />
                <label htmlFor="nomineeDeclarationCheck" style={{ cursor: "pointer" }}>
                  I hereby nominate the person(s) mentioned above to receive the securities held in my Zerodha Demat account in the event of my death, in accordance with Section 72 of the Companies Act and SEBI regulations.
                </label>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="nominee-modal-footer">
              <div className="footer-left">
                <button
                  type="button"
                  className="optout-text-btn"
                  onClick={handleOptOut}
                  disabled={isSubmitting}
                >
                  <i className="fa-solid fa-ban"></i> Opt out of nomination
                </button>
              </div>
              <div className="footer-right">
                <button
                  type="button"
                  className="btn-kite-secondary"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-kite-primary"
                  disabled={isSubmitting || !isAllocationValid}
                >
                  {isSubmitting ? "Submitting to CDSL..." : "Submit Nomination"}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default NomineeModal;
