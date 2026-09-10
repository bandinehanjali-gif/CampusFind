import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

function ReportFound({ setPage }) {
  const [form, setForm] = useState({
    objectName: "",
    category: "",
    date: "",
    time: "",
    location: "",
    description: "",
    contact: "",
    image: null,
  });

  const [imagePreview, setImagePreview] = useState("");

  const [loading, setLoading] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");

  const [successMessage, setSuccessMessage] = useState("");

  // --------------------------------
  // HANDLE TEXT INPUTS
  // --------------------------------

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setErrorMessage("");
  }

  // --------------------------------
  // HANDLE IMAGE
  // --------------------------------

  function handleImageChange(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    console.log("Image selected:", file.name);
    console.log("Image size:", file.size);
    console.log("Image type:", file.type);

    // Maximum 5 MB
    const maxSize = 5 * 1024 * 1024;

    if (file.size > maxSize) {
      setErrorMessage(
        "Image is larger than 5 MB. Please select a smaller image."
      );

      event.target.value = "";
      return;
    }

    // Check that it is an image
    if (!file.type.startsWith("image/")) {
      setErrorMessage("Please select a valid image file.");

      event.target.value = "";
      return;
    }

    setForm((previous) => ({
      ...previous,
      image: file,
    }));

    // Create image preview
    const reader = new FileReader();

    reader.onloadend = () => {
      setImagePreview(reader.result);
    };

    reader.readAsDataURL(file);

    setErrorMessage("");
  }

  // --------------------------------
  // SUBMIT FORM
  // --------------------------------

  async function handleSubmit(event) {
    event.preventDefault();

    console.log("================================");
    console.log("FOUND ITEM SUBMIT STARTED");
    console.log("================================");

    setErrorMessage("");
    setSuccessMessage("");

    // --------------------------------
    // VALIDATION
    // --------------------------------

    if (!form.objectName.trim()) {
      setErrorMessage("Please enter the object name.");
      return;
    }

    if (!form.category) {
      setErrorMessage("Please select a category.");
      return;
    }

    if (!form.date) {
      setErrorMessage("Please select the date found.");
      return;
    }

    if (!form.location.trim()) {
      setErrorMessage("Please enter the location where you found it.");
      return;
    }

    try {
      setLoading(true);

      // --------------------------------
      // GET CURRENT SUPABASE USER
      // --------------------------------

      console.log("Checking logged-in Supabase user...");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error("USER ERROR:", userError);
        throw new Error(
          "Unable to get your login information: " +
            userError.message
        );
      }

      if (!user) {
        throw new Error(
          "You are not logged in to Supabase. Please login again."
        );
      }

      console.log("Logged-in user ID:", user.id);
      console.log("Logged-in email:", user.email);

      // --------------------------------
      // IMAGE URL
      // --------------------------------

      let imageUrl = null;

      // --------------------------------
      // UPLOAD IMAGE TO STORAGE
      // --------------------------------

      if (form.image) {
        console.log("--------------------------------");
        console.log("Starting image upload...");
        console.log("Bucket: found-items");
        console.log("--------------------------------");

        const fileExtension =
          form.image.name.split(".").pop()?.toLowerCase() || "jpg";

        const fileName =
          `${user.id}-${Date.now()}.${fileExtension}`;

        console.log("File name:", fileName);

        const { error: uploadError } =
          await supabase.storage
            .from("found-items")
            .upload(fileName, form.image, {
              cacheControl: "3600",
              upsert: false,
            });

        if (uploadError) {
          console.error(
            "SUPABASE STORAGE ERROR:",
            uploadError
          );

          throw new Error(
            "Image upload failed: " +
              uploadError.message
          );
        }

        console.log("IMAGE UPLOAD SUCCESS!");

        // --------------------------------
        // GET PUBLIC IMAGE URL
        // --------------------------------

        const { data: publicUrlData } =
          supabase.storage
            .from("found-items")
            .getPublicUrl(fileName);

        imageUrl = publicUrlData.publicUrl;

        console.log("Image URL:", imageUrl);
      } else {
        console.log("No image selected.");
      }

      // --------------------------------
      // SAVE DATA TO found_items TABLE
      // --------------------------------

      console.log("--------------------------------");
      console.log("Saving found item to database...");
      console.log("Table: found_items");
      console.log("--------------------------------");

      const { data, error: insertError } =
        await supabase
          .from("found_items")
          .insert({
            user_id: user.id,

            object_name: form.objectName.trim(),

            category: form.category,

            image_url: imageUrl,

            found_date: form.date,

            found_time: form.time || null,

            location: form.location.trim(),

            description: form.description.trim(),

            contact: form.contact.trim(),

            status: "Available",
          })
          .select();

      // --------------------------------
      // DATABASE ERROR
      // --------------------------------

      if (insertError) {
        console.error(
          "SUPABASE DATABASE ERROR:",
          insertError
        );

        throw new Error(
          "Database error: " +
            insertError.message
        );
      }

      console.log(
        "DATABASE INSERT SUCCESS!"
      );

      console.log(
        "Saved found item:",
        data
      );

      // --------------------------------
      // SUCCESS
      // --------------------------------

      setSuccessMessage(
        "Found item reported successfully! 🎉"
      );

      // --------------------------------
      // CLEAR FORM
      // --------------------------------

      setForm({
        objectName: "",
        category: "",
        date: "",
        time: "",
        location: "",
        description: "",
        contact: "",
        image: null,
      });

      setImagePreview("");

      // --------------------------------
      // GO TO DASHBOARD
      // --------------------------------

      setTimeout(() => {
        setPage("dashboard");
      }, 1500);

    } catch (error) {
      console.error(
        "================================"
      );

      console.error(
        "REPORT FOUND FAILED:",
        error
      );

      console.error(
        "================================"
      );

      setErrorMessage(
        error?.message ||
          "Something went wrong while reporting the found item."
      );

    } finally {
      setLoading(false);
    }
  }

  // --------------------------------
  // UI
  // --------------------------------

  return (
    <div className="form-page">

      <div className="form-card">

        {/* BACK BUTTON */}

        <button
          type="button"
          className="back-button"
          onClick={() => setPage("dashboard")}
        >
          ← Back to Dashboard
        </button>

        {/* HEADER */}

        <div className="form-header">

          <div className="form-icon">
            📦
          </div>

          <div>
            <h1>
              Report Found Object
            </h1>

            <p>
              Help return an item to its rightful owner.
            </p>
          </div>

        </div>

        {/* SUCCESS MESSAGE */}

        {successMessage && (
          <div className="success-message">
            {successMessage}
          </div>
        )}

        {/* ERROR MESSAGE */}

        {errorMessage && (
          <div className="error-message">
            {errorMessage}
          </div>
        )}

        {/* FORM */}

        <form onSubmit={handleSubmit}>

          {/* OBJECT NAME */}

          <div className="form-group">

            <label>
              Object Name *
            </label>

            <input
              type="text"
              name="objectName"
              placeholder="Example: Black Wallet"
              value={form.objectName}
              onChange={handleChange}
            />

          </div>

          {/* CATEGORY */}

          <div className="form-group">

            <label>
              Category *
            </label>

            <select
              name="category"
              value={form.category}
              onChange={handleChange}
            >

              <option value="">
                Select category
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

          {/* IMAGE */}

          <div className="form-group">

            <label>
              Picture
            </label>

            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/jpg"
              onChange={handleImageChange}
            />

            <small>
              Maximum image size: 5 MB
            </small>

            {imagePreview && (
              <div className="image-preview">

                <img
                  src={imagePreview}
                  alt="Found item preview"
                />

              </div>
            )}

          </div>

          {/* DATE + TIME */}

          <div className="form-row">

            <div className="form-group">

              <label>
                Date Found *
              </label>

              <input
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
              />

            </div>

            <div className="form-group">

              <label>
                Time Found
              </label>

              <input
                type="time"
                name="time"
                value={form.time}
                onChange={handleChange}
              />

            </div>

          </div>

          {/* LOCATION */}

          <div className="form-group">

            <label>
              Location Found *
            </label>

            <input
              type="text"
              name="location"
              placeholder="Example: Library Block"
              value={form.location}
              onChange={handleChange}
            />

          </div>

          {/* DESCRIPTION */}

          <div className="form-group">

            <label>
              Description
            </label>

            <textarea
              name="description"
              placeholder="Describe the item..."
              value={form.description}
              onChange={handleChange}
              rows="4"
            />

          </div>

          {/* CONTACT */}

          <div className="form-group">

            <label>
              Contact Information
            </label>

            <input
              type="text"
              name="contact"
              placeholder="Phone number or email"
              value={form.contact}
              onChange={handleChange}
            />

          </div>

          {/* SUBMIT */}

          <button
            type="submit"
            className="submit-button"
            disabled={loading}
          >

            {loading
              ? "Submitting..."
              : "Report Found Object →"}

          </button>

        </form>

      </div>

    </div>
  );
}

export default ReportFound;