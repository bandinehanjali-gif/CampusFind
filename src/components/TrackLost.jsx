import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

function TrackLost({ setPage }) {
  // ==========================================
  // STATE
  // ==========================================

  const [lostItems, setLostItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  // ==========================================
  // LOAD LOST ITEMS FROM SUPABASE
  // ==========================================

  async function loadLostItems() {
    try {
      setLoading(true);
      setErrorMessage("");

      // Get currently logged-in Supabase user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        throw new Error(
          "You are not logged in. Please login again."
        );
      }

      console.log(
        "Track Lost - Current user:",
        user.id
      );

      // Get only this user's lost items
      const { data, error } = await supabase
        .from("lost_items")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        throw error;
      }

      console.log(
        "Track Lost - Items loaded:",
        data
      );

      setLostItems(data || []);
    } catch (error) {
      console.error(
        "Track Lost - Load error:",
        error
      );

      setErrorMessage(
        error?.message ||
          "Unable to load your lost objects."
      );
    } finally {
      setLoading(false);
    }
  }

  // ==========================================
  // INITIAL LOAD
  // ==========================================

  useEffect(() => {
    loadLostItems();
  }, []);

  // ==========================================
  // SUPABASE REALTIME
  // ==========================================

  useEffect(() => {
    let channel = null;

    async function startRealtime() {
      try {
        // Get logged-in user
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          console.error(
            "Realtime user error:",
            userError
          );
          return;
        }

        if (!user) {
          console.log(
            "Realtime: No logged-in user."
          );
          return;
        }

        console.log(
          "Starting lost_items realtime..."
        );

        // ======================================
        // CREATE REALTIME CHANNEL
        // ======================================

        channel = supabase
          .channel(
            `track-lost-${user.id}-${Date.now()}`
          )
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "lost_items",
            },
            (payload) => {
              console.log(
                "REALTIME EVENT:",
                payload
              );

              // ==================================
              // INSERT
              // ==================================

              if (
                payload.eventType === "INSERT"
              ) {
                // Only add items belonging
                // to the logged-in user
                if (
                  payload.new.user_id ===
                  user.id
                ) {
                  setLostItems(
                    (currentItems) => {
                      const exists =
                        currentItems.some(
                          (item) =>
                            item.id ===
                            payload.new.id
                        );

                      if (exists) {
                        return currentItems;
                      }

                      return [
                        payload.new,
                        ...currentItems,
                      ];
                    }
                  );

                  console.log(
                    "Realtime INSERT added:",
                    payload.new
                  );
                }
              }

              // ==================================
              // UPDATE
              // ==================================

              if (
                payload.eventType === "UPDATE"
              ) {
                console.log(
                  "Realtime UPDATE received:",
                  payload.new
                );

                // Only update the logged-in
                // user's lost item
                if (
                  payload.new.user_id ===
                  user.id
                ) {
                  setLostItems(
                    (currentItems) =>
                      currentItems.map(
                        (item) =>
                          item.id ===
                          payload.new.id
                            ? payload.new
                            : item
                      )
                  );

                  console.log(
                    "Track Lost updated item:",
                    payload.new.id,
                    "Status:",
                    payload.new.status
                  );
                }
              }

              // ==================================
              // DELETE
              // ==================================

              if (
                payload.eventType === "DELETE"
              ) {
                console.log(
                  "Realtime DELETE received:",
                  payload.old
                );

                setLostItems(
                  (currentItems) =>
                    currentItems.filter(
                      (item) =>
                        item.id !==
                        payload.old.id
                    )
                );
              }
            }
          )
          .subscribe((status) => {
            console.log(
              "Track Lost Realtime Status:",
              status
            );

            if (status === "SUBSCRIBED") {
              console.log(
                "✅ Track Lost Realtime connected successfully!"
              );
            }

            if (status === "CHANNEL_ERROR") {
              console.error(
                "❌ Track Lost Realtime channel error."
              );
            }

            if (status === "TIMED_OUT") {
              console.error(
                "❌ Track Lost Realtime connection timed out."
              );
            }
          });
      } catch (error) {
        console.error(
          "Realtime setup error:",
          error
        );
      }
    }

    startRealtime();

    // ==========================================
    // CLEANUP REALTIME CHANNEL
    // ==========================================

    return () => {
      if (channel) {
        console.log(
          "Closing Track Lost Realtime..."
        );

        supabase.removeChannel(channel);
      }
    };
  }, []);

  // ==========================================
  // FORMAT DATE
  // ==========================================

  function formatDate(date) {
    if (!date) {
      return "Not provided";
    }

    return new Date(
      `${date}T00:00:00`
    ).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  // ==========================================
  // FORMAT TIME
  // ==========================================

  function formatTime(time) {
    if (!time) {
      return "Not provided";
    }

    const parts = time.split(":");

    const hours = Number(parts[0]);
    const minutes = Number(parts[1]);

    const date = new Date();

    date.setHours(
      hours,
      minutes,
      0,
      0
    );

    return date.toLocaleTimeString(
      "en-IN",
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  }

  // ==========================================
  // STATUS CLASS
  // ==========================================

  function getStatusClass(status) {
    if (status === "Found") {
      return "found-status";
    }

    if (
      status === "Claim Requested"
    ) {
      return "claim-status";
    }

    return "not-found-status";
  }

  // ==========================================
  // STATUS TEXT
  // ==========================================

  function getStatusText(status) {
    if (status === "Found") {
      return "✓ Object Found";
    }

    if (
      status === "Claim Requested"
    ) {
      return "📩 Claim Requested";
    }

    return "○ Not Found";
  }

  // ==========================================
  // PAGE
  // ==========================================

  return (
    <main className="track-page">

      <div className="track-container">

        {/* =====================================
            BACK BUTTON
        ===================================== */}

        <button
          type="button"
          className="back-button"
          onClick={() =>
            setPage("dashboard")
          }
        >
          ← Back to Dashboard
        </button>

        {/* =====================================
            TITLE
        ===================================== */}

        <h1>
          Track Lost Object 📍
        </h1>

        <p className="form-intro">
          Check the current status of
          your lost objects.
        </p>

        {/* =====================================
            ERROR
        ===================================== */}

        {errorMessage && (
          <div className="form-error">
            ❌ {errorMessage}
          </div>
        )}

        {/* =====================================
            LOADING
        ===================================== */}

        {loading && (
          <div className="loading-message">
            Loading your lost objects...
          </div>
        )}

        {/* =====================================
            EMPTY STATE
        ===================================== */}

        {!loading &&
          lostItems.length === 0 && (
            <div className="empty-state">

              <div>📍</div>

              <h3>
                No lost objects reported
              </h3>

              <p>
                You haven't reported any
                lost objects yet.
              </p>

              <button
                type="button"
                className="submit-button"
                onClick={() =>
                  setPage("lost")
                }
              >
                Report Lost Object
              </button>

            </div>
          )}

        {/* =====================================
            LOST ITEMS
        ===================================== */}

        {!loading &&
          lostItems.length > 0 && (
            <div className="track-list">

              {lostItems.map((item) => (
                <div
                  className="track-card"
                  key={item.id}
                >

                  {/* ===========================
                      IMAGE
                  =========================== */}

                  <div>

                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={
                          item.object_name
                        }
                        className="track-image"
                      />
                    ) : (
                      <div className="track-image-placeholder">
                        📦
                      </div>
                    )}

                  </div>

                  {/* ===========================
                      DETAILS
                  =========================== */}

                  <div className="track-details">

                    <h3>
                      {item.object_name}
                    </h3>

                    <p>
                      <strong>
                        Category:
                      </strong>{" "}
                      {item.category}
                    </p>

                    <p>
                      <strong>
                        Lost at:
                      </strong>{" "}
                      {item.location}
                    </p>

                    <p>
                      <strong>
                        Date:
                      </strong>{" "}
                      {formatDate(
                        item.lost_date
                      )}
                    </p>

                    <p>
                      <strong>
                        Time:
                      </strong>{" "}
                      {formatTime(
                        item.lost_time
                      )}
                    </p>

                    {/* DESCRIPTION */}

                    {item.description && (
                      <p>
                        <strong>
                          Description:
                        </strong>{" "}
                        {item.description}
                      </p>
                    )}

                    {/* CONTACT */}

                    {item.contact && (
                      <p>
                        <strong>
                          Contact:
                        </strong>{" "}
                        {item.contact}
                      </p>
                    )}

                    {/* =========================
                        STATUS
                    ========================= */}

                    <div
                      className={`status ${getStatusClass(
                        item.status
                      )}`}
                    >
                      {getStatusText(
                        item.status
                      )}
                    </div>

                  </div>

                </div>
              ))}

            </div>
          )}

        {/* =====================================
            REALTIME INDICATOR
        ===================================== */}

        <div className="realtime-info">
          <span className="realtime-dot">
            ●
          </span>

          Live status updates enabled
        </div>

      </div>

    </main>
  );
}

export default TrackLost;