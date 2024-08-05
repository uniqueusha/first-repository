const express = require ('express');
const doctorController = require('../../controller/Admin/doctor.controller');
const checkAuth = require('../../middleware/check.auth');

const router = express.Router();

router.post('/',doctorController.createDoctor);
router.post('/supper_admin',doctorController.createSupperAdmin);
router.post('/Login',doctorController.doctorLogin);
router.get('/',doctorController.getDoctors);
router.get('/wma',doctorController.getStatusActive);
router.get('/category',doctorController.getDoctorByCategory);
router.get('/get-doctors-by-specializations',doctorController.getDoctorBySpecializationId);
router.get('/:id',doctorController.getDoctor);
router.put('/:id',doctorController.updateDoctor);
router.delete('/:id',doctorController.deleteDoctor);

module.exports = router;