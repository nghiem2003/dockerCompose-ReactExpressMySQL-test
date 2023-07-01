import PatientService from "../services/PatientService"
import db from "../models/index";
var storage = require('node-persist');
let handlegetAllPatients = async (req, res) => {
    let id = req.query.id; // truyền All, id
    raw: true;
    if(!id){
        return res.status(200).json({
        errCode: 1,
        errMessage: 'Missing required parameters',
        users: []
    })
    }
    let users = await PatientService.getAllPatients(id);
    
    return res.status(200).json({
        errCode: 0,
        errMessage: 'OK',
        users
    })
}

let handleCreateNewPatient = async (req, res) =>{
    let message = await PatientService.createNewPatient(req.body);
    console.log(message);
    return res.status(200).json(message)
    
}

let handleEditPatient = async (req, res) =>{
    let data = req.body;
    let message = await PatientService.updatePatientData(data);
    return res.status(200).json(message);
}
let handleDeletePatient = async (req, res) =>{
    if(!req.body.email){
        return res.status(200).json({
            errCode: 1,
            errMessage: 'Missing required parameters',
        })
    }
    let message = await PatientService.deleteUser(req.body.email);
    return res.status(200).json(message);
}

let handleBooking_1 = async (req, res) =>{
    return res.render('patient_booking_clinic.ejs');
}

let postBooking_clinic = async (req, res) => {
    let message = await PatientService.createBooking_clinic(req.body);
    console.log(message)
    return res.redirect('/patient-booking-specialization');
}

let handleBooking_2 = async (req, res) =>{
    return res.render('patient_booking_specialization.ejs');
}

let postBooking_specialization = async (req, res) => {
    let message = await PatientService.createBooking_specialization(req.body);
    console.log(message)
    return res.redirect('/patient-booking-doctor');
}

let handleBooking_3 = async (req, res) =>{
    const doctors = await db.Doctor.findAll({
        where: { ClinicId: PatientService.Clinic_value(),
                SpecializationId: PatientService.Specialization_value()
         },
    });
    // Render file EJS và truyền danh sách bác sĩ vào
    res.render('patient-booking-doctor.ejs', { doctors: doctors });
}


let postBooking_doctor = async (req, res) => {
    let message = await PatientService.createBooking_doctor(req.body);
    console.log(message)
    return res.send('Created');
}
module.exports ={
    handlegetAllPatients: handlegetAllPatients,
    handleCreateNewPatient: handleCreateNewPatient,
    handleEditPatient: handleEditPatient,
    handleDeletePatient: handleDeletePatient,
    handleBooking_1: handleBooking_1,
    postBooking_clinic: postBooking_clinic,
    handleBooking_2: handleBooking_2,
    postBooking_specialization: postBooking_specialization,
    handleBooking_3: handleBooking_3,
    postBooking_doctor: postBooking_doctor,
}