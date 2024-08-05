const express = require("express");
const appointmentContoller = require("../../controller/Doctor/appointment.controller");
const checkAuth = require("../../middleware/check.auth");

const router = express.Router();
router.post('/',checkAuth,appointmentContoller.createAppointment);
router.get('/',checkAuth,appointmentContoller.getAppointments);
router.get('/wma',checkAuth,appointmentContoller.getStatusActive);
router.get('/:id',checkAuth,appointmentContoller.getAppointmentSlot);
router.put('/:id',appointmentContoller.updateAppointment);
router.delete('/:id',checkAuth,appointmentContoller.deleteAppointment);
module.exports = router;