const Student = require('../models/student');
const Admin = require('../models/admin');

module.exports.loginMiddleware = async (req, res, next) => {
  const { credential, password } = req.body;

  // Debug: Log the credential and password
  console.log("Credential:", credential);
  console.log("Password:", password);

  // Validate input
  if (!credential || !password) {
    return res.status(400).send("Both credential and password are required.");
  }

  try {
    // 1) Try to find a student by roll number
    let user = await Student.findOne({ rollNumber: credential });
    if (user) {
      console.log("Student found:", user);
      // Plain text comparison
      if (user.password !== password) {
        return res.status(401).send("Invalid credentials");
      }
      req.session.userId = user._id;
      req.session.userType = "student";
      return res.redirect("/student/studentDashboard");
    }

    // 2) If no student is found, try to find an admin by username
    user = await Admin.findOne({ username: credential });
    if (user) {
      console.log("Admin found:", user);
      // Plain text comparison
      if (user.password !== password) {
        return res.status(401).send("Invalid credentials");
      }
      req.session.userId = user._id;
      req.session.userType = "admin";
      return res.redirect("/admin/adminDashboard");
    }

    // 3) If neither is found, return error
    console.log("No user found for credential:", credential);
    return res.status(401).send("Invalid credentials");
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).send("Server error");
  }
};
