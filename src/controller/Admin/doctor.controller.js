const pool = require('../../../db');
const util = require('util');
const query = util.promisify(pool.query).bind(pool);
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

//error 422 handle
error422 = (message, res) => {
  return res.status(422).json({
    status: 422,
    message: message,
  });
};
//error 500 handle
error500 = (err, res) => {
  return res.status(500).json({
    status: 500,
    message: "Internal Server Error",
    error: err
  });
}

// Creates Doctors
const createDoctor = async (req, res) => {
  const doctor_name = req.body.doctor_name ? req.body.doctor_name.trim() : '';
  const organization_name = req.body.organization_name ? req.body.organization_name.trim() : '';
  const s_id = req.body.s_id ? req.body.s_id : '';
  const address1 = req.body.address1 ? req.body.address1.trim() : '';
  const city = req.body.city ? req.body.city.trim() : '';
  const district_id = req.body.district_id ? req.body.district_id : '';
  const state_id = req.body.state_id ? req.body.state_id : '';
  const email_id = req.body.email_id ? req.body.email_id.trim() : '';
  const mobile_no = req.body.mobile_no ? req.body.mobile_no : '';
  const education = req.body.education ? req.body.education.trim() : '';
  const password = req.body.password ? req.body.password : '';
  
  if (!doctor_name) {
    return error422("Doctor name is required", res);
  } else if (!organization_name) {
    return error422("Organization name is required", res);
  } else if (!s_id) {
    return error422("Specialization Id is required", res);
  } else if (!city) {
    return error422("city is required", res);
  } else if (!district_id) {
    return error422("District Id is required", res);
  } else if (!state_id) {
    return error422("State Id is required", res);
  } else if (!email_id) {
    return error422("Email Id is required", res);
  } else if (!mobile_no) {
    return error422("Mobile number is required", res);
  } else if (!education) {
    return error422("Education is required", res);
  } else if (!password) {
    return error422("password is require", res);
  }

  // check email_id already exists in untitled
  const isExistEmailIdQuery = 'SELECT * FROM untitled WHERE email_id = ?'
  const isExistEmailIdResult = await query(isExistEmailIdQuery, [email_id]);
  if (isExistEmailIdResult.length > 0) {
    return error422('Email id already exists.', res);
  }

  try {
    //Start the transaction
    await query("BEGIN");
    //Insert Doctors Details
    const insertDoctorQuery = 'INSERT INTO doctor (doctor_name, organization_name, s_id, address1, city, district_id, state_id, email_id, mobile_no, education) VALUES (?,?,?,?,?,?,?,?,?,?)';
    const insertDoctorValues = [doctor_name, organization_name, s_id, address1, city, district_id, state_id, email_id, mobile_no, education];
    const insertDoctorResult = await query(insertDoctorQuery, insertDoctorValues);
    const doctor_id = insertDoctorResult.insertId;

    const hash = await bcrypt.hash(password, 10); // Hash the password using bcrypt

    //insert into untitled
    const insertUntitledQuery = 'INSERT INTO untitled (email_id, extenstions , doctor_id) VALUES (?,?,?)';
    const insertUntitledValues = [email_id, hash, doctor_id];
    const untitledResult = await query(insertUntitledQuery, insertUntitledValues);

    //commit the transation
    await query("COMMIT");

    return res.status(200).json({
      status: 200,
      message: "Doctor Added Successfull",
    });
  } catch (error) {
    //Handle errors
    await query("ROLLBACK");
    return error500(error, res)
  }
};
// Login Doctor
const doctorLogin = async (req, res) => {
  const password = req.body.password ? req.body.password.trim() : '';
  const email_id = req.body.email_id ? req.body.email_id.trim() : '';
  if (!password) {
    return error422("Password is required.", res);
  } else if (!email_id) {
    return error422("Email Id is required.", res);
  }
  // Check if the Doctor with provided email_id exites and is active
  const checkUntitledQuery = "SELECT * FROM untitled WHERE LOWER(TRIM(email_id)) = ? AND status = 1";
  const checkUntitledResult = await query(checkUntitledQuery, [email_id.trim()]);
  const untitled = checkUntitledResult[0];
  if (!untitled) {
    return error422("Authentication Failed. Contact to admin.", res);
  }
  // Check if the Doctor with the provided mobile no exists and is active
  const checkDoctorQuery = "SELECT * FROM doctor WHERE doctor_id = ? AND status = 1";
  const doctorResult = await query(checkDoctorQuery, [untitled.doctor_id]);
  const doctor = doctorResult[0];
  if (!doctor) {
    return error422("Authentication Failed", res);
  }

  try {
    const isPasswordValid = await bcrypt.compare(
      password,
      untitled.extenstions
    );

    if (!isPasswordValid) {
      return error422("Password wrong.", res);
    }


    // Generate a JWT token
    const token = jwt.sign(
      {
        doctor_id: untitled.doctor_id,
        email_id: untitled.email_id,
      },
      "secret_this_should_be", // Use environment variable for secret key
      { expiresIn: "2h" }
    );

    const DataQuery = `SELECT d.*, ut.category FROM doctor d
        LEFT JOIN untitled ut
        ON ut.doctor_id=d.doctor_id
        WHERE d.doctor_id=${untitled.doctor_id}`;
    let DataResult = await query(DataQuery)


    return res.status(200).json({
      status: 200,
      message: "Authentication Successfully",
      token: token,
      expiresIn: 7200,
      data: DataResult[0],

    });

  } catch (error) {
    await query("ROLLBACK");
    return error500(error, res)
  }

};

