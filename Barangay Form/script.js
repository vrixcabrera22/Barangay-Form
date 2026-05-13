  let cur = 0;

  const panels = document.querySelectorAll(".step-panel");

  const sls = [0, 1, 2, 3].map((i) => document.getElementById("sl" + i));

  function render() {
    panels.forEach((p, i) => {
      p.classList.toggle("active", i === cur);
    });

    document.getElementById("pf").style.width = ((cur + 1) / 4) * 100 + "%";

    sls.forEach((s, i) => {
      s.className = i === cur ? "cur" : i < cur ? "done" : "";
    });

    document.getElementById("hint").textContent = "Step " + (cur + 1) + " of 4";

    const bb = document.getElementById("backBtn");

    bb.style.opacity = cur === 0 ? "0.4" : "1";

    bb.style.pointerEvents = cur === 0 ? "none" : "auto";

    const nb = document.getElementById("nextBtn");

    nb.innerHTML =
      cur === 3
        ? '<i class="ti ti-refresh" aria-hidden="true"></i> Restart'
        : 'Next <i class="ti ti-arrow-right" aria-hidden="true"></i>';
  }

  function validate(step) {
    var ok = true;

    function check(fieldId, inputId, test) {
      var field = document.getElementById(fieldId);
      var val = document.getElementById(inputId).value.trim();
      if (!test(val)) {
        field.classList.add("has-error");
        ok = false;
      } else {
        field.classList.remove("has-error");
      }
    }

    if (step === 0) {
      check("field-name", "inp-name", function (v) {
        return v.length > 0;
      });
      check("field-age", "inp-age", function (v) {
        return v !== "" && +v >= 1 && +v <= 120;
      });
      check("field-purok", "inp-purok", function (v) {
        return v !== "";
      });
    }

    if (step === 1) {
      check("field-checkup", "inp-checkup", function (v) {
        return v !== "";
      });
      check("field-conditions", "inp-conditions", function (v) {
        return v !== "";
      });
    }

    return ok;
  }

  function go(dir) {
    if (dir === 1 && cur === 3) {
      cur = 0;
      render();
      return;
    }

    if (dir === 1 && !validate(cur)) return;

    cur = Math.max(0, Math.min(3, cur + dir));

    if (cur === 3) calcScore();

    render();
  }

  function pillVal(group) {
    const el = document.querySelector('.pill.on[data-g="' + group + '"]');
    return el ? el.textContent.trim() : "";
  }

  function pillsActive(cat) {
    return Array.from(
      document.querySelectorAll('.pill.on[data-c="' + cat + '"]'),
    ).map(function (el) {
      return el.textContent.trim();
    });
  }

  function calcScore() {
    var score = 0;
    var recs = [];
    var stats = [];

    /* Vaccination */
    var vax = pillVal("vax");
    if (vax.indexOf("Unvaccinated") !== -1) {
      score += 2;
      recs.push(
        "Get vaccinated at the nearest health center to reduce disease risk.",
      );
      stats.push({
        icon: "ti-vaccine-bottle-off",
        color: "#ba7517",
        label: "Unvaccinated",
        warn: true,
      });
    } else {
      stats.push({
        icon: "ti-vaccine",
        color: "#588157",
        label: "Vaccinated",
        warn: false,
      });
    }

    /* Symptoms */
    var symptoms = pillsActive("s").filter(function (s) {
      return s.indexOf("None") === -1;
    });
    if (symptoms.length === 0) {
      stats.push({
        icon: "ti-circle-check",
        color: "#588157",
        label: "No symptoms",
        warn: false,
      });
    } else {
      score += symptoms.length * 1.5;
      recs.push(
        "Monitor symptoms (" +
          symptoms
            .map(function (s) {
              return s.toLowerCase();
            })
            .join(", ") +
          ") closely and seek medical attention if they worsen.",
      );
      stats.push({
        icon: "ti-thermometer",
        color: "#ba7517",
        label: symptoms.length + " symptom" + (symptoms.length > 1 ? "s" : ""),
        warn: true,
      });
    }

    /* Emergency kit */
    var kit = pillVal("kit");
    if (kit.indexOf("Not") !== -1) {
      score += 2;
      recs.push(
        "Prepare an emergency kit with food, water, flashlight, medicines, and batteries.",
      );
      stats.push({
        icon: "ti-first-aid-kit",
        color: "#ba7517",
        label: "No kit yet",
        warn: true,
      });
    } else {
      stats.push({
        icon: "ti-first-aid-kit",
        color: "#588157",
        label: "Kit ready",
        warn: false,
      });
    }

    /* Evacuation plan */
    var evac = pillsActive("e");
    var evacStr = evac.join(", ");
    if (evacStr.indexOf("None") !== -1) {
      score += 2;
      recs.push(
        "Establish an evacuation plan — identify an assigned center or family meeting point.",
      );
      stats.push({
        icon: "ti-map-pin",
        color: "#ba7517",
        label: "No evac plan",
        warn: true,
      });
    } else if (evacStr.indexOf("Family") !== -1) {
      score += 0.5;
      stats.push({
        icon: "ti-map-pin",
        color: "#588157",
        label: "Partial plan",
        warn: false,
      });
    } else {
      stats.push({
        icon: "ti-building-community",
        color: "#588157",
        label: "Assigned center",
        warn: false,
      });
    }

    /* Household size */
    var hh = pillVal("hh");
    if (hh.indexOf("7+") !== -1) {
      score += 1;
      recs.push(
        "Large household — ensure every member knows the evacuation plan and emergency contacts.",
      );
    } else if (hh.indexOf("4") !== -1) {
      score += 0.5;
    }

    /* Disaster experience */
    var disasterEl = document.querySelector("#sp2 textarea");
    var disasterText = disasterEl ? disasterEl.value.trim() : "";
    if (disasterText.length > 5) {
      recs.push(
        "Previous disaster experience noted — household may need priority monitoring and psychosocial support.",
      );
    }

    /* Clamp and classify */
    score = Math.round(Math.min(10, Math.max(0, score)));

    var level, riskText, icon;
    if (score <= 3) {
      level = "low";
      riskText = "Low risk";
      icon = "ti-circle-check";
      if (recs.length === 0)
        recs.push(
          "Maintain your current health practices and keep your emergency kit updated.",
        );
    } else if (score <= 6) {
      level = "moderate";
      riskText = "Moderate risk";
      icon = "ti-alert-circle";
    } else {
      level = "high";
      riskText = "High risk";
      icon = "ti-alert-triangle";
      recs.unshift(
        "Contact your Barangay Health Worker immediately for a home visit and assistance.",
      );
    }

    /* Render score */
    var sb = document.getElementById("scoreBig");
    sb.textContent = score;
    sb.className = "score-big " + level;

    var rp = document.getElementById("riskPill");
    rp.className = "risk-pill " + level;
    rp.querySelector("i").className = "ti " + icon;
    document.getElementById("riskLabel").textContent = riskText;

    /* Render recommendations */
    var recList = document.getElementById("recList");
    recList.innerHTML = recs
      .map(function (r) {
        return (
          '<div class="rec-item"><div class="rec-dot"></div><div>' +
          r +
          "</div></div>"
        );
      })
      .join("");

    var residentName = document.getElementById("inp-name").value;

    var residentAge = document.getElementById("inp-age").value;

    var residentPurok = document.getElementById("inp-purok").value;

    var summaryHTML = `
<div class="summary-card">

  <div class="summary-grid">

    <div class="summary-item">
      <span>Resident Name</span>
      <strong>${residentName}</strong>
    </div>

    <div class="summary-item">
      <span>Age</span>
      <strong>${residentAge}</strong>
    </div>

    <div class="summary-item">
      <span>Purok</span>
      <strong>${residentPurok}</strong>
    </div>

    <div class="summary-item">
      <span>Vaccination</span>
      <strong>${vax}</strong>
    </div>

    <div class="summary-item">
      <span>Symptoms</span>
      <strong>
        ${symptoms.length ? symptoms.join(", ") : "None"}
      </strong>
    </div>

    <div class="summary-item">
      <span>Risk Level</span>
      <strong>${riskText}</strong>
    </div>

  </div>

</div>
`;

    document.getElementById("residentSummary").innerHTML = summaryHTML;

    /* Render stat cards */
    var statRow = document.getElementById("statRow");
    statRow.innerHTML = stats
      .slice(0, 3)
      .map(function (s) {
        return (
          '<div class="stat-card' +
          (s.warn ? " warn" : "") +
          '">' +
          '<div class="stat-icon"><i class="ti ' +
          s.icon +
          '" style="color:' +
          s.color +
          '" aria-hidden="true"></i></div>' +
          "<p>" +
          s.label +
          "</p>" +
          "</div>"
        );
      })
      .join("");
  }

  document.querySelectorAll(".pill[data-g]").forEach((p) => {
    p.addEventListener("click", () => {
      const g = p.dataset.g;

      document
        .querySelectorAll(`.pill[data-g="${g}"]`)
        .forEach((x) => x.classList.remove("on"));

      p.classList.add("on");
    });
  });

  document.querySelectorAll(".pill[data-c]").forEach((p) => {
    p.addEventListener("click", () => {
      p.classList.toggle("on");
    });
  });

  render();

  /* Clear errors live as the user fixes fields */
  ["inp-name", "inp-age", "inp-purok", "inp-checkup", "inp-conditions"].forEach(
    function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      ["input", "change"].forEach(function (evt) {
        el.addEventListener(evt, function () {
          if (el.value.trim() !== "") {
            var field = el.closest(".field");
            if (field) field.classList.remove("has-error");
          }
        });
      });
    },
  );
