function Dashboard({ setPage, user }) {
  return (
    <main className="dashboard">

      <section className="dashboard-header">

        <div>
          <p className="small-title">
            CAMPUS LOST & FOUND
          </p>

          <h1>
            Welcome to CampusFind 🎓
          </h1>

          <p>
            Hello {user?.type}! Lost something? Found something?
            Let's help it find its way home.
          </p>
        </div>

      </section>

      <h2 className="section-title">
        What would you like to do?
      </h2>

      <div className="option-grid">

        {/* REPORT LOST */}

        <div
          className="option-card"
          onClick={() => setPage("lost")}
        >

          <div className="option-icon">
            🔍
          </div>

          <h3>
            Report Lost
          </h3>

          <p>
            Report an object that you have lost
            somewhere on campus.
          </p>

          <button type="button">
            Report Lost →
          </button>

        </div>


        {/* REPORT FOUND */}

        <div
          className="option-card"
          onClick={() => setPage("found")}
        >

          <div className="option-icon">
            📦
          </div>

          <h3>
            Report Found
          </h3>

          <p>
            Report an object that you found
            somewhere on campus.
          </p>

          <button type="button">
            Report Found →
          </button>

        </div>


        {/* SEARCH FOUND */}

        <div
          className="option-card"
          onClick={() => setPage("search")}
        >

          <div className="option-icon">
            🧭
          </div>

          <h3>
            Search Found Objects
          </h3>

          <p>
            Browse objects that have been found
            around the campus.
          </p>

          <button type="button">
            Search Objects →
          </button>

        </div>


        {/* TRACK LOST */}

        <div
          className="option-card"
          onClick={() => setPage("track")}
        >

          <div className="option-icon">
            📍
          </div>

          <h3>
            Track Lost Object
          </h3>

          <p>
            Check the current status of your
            reported lost objects.
          </p>

          <button type="button">
            Track Object →
          </button>

        </div>

      </div>

    </main>
  );
}

export default Dashboard;