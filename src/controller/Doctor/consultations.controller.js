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
  console.log(err);
  return res.status(500).json({
    status: 500,
    message: "Internal Server Error",
    error: err
  });
}
//Create Consultation
const createConsultation = async (req, res) => {
  const patient_id = req.body.patient_id ? req.body.patient_id : '';
  const doctor_id = req.body.doctor_id ? req.body.doctor_id : '';
  const notes = req.body.notes ? req.body.notes.trim() : '';
  const mediciene = req.body.mediciene ? req.body.mediciene : [];

  if (!patient_id) {
    return error422("Patient id is required", res);
  } else if (!doctor_id) {
    return error422("Doctor id is require", res);
  } else if (!notes) {
    return error422("Notes is require", res);
  }
  try {
    // Start a transaction
    await query("BEGIN");

    // Check if patient id exists
    const patientIdIsExistsQuery = "SELECT * FROM patients WHERE patient_id = ? ";
    const patientIdIsExistsResult = await query(patientIdIsExistsQuery, [patient_id]);
    if (patientIdIsExistsResult.length == 0) {
      return error422("Patient Not Found.", res);
    }
    // Check if doctor exists
    const doctorIsExistsQuery = "SELECT * FROM doctor WHERE doctor_id = ?";
    const doctorIsExistsResult = await query(doctorIsExistsQuery, [doctor_id]);
    if (doctorIsExistsResult.length == 0) {
      return error422("doctor Not Found.", res);
    }
    // Insert consultations details
    const insertConsultationsQuery = 'INSERT INTO consultations (patient_id, doctor_id, notes) VALUES (?,?,?)';
    const insertConsultationsValues = [patient_id, doctor_id, notes];
    const insertConsultationsResult = await query(insertConsultationsQuery, insertConsultationsValues);
    const consultation_id = insertConsultationsResult.insertId;

    //insert into Consultation Medicine in Array
    let medicieneArray = mediciene
    for (let i = 0; i < medicieneArray.length; i++) {
      const element = medicieneArray[i];
      const mediciene_id = element.mediciene_id ? element.mediciene_id : '';
      const medicine_notes = element.medicine_notes ? element.medicine_notes : '';
      if (!mediciene_id) {
        await query("ROLLBACK");
        return error422("Mediciene id is require", res);
      } else if (!medicine_notes) {
        await query("ROLLBACK");
        return error422("Mediciene notes is require", res);
      }
      // Check if Medicine exists
      const medicineIsExistsQuery = "SELECT * FROM medicines WHERE mediciene_id = ?";
      const medicineIsExistsResult = await query(medicineIsExistsQuery, [mediciene_id]);
      if (medicineIsExistsResult.length == 0) {
        return error422("Medicine Not Found.", res);
      }
      let insertConsultationMedicineQuery = 'INSERT INTO consultation_medicine (consultation_id,mediciene_id, medicine_notes) VALUES (?,?,?)';
      let insertConsultationMedicinevalues = [consultation_id, mediciene_id, medicine_notes];
      let insertConsultationMedicineResult = await query(insertConsultationMedicineQuery, insertConsultationMedicinevalues);

    }
    // Commit the transaction
    await query("COMMIT");

    return res.status(200).json({
      status: 200,
      message: "Consultations added successfully"
    });
  } catch (error) {
    // Handle errors
    await query("ROLLBACK");
    return error500(error, res)
  }
};
//Get All Consultation List
const getConsultations = async (req, res) => {
  const { page, perPage, key } = req.query;
  const doctorId = parseInt(req.query.doctorId);

  try {
    let getConsultationsQuery = `SELECT c.*,p.patient_name,p.mobile_no,p.appointment_date,p.appointment_time,s.specialization_name,p.gender,p.age,p.address,p.city,p.district_id,p.state_id,p.notes AS p_notes,d.doctor_name,d.organization_name,d.address1,d.city AS d_city,d.district_id AS d_district_id,d.state_id AS d_state_id,d.email_id,d.mobile_no AS d_mobile_no,d.education FROM consultations c
    INNER JOIN patients AS p
    ON c.patient_id = p.patient_id
    INNER JOIN doctor AS d
    ON c.doctor_id = d.doctor_id
    INNER JOIN specialization AS s
    ON d.s_id = s.s_id`;

    let countQuery = `SELECT COUNT(*) AS total,p.patient_name,p.mobile_no,p.appointment_date,p.appointment_time,s.specialization_name,p.gender,p.age,p.address,p.city,p.district_id,p.state_id,p.notes AS p_notes,d.doctor_name,d.organization_name,d.address1,d.city AS d_city,d.district_id AS d_district_id,d.state_id AS d_state_id,d.email_id,d.mobile_no AS d_mobile_no,d.education FROM consultations c
    INNER JOIN patients AS p
    ON c.patient_id = p.patient_id
    INNER JOIN doctor AS d
    ON c.doctor_id = d.doctor_id
    INNER JOIN specialization AS s
    ON d.s_id = s.s_id`;

    if (key) {
      const lowercaseKey = key.toLowerCase().trim();
      if (lowercaseKey === "activated") {
        getConsultationsQuery += ` AND status = 1`;
        countQuery += ` AND status = 1`;
      } else if (lowercaseKey === "deactivated") {
        getConsultationsQuery += ` AND status = 0`;
        countQuery += ` AND status = 0`;
      } else {
        getConsultationsQuery += ` AND LOWER(patient_name) LIKE '%${lowercaseKey}%'`;
        countQuery += ` AND LOWER(patient_name) LIKE '%${lowercaseKey}%'`;
      }
    }
    if (doctorId) {
      getConsultationsQuery += ` WHERE c.doctor_id = ${doctorId}`;
      countQuery += ` WHERE c.doctor_id = ${doctorId}`;
    }
    let total = 0;
    // Apply pagination if both page and perPage are provided
    if (page && perPage) {
      const totalResult = await query(countQuery,);
      total = parseInt(totalResult[0].total);
      const start = (page - 1) * perPage;
      getConsultationsQuery += ` LIMIT ${perPage} OFFSET ${start}`;
    }
    let result = await query(getConsultationsQuery);

    //get medicines
    for (let i = 0; i < result.length; i++) {
      const element = result[i];
      let consultationQuery = `SELECT * FROM consultation_medicine WHERE consultation_id = ${element.consultation_id}`;
      consultationresult = await query(consultationQuery);
      result[i]['medicines'] = consultationresult
    }

    const data = {
      status: 200,
      message: "Consultations retrieved successfully",
      data: result
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
// get Consultation by id...
  const getConsultation = async (req, res) => {
  const consultationId = parseInt(req.params.id);
  try {
    const consultationByIdQuery = `SELECT c.*,p.patient_name,p.mobile_no,p.appointment_date,p.appointment_time,s.specialization_name,p.gender,p.age,p.address,p.city,p.district_id,p.state_id,p.notes AS p_notes,d.doctor_name,d.organization_name,d.address1,d.city AS d_city,d.district_id AS d_district_id,d.state_id AS d_state_id,d.email_id,d.mobile_no AS d_mobile_no,d.education FROM consultations c
    INNER JOIN patients AS p
    ON c.patient_id = p.patient_id
    INNER JOIN doctor AS d
    ON c.doctor_id = d.doctor_id
    INNER JOIN specialization AS s
    ON d.s_id = s.s_id
    WHERE c.consultation_id = ?`;

    let consultationByIdResult = await query(consultationByIdQuery, [consultationId]);
    let consultation = consultationByIdResult[0]
    if (consultationByIdResult.length === 0) {
      return error422("Consultation Not Found.", res);
    }
    //get medicines
    const medicineQuery = `SELECT * FROM consultation_medicine WHERE consultation_id =? `
    const medicineResult = await query(medicineQuery, [consultationId]);
    consultation['medicines'] = medicineResult
    return res.status(200).json({
      status: 200,
      message: "Consultation fetched successfully",
      data: consultation,
    });

  } catch (error) {
    // Handle errors
    await query("ROLLBACK");
    return error500(error, res)
  }
};
// update Consultation
const updateConsultation = async (req, res) => {
  const consultationId = parseInt(req.params.id);
  const newDate = new Date();
  const patient_id = req.body.patient_id ? req.body.patient_id : '';
  const doctor_id = req.body.doctor_id ? req.body.doctor_id : '';
  const notes = req.body.notes ? req.body.notes.trim() : '';
  const mediciene = req.body.mediciene ? req.body.mediciene : [];
  
  if (!patient_id) {
    return error422("Patient id is required", res);
  } else if (!doctor_id) {
    return error422("Doctor id is require", res);
  } else if (!notes) {
    return error422("Notes is require", res);
  } else if (!consultationId) {
    return error422("consultation Id is require", res);
  }
  // Check if consultation exists
  const consultationIsExistsQuery = "SELECT * FROM consultations WHERE consultation_id = ?";
  const consultationIsExistsResult = await query(consultationIsExistsQuery, [consultationId]);
  if (consultationIsExistsResult.length == 0) {
    return error422("consultation Not Found.", res);
  }

  try {
    // Start a transaction
    await query("BEGIN");
    let updateQuery = `UPDATE consultations SET patient_id = ?,doctor_id = ?, notes = ?, modified_at = ? WHERE consultation_id =?`;
    let updateresult = await query(updateQuery, [patient_id, doctor_id, notes, newDate, consultationId]);

    //update into Consultation Medicine 
    for (let i = 0; i < mediciene.length; i++) {
      const element = mediciene[i];
      const consultation_medicine_id = element.consultation_medicine_id ? element.consultation_medicine_id : '';
      const mediciene_id = element.mediciene_id ? element.mediciene_id : '';
      const medicine_notes = element.medicine_notes ? element.medicine_notes : '';
      if (!mediciene_id) {
        await query("ROLLBACK");
        return error422("Medicine id is required", res);
      } else if (!medicine_notes) {
        await query("ROLLBACK");
        return error422("Medicine note are required", res);
      }
      // Check if Medicine exists
      const medicineIsExistsQuery = "SELECT * FROM medicines WHERE mediciene_id = ?";
      const medicineIsExistsResult = await query(medicineIsExistsQuery, [element.mediciene_id]);
      if (medicineIsExistsResult.length == 0) {
        await query("ROLLBACK");
        return error422("Medicine Not Found.", res);
      }
      if (consultation_medicine_id) {
        let updateConsultationMedicineQuery = `UPDATE consultation_medicine SET mediciene_id=?, medicine_notes=?, modified_at = ? WHERE consultation_id= ? AND consultation_medicine_id= ?`;
        let updateConsultationMedicineValues = [mediciene_id, medicine_notes, newDate, consultationId, consultation_medicine_id];
        let updateConsultationMedicineResult = await query(updateConsultationMedicineQuery, updateConsultationMedicineValues);
      } else {
        let insertConsultationMedicineQuery = 'INSERT INTO consultation_medicine (consultation_id,mediciene_id, medicine_notes) VALUES (?,?,?)';
        let insertConsultationMedicinevalues = [consultationId, mediciene_id, medicine_notes];
        let insertConsultationMedicineResult = await query(insertConsultationMedicineQuery, insertConsultationMedicinevalues);
      }

    }

    // Commit the transaction
    await query("COMMIT");

    return res.status(200).json({
      status: 200,
      message: "Consulatation updated successfully",
    });

  } catch (error) {
    // Handle errors
    await query("ROLLBACK");
    return error500(error, res)
  }
};
// delete Consultation Medicine
  const deleteConsultationMedicine = async (req, res) => {
  const consultationId = parseInt(req.params.id);
  const consultationMedicineId = parseInt(req.query.Id);
  try {
    // Check if consultation exists
    const consultationIdIsExistsQuery = "SELECT * FROM consultations WHERE consultation_id = ?";
    const consultationIdIsExistsResult = await query(consultationIdIsExistsQuery, [consultationId]);
    if (consultationIdIsExistsResult.length == 0) {
      return error422("consultation Not Found.", res);
    }
    // Check if consultation Medicine exists
    const consultationMedicinedIdIsExistsQuery = "SELECT * FROM consultation_medicine WHERE consultation_medicine_id = ?";
    const consultationMedicinedIdIsExistsResult = await query(consultationMedicinedIdIsExistsQuery, [consultationMedicineId]);
    if (consultationMedicinedIdIsExistsResult.length == 0) {
      return error422("consultation medicine Not Found.", res);
    }

    //update the patient status
    const deleteConsultationMedicineQuery = `DELETE FROM consultation_medicine WHERE consultation_id = ? AND consultation_medicine_id = ?`;
    const deleteConsultationMedicineResult = await query(deleteConsultationMedicineQuery, [consultationId, consultationMedicineId]);

    return res.status(200).json({
      status: 200,
      message: `Consultation Medicine Delete Successfully.`,
    });
  } catch (error) {
    return error500(error, res);
  }
};
module.exports = {
  createConsultation,
  getConsultations,
  getConsultation,
  updateConsultation,
  deleteConsultationMedicine
}