//Get getDoctors
const getDoctors = async (req, res) => {
  const { page, perPage, key } = req.query;
  try {
    let getDoctorQuery = `SELECT d.*, ut.category FROM doctor d
        LEFT JOIN untitled ut
        ON d.doctor_id = ut.doctor_id`;
    let countQuery = `SELECT COUNT(*) AS total,ut.category FROM doctor d LEFT JOIN untitled ut ON d.doctor_id = ut.doctor_id`;
    if (key) {
      const lowercaseKey = key.toLowerCase().trim();
      if (lowercaseKey === "activated") {
        getDoctorQuery += ` Where c.status = 1`;
        countQuery += ` Where c.status = 1`;
      } else if (lowercaseKey === "deactivated") {
        getDoctorQuery += ` Where c.status = 0`;
        countQuery += ` Where c.status = 0`;
      } else {
        getDoctorQuery += ` Where LOWER(d.doctor_name) LIKE '%${lowercaseKey}%'`;
        countQuery += ` Where LOWER(d.doctor_name) LIKE '%${lowercaseKey}%'`;
      }
    }
    let total = 0;
    // Apply pagination if both page and perPage are provided
    if (page && perPage) {
      const totalResult = await query(countQuery);
      total = parseInt(totalResult[0].total);
      const start = (page - 1) * perPage;
      getDoctorQuery += ` LIMIT ${perPage} OFFSET ${start}`;
    }

    // return res.status(200).json("hii")
    const result = await query(getDoctorQuery);
    const data = {
      status: 200,
      message: "Doctor retrieved successfully",
      data: result,
    };
    // Add pagination information if provided
    if (page && perPage) {
      data.pagination = {
        per_page: perPage,
        total: total,
        current_page: page,
        last_page: Math.ceil(total / perPage),
      };
    }
    return res.status(200).json(data);
  } catch (error) {
    return error500(error, res);
  }
};

//Get Doctor by id
const getDoctor = async (req, res) => {
  const doctorId = parseInt(req.params.id);
  try {
    const doctorQuery = `SELECT d.*, ut.category FROM doctor d
      LEFT JOIN untitled ut
      ON d.doctor_id = ut.doctor_id
      WHERE d.doctor_id = ?`;
    const doctorResult = await query(doctorQuery, [doctorId]);

    if (doctorResult.length === 0) {
      return error422("Doctor Not Found.", res);
    }

    return res.status(200).json({
      status: 200,
      message: "Doctor Fetched Successfully",
      data: doctorResult[0],
    });
  } catch (error) {
    return error500(error, res);
  }
};

