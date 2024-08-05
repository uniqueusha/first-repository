
const pool = require('../../../db');
const util = require('util');
const query = util.promisify(pool.query).bind(pool);

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
// Creates Patient
const createPatient = async (req, res) => {
  const patient_name = req.body.patient_name ? req.body.patient_name.trim() : '';
  const mobile_no = req.body.mobile_no ? req.body.mobile_no : '';
  const appointment_date = req.body.appointment_date ? req.body.appointment_date : '';
  const appointment_time = req.body.appointment_time ? req.body.appointment_time : '';
  const s_id = req.body.s_id ? req.body.s_id : '';
  const doctor_id = req.body.doctor_id ? req.body.doctor_id : '';
  const gender = req.body.gender ? req.body.gender : '';
  const age = req.body.age ? req.body.age.trim() : '';
  const address = req.body.address ? req.body.address.trim() : '';
  const city = req.body.city ? req.body.city.trim() : '';
  const district_id = req.body.district_id ? req.body.district_id : '';
  const state_id = req.body.state_id ? req.body.state_id : '';
  const notes = req.body.notes ? req.body.notes.trim() : '';
  if (!patient_name) {
    return error422("Patient name is required", res);
  } else if (!mobile_no) {
    return error422("Mobile Number is require", res);
  } else if (!appointment_date) {
    return error422("Appointment Date is require", res);
  } else if (!s_id) {
    return error422("Specialization id is require", res);
  } else if (!doctor_id) {
    return error422("Doctor id is require", res);
  } else if (!gender) {
    return error422("Gender is require", res);
  } else if (!age) {
    return error422("Age is require", res);
  }
  // check Patient name already exites in patients
  const isExistPatientNameQuery = 'SELECT * FROM patients WHERE patient_name = ?'
  const isExistPatientNameResult = await query(isExistPatientNameQuery, [patient_name]);
  if (isExistPatientNameResult.length > 0) {
    return error422("Patient name is already exists", res);
  }
  try {
    // Start a transaction
    await query("BEGIN");

    // Insert Patient details
    const insertPatientQuery = 'INSERT INTO patients (patient_name, mobile_no, appointment_date, appointment_time, s_id, doctor_id, gender, age, address, city, district_id, state_id, notes) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)';
    const insertPatientValues = [patient_name, mobile_no, appointment_date, appointment_time, s_id, doctor_id, gender, age, address, city, district_id, state_id, notes];
    const insertPatientResult = await query(insertPatientQuery, insertPatientValues);

    // Commit the transaction
    await query("COMMIT");

    return res.status(200).json({
      status: 200,
      message: "Patient added successfully",
    });
  } catch (error) {
    // Handle errors
    await query("ROLLBACK");
    return error500(error, res)

  }
};
// get Patient by id...
const getPatient = async (req, res) => {
  const patientId = parseInt(req.params.id);
  try {
    const patientQuery = 'SELECT * FROM patients WHERE  patient_id = ?';
    const patientResult = await query(patientQuery, [patientId]);

    if (patientResult.length === 0) {
      return error422("Patient Not Found.", res);
    }
    return res.status(200).json({
      status: 200,
      message: "Patient fetched successfully",
      data: patientResult[0],
    });

  } catch (error) {
    // Handle errors
    await query("ROLLBACK");
    return error500(error, res)

  }
};
//get getPatients...
const getPatients = async (req, res) => {
  const { page, perPage, key } = req.query;
  const doctorId = parseInt(req.query.doctorId);

  try {
    let getPatientsQuery = `SELECT * FROM patients WHERE 1`;
    let countQuery = `SELECT COUNT(*) AS total FROM patients WHERE 1`;
    if (key) {
      const lowercaseKey = key.toLowerCase().trim();
      if (lowercaseKey === "activated") {
        getPatientsQuery += `AND tatus = 1`;
        countQuery += ` AND status = 1`;
      } else if (lowercaseKey === "deactivated") {
        getPatientsQuery += ` AND status = 0`;
        countQuery += ` AND status = 0`;
      } else {
        getPatientsQuery += ` AND LOWER(patient_name) LIKE '%${lowercaseKey}%'`;
        countQuery += ` AND LOWER(patient_name) LIKE '%${lowercaseKey}%'`;
      }
    }
    if (doctorId) {
      getPatientsQuery += ` AND doctor_id = ${doctorId}`;
      countQuery += `  AND doctor_id = ${doctorId}`;
    }

    let total = 0;
    // Apply pagination if both page and perPage are provided
    if (page && perPage) {
      const totalResult = await query(countQuery,);
      total = parseInt(totalResult[0].total);
      const start = (page - 1) * perPage;
      getPatientsQuery += ` LIMIT ${perPage} OFFSET ${start}`;
    }

    const result = await query(getPatientsQuery);
    const data = {
      status: 200,
      message: "Patients retrieved successfully",
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
//update Patient
const updatePatient = async (req, res) => {
  const newDate = new Date();
  const patientId = parseInt(req.params.id);
  const patient_name = req.body.patient_name ? req.body.patient_name.trim() : '';
  const mobile_no = req.body.mobile_no ? req.body.mobile_no : '';
  const appointment_date = req.body.appointment_date ? req.body.appointment_date : '';
  const appointment_time = req.body.appointment_time ? req.body.appointment_time : '';
  const s_id = req.body.s_id ? req.body.s_id : '';
  const gender = req.body.gender ? req.body.gender : '';
  const age = req.body.age ? req.body.age.trim() : '';
  const address = req.body.address ? req.body.address.trim() : '';
  const city = req.body.city ? req.body.city.trim() : '';
  const district_id = req.body.district_id ? req.body.district_id : '';
  const state_id = req.body.state_id ? req.body.state_id : '';
  const notes = req.body.notes ? req.body.notes.trim() : '';
  const doctor_id = req.companyData.doctor_id;
  if (!patient_name) {
    return error422("Patient name is required", res);
  } else if (!mobile_no) {
    return error422("Mobile Number is require", res);
  } else if (!appointment_date) {
    return error422("Appointment Date is require", res);
  } else if (!s_id) {
    return error422("Specialization id is require", res);
  } else if (!gender) {
    return error422("Gender is require", res);
  } else if (!age) {
    return error422("Age Date is require", res);
  } else if (!doctor_id) {
    return error422("Doctor id is require", res);
  }

  // Check if patient exists
  const patientIsExistsQuery = "SELECT * FROM patients WHERE patient_id = ? && doctor_id";
  const patientIsExistsResult = await query(patientIsExistsQuery, [patientId, doctor_id]);
  if (patientIsExistsResult.length == 0) {
    return error422("Patient Not Found.", res);
  }

  // check patient name already exites in patients
  const isExistPatientIdNameQuery = 'SELECT * FROM patients WHERE (patient_name = ? && doctor_id = ?) AND patient_id !=?'
  const isExistPatientNameResult = await query(isExistPatientIdNameQuery, [patient_name, doctor_id, patientId]);
  if (isExistPatientNameResult.length > 0) {
    return error422("Patient Name is already exists", res);
  }

  try {
    // Start a transaction
    await query("BEGIN");

    const updateQuery = `UPDATE patients SET patient_name = ?, mobile_no = ?, appointment_date = ?, appointment_time = ?, s_id = ?, doctor_id = ?, gender = ?, age = ?, address = ?, city = ?, district_id = ?, state_id = ?, notes =?, modified_at = ? WHERE patient_id = ?`;
    const updateresult = await query(updateQuery, [patient_name, mobile_no, appointment_date, appointment_time, s_id, doctor_id, gender, age, address, city, district_id, state_id, notes, newDate, patientId]);

    // Commit the transaction
    await query("COMMIT");

    return res.status(200).json({
      status: 200,
      message: "Patient updated successfully",
    });

  } catch (error) {
    // Handle errors
    await query("ROLLBACK");
    return error500(error, res)
  }
};
//change Status (Delete) for patient
const deletePatient = async (req, res) => {
  const patientId = parseInt(req.params.id);
  const status = parseInt(req.query.status);
  try {
    // Check if patient id exists
    const patientIdIsExistsQuery = "SELECT * FROM patients WHERE patient_id = ?";
    const patientIdIsExistsResult = await query(patientIdIsExistsQuery, [patientId]);
    if (patientIdIsExistsResult.length == 0) {
      return error422("Patient Not Found.", res);
    }

    // Validate the status parameter
    if (status !== 0 && status !== 1) {
      return res.status(400).json({
        status: 400,
        message: "Invalid status value. Status must be 0 (inactive) or 1 (active).",
      });
    }

    //update the patient status
    const deleteUpdateQuery = `UPDATE patients SET status = ? WHERE patient_id = ?`;
    const deleteUpdateResult = await query(deleteUpdateQuery, [status, patientId]);

    const statusMessage = status === 1 ? "activated" : "deactivated";

    return res.status(200).json({
      status: 200,
      message: `Patient ${statusMessage} successfully.`,
    });
  } catch (error) {
    return error500(error, res);
  }
};
//active list patients
const getStatusActive = async (req, res) => {

  try {
    const statusActiveQuery = `SELECT * FROM patients WHERE status =1`;
    const statusActiveResult = await query(statusActiveQuery);
    const result = statusActiveResult;
    return res.status(200).json({
      status: 200,
      message: "Patients Active Successfully.",
      data: result
    });
  } catch (error) {
    return error500(error, res);
  }
};
// change patient status
const patientStatusChange = async (req, res) => {
  const patientId = parseInt(req.params.id);
  const patientStatus = req.query.patientStatus;
  
  try {
    // Check if patient id exists
    const patientIdIsExistsQuery = "SELECT * FROM patients WHERE patient_id = ? ";
    const patientIdIsExistsResult = await query(patientIdIsExistsQuery, [patientId]);
    if (patientIdIsExistsResult.length == 0) {
      return error422("Patient Not Found.", res);
    }

    // Validate the status parameter
    if (patientStatus !== 'PENDING' && patientStatus !== 'CONFIRM') {
      return res.status(400).json({
        status: 400,
        message: "Invalid status value. Status must be  (pending) or  (confirm).",
      });
    }
    //update the patient status (PENDING AND CONFIRM)
    const statusUpdateQuery = "UPDATE patients SET patient_status = ? WHERE patient_id = ?";
    const statusUpdateResult = await query(statusUpdateQuery, [patientStatus, patientId]);
    
    // Commit the transaction
    await query("COMMIT");

    const statusMessage = patientStatus === "PENDING" ? "PENDING" : "CONFIRM";
    console.log(statusMessage);
    return res.status(200).json({
      status: 200,
      message: `Patient ${statusMessage} successfully.`,
    });
  } catch (error) {
    await query("ROLLBACK");
    return error500(error, res);
  }
};
//Confirm list patients
const getStatusConfirm = async (req, res) => {
  const { page, perPage} = req.query;
  const doctorId = parseInt(req.query.doctorId);
  try {
    let statusConfirmQuery = `SELECT * FROM patients WHERE patient_status = "CONFIRM"`;
    let countQuery = `SELECT COUNT(*) AS total FROM patients WHERE patient_status = "CONFIRM"`;
    if (doctorId) {
      statusConfirmQuery += ` AND doctor_id = ${doctorId}`;
      countQuery += `  AND doctor_id = ${doctorId}`;
    }
    let total = 0;
    // Apply pagination if both page and perPage are provided
    if (page && perPage) {
      const totalResult = await query(countQuery,);
      total = parseInt(totalResult[0].total);
      const start = (page - 1) * perPage;
      statusConfirmQuery += ` LIMIT ${perPage} OFFSET ${start}`;
    }
    const result = await query(statusConfirmQuery);
    const data = {
      status: 200,
      message: "Confirm Patient",
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
//Pending list patients
const getStatusPending = async (req, res) => {
  const { page, perPage} = req.query;
  const doctorId = parseInt(req.query.doctorId);
  try {
    let statusPendingQuery = `SELECT * FROM patients WHERE patient_status = "PENDING"`;
    let countQuery = `SELECT COUNT(*) AS total FROM patients WHERE patient_status = "PENDING"`;
    if (doctorId) {
      statusPendingQuery += `AND doctor_id = ${doctorId}`;
      countQuery += `  AND doctor_id = ${doctorId}`;
    }
    let total = 0;
    // Apply pagination if both page and perPage are provided
    if (page && perPage) {
      const totalResult = await query(countQuery,);
      total = parseInt(totalResult[0].total);
      const start = (page - 1) * perPage;
      statusPendingQuery += ` LIMIT ${perPage} OFFSET ${start}`;
    }
    const result = await query(statusPendingQuery);
    const data = {
      status: 200,
      message: "Pending Patient",
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
//patient Search By Mobile Number
const getPatientbyMobileNo = async (req, res) => {
  const { page, perPage} = req.query;
  const doctorId = parseInt(req.query.doctorId);
  const mobileNo = parseInt(req.query.mobileNo);
  try {
    let getPatientbyMobileNoQuery = `SELECT * FROM patients WHERE mobile_no = ${mobileNo} `;
    let countQuery = `SELECT COUNT(*) AS total FROM patients WHERE mobile_no = ${mobileNo}`;
    if (doctorId) {
      getPatientbyMobileNoQuery += ` AND doctor_id = ${doctorId}`;
      countQuery += `  AND doctor_id = ${doctorId}`;
    }
    let total = 0;
    // Apply pagination if both page and perPage are provided
    if (page && perPage) {
      const totalResult = await query(countQuery,);
      total = parseInt(totalResult[0].total);
      const start = (page - 1) * perPage;
      getPatientbyMobileNoQuery += ` LIMIT ${perPage} OFFSET ${start}`;
    }
    const result = await query(getPatientbyMobileNoQuery);
    const data = {
      status: 200,
      message: " Patients list By Mobile No",
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
module.exports = {
  createPatient,
  getPatient,
  getPatients,
  updatePatient,
  deletePatient,
  getStatusActive,
  patientStatusChange,
  getStatusConfirm,
  getStatusPending,
  getPatientbyMobileNo
}