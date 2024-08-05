const express = require("express");
const medicienceContoller = require("../../controller/Admin/medicience.controller");
const checkAuth = require("../../middleware/check.auth");

const router = express.Router();

router.post('/',checkAuth,medicienceContoller.createMedicine);
router.get('/',checkAuth,medicienceContoller.getMedicience);
router.get('/wma',checkAuth,medicienceContoller.getStatusActive);
router.get('/:id',checkAuth,medicienceContoller.getMedicine);
router.put('/:id',checkAuth,medicienceContoller.updateMedicine);
router.delete('/:id',checkAuth,medicienceContoller.deleteMedicine);
module.exports = router;