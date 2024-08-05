const pool = require("../../../db");
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

//create specialization
const createSpecialization = async (req, res) => {
    const specialization_name = req.body.specialization_name ? req.body.specialization_name	.trim() : '';
    const description = req.body.description ? req.body.description.trim() : '';
    const untitled_id = 1;
    if (!specialization_name) {
        return error422("Specialization Name is required", res);
    } else if (!untitled_id) {
        return error422("untitled id is required", res);
    } 
    try {
        //Start the transaction
        await query("BEGIN");
        //Insert Specialization Details
        const insertSpecializationQuery = 'INSERT INTO specialization  (specialization_name, description, untitled_id) VALUES (?,?,?)';
        const insertSpecializationValues = [specialization_name, description, untitled_id];
        const insertSpecializationResult = await query(insertSpecializationQuery, insertSpecializationValues);
    
    //commit the transation
    await query("COMMIT");

    return res.status(200).json({
        status: 200,
        message: "Specialization Added Successfull",
    });
    } catch (error) {
    //Handle errors
    await query("ROLLBACK");
    return error500(error,res)
}
};

// get specialization by id
const getSpecialization = async (req, res) => {
    const Sid = parseInt(req.params.id);
    try {
      const specializationQuery = 'SELECT * FROM specialization WHERE s_id = ?';
      const specializationResult = await query(specializationQuery, [Sid]);
      
      if (specializationResult.length === 0) {
        return error422("Specialization Not Found.", res);
      }
      return res.status(200).json({
        status: 200,
        message: "Specialization fetched successfully",
        data: specializationResult[0],
      });
  
    } catch (error) {
      // Handle errors
      await query("ROLLBACK");
      return error500(error, res)
  
    }
};

//get specializations
const getSpecializations = async (req, res) => {
    const { page, perPage, key } = req.query;
    try {
        let getSpecializationQuery = `SELECT * FROM specialization`;
        let countQuery = `SELECT COUNT(*) AS total FROM specialization`;
        if (key) {
          const lowercaseKey = key.toLowerCase().trim();
          if (lowercaseKey === "activated") {
            getSpecializationQuery += ` WHERE status = 1`;
            countQuery += ` WHERE status = 1`;
          } else if (lowercaseKey === "deactivated") {
            getSpecializationQuery += ` WHERE status = 0`;
            countQuery += ` WHERE status = 0`;
          } else {
            getSpecializationQuery += ` WHERE LOWER(specialization_name) LIKE '%${lowercaseKey}%'`;
            countQuery += ` WHERE LOWER(specialization_name) LIKE '%${lowercaseKey}%'`;
          }
        }
        let total = 0;

        // Apply pagination if both page and perPage are provided
        if (page && perPage) {
          const totalResult = await query(countQuery,);
          total = parseInt(totalResult[0].total);
          const start = (page - 1) * perPage;
          getSpecializationQuery += ` LIMIT ${perPage} OFFSET ${start}`;
        }

        const result = await query(getSpecializationQuery);
        const data = {
        status: 200,
        message: "Specialization retrieved successfully",
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

//Update Specialization
const updateSpecialization = async (req, res) => {
    const SId = parseInt(req.params.id);
    const newDate = new Date();
    const specialization_name = req.body.specialization_name ? req.body.specialization_name.trim() : '';
    const description = req.body.description ? req.body.description.trim() : '';
    if (!specialization_name) {
      return error422("specialization Name is required", res);
    } else if (!SId) {
      return error422("specialization Id is required", res);
    }
  
    // Check if specialization exists
    const specializationIsExistsQuery = "SELECT * FROM specialization WHERE s_id = ?";
    const specializationIsExistsResult = await query(specializationIsExistsQuery, [SId]);
    if (specializationIsExistsResult.length == 0) {
      return error422("specialization Not Found.", res);
    }
  
    // check specializatuin name already exites in specialization
    const isExistSpecializationNameQuery = 'SELECT * FROM specialization WHERE specialization_name= ? && s_id !=?';
    const isExistSpecializationNameResult = await query(isExistSpecializationNameQuery, [specialization_name, SId]);
    if (isExistSpecializationNameResult.length > 0) {
      return error422("Specialization Name is already exists", res);
    }
  
    try {
      // Start a transaction
      await query("BEGIN");
  
      const updateQuery = `UPDATE specialization SET specialization_name= ?,description=?,updated_date = ? where s_id=?`;
      const updateresult = await query(updateQuery, [specialization_name, description, newDate, SId]);
  
      // Commit the transaction
      await query("COMMIT");
  
      return res.status(200).json({
        status: 200,
        message: "Specialization updated successfully",
      });
  
    } catch (error) {
      // Handle errors
      await query("ROLLBACK");
      return error500(error, res)
    }
  };

 //Delete data than change Status
const deleteSpecialization = async (req, res) => {
    const SId = parseInt(req.params.id);
    const status = parseInt(req.query.status);
    if (!SId) {
      return error422("Specialization Id is required", res);
    }
  
    try {
      // Check if specialization id exists
      const specializationIdIsExistsQuery = "SELECT * FROM specialization WHERE s_id = ?";
      const specializationIdIsExistsResult = await query(specializationIdIsExistsQuery, [SId]);
      if (specializationIdIsExistsResult.length == 0) {
        return error422("specialization Not Found.", res);
      }
  
      // Validate the status parameter
      if (status !== 0 && status !== 1) {
        return res.status(400).json({
          status: 400,
          message: "Invalid status value. Status must be 0 (inactive) or 1 (active).",
        });
      }
  
      //update the state status
      const deleteUpdateQuery = `UPDATE specialization SET status = ? WHERE s_id = ?`;
      const deleteUpdateResult = await query(deleteUpdateQuery, [status, SId]);
  
      const statusMessage = status === 1 ? "activated" : "deactivated";
  
      return res.status(200).json({
        status: 200,
        message: `Specialization ${statusMessage} successfully.`,
      });
    } catch (error) {
      return error500(error, res);
    }
  }; 

  //active list Specialization
    const getStatusActive = async (req, res) => {
    try {
      const statusActiveQuery = `SELECT * FROM specialization WHERE status =1`;
      const statusActiveResult = await query(statusActiveQuery);
      const result = statusActiveResult;
      return res.status(200).json({
        status: 200,
        message: "Specialization Active Successfully.",
        data: result
      });
    } catch (error) {
      return error500(error, res);
    }
  };


module.exports = {
    createSpecialization,
    getSpecialization,
    getSpecializations,
    updateSpecialization,
    deleteSpecialization,
    getStatusActive
}

