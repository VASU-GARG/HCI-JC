var express = require("express");
var router = express.Router();

var crypto = require("crypto");

let secrateKey = "secrateKey";

var bcrypt = require("bcryptjs");

var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

const firebase = require("../public/javascripts/config");

const db = firebase.firestore();
const patientTable = db.collection("patient");
const doctorTable = db.collection("doctor");
const labTable = db.collection("lab");

router.use(express.json());

/* middlewares started */

var checkIfPatientLoggedIn = function (req, res, next) {
  var patientDetails = req.session.patientData;
  console.log(patientDetails);
  if (patientDetails) {
    {
      return res.redirect("/patient");
    }
  } else {
    console.log("no");
    next();
  }
};
var checkIfDoctorLoggedIn = function (req, res, next) {
  var doctorDetails = req.session.doctorData;
  if (doctorDetails) {
    {
      return res.redirect("/doctor");
    }
  } else {
    next();
  }
};
var checkIfLabLoggedIn = function (req, res, next) {
  var labDetails = req.session.labData;
  if (labDetails) {
    {
      return res.redirect("/lab");
    }
  } else {
    next();
  }
};

var checkPatientToken = function (req, res, next) {
  if (req.session.patientData) {
    next();
  } else {
    return res.redirect("/");
  }
};

var checkDoctorToken = function (req, res, next) {
  if (req.session.doctorData) {
    next();
  } else {
    return res.redirect("/");
  }
};

var checkLabToken = function (req, res, next) {
  if (req.session.labData) {
    next();
  } else {
    return res.redirect("/");
  }
};

/* GET home page. */
router.get("/", function (req, res, next) {
  if (req.session.patientData) {
    res.redirect("/patient");
  } else if (req.session.labData) {
    res.redirect("/lab");
  } else if (req.session.doctorData) {
    res.redirect("/doctor");
  }
  res.render("index", { title: "Express" });
});

router.get("/about", function (req, res, next) {
  res.render("about", { title: "Express" });
});

router.get("/contact", function (req, res, next) {
  res.render("contact", { title: "Express" });
});

router.get("/patient", checkPatientToken, function (req, res, next) {
  var patientDetails = req.session.patientData;

  res.render("patient", {
    record: patientDetails,
  });
});

router.get("/doctor", checkDoctorToken, function (req, res, next) {
  var doctorDetails = req.session.doctorData;
  res.render("doctor", { record: doctorDetails });
});
router.get("/lab", checkLabToken, function (req, res, next) {
  var labDetails = req.session.labData;
  res.render("lab", { record: labDetails });
});

router.get("/doctorSignIn", checkIfDoctorLoggedIn, function (req, res, next) {
  res.render("doctorSignIn", { title: "Express" });
});
router.get("/patientSignIn", checkIfPatientLoggedIn, function (req, res, next) {
  res.render("patientSignIn", { title: "Express" });
});
router.get("/labSignIn", checkIfLabLoggedIn, function (req, res, next) {
  res.render("labSignIn", { title: "Express" });
});
router.get("/uploadReport", checkLabToken, function (req, res, next) {
  console.log(req.session.labData);
  res.render("uploadReport", { title: "Express" });
});

router.get("/allReports", checkPatientToken, async function (req, res, next) {
  var patientDetail = req.session.patientData;
  var email = patientDetail.email;

  const snapshot = await patientTable.where("email", "==", email).get();

  snapshot.forEach((doc) => {
    res.render("allReports", {
      reports: doc.data().reports,
    });
  });
});

router.get("/addPatient", checkDoctorToken, function (req, res, next) {
  res.render("addPatient");
});

router.get("/profile", function (req, res, next) {
  if (req.session.patientData) {
    res.render("profile", { record: req.session.patientData });
  } else if (req.session.labData) {
    res.render("profile", { record: req.session.labData });
  } else if (req.session.doctorData) {
    res.render("profile", { record: req.session.doctorData });
  } else {
    res.redirect("/");
  }
});

router.get("/logout", function (req, res, next) {
  req.session.destroy();
  res.redirect("/");
});

// router.get("/doctorSignUp", function (req, res, next) {
//   res.render("doctorSignUp", { title: "Express" });
// });
// router.get("/patientSignUp", function (req, res, next) {
//   res.render("patientSignUp", { title: "Express" });
// });
// router.get("/labSignUp", function (req, res, next) {
//   res.render("labSignUp", { title: "Express" });
// });

router.post("/doctorSignIn", async function (req, res, next) {
  var email_entered = req.body.doctorEmail;

  const snapshot = await doctorTable.where("email", "==", email_entered).get();

  if (snapshot.empty) {
    res.render("doctorSignIn", {
      status: "User not found. Please Register first",
    });
  } else {
    var pass_entered = req.body.doctorPass;
    snapshot.forEach((doc) => {
      if (bcrypt.compareSync(pass_entered, doc.data().pass)) {
        req.session.doctorData = doc.data();
        res.redirect("/doctor");
      } else {
        res.render("doctorSignIn", {
          status: "Invalid Credentials",
        });
      }
    });
  }
});

