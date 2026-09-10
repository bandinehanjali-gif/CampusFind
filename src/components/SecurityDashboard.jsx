import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

function SecurityDashboard({ setPage, user }) {
  // ==========================================
  // STATE
  // ==========================================

  const [lostItems, setLostItems] = useState([]);
  const [foundItems, setFoundItems] = useState([]);
  const [claims, setClaims] = useState([]);

  const [activeSection, setActiveSection] =
    useState("overview");

  const [loading, setLoading] =
    useState(true);

  const [actionLoading, setActionLoading] =
    useState(null);

  const [errorMessage, setErrorMessage] =
    useState("");

  // ==========================================
  // LOAD ALL SECURITY DATA
  // ==========================================

  async function loadSecurityData() {
    try {
      setLoading(true);
      setErrorMessage("");

      // ----------------------------------------
      // LOST ITEMS
      // ----------------------------------------

      const {
        data: lostData,
        error: lostError,
      } = await supabase
        .from("lost_items")
        .select("*")
        .order("created_at", {
          ascending: false,
        });

      if (lostError) {
        throw lostError;
      }

      // ----------------------------------------
      // FOUND ITEMS
      // ----------------------------------------

      const {
        data: foundData,
        error: foundError,
      } = await supabase
        .from("found_items")
        .select("*")
        .order("created_at", {
          ascending: false,
        });

      if (foundError) {
        throw foundError;
      }

      // ----------------------------------------
      // CLAIMS
      // ----------------------------------------

      const {
        data: claimData,
        error: claimError,
      } = await supabase
        .from("claims")
        .select("*")
        .order("created_at", {
          ascending: false,
        });

      if (claimError) {
        throw claimError;
      }

      console.log(
        "Security lost items:",
        lostData
      );

      console.log(
        "Security found items:",
        foundData
      );

      console.log(
        "Security claims:",
        claimData
      );

      setLostItems(lostData || []);
      setFoundItems(foundData || []);
      setClaims(claimData || []);

    } catch (error) {
      console.error(
        "Security dashboard error:",
        error
      );

      setErrorMessage(
        error?.message ||
          "Unable to load security data."
      );
    } finally {
      setLoading(false);
    }
  }

  // ==========================================
  // INITIAL LOAD
  // ==========================================

  useEffect(() => {
    loadSecurityData();
  }, []);

  // ==========================================
  // REALTIME
  // ==========================================

  useEffect(() => {
    console.log(
      "Starting Security realtime..."
    );

    const lostChannel = supabase
      .channel("security-lost-items")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "lost_items",
        },
        (payload) => {
          console.log(
            "Security lost item realtime:",
            payload
          );

          if (
            payload.eventType === "INSERT"
          ) {
            setLostItems(
              (current) => [
                payload.new,
                ...current,
              ]
            );
          }

          if (
            payload.eventType === "UPDATE"
          ) {
            setLostItems(
              (current) =>
                current.map((item) =>
                  item.id ===
                  payload.new.id
                    ? payload.new
                    : item
                )
            );
          }

          if (
            payload.eventType === "DELETE"
          ) {
            setLostItems(
              (current) =>
                current.filter(
                  (item) =>
                    item.id !==
                    payload.old.id
                )
            );
          }
        }
      )
      .subscribe();

    const foundChannel = supabase
      .channel("security-found-items")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "found_items",
        },
        (payload) => {
          console.log(
            "Security found item realtime:",
            payload
          );

          if (
            payload.eventType === "INSERT"
          ) {
            setFoundItems(
              (current) => [
                payload.new,
                ...current,
              ]
            );
          }

          if (
            payload.eventType === "UPDATE"
          ) {
            setFoundItems(
              (current) =>
                current.map((item) =>
                  item.id ===
                  payload.new.id
                    ? payload.new
                    : item
                )
            );
          }

          if (
            payload.eventType === "DELETE"
          ) {
            setFoundItems(
              (current) =>
                current.filter(
                  (item) =>
                    item.id !==
                    payload.old.id
                )
            );
          }
        }
      )
      .subscribe();

    const claimsChannel = supabase
      .channel("security-claims")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "claims",
        },
        (payload) => {
          console.log(
            "Security claim realtime:",
            payload
          );

          if (
            payload.eventType === "INSERT"
          ) {
            setClaims(
              (current) => [
                payload.new,
                ...current,
              ]
            );
          }

          if (
            payload.eventType === "UPDATE"
          ) {
            setClaims(
              (current) =>
                current.map((claim) =>
                  claim.id ===
                  payload.new.id
                    ? payload.new
                    : claim
                )
            );
          }

          if (
            payload.eventType === "DELETE"
          ) {
            setClaims(
              (current) =>
                current.filter(
                  (claim) =>
                    claim.id !==
                    payload.old.id
                )
            );
          }
        }
      )
      .subscribe();

    // ========================================
    // CLEANUP
    // ========================================

    return () => {
      supabase.removeChannel(
        lostChannel
      );

      supabase.removeChannel(
        foundChannel
      );

      supabase.removeChannel(
        claimsChannel
      );
    };
  }, []);

  // ==========================================
  // UPDATE LOST ITEM STATUS
  // ==========================================

  async function updateLostStatus(
    itemId,
    newStatus
  ) {
    try {
      setActionLoading(
        `lost-${itemId}`
      );

      setErrorMessage("");

      const { error } =
        await supabase
          .from("lost_items")
          .update({
            status: newStatus,
          })
          .eq("id", itemId);

      if (error) {
        throw error;
      }

      console.log(
        "Lost item status updated:",
        itemId,
        newStatus
      );

    } catch (error) {
      console.error(
        "Lost status update error:",
        error
      );

      setErrorMessage(
        error?.message ||
          "Unable to update lost item."
      );
    } finally {
      setActionLoading(null);
    }
  }

  // ==========================================
  // UPDATE FOUND ITEM STATUS
  // ==========================================

  async function updateFoundStatus(
    itemId,
    newStatus
  ) {
    try {
      setActionLoading(
        `found-${itemId}`
      );

      setErrorMessage("");

      const { error } =
        await supabase
          .from("found_items")
          .update({
            status: newStatus,
          })
          .eq("id", itemId);

      if (error) {
        throw error;
      }

      console.log(
        "Found item status updated:",
        itemId,
        newStatus
      );

    } catch (error) {
      console.error(
        "Found status update error:",
        error
      );

      setErrorMessage(
        error?.message ||
          "Unable to update found item."
      );
    } finally {
      setActionLoading(null);
    }
  }

  // ==========================================
  // APPROVE CLAIM
  // ==========================================

  async function approveClaim(claim) {
    try {
      setActionLoading(
        `claim-${claim.id}`
      );

      setErrorMessage("");

      // ----------------------------------------
      // UPDATE CLAIM
      // ----------------------------------------

      const {
        error: claimError,
      } = await supabase
        .from("claims")
        .update({
          status: "Approved",
        })
        .eq("id", claim.id);

      if (claimError) {
        throw claimError;
      }

      // ----------------------------------------
      // UPDATE FOUND ITEM
      // ----------------------------------------

      const {
        error: foundError,
      } = await supabase
        .from("found_items")
        .update({
          status: "Returned",
        })
        .eq(
          "id",
          claim.found_item_id
        );

      if (foundError) {
        throw foundError;
      }

      // ----------------------------------------
      // UPDATE MATCHING LOST ITEM
      // ----------------------------------------

      const matchingLostItem =
        lostItems.find(
          (item) =>
            item.object_name
              ?.toLowerCase() ===
            foundItems
              .find(
                (found) =>
                  found.id ===
                  claim.found_item_id
              )
              ?.object_name?.toLowerCase()
        );

      if (matchingLostItem) {
        await supabase
          .from("lost_items")
          .update({
            status: "Found",
          })
          .eq(
            "id",
            matchingLostItem.id
          );
      }

      alert(
        "Claim approved successfully! ✅"
      );

    } catch (error) {
      console.error(
        "Approve claim error:",
        error
      );

      setErrorMessage(
        error?.message ||
          "Unable to approve claim."
      );
    } finally {
      setActionLoading(null);
    }
  }

  // ==========================================
  // REJECT CLAIM
  // ==========================================

  async function rejectClaim(claim) {
    try {
      setActionLoading(
        `claim-${claim.id}`
      );

      setErrorMessage("");

      const { error } =
        await supabase
          .from("claims")
          .update({
            status: "Rejected",
          })
          .eq("id", claim.id);

      if (error) {
        throw error;
      }

      alert(
        "Claim rejected."
      );

    } catch (error) {
      console.error(
        "Reject claim error:",
        error
      );

      setErrorMessage(
        error?.message ||
          "Unable to reject claim."
      );
    } finally {
      setActionLoading(null);
    }
  }

  // ==========================================
  // FORMAT DATE
  // ==========================================

  function formatDate(date) {
    if (!date) {
      return "Not provided";
    }

    return new Date(
      `${date}T00:00:00`
    ).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  }

  // ==========================================
  // COUNTS
  // ==========================================

  const totalLost =
    lostItems.length;

  const totalFound =
    foundItems.length;

  const pendingClaims =
    claims.filter(
      (claim) =>
        claim.status === "Pending"
    ).length;

  const foundLostItems =
    lostItems.filter(
      (item) =>
        item.status === "Found"
    ).length;

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <main className="security-page">

        <div className="security-container">

          <div className="security-loading">
            🛡️ Loading Security Dashboard...
          </div>

        </div>

      </main>
    );
  }

  // ==========================================
  // DASHBOARD
  // ==========================================

  return (
    <main className="security-page">

      <div className="security-container">

        {/* =====================================
            HEADER
        ===================================== */}

        <div className="security-header">

          <div>

            <div className="security-title-icon">
              🛡️
            </div>

            <h1>
              Security Dashboard
            </h1>

            <p>
              Manage campus lost &
              found reports
            </p>

          </div>

          <button
            className="security-logout-button"
            onClick={() =>
              setPage("dashboard")
            }
          >
            ← Dashboard
          </button>

        </div>

        {/* =====================================
            ERROR
        ===================================== */}

        {errorMessage && (
          <div className="security-error">
            ❌ {errorMessage}
          </div>
        )}

        {/* =====================================
            NAVIGATION
        ===================================== */}

        <div className="security-tabs">

          <button
            className={
              activeSection ===
              "overview"
                ? "security-tab active"
                : "security-tab"
            }
            onClick={() =>
              setActiveSection(
                "overview"
              )
            }
          >
            📊 Overview
          </button>

          <button
            className={
              activeSection ===
              "lost"
                ? "security-tab active"
                : "security-tab"
            }
            onClick={() =>
              setActiveSection(
                "lost"
              )
            }
          >
            🔍 Lost Reports
          </button>

          <button
            className={
              activeSection ===
              "found"
                ? "security-tab active"
                : "security-tab"
            }
            onClick={() =>
              setActiveSection(
                "found"
              )
            }
          >
            📦 Found Reports
          </button>

          <button
            className={
              activeSection ===
              "claims"
                ? "security-tab active"
                : "security-tab"
            }
            onClick={() =>
              setActiveSection(
                "claims"
              )
            }
          >
            📩 Claims
            {pendingClaims > 0 && (
              <span className="security-badge">
                {pendingClaims}
              </span>
            )}
          </button>

        </div>

        {/* =====================================
            OVERVIEW
        ===================================== */}

        {activeSection ===
          "overview" && (
          <section>

            <div className="security-cards">

              <div className="security-stat-card">

                <span>🔍</span>

                <div>
                  <h3>
                    {totalLost}
                  </h3>

                  <p>
                    Total Lost Reports
                  </p>
                </div>

              </div>

              <div className="security-stat-card">

                <span>📦</span>

                <div>
                  <h3>
                    {totalFound}
                  </h3>

                  <p>
                    Total Found Reports
                  </p>
                </div>

              </div>

              <div className="security-stat-card">

                <span>📩</span>

                <div>
                  <h3>
                    {pendingClaims}
                  </h3>

                  <p>
                    Pending Claims
                  </p>
                </div>

              </div>

              <div className="security-stat-card">

                <span>✅</span>

                <div>
                  <h3>
                    {foundLostItems}
                  </h3>

                  <p>
                    Lost Items Found
                  </p>
                </div>

              </div>

            </div>

            <div className="security-welcome">

              <h2>
                Welcome, Security 🛡️
              </h2>

              <p>
                Use this dashboard to
                monitor lost objects,
                found objects and
                claim requests.
              </p>

            </div>

          </section>
        )}

        {/* =====================================
            LOST REPORTS
        ===================================== */}

        {activeSection ===
          "lost" && (
          <section>

            <h2 className="security-section-title">
              🔍 Lost Reports
            </h2>

            {lostItems.length ===
            0 ? (
              <div className="security-empty">
                No lost reports available.
              </div>
            ) : (
              <div className="security-grid">

                {lostItems.map(
                  (item) => (
                    <div
                      className="security-item-card"
                      key={item.id}
                    >

                      {item.image_url ? (
                        <img
                          src={
                            item.image_url
                          }
                          alt={
                            item.object_name
                          }
                          className="security-item-image"
                        />
                      ) : (
                        <div className="security-image-placeholder">
                          📦
                        </div>
                      )}

                      <div className="security-item-content">

                        <h3>
                          {
                            item.object_name
                          }
                        </h3>

                        <p>
                          <strong>
                            Category:
                          </strong>{" "}
                          {
                            item.category
                          }
                        </p>

                        <p>
                          <strong>
                            Location:
                          </strong>{" "}
                          {
                            item.location
                          }
                        </p>

                        <p>
                          <strong>
                            Date:
                          </strong>{" "}
                          {formatDate(
                            item.lost_date
                          )}
                        </p>

                        <div
                          className={`security-status ${item.status === "Found"
                            ? "security-found"
                            : "security-not-found"
                          }`}
                        >
                          {item.status}
                        </div>

                        <select
                          value={
                            item.status
                          }
                          disabled={
                            actionLoading ===
                            `lost-${item.id}`
                          }
                          onChange={(
                            event
                          ) =>
                            updateLostStatus(
                              item.id,
                              event
                                .target
                                .value
                            )
                          }
                        >
                          <option value="Not Found">
                            Not Found
                          </option>

                          <option value="Found">
                            Found
                          </option>

                          <option value="Claim Requested">
                            Claim Requested
                          </option>
                        </select>

                      </div>

                    </div>
                  )
                )}

              </div>
            )}

          </section>
        )}

        {/* =====================================
            FOUND REPORTS
        ===================================== */}

        {activeSection ===
          "found" && (
          <section>

            <h2 className="security-section-title">
              📦 Found Reports
            </h2>

            {foundItems.length ===
            0 ? (
              <div className="security-empty">
                No found reports available.
              </div>
            ) : (
              <div className="security-grid">

                {foundItems.map(
                  (item) => (
                    <div
                      className="security-item-card"
                      key={item.id}
                    >

                      {item.image_url ? (
                        <img
                          src={
                            item.image_url
                          }
                          alt={
                            item.object_name
                          }
                          className="security-item-image"
                        />
                      ) : (
                        <div className="security-image-placeholder">
                          📦
                        </div>
                      )}

                      <div className="security-item-content">

                        <h3>
                          {
                            item.object_name
                          }
                        </h3>

                        <p>
                          <strong>
                            Category:
                          </strong>{" "}
                          {
                            item.category
                          }
                        </p>

                        <p>
                          <strong>
                            Location:
                          </strong>{" "}
                          {
                            item.location
                          }
                        </p>

                        <p>
                          <strong>
                            Date:
                          </strong>{" "}
                          {formatDate(
                            item.found_date
                          )}
                        </p>

                        <div className="security-status security-found">
                          {
                            item.status
                          }
                        </div>

                        <select
                          value={
                            item.status
                          }
                          disabled={
                            actionLoading ===
                            `found-${item.id}`
                          }
                          onChange={(
                            event
                          ) =>
                            updateFoundStatus(
                              item.id,
                              event
                                .target
                                .value
                            )
                          }
                        >
                          <option value="Available">
                            Available
                          </option>

                          <option value="Claim Requested">
                            Claim Requested
                          </option>

                          <option value="Returned">
                            Returned
                          </option>

                        </select>

                      </div>

                    </div>
                  )
                )}

              </div>
            )}

          </section>
        )}

        {/* =====================================
            CLAIMS
        ===================================== */}

        {activeSection ===
          "claims" && (
          <section>

            <h2 className="security-section-title">
              📩 Claim Requests
            </h2>

            {claims.length ===
            0 ? (
              <div className="security-empty">
                No claim requests yet.
              </div>
            ) : (
              <div className="security-claims">

                {claims.map(
                  (claim) => {

                    const foundItem =
                      foundItems.find(
                        (item) =>
                          item.id ===
                          claim.found_item_id
                      );

                    return (
                      <div
                        className="security-claim-card"
                        key={claim.id}
                      >

                        <div>

                          <h3>
                            {foundItem
                              ?.object_name ||
                              "Found Item"}
                          </h3>

                          <p>
                            <strong>
                              Claim ID:
                            </strong>{" "}
                            {claim.id}
                          </p>

                          <p>
                            <strong>
                              Claimant:
                            </strong>{" "}
                            {claim.claimant_id}
                          </p>

                          <p>
                            <strong>
                              Submitted:
                            </strong>{" "}
                            {new Date(
                              claim.created_at
                            ).toLocaleString(
                              "en-IN"
                            )}
                          </p>

                          <div
                            className={`security-claim-status ${claim.status === "Approved"
                              ? "security-approved"
                              : claim.status === "Rejected"
                              ? "security-rejected"
                              : "security-pending"
                            }`}
                          >
                            {claim.status}
                          </div>

                        </div>

                        {claim.status ===
                          "Pending" && (
                          <div className="security-claim-actions">

                            <button
                              className="approve-button"
                              disabled={
                                actionLoading ===
                                `claim-${claim.id}`
                              }
                              onClick={() =>
                                approveClaim(
                                  claim
                                )
                              }
                            >
                              {actionLoading ===
                              `claim-${claim.id}`
                                ? "Processing..."
                                : "✓ Approve"}
                            </button>

                            <button
                              className="reject-button"
                              disabled={
                                actionLoading ===
                                `claim-${claim.id}`
                              }
                              onClick={() =>
                                rejectClaim(
                                  claim
                                )
                              }
                            >
                              ✕ Reject
                            </button>

                          </div>
                        )}

                      </div>
                    );
                  }
                )}

              </div>
            )}

          </section>
        )}

        {/* =====================================
            REALTIME
        ===================================== */}

        <div className="security-realtime">
          <span>●</span>
          Live security updates enabled
        </div>

      </div>

    </main>
  );
}

export default SecurityDashboard;