import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

function ReportLost({ setPage }) {
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

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previousForm) => ({
      ...previousForm,
      [name]: value,
    }));

    setErrorMessage("");
    setSuccessMessage("");
  }

  function handleImage(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    // Check image type
    if (!file.type.startsWith("image/")) {
      setErrorMessage("Please select a valid image file.");
      return;
    }

    // Check image size - 5 MB
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage("Image size must be less than 5 MB.");
      return;
    }

    setForm((previousForm) => ({
      ...previousForm,
      image: file,
    }));

    const reader = new FileReader();

    reader.onloadend = () => {
      setImagePreview(reader.result);
    };

    reader.readAsDataURL(file);

    setErrorMessage("");
    setSuccessMessage("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    console.log("SUBMIT BUTTON CLICKED");

    setErrorMessage("");
    setSuccessMessage("");

    // -----------------------------------------
    // CHECK REQUIRED FIELDS
    // -----------------------------------------

    if (
      !form.objectName.trim() ||
      !form.category ||
      !form.date ||
      !form.time ||
      !form.location.trim()
    ) {
      setErrorMessage(
        "Please fill all required fields marked with *."
      );
      return;
    }

    setLoading(true);

    try {
      // -----------------------------------------
      // GET CURRENT SUPABASE USER
      // -----------------------------------------

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        throw new Error(
          "You are not logged in to Supabase. Please login again."
        );
      }

      console.log("Logged in user:", user.id);

      // -----------------------------------------
      // IMAGE UPLOAD
      // -----------------------------------------

      let imageUrl = null;

      if (form.image) {
        console.log("Uploading lost item image...");

        // Get file extension
        const fileExtension =
          form.image.name.split(".").pop()?.toLowerCase() || "jpg";

        // Create unique file name
        const fileName = `${Date.now()}-${Math.random()
          .toString(36)
          .substring(2, 10)}.${fileExtension}`;

        // Store image inside user's folder
        const filePath = `${user.id}/${fileName}`;

        console.log("Image path:", filePath);

        const { error: uploadError } = await supabase.storage
          .from("lost-items")
          .upload(filePath, form.image, {
            cacheControl: "3600",
            upsert: false,
            contentType: form.image.type,
          });

        if (uploadError) {
          console.error("Storage upload error:", uploadError);

          throw new Error(
            "Image upload failed: " + uploadError.message
          );
        }

        // -----------------------------------------
        // GET PUBLIC IMAGE URL
        // -----------------------------------------

        const { data: publicUrlData } = supabase.storage
          .from("lost-items")
          .getPublicUrl(filePath);

        imageUrl = publicUrlData.publicUrl;

        console.log("Image uploaded successfully:");
        console.log(imageUrl);
      }

      // -----------------------------------------
      // INSERT INTO DATABASE
      // -----------------------------------------

      console.log("Saving lost item to database...");

      const { data, error: databaseError } = await supabase
        .from("lost_items")
        .insert({
          user_id: user.id,
          object_name: form.objectName.trim(),
          category: form.category,
          image_url: imageUrl,
          lost_date: form.date,
          lost_time: form.time,
          location: form.location.trim(),
          description: form.description.trim(),
          contact: form.contact.trim(),
          status: "Not Found",
        })
        .select();

      if (databaseError) {
        console.error("Database error:", databaseError);

        throw new Error(
          "Database error: " + databaseError.message
        );
      }

      console.log("Lost item saved:", data);

      // -----------------------------------------
      // SUCCESS
      // -----------------------------------------

      setSuccessMessage(
        "Lost object reported successfully! ✅"
      );

      // Clear form
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

      // Go dashboard after short delay
      setTimeout(() => {
        setPage("dashboard");
      }, 1200);
    } catch (error) {
      console.error("REPORT LOST ERROR:", error);

      setErrorMessage(
        error?.message ||
          "Something went wrong while submitting the report."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="form-page">
      <div className="form-container">

        {/* BACK BUTTON */}
        <button
          type="button"
          className="back-button"
          onClick={() => setPage("dashboard")}
        >
          ← Back to Dashboard
        </button>

        <h1>Report Lost Object 🔍</h1>

        <p className="form-intro">
          Please provide details about the object you lost.
        </p>

        <form onSubmit={handleSubmit}>

          {/* OBJECT NAME */}
          <div className="form-group">
            <label>
              Name of the object *
            </label>

            <input
              name="objectName"
              type="text"
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

              <option value="Books">
                Books
              </option>

              <option value="Wallet / Money">
                Wallet / Money
              </option>

              <option value="Keys">
                Keys
              </option>

              <option value="Documents">
                Documents
              </option>

              <option value="Bag">
                Bag
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
              Picture of the lost object
            </label>

            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/jpg"
              onChange={handleImage}
            />

            {imagePreview && (
              <img
                className="form-image-preview"
                src={imagePreview}
                alt="Lost object preview"
              />
            )}
          </div>

          {/* DATE + TIME */}
          <div className="two-column">

            <div className="form-group">
              <label>
                Date lost *
              </label>

              <input
                name="date"
                type="date"
                value={form.date}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>
                Approximate time lost *
              </label>

              <input
                name="time"
                type="time"
                value={form.time}
                onChange={handleChange}
              />
            </div>

          </div>

          {/* LOCATION */}
          <div className="form-group">
            <label>
              Location where the object was lost *
            </label>

            <input
              name="location"
              type="text"
              placeholder="Example: Library, Block A, Canteen"
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
              placeholder="Describe the object, colour, brand, special marks, etc."
              value={form.description}
              onChange={handleChange}
            />
          </div>

          {/* CONTACT */}
          <div className="form-group">
            <label>
              Contact Number
            </label>

            <input
              name="contact"
              type="tel"
              placeholder="Enter contact number"
              value={form.contact}
              onChange={handleChange}
            />
          </div>

          {/* ERROR */}
          {errorMessage && (
            <div className="form-error">
              ❌ {errorMessage}
            </div>
          )}

          {/* SUCCESS */}
          {successMessage && (
            <div className="form-success">
              ✅ {successMessage}
            </div>
          )}

          {/* SUBMIT */}
          <button
            className="submit-button"
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Submitting..."
              : "Submit Lost Report"}
          </button>

        </form>

      </div>
    </main>
  );
}

export default ReportLost;