router.post("/patientSignIn", async function (req, res, next) {
  var email_entered = req.body.patientEmail;

  const snapshot = await patientTable.where("email", "==", email_entered).get();

  if (snapshot.empty) {
    res.send("User Not registered");
  } else {
    var pass_entered = req.body.patientPass;
    snapshot.forEach((doc) => {
      if (bcrypt.compareSync(pass_entered, doc.data().pass)) {
        req.session.patientData = doc.data();
        res.redirect("/patient");
      } else {
        res.send("invalid credentials");
      }
    });
  }
});

router.post("/labSignIn", async function (req, res, next) {
  var email_entered = req.body.labEmail;

  const snapshot = await labTable.where("email", "==", email_entered).get();

  if (snapshot.empty) {
    res.send("Lab Not registered");
  } else {
    var pass_entered = req.body.labPass;
    snapshot.forEach((doc) => {
      if (bcrypt.compareSync(pass_entered, doc.data().pass)) {
        req.session.labData = doc.data();
        res.redirect("/lab");
      } else {
        res.send("invalid credentials");
      }
    });
  }
});

router.post("/doctorSignUp", async function (req, res, next) {
  var record = {
    name: req.body.doctorName,
    id: req.body.doctorId,
    email: req.body.doctorEmail,
    mobile: req.body.doctorMobile,
    pass: bcrypt.hashSync(req.body.doctorPass, 10),
    patients: [],
  };

  const snapshot1 = await doctorTable
    .where("email", "==", req.body.doctorEmail)
    .get();

  const snapshot2 = await doctorTable
    .where("id", "==", req.body.doctorId)
    .get();

  const snapshot3 = await doctorTable
    .where("mobile", "==", req.body.doctorMobile)
    .get();

  if (snapshot1.empty && snapshot2.empty && snapshot3.empty) {
    if (req.body.doctorPass === req.body.doctorConfPass) {
      await doctorTable.add(record);
      res.render("doctorSignIn");
    } else {
      res.send("password and confirm password do no match");
    }
  } else {
    res.render("doctorSignIn", {
      status: "User Already Exist. Sign In to contiue",
    });
  }
});

router.post("/patientSignUp", async function (req, res, next) {
  var record = {
    name: req.body.patientName,
    aadhar: req.body.patientAadhar,
    email: req.body.patientEmail,
    mobile: req.body.patientMobile,
    age: req.body.patientAge,
    gender: req.body.patientGender,
    height: req.body.patientHeight,
    weight: req.body.patientWeight,
    pass: bcrypt.hashSync(req.body.patientPass, 10),
    reports: [],
    doctors: [],
  };

  const snapshot1 = await patientTable
    .where("email", "==", req.body.patientEmail)
    .get();

  const snapshot2 = await patientTable
    .where("mobile", "==", req.body.patientMobile)
    .get();

  if (snapshot1.empty && snapshot2.empty) {
    if (req.body.patientPass === req.body.patientConfPass) {
      await patientTable.add(record);
      res.render("patientSignIn");
    } else {
      res.send("password and confirm password do no match");
    }
  } else {
    res.render("patientSignIn", {
      status: "User Already Exist. Sign In to contiue",
    });
  }
});

router.post("/labSignUp", async function (req, res, next) {
  var record = {
    name: req.body.labName,
    id: req.body.labId,
    email: req.body.labEmail,
    mobile: req.body.labMobile,
    pass: bcrypt.hashSync(req.body.labPass, 10),
  };

  const snapshot1 = await labTable
    .where("email", "==", req.body.labEmail)
    .get();

  const snapshot2 = await labTable
    .where("mobile", "==", req.body.labMobile)
    .get();

  const snapshot3 = await labTable.where("id", "==", req.body.labId).get();

  if (snapshot1.empty && snapshot2.empty && snapshot3.empty) {
    if (req.body.labPass === req.body.labConfPass) {
      await labTable.add(record);
      res.render("labSignIn");
    } else {
      res.send("password and confirm password do no match");
    }
  } else {
    res.render("labSignIn", {
      status: "Lab Already Registered. Sign In to contiue",
    });
  }
});

router.post("/uploadFile", checkLabToken, async function (req, res, next) {
  var labDetail = req.session.labData;
  const snapshot = await patientTable
    .where("email", "==", req.body.email)
    .get();
  if (snapshot.empty == false) {
    snapshot.forEach((doc) => {
      var reportsArray = doc.data().reports;

      const ob = {
        labName: labDetail.name,
        link: req.body.docLink,
        testName: req.body.testName,
        date: new Date().toDateString(),
      };

      reportsArray.push(ob);

      db.collection("patient").doc(doc.id).update({
        reports: reportsArray,
      });
    });
  } else {
    // res.render("uploadReport");
    console.log("no patient found");
    res.render("uploadReport", { status: "patient not found" });
  }
});

