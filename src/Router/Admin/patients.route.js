const express = require("express");
const patientContoller = require("../../controller/Admin/patients.controller");
const checkAuth = require("../../middleware/check.auth");

const router = express.Router();
router.post('/',patientContoller.createPatient);

router.get('/',patientContoller.getPatients);
router.get('/search_patient',patientContoller. getPatientbyMobileNo);
router.get('/confirm',patientContoller.getStatusConfirm);
router.get('/pending',patientContoller.getStatusPending);
router.get('/wma',patientContoller.getStatusActive);
router.get('/:id',patientContoller.getPatient);
router.patch('/:id',patientContoller.patientStatusChange);
router.put('/:id',checkAuth,patientContoller.updatePatient);

router.delete('/:id',checkAuth,patientContoller.deletePatient);



module.exports = router;