// Update Doctor
const updateDoctor = async (req, res) => {
  const doctorId = parseInt(req.params.id);
  const newDate = new Date();
  const doctor_name = req.body.doctor_name ? req.body.doctor_name.trim() : '';
  const organization_name = req.body.organization_name ? req.body.organization_name.trim() : '';
  const s_id = req.body.s_id ? req.body.s_id : '';
  const address1 = req.body.address1 ? req.body.address1.trim() : '';
  const city = req.body.city ? req.body.city.trim() : '';
  const district_id = req.body.district_id ? req.body.district_id : '';
  const state_id = req.body.state_id ? req.body.state_id : '';
  const email_id = req.body.email_id ? req.body.email_id.trim() : '';
  const mobile_no = req.body.mobile_no ? req.body.mobile_no : '';
  const education = req.body.education ? req.body.education.trim() : '';
  if (!doctorId) {
    return error422("Doctor Id is required", res);
  } else if (!organization_name) {
    return error422("Organization name is required", res);
  } else if (!s_id) {
    return error422("Specialization Id is required", res);
  } else if (!city) {
    return error422("city is required", res);
  } else if (!district_id) {
    return error422("District Id is required", res);
  } else if (!state_id) {
    return error422("State Id is required", res);
  } else if (!email_id) {
    return error422("Email Id is required", res);
  } else if (!mobile_no) {
    return error422("Mobile number is required", res);
  } else if (!education) {
    return error422("Education is required", res);
  }

  // Check if doctor exists
  const doctorIsExistsQuery = "SELECT * FROM doctor WHERE doctor_id = ?";
  const doctorIsExistsResult = await query(doctorIsExistsQuery, [doctorId]);
  if (doctorIsExistsResult.length == 0) {
    return error422("doctor Not Found.", res);
  }

  try {
    // Start a transaction
    await query("BEGIN");

    const updateQuery = `UPDATE doctor SET doctor_name= ?,organization_name = ?, s_id = ?, address1 = ?, city = ?, district_id = ?, state_id = ?, email_id = ?, mobile_no =?, education = ?, modified_at = ? where doctor_id=?`;
    const updateresult = await query(updateQuery, [doctor_name, organization_name, s_id, address1, city, district_id, state_id, email_id, mobile_no, education, newDate, doctorId]);

    // Commit the transaction
    await query("COMMIT");

    return res.status(200).json({
      status: 200,
      message: "Doctor updated successfully",
    });

  } catch (error) {
    // Handle errors
    await query("ROLLBACK");
    return error500(error, res)
  }
};

//Delete data than change Status
const deleteDoctor = async (req, res) => {
  const doctorId = parseInt(req.params.id);
  const status = parseInt(req.query.status);
  if (!doctorId) {
    return error422("Doctor Id is required", res);
  }

  try {
    // Check if doctor id exists
    const doctorIdIsExistsQuery = "SELECT * FROM doctor WHERE doctor_id = ?";
    const doctorIdIsExistsResult = await query(doctorIdIsExistsQuery, [doctorId]);
    if (doctorIdIsExistsResult.length == 0) {
      return error422("Doctor Not Found.", res);
    }

    // Validate the status parameter
    if (status !== 0 && status !== 1) {
      return res.status(400).json({
        status: 400,
        message: "Invalid status value. Status must be 0 (inactive) or 1 (active).",
      });
    }

    //update the state status
    const deleteUpdateQuery = `UPDATE doctor SET status = ? WHERE doctor_id = ?`;
    const deleteUpdateResult = await query(deleteUpdateQuery, [status, doctorId]);

    const statusMessage = status === 1 ? "activated" : "deactivated";

    return res.status(200).json({
      status: 200,
      message: `Doctor ${statusMessage} successfully.`,
    });
  } catch (error) {
    return error500(error, res);
  }
};

//active list state
const getStatusActive = async (req, res) => {
  try {
    const statusActiveQuery = `SELECT * FROM doctor WHERE status =1 `;
    const statusActiveResult = await query(statusActiveQuery);
    const result = statusActiveResult;
    return res.status(200).json({
      status: 200,
      message: " Active Doctors.",
      data: result
    });
  } catch (error) {
    return error500(error, res);
  }
};

// get Doctor by Specialization Id
const getDoctorBySpecializationId = async (req, res) => {
  const specializations = req.body.specializations ? req.body.specializations : [];
  if (!specializations) {
    return error422("Specializations is required", res);
  }
  let specializationArray = specializations;
  let doctorArray = [];
  for (let i = 0; i < specializationArray.length; i++) {
    const element = specializationArray[i];
    //console.log(element.s_id)
    //console.log('1st for loop start index=',i);
    let query2 = `SELECT * FROM doctor WHERE s_id = ${element.s_id}`;
    result = await query(query2);
    //console.log(result);
    //console.log('1st for loop end index=',i);
     for (let index = 0; index < result.length; index++) { //exit array by index data ([]array -> {}data)
      const element1 = result[index];
      //console.log(element1);
      doctorArray.push(element1)
     }

  }
  return res.status(200).json({
    status:200,
    message:"mesage",
    data:doctorArray
  })
};
// doctor by category
const getDoctorByCategory = async (req, res) => {
  console.log('hi')
  try {
    const getDoctorByCategoryQuery = `SELECT d.*,ut.category FROM doctor d
    JOIN untitled ut 
    ON d.doctor_id = ut.doctor_id
    WHERE category = 2`;
    const getDoctorByCategoryResult = await query(getDoctorByCategoryQuery);
    const result = getDoctorByCategoryResult;
    return res.status(200).json({
      status: 200,
      message: " Doctors By Category.!!",
      data: result
    });
  } catch (error) {
    return error500(error, res);
  }
};
// create Supper Admin
const createSupperAdmin = async (req, res) => {
  const doctor_name = req.body.doctor_name ? req.body.doctor_name.trim() : '';
  const organization_name = req.body.organization_name ? req.body.organization_name.trim() : '';
  const s_id = req.body.s_id ? req.body.s_id : '';
  const address1 = req.body.address1 ? req.body.address1.trim() : '';
  const city = req.body.city ? req.body.city.trim() : '';
  const district_id = req.body.district_id ? req.body.district_id : '';
  const state_id = req.body.state_id ? req.body.state_id : '';
  const email_id = req.body.email_id ? req.body.email_id.trim() : '';
  const mobile_no = req.body.mobile_no ? req.body.mobile_no : '';
  const education = req.body.education ? req.body.education.trim() : '';
  const password = req.body.password ? req.body.password : '';
  const category = req.body.category ? req.body.category : '';
  if (!doctor_name) {
    return error422("Doctor name is required", res);
  } else if (!organization_name) {
    return error422("Organization name is required", res);
  } else if (!s_id) {
    return error422("Specialization Id is required", res);
  } else if (!city) {
    return error422("city is required", res);
  } else if (!district_id) {
    return error422("District Id is required", res);
  } else if (!state_id) {
    return error422("State Id is required", res);
  } else if (!email_id) {
    return error422("Email Id is required", res);
  } else if (!mobile_no) {
    return error422("Mobile number is required", res);
  } else if (!education) {
    return error422("Education is required", res);
  } else if (!password) {
    return error422("password is require", res);
  } 

  // check email_id already exists in untitled
  const isExistEmailIdQuery = 'SELECT * FROM untitled WHERE email_id = ?'
  const isExistEmailIdResult = await query(isExistEmailIdQuery, [email_id]);
  if (isExistEmailIdResult.length > 0) {
    return error422('Email id already exists.', res);
  }

  try {
    //Start the transaction
    await query("BEGIN");
    //Insert Doctors Details
    const insertDoctorQuery = 'INSERT INTO doctor (doctor_name, organization_name, s_id, address1, city, district_id, state_id, email_id, mobile_no, education) VALUES (?,?,?,?,?,?,?,?,?,?)';
    const insertDoctorValues = [doctor_name, organization_name, s_id, address1, city, district_id, state_id, email_id, mobile_no, education];
    const insertDoctorResult = await query(insertDoctorQuery, insertDoctorValues);
    const doctor_id = insertDoctorResult.insertId;

    const hash = await bcrypt.hash(password, 10); // Hash the password using bcrypt

    //insert into untitled
    const insertUntitledQuery = 'INSERT INTO untitled (email_id, extenstions , doctor_id, category) VALUES (?,?,?,?)';
    const insertUntitledValues = [email_id, hash, doctor_id, category];
    const untitledResult = await query(insertUntitledQuery, insertUntitledValues);

    //commit the transation
    await query("COMMIT");

    return res.status(200).json({
      status: 200,
      message: "Doctor Added Successfull",
    });
  } catch (error) {
    //Handle errors
    await query("ROLLBACK");
    return error500(error, res)
  }
};
module.exports = {
  createDoctor,
  doctorLogin,
  getDoctors,
  getDoctor,
  updateDoctor,
  deleteDoctor,
  getStatusActive,
  getDoctorBySpecializationId,
  getDoctorByCategory,
  createSupperAdmin
}