router.post("/addPatient", async (req, res, next) => {
  const snapshot = await patientTable
    .where("email", "==", req.body.patientEmail)
    .get();

  if (snapshot.empty) {
    res.render("addPatient", { status: "patient does not exist" });
  } else {
    const doctorData = req.session.doctorData;

    for (i = 0; i < doctorData.patients.length; i++) {
      if (doctorData.patients[i].patientEmail === req.body.patientEmail) {
        res.render("addPatient", {
          status: "Patient already present in your record",
        });
        return;
      }
    }

    const snapshot1 = await doctorTable
      .where("email", "==", doctorData.email)
      .get();

    const snapshot2 = await patientTable
      .where("email", "==", req.body.patientEmail)
      .get();

    var newObj1 = {
      patientEmail: req.body.patientEmail,
      patientName: req.body.patientName,
      reports: [],
    };

    var newObj2 = {
      doctorName: doctorData.name,
      doctorEmail: doctorData.email,
      doctorPhone: doctorData.mobile,
      reports_shared: [],
    };

    var patientArray = doctorData.patients;

    patientArray.push(newObj1);

    snapshot1.forEach((doc) => {
      db.collection("doctor").doc(doc.id).update({
        patients: patientArray,
      });

      snapshot2.forEach((doc) => {
        var doctorArray = doc.data().doctors;
        doctorArray.push(newObj2);

        db.collection("patient").doc(doc.id).update({
          doctors: doctorArray,
        });
        res.render("addPatient", { status: "patient added successfuly" });
      });
    });
  }
});

router.post("/sendReportsPage", checkPatientToken, async (req, res) => {
  var patientDetail = req.session.patientData;

  const snapshot = await doctorTable
    .where("email", "==", req.body.doctorEmail)
    .get();

  snapshot.forEach((doc) => {
    for (let i = 0; i < doc.data().patients.length; i++) {
      if (doc.data().patients[i].patientEmail === patientDetail.email) {
        var reports = doc.data().patients[i].reports;

        console.log(reports);

        res.render("sendReports", {
          docEmail: req.body.doctorEmail,
          record: patientDetail,
          reportsAlreadySent: reports,
        });
      }
    }
  });

  return;
});

router.post("/sendReports", checkPatientToken, async (req, res) => {
  var patientData = req.session.patientData;
  if (req.body.unsendFunc) {
    var reportDate = req.body.temp_reportDate.trim();
    var reportName = req.body.temp_reportName.trim();
    // console.log(req.body.doctorEmail);

    const snapshot = await doctorTable
      .where("email", "==", req.body.doctorEmail)
      .get();

    snapshot.forEach((doc) => {
      for (let i = 0; i < doc.data().patients.length; i++) {
        if (doc.data().patients[i].patientEmail === patientData.email) {
          var patientArray = doc.data().patients;
          var updatedArray = [];
          for (let j = 0; j < patientArray[i].reports.length; j++) {
            if (
              patientArray[i].reports[j].reportDate == reportDate &&
              patientArray[i].reports[j].reportName == reportName
            ) {
            } else {
              updatedArray.push(patientArray[i].reports[j]);
            }
          }
          patientArray[i].reports = updatedArray;
          db.collection("doctor").doc(doc.id).update({
            patients: patientArray,
          });

          console.log("hellp");
          // var xhr = new XMLHttpRequest();
          // // var doc_email = document.getElementById("doctor-email").value;
          // xhr.open("POST", "sendReportsPage", true);
          // xhr.setRequestHeader("Content-Type", "application/json");
          // xhr.send(
          //   JSON.stringify({
          //     docEmail: req.body.doctorEmail,
          //   })
          // );
          res.render("sendReports", {
            docEmail: req.body.doctorEmail,
            record: patientData,
            reportsAlreadySent: patientArray[i].reports,
          });
        }
      }
    });
  } else {
    var patientData = req.session.patientData;
    var newObj = {
      reportName: req.body.reportName.trim(),
      reportLink: req.body.reportLink,
      reportDate: req.body.reportDate.trim(),
    };

    const snapshot1 = await doctorTable
      .where("email", "==", req.body.doctorEmail)
      .get();

    snapshot1.forEach((doc) => {
      for (let i = 0; i < doc.data().patients.length; i++) {
        if (doc.data().patients[i].patientEmail === patientData.email) {
          var patientArray = doc.data().patients;

          var reports = patientArray[i].reports;
          reports.push(newObj);

          patientArray[i].reports = reports;

          db.collection("doctor").doc(doc.id).update({
            patients: patientArray,
          });
          res.render("sendReports", {
            docEmail: req.body.doctorEmail,
            record: patientData,
            reportsAlreadySent: patientArray[i].reports,
          });
        }
      }
    });
  }
});

router.post("/openPatientReports", checkDoctorToken, (req, res) => {
  var patientEmail = req.body.patientEmail;
  var doctorData = req.session.doctorData;

  for (let i = 0; i < doctorData.patients.length; i++) {
    if (doctorData.patients[i].patientEmail === patientEmail) {
      res.render("patientReportsByDoctor", {
        reports: doctorData.patients[i].reports,
      });
    }
  }
});

module.exports = router;
