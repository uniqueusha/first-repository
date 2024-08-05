const express = require('express');
const consultationContoller = require('../../controller/Doctor/consultations.controller');
const checkAuth = require("../../middleware/check.auth");

const router = express.Router();
router.post('/',consultationContoller.createConsultation);
router.get('/',consultationContoller.getConsultations);
router.get('/:id',consultationContoller.getConsultation);
router.put('/:id',consultationContoller.updateConsultation);
router.delete('/:id',consultationContoller.deleteConsultationMedicine);

module.exports = router;



