const express = require("express");
const specializationController = require("../../controller/Admin/specialization.controller");

const checkAuth = require("../../middleware/check.auth");

const router = express.Router();

router.post("/", specializationController.createSpecialization);
router.get("/",specializationController.getSpecializations);
router.get("/wma",specializationController.getStatusActive);
router.get("/:id",specializationController.getSpecialization);
router.put("/:id",specializationController.updateSpecialization);
router.delete("/:id",specializationController.deleteSpecialization);
module.exports = router;
