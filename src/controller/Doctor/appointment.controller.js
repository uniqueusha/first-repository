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
// Creates Appointment
const createAppointment = async (req, res) => {
    const day = req.body.day ? req.body.day.trim() : '';
    const time = req.body.time ? req.body.time : '';
    const comment = req.body.comment ? req.body.comment.trim() : '';
    const doctor_id = req.companyData.doctor_id;
    if (!day) {
      return error422("Day is required", res);
    } else if (!time) {
      return error422("Time is require", res);
    } else if (!comment) {
      return error422("Comment is require", res);
    } else if (!doctor_id) {
      return error422("Doctor id is require", res);
    } 
    try {
      // Start a transaction
      await query("BEGIN");
  
      // Insert Appointment details
      const insertAppointmentQuery = 'INSERT INTO appointment_slots (day, time, comment, doctor_id) VALUES (?,?,?,?)';
      const insertAppointmentValues = [day, time, comment, doctor_id];
      const insertAppointmentResult = await query(insertAppointmentQuery, insertAppointmentValues);
  
      // Commit the transaction
      await query("COMMIT");
  
      return res.status(200).json({
        status: 200,
        message: "Appointment create successfully",
      });
    } catch (error) {
      // Handle errors
      await query("ROLLBACK");
      return error500(error, res)
  
    }
  };
  // get Appointment slot by id...
const getAppointmentSlot = async (req, res) => {
    const slotId = parseInt(req.params.id);
    const doctor_id = req.companyData.doctor_id
    try {
      const appointmentQuery = 'SELECT * FROM appointment_slots WHERE  slot_id = ? AND doctor_id = ?';
      const appointmentResult = await query(appointmentQuery, [slotId, doctor_id]);
  
      if (appointmentResult.length === 0) {
        return error422("Appointment Not Found.", res);
      }
      return res.status(200).json({
        status: 200,
        message: "Appointment fetched successfully",
        data: appointmentResult[0],
      });
  
    } catch (error) {
      // Handle errors
      await query("ROLLBACK");
      return error500(error, res)
  
    }
  };
  //get getAppointments...
const getAppointments = async (req, res) => {
    const { page, perPage, key } = req.query;
    const doctor_id = req.companyData.doctor_id;
    try {
      let getAppointmentsQuery = `SELECT * FROM appointment_slots WHERE  doctor_id = ${doctor_id}`;
      let countQuery = `SELECT COUNT(*) AS total FROM appointment_slots WHERE doctor_id = ${doctor_id}`;
      if (key) {
        const lowercaseKey = key.toLowerCase().trim();
        if (lowercaseKey === "activated") {
          getAppointmentsQuery += `AND tatus = 1`;
          countQuery += ` AND status = 1`;
        } else if(lowercaseKey === "deactivated") {
          getAppointmentsQuery += ` AND status = 0`;
          countQuery += ` AND status = 0`;
        } 
    }
      let total = 0;
      // Apply pagination if both page and perPage are provided
      if (page && perPage) {
        const totalResult = await query(countQuery,);
        total = parseInt(totalResult[0].total);
        const start = (page - 1) * perPage;
        getAppointmentsQuery += ` LIMIT ${perPage} OFFSET ${start}`;
      }
  
      const result = await query(getAppointmentsQuery);
      const data = {
        status: 200,
        message: "Appointments retrieved successfully",
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
  //update Appointment
const updateAppointment = async (req, res) => {
  
    const slotId = parseInt(req.params.id);
    const newDate = new Date();
    const day = req.body.day ? req.body.day.trim() : '';
    const time = req.body.time ? req.body.time : '';
    const comment = req.body.comment ? req.body.comment.trim() : '';
    const doctor_id = req.companyData.doctor_id;
    
    if (!day) {
      return error422("Day is required", res);
    } else if (!time) {
      return error422("Time is require", res);
    } else if (!comment) {
      return error422("Comment is require", res);
    } else if (!doctor_id) {
      return error422("Doctor id is require", res);
    }
  
    // Check if Appointment exists
    const appointmentIsExistsQuery = "SELECT * FROM appointment_slots WHERE slot_id = ? && doctor_id = ?";
    const appointmentIsExistsResult = await query(appointmentIsExistsQuery, [slotId, doctor_id]);
    if (appointmentIsExistsResult.length == 0) {
      return error422("Appointment Not Found.", res);
    }
  
    try {
      // Start a transaction
      await query("BEGIN");
  
      const updateQuery = `UPDATE appointment_slots SET day = ?, time = ?, comment = ?, modified_at = ? WHERE slot_id = ?`;
      const updateresult = await query(updateQuery, [day, time, comment, newDate, slotId]);
  
      // Commit the transaction
      await query("COMMIT");
  
      return res.status(200).json({
        status: 200,
        message: "Appointment updated successfully",
      });
  
    } catch (error) {
      // Handle errors
      await query("ROLLBACK");
      return error500(error, res)
    }
  };
  //change Status (Delete) for Appointment
const deleteAppointment = async (req, res) => {
    const slotId = parseInt(req.params.id);
    const status = parseInt(req.query.status);
    const doctor_id = req.companyData.doctor_id;
    if (!doctor_id) {
        return error422("Doctor Id is required", res);
      }
    try {
      // Check if Apoointment slot id exists
      const appointmentIdIsExistsQuery = "SELECT * FROM appointment_slots WHERE slot_id = ? && doctor_id =?";
      const appointmentIdIsExistsResult = await query(appointmentIdIsExistsQuery, [slotId, doctor_id]);
      if (appointmentIdIsExistsResult.length == 0) {
        return error422("Appointment Not Found.", res);
      }
  
      // Validate the status parameter
      if (status !== 0 && status !== 1) {
        return res.status(400).json({
          status: 400,
          message: "Invalid status value. Status must be 0 (inactive) or 1 (active).",
        });
      }
  
      //update the patient status
      const deleteUpdateQuery = `UPDATE appointment_slots SET status = ? WHERE slot_id = ?`;
      const deleteUpdateResult = await query(deleteUpdateQuery, [status, slotId]);
  
      const statusMessage = status === 1 ? "activated" : "deactivated";
  
      return res.status(200).json({
        status: 200,
        message: `Appointment ${statusMessage} successfully.`,
      });
    } catch (error) {
      return error500(error, res);
    }
  };
  //active list Appointments
    const getStatusActive = async (req, res) => {
    const doctor_id = req.companyData.doctor_id;
    try {
      const statusActiveQuery = `SELECT * FROM appointment_slots WHERE status =1 && doctor_id =?`;
      const statusActiveResult = await query(statusActiveQuery,[doctor_id]);
      const result = statusActiveResult;
      return res.status(200).json({
        status: 200,
        message: "Appointment Active Successfully.",
        data: result
      });
    } catch (error) {
      return error500(error, res);
    }
  };
module.exports = {
    createAppointment,
    getAppointmentSlot,
    getAppointments,
    updateAppointment,
    deleteAppointment,
    getStatusActive
  }