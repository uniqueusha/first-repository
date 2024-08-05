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
  // Creates Medicine
  const createMedicine = async (req, res) => {
    const medicience_name = req.body.medicience_name? req.body.medicience_name.trim() : '';
    const content	= req.body.content ? req.body.content	.trim() : '';
    const doctor_id = req.companyData.doctor_id;
    if (!medicience_name) {
      return error422("Medicience name is required", res);
    } else if (!doctor_id) {
      return error422("Doctor id is require", res);
    }
  // check Medicine name already exites in Medicience
  const isExistMedicineNameQuery = 'SELECT * FROM medicines WHERE medicience_name = ? && doctor_id = ?'
  const isExistMedicineNameResult = await query(isExistMedicineNameQuery, [medicience_name, doctor_id]);
  if (isExistMedicineNameResult.length > 0) {
    return error422("Medicine name is already exists", res);
  }
  try {
    // Start a transaction
    await query("BEGIN");

    // Insert Medicine details
    const insertMedicineQuery = 'INSERT INTO medicines (medicience_name, content, doctor_id) VALUES (?,?,?)';
    const insertMedicineValues = [medicience_name, content, doctor_id];
    const insertMedicineResult = await query(insertMedicineQuery, insertMedicineValues);

    // Commit the transaction
    await query("COMMIT");

    return res.status(200).json({
      status: 200,
      message: "Medicine added successfully",
    });
} catch (error) {
    // Handle errors
    await query("ROLLBACK");
    return error500(error, res)

  }
};
// get medicine by id...
const getMedicine = async (req, res) => {
  const medicineId = parseInt(req.params.id);
  const doctor_id = req.companyData.doctor_id
  try {
    const medicineQuery = 'SELECT * FROM medicines WHERE  mediciene_id = ? AND doctor_id = ?';
    const medicineResult = await query(medicineQuery, [medicineId, doctor_id]);

    if (medicineResult.length === 0) {
      return error422("Medicine Not Found.", res);
    }
    return res.status(200).json({
      status: 200,
      message: "Medicine fetched successfully",
      data: medicineResult[0],
    });

  } catch (error) {
    // Handle errors
    await query("ROLLBACK");
    return error500(error, res)

  }
};
//get getMedicience...
const getMedicience = async (req, res) => {
  const { page, perPage, key } = req.query;
  const doctor_id = req.companyData.doctor_id;
  try {
    let getMedicienceQuery = `SELECT * FROM medicines WHERE doctor_id = ${doctor_id}`;
    let countQuery = `SELECT COUNT(*) AS total FROM medicines WHERE doctor_id = ${doctor_id}`;
    if (key) {
      const lowercaseKey = key.toLowerCase().trim();
      if (lowercaseKey === "activated") {
        getMedicienceQuery += ` AND status = 1`;
        countQuery += ` AND status = 1`;
      } else if (lowercaseKey === "deactivated") {
        getMedicienceQuery += ` AND status = 0`;
        countQuery += ` AND status = 0`;
      } else {
        getMedicienceQuery += ` AND LOWER(medicience_name) LIKE '%${lowercaseKey}%'`;
        countQuery += ` AND LOWER(medicience_name) LIKE '%${lowercaseKey}%'`;
      }
    }
    let total = 0;

    // Apply pagination if both page and perPage are provided
    if (page && perPage) {
      const totalResult = await query(countQuery,);
      total = parseInt(totalResult[0].total);
      const start = (page - 1) * perPage;
      getMedicienceQuery += ` LIMIT ${perPage} OFFSET ${start}`;
    }

    const result = await query(getMedicienceQuery);
    const data = {
      status: 200,
      message: "Medicience retrieved successfully",
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
//update Medicine
const updateMedicine = async (req, res) => {
  const medicineId = parseInt(req.params.id);
  const newDate = new Date();
  const medicience_name = req.body.medicience_name? req.body.medicience_name.trim() : '';
  const content	= req.body.content ? req.body.content	.trim() : '';
  const doctor_id = req.companyData.doctor_id;
  if (!medicience_name) {
    return error422("Medicience Name is required", res);
  } else if (!doctor_id) {
    return error422("Doctor Id is required", res);
  }

  // Check if Medicine exists
  const medicineIsExistsQuery = "SELECT * FROM medicines WHERE mediciene_id = ? && doctor_id =?";
  const medicineIsExistsResult = await query(medicineIsExistsQuery, [medicineId, doctor_id]);
  if (medicineIsExistsResult.length == 0) {
    return error422("Medicine Not Found.", res);
  }

  // check medicience name already exites in medicience
  const isExistMedicienceIdNameQuery = 'SELECT * FROM medicines WHERE (medicience_name = ? && doctor_id = ?) AND mediciene_id !=?'
  const isExistMedicienceNameResult = await query(isExistMedicienceIdNameQuery, [medicience_name, doctor_id, medicineId]);
  if (isExistMedicienceNameResult.length > 0) {
    return error422("Medicience Name is already exists", res);
  }

  try {
    // Start a transaction
    await query("BEGIN");

    const updateQuery = `UPDATE medicines SET medicience_name = ?,content = ?,modified_at = ?, doctor_id = ? WHERE mediciene_id = ?`;
    const updateresult = await query(updateQuery, [medicience_name, content, newDate, doctor_id, medicineId]);

    // Commit the transaction
    await query("COMMIT");

    return res.status(200).json({
      status: 200,
      message: "Medicine updated successfully",
    });

  } catch (error) {
    // Handle errors
    await query("ROLLBACK");
    return error500(error, res)
  }
};
//Delete data than change Status
const deleteMedicine = async (req, res) => {
  const medicineId = parseInt(req.params.id);
  const status = parseInt(req.query.status);
  const doctor_id = req.companyData.doctor_id;

  if (!doctor_id) {
    return error422("Doctor Id is required", res);
  }

  try {
    // Check if Medicine id exists
    const medicineIdIsExistsQuery = "SELECT * FROM medicines WHERE mediciene_id = ? && doctor_id = ?";
    const medicineIdIsExistsResult = await query(medicineIdIsExistsQuery, [medicineId, doctor_id]);
    if (medicineIdIsExistsResult.length == 0) {
      return error422("Medicine Not Found.", res);
    }

    // Validate the status parameter
    if (status !== 0 && status !== 1) {
      return res.status(400).json({
        status: 400,
        message: "Invalid status value. Status must be 0 (inactive) or 1 (active).",
      });
    }

    //update the medicine status
    const deleteUpdateQuery = `UPDATE medicines SET status = ? WHERE mediciene_id = ?`;
    const deleteUpdateResult = await query(deleteUpdateQuery, [status, medicineId]);

    const statusMessage = status === 1 ? "activated" : "deactivated";

    return res.status(200).json({
      status: 200,
      message: `Medicine ${statusMessage} successfully.`,
    });
  } catch (error) {
    return error500(error, res);
  }
};
//active list medicience
const getStatusActive = async (req, res) => {
const doctor_id = req.companyData.doctor_id;
  try {
    const statusActiveQuery = `SELECT * FROM medicines WHERE status =1 && doctor_id =?`;
    const statusActiveResult = await query(statusActiveQuery,[doctor_id]);
    const result = statusActiveResult;
    return res.status(200).json({
      status: 200,
      message: "Medicience Active Successfully.",
      data: result
    });
  } catch (error) {
    return error500(error, res);
  }
};

module.exports = {
    createMedicine,
    getMedicine,
    getMedicience,
    updateMedicine,
    deleteMedicine,
    getStatusActive
}