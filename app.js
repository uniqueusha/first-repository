
const express=require('express');
const bodyParser=require("body-parser");
const cors = require('cors');
const app=express();
const path = require("path");   
app.use(express.json({ limit: '50mb' }));  

const specializationRoute = require("./src/Router/Admin/specialization.route");
const doctorRoute = require("./src/Router/Admin/doctor.route");
const medicienceRoute = require("./src/Router/Admin/medicience.route");
const patientsRoute = require("./src/Router/Admin/patients.route");
const consultationsRoute = require("./src/Router/Doctor/consultations.route");
const appointmentRoute = require("./src/Router/Doctor/appointment.route");


app.use(bodyParser.json());
app.use((req,res,next)=>{
    res.setHeader("Access-Control-Allow-Origin","*");
    res.setHeader(
        "Access-Control-Allow-Headers",
        "Origin,X-Requested-With,Content-Type,Accept, Authorization"
    );
    res.setHeader(
        "Access-Control-Allow-Methods",
        "GET,POST,PATCH,PUT,DELETE,OPTIONS" 
    );
    next();
});

app.use(cors());

app.use('/api/specialization',specializationRoute);
app.use('/api/doctor',doctorRoute);
app.use('/api/medicience',medicienceRoute);
app.use('/api/patient',patientsRoute);
app.use('/api/consultations',consultationsRoute);
app.use('/api/appointment',appointmentRoute);



module.exports = app;