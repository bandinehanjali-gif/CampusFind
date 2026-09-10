import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

function SearchFound({ setPage }) {
  // --------------------------------
  // FOUND ITEMS FROM SUPABASE
  // --------------------------------

  const [foundItems, setFoundItems] = useState([]);

  // --------------------------------
  // SEARCH
  // --------------------------------

  const [searchText, setSearchText] = useState("");

  const [selectedCategory, setSelectedCategory] =
    useState("All");

  // --------------------------------
  // LOADING / ERROR
  // --------------------------------

  const [loading, setLoading] = useState(true);

  const [errorMessage, setErrorMessage] =
    useState("");

  // --------------------------------
  // CLAIM
  // --------------------------------

  const [claimingId, setClaimingId] =
    useState(null);

  const [claimedIds, setClaimedIds] =
    useState([]);

  // --------------------------------
  // LOAD FOUND ITEMS
  // --------------------------------

  async function loadFoundItems() {
    try {
      console.log(
        "Loading found items from Supabase..."
      );

      setLoading(true);
      setErrorMessage("");

      const {
        data,
        error,
      } = await supabase
        .from("found_items")
        .select("*")
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        console.error(
          "Error loading found items:",
          error
        );

        throw error;
      }

      console.log(
        "Found items loaded:",
        data
      );

      setFoundItems(data || []);

    } catch (error) {
      console.error(
        "Search Found error:",
        error
      );

      setErrorMessage(
        error?.message ||
          "Unable to load found items."
      );

    } finally {
      setLoading(false);
    }
  }

  // --------------------------------
  // LOAD WHEN PAGE OPENS
  // --------------------------------

  useEffect(() => {
    loadFoundItems();
  }, []);

  // --------------------------------
  // REALTIME
  // --------------------------------

  useEffect(() => {
    console.log(
      "Starting realtime connection..."
    );

    const channel =
      supabase
        .channel("found-items-realtime")

        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "found_items",
          },
          (payload) => {
            console.log(
              "Realtime change received:",
              payload
            );

            // -----------------------------
            // NEW FOUND ITEM
            // -----------------------------

            if (
              payload.eventType === "INSERT"
            ) {
              setFoundItems(
                (currentItems) => [
                  payload.new,
                  ...currentItems,
                ]
              );
            }

            // -----------------------------
            // UPDATED FOUND ITEM
            // -----------------------------

            if (
              payload.eventType === "UPDATE"
            ) {
              setFoundItems(
                (currentItems) =>
                  currentItems.map((item) =>
                    item.id === payload.new.id
                      ? payload.new
                      : item
                  )
              );
            }

            // -----------------------------
            // DELETED FOUND ITEM
            // -----------------------------

            if (
              payload.eventType === "DELETE"
            ) {
              setFoundItems(
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
            "Realtime status:",
            status
          );
        });

    // --------------------------------
    // CLEANUP
    // --------------------------------

    return () => {
      console.log(
        "Closing realtime connection..."
      );

      supabase.removeChannel(channel);
    };
  }, []);

  // --------------------------------
  // CLAIM FOUND ITEM
  // --------------------------------

  async function handleClaim(item) {
    try {
      setClaimingId(item.id);
      setErrorMessage("");

      console.log(
        "Claiming item:",
        item.id
      );

      // --------------------------------
      // GET CURRENT USER
      // --------------------------------

      const {
        data: {
          user,
        },
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

      // --------------------------------
      // CHECK WHETHER ALREADY CLAIMED
      // --------------------------------

      const {
        data: existingClaim,
        error: checkError,
      } = await supabase
        .from("claims")
        .select("id")
        .eq(
          "found_item_id",
          item.id
        )
        .eq(
          "claimant_id",
          user.id
        )
        .maybeSingle();

      if (checkError) {
        throw checkError;
      }

      if (existingClaim) {
        alert(
          "You have already submitted a claim for this item."
        );

        setClaimedIds(
          (current) => [
            ...current,
            item.id,
          ]
        );

        return;
      }

      // --------------------------------
      // INSERT CLAIM
      // --------------------------------

      const {
        data,
        error: claimError,
      } = await supabase
        .from("claims")
        .insert({
          found_item_id: item.id,
          claimant_id: user.id,
          status: "Pending",
        })
        .select();

      if (claimError) {
        console.error(
          "Claim error:",
          claimError
        );

        throw claimError;
      }

      console.log(
        "Claim submitted:",
        data
      );

      // --------------------------------
      // UPDATE UI
      // --------------------------------

      setClaimedIds(
        (current) => [
          ...current,
          item.id,
        ]
      );

      alert(
        "Claim request submitted successfully! 🎉"
      );

    } catch (error) {
      console.error(
        "Claim failed:",
        error
      );

      setErrorMessage(
        error?.message ||
          "Unable to submit claim."
      );

    } finally {
      setClaimingId(null);
    }
  }

  // --------------------------------
  // FILTER ITEMS
  // --------------------------------

  const filteredItems =
    foundItems.filter((item) => {

      const search =
        searchText
          .trim()
          .toLowerCase();

      const matchesSearch =
        !search ||
        item.object_name
          ?.toLowerCase()
          .includes(search) ||
        item.location
          ?.toLowerCase()
          .includes(search) ||
        item.description
          ?.toLowerCase()
          .includes(search);

      const matchesCategory =
        selectedCategory === "All" ||
        item.category ===
          selectedCategory;

      return (
        matchesSearch &&
        matchesCategory
      );
    });

  // --------------------------------
  // FORMAT DATE
  // --------------------------------

  function formatDate(date) {
    if (!date) return "Not provided";

    const formatted =
      new Date(date).toLocaleDateString(
        "en-IN",
        {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }
      );

    return formatted;
  }

  // --------------------------------
  // UI
  // --------------------------------

  return (
    <div className="search-page">

      <div className="search-container">

        {/* BACK BUTTON */}

        <button
          type="button"
          className="back-button"
          onClick={() =>
            setPage("dashboard")
          }
        >
          ← Back to Dashboard
        </button>

        {/* HEADER */}

        <div className="search-header">

          <div className="form-icon">
            🔎
          </div>

          <div>
            <h1>
              Search Found Objects
            </h1>

            <p>
              Search items reported as found
              on campus.
            </p>
          </div>

        </div>

        {/* ERROR */}

        {errorMessage && (
          <div className="error-message">
            {errorMessage}
          </div>
        )}

        {/* SEARCH CONTROLS */}

        <div className="search-controls">

          <div className="search-input-wrapper">

            <span>
              🔍
            </span>

            <input
              type="text"
              placeholder="Search by object name, location..."
              value={searchText}
              onChange={(event) =>
                setSearchText(
                  event.target.value
                )
              }
            />

          </div>

          <select
            value={selectedCategory}
            onChange={(event) =>
              setSelectedCategory(
                event.target.value
              )
            }
          >

            <option value="All">
              All Categories
            </option>

            <option value="Electronics">
              Electronics
            </option>

            <option value="Wallet / Money">
              Wallet / Money
            </option>

            <option value="ID / Cards">
              ID / Cards
            </option>

            <option value="Books">
              Books
            </option>

            <option value="Keys">
              Keys
            </option>

            <option value="Clothing">
              Clothing
            </option>

            <option value="Accessories">
              Accessories
            </option>

            <option value="Other">
              Other
            </option>

          </select>

        </div>

        {/* LOADING */}

        {loading && (
          <div className="loading-message">
            Loading found objects...
          </div>
        )}

        {/* NO ITEMS */}

        {!loading &&
          filteredItems.length === 0 && (
            <div className="empty-message">

              <div className="empty-icon">
                📦
              </div>

              <h2>
                No found objects
              </h2>

              <p>
                No matching found objects
                are available right now.
              </p>

            </div>
          )}

        {/* FOUND ITEMS */}

        {!loading &&
          filteredItems.length > 0 && (

            <div className="items-grid">

              {filteredItems.map(
                (item) => {

                  const isClaimed =
                    claimedIds.includes(
                      item.id
                    );

                  return (
                    <div
                      className="item-card"
                      key={item.id}
                    >

                      {/* IMAGE */}

                      {item.image_url ? (
                        <div className="item-image-container">

                          <img
                            src={item.image_url}
                            alt={
                              item.object_name
                            }
                            className="item-image"
                          />

                        </div>
                      ) : (
                        <div className="item-image-placeholder">
                          📦
                        </div>
                      )}

                      {/* ITEM INFORMATION */}

                      <div className="item-content">

                        <div className="item-title-row">

                          <h2>
                            {item.object_name}
                          </h2>

                          <span className="item-status">
                            {item.status}
                          </span>

                        </div>

                        <p className="item-category">
                          {item.category}
                        </p>

                        <div className="item-details">

                          <p>
                            📍{" "}
                            <strong>
                              Location:
                            </strong>{" "}
                            {item.location}
                          </p>

                          <p>
                            📅{" "}
                            <strong>
                              Found:
                            </strong>{" "}
                            {formatDate(
                              item.found_date
                            )}
                          </p>

                          {item.found_time && (
                            <p>
                              🕐{" "}
                              <strong>
                                Time:
                              </strong>{" "}
                              {item.found_time}
                            </p>
                          )}

                        </div>

                        {item.description && (
                          <p className="item-description">
                            {item.description}
                          </p>
                        )}

                        {/* CLAIM BUTTON */}

                        {item.status ===
                          "Available" && (
                          <button
                            type="button"
                            className="claim-button"
                            disabled={
                              claimingId ===
                                item.id ||
                              isClaimed
                            }
                            onClick={() =>
                              handleClaim(item)
                            }
                          >

                            {claimingId ===
                            item.id
                              ? "Submitting..."
                              : isClaimed
                              ? "Claim Requested ✓"
                              : "This Is My Item →"}

                          </button>
                        )}

                        {item.status ===
                          "Claim Requested" && (
                          <button
                            type="button"
                            className="claim-button"
                            disabled
                          >
                            Claim Already Requested
                          </button>
                        )}

                        {item.status ===
                          "Returned" && (
                          <button
                            type="button"
                            className="claim-button"
                            disabled
                          >
                            Item Returned
                          </button>
                        )}

                      </div>

                    </div>
                  );
                }
              )}

            </div>
          )}

        {/* REALTIME INFORMATION */}

        <div className="realtime-info">

          <span className="realtime-dot">
            ●
          </span>

          Live updates enabled

        </div>

      </div>

    </div>
  );
}

export default SearchFound;