import express from 'express';
import homeController from '../controller/homeController';
import LoginController from '../controller/LoginController';
import PatientController from '../controller/PatientController';
import DoctorController from '../controller/DoctorController';
import BookingController from '../controller/BookingController';
import db, { sequelize } from '../models/index';
var storage = require('node-persist');
let router = express.Router();

let initWebRoutes = (app) => {
  app.use(express.json());

  // function isLoggedIn(req,res,next)
  // {
  //     if (req.session.userId)
  //         next();
  //     else res.redirect('/api/login');
  // }

  //***************ADMIN****************
  router.get('/create-new-patient', homeController.getCreatePatient); //render ra form create patient
  router.get('/create-new-doctor', homeController.getCreateDoctor); //render ra form create doctor
  router.post('/post-create-patient', homeController.postCreatePatient); //created patient
  router.post('/post-create-doctor', homeController.postCreateDoctor); //created patient
  router.get('/get-crud', homeController.displayGetCRUD); //in ra màn hình 
  router.get('/edit-crud', homeController.getEditCRUD); //edit
  router.post('/put-crud', homeController.putCRUD); //edit xong thì sẽ chuyển
  router.post('/delete-crud', homeController.deleteCRUD); //delete

  router.post('/api/login', LoginController.handleLogin); //login
  router.post('/api/log-out', async (req, res) => {
    await delete req.session.userId;
    await delete req.session.roleId;

    res.send('logged out');
  });
  //***************PATIENT***************

  router.get('/api/get-all-patients', PatientController.handlegetAllPatients); //print all patients

  router.get('/api/patient/info', PatientController.handlegetOnePatient); //print a ptient
  router.post('/api/patient-sign-up', PatientController.handleCreateNewPatient); // patient signup
  router.put('/api/edit-patient', PatientController.handleEditPatient); // edit a patient
  router.put(
    '/api/change-patient-password',
    PatientController.handleChangePassword
  ); // change patient password
  router.delete('/api/delete-patient', PatientController.handleDeletePatient); // delete a patient (might be delete if it's not useful)

  //***************DOCTOR***************

  router.get('/api/get-all-doctors', DoctorController.handlegetAllDoctors); //print all doctors

  router.get('/api/doctor/info', DoctorController.handlegetOneDoctor); //print a ptient
  router.post('/api/doctor-sign-up', DoctorController.handleCreateNewDoctor); // this appears to manual create a new doctor in backend
  router.put('/api/edit-doctor', DoctorController.handleEditDoctor); // edit a doctor
  router.put(
    '/api/change-doctor-password',
    DoctorController.handleChangePassword
  ); // change doctor password
  router.delete('/api/delete-doctor', DoctorController.handleDeleteDoctor); // delete a doctor (might be delete if it's not useful)

  //***************BOOKING***************

  //   router.get('/api/patient-booking', BookingController.handleBooking_1); // render frontend select clinic
  //   router.post('/api/booking-state-clinic', BookingController.postBooking_clinic); // save clinicId and redirect to /api/patient-booking-specialization

  //   router.get('/api/patient-booking-specialization', BookingController.handleBooking_2); // render frontend select specialization
  //   router.post('/api/booking-state-specialization', BookingController.postBooking_specialization); // save specializationId and redirect to /api/patient-booking-doctor

  //   router.get('/api/patient-booking-doctor', BookingController.handleBooking_3); // render frontend select doctor, date and time
  //   router.post('/api/booking-state-complete', BookingController.postBooking_doctor); // result of booking

  router.post(
    '/api/user/booking/cancel',
    BookingController.handleCancelBooking,
    BookingController.DescriptionOfCancel
  );

  router.post(
    '/api/user/booking/confirm',
    BookingController.handleConfirmBooking
  );
  router.post(
    '/api/user/booking/done',
    BookingController.handleDoneBooking,
    BookingController.DescriptionOfDone
  );

  // test frontend style booking
  router.get('/api/booking', async (req, res) => {
    let clinicData = await db.Clinic.findAll({
      raw: true,
    });
    let specializationData = await db.Specialization.findAll({
      raw: true,
    });
    res.send({ clinic: clinicData, specialization: specializationData });
  });
  router.post('/api/get-booking/doctor', async (req, res) => {
    let doctorData = await db.Doctor.findAll({
      where: {
        SpecializationId: req.body.sid,
        ClinicId: req.body.cid,
      },
      raw: true,
    });
    res.send({ doctor: doctorData });
  });

  router.post('/api/booking/done', BookingController.postBooking);

  router.get('/api/get-session', async (req, res) => {
    let response = 'userId' in req.session ? req.session.userId : 'failed';
    let responseStr = 'userId' in req.session ? response.toString() : response;
    res.send(responseStr);
  });

  router.get('/api/profile/patient/:id', async (req, res) => {
    let userId = req.params.id;
    let data = await db.Patient.findOne({
      raw: true,
      where: {
        id: userId,
      },
      attributes: [
        'email',
        'Patient_lastName',
        'Patient_firstName',
        'Patient_address',
        'Patient_gender',
        'Patient_age',
        'Patient_phoneNumber',
      ],
    });

    res.send({ data: data });
  });
  router.get('/api/profile/doctor/:id', async (req, res) => {
    let userId = req.params.id;
    let data = await db.Doctor.findOne({
      raw: true,
      where: {
        id: userId,
      },
      attributes: [
        'email',
        'Doctor_lastName',
        'Doctor_firstName',
        'Doctor_address',
        'Doctor_gender',
        'Doctor_age',
        'Doctor_phoneNumber',
        'ClinicId',
        'SpecializationId',
      ],
    });
    let workData = await db.Clinic.findOne({
      raw: true,
      where: {
        id: data.ClinicId,
      },
      attributes: ['Clinic_address'],
    });
    let specialty = await db.Specialization.findOne({
      raw: true,
      where: {
        id: data.SpecializationId,
      },
      attributes: ['Specialization_name'],
    });

    let combined = { ...data, ...specialty, ...workData };
    res.send({ data: combined });
  });

  router.get('/api/booking/patient/:id', async (req, res) => {
    let userId = req.params.id;
    let bookData = await db.sequelize.query(
      ' SELECT bookings.id,h.StatusId,doctors.Doctor_firstName,f.Doctor_lastName,a.Clinic_name,b.Clinic_address,g.date,c.valueEn AS time,d.valueEn AS status FROM bookings INNER JOIN bookings h ON h.id = bookings.id INNER JOIN doctors ON doctors.id = bookings.DoctorId INNER JOIN doctors AS f ON doctors.id = f.id INNER JOIN clinics a ON a.id = doctors.ClinicId INNER JOIN clinics b ON b.id = doctors.ClinicId INNER JOIN bookings g ON g.id = bookings.id INNER JOIN allcodes c ON c.id = bookings.timeType INNER JOIN allcodes d ON d.id = bookings.StatusId WHERE bookings.PatientId = ' +
        userId +
        ' ORDER by h.StatusId asc , bookings.id asc',
      { type: db.sequelize.QueryTypes.SELECT }
    );

    if (bookData.length === 0)
      res.send({ data: { message: 'No booking records found!' } });
    else {
      res.send({ data: bookData });
    }
  });

  router.get('/api/booking/doctor/:id', async (req, res) => {
    let userId = req.params.id;
    let bookData = await db.sequelize.query(
      'SELECT bookings.id, h.StatusId, patients.Patient_firstName, patients.Patient_lastName, a.Clinic_name, b.Clinic_address, g.date, c.valueEn AS time, d.valueEn AS status FROM bookings INNER JOIN bookings h ON h.id = bookings.id INNER JOIN patients ON patients.id = bookings.PatientId INNER JOIN patients AS f ON patients.id = f.id INNER JOIN doctors ON doctors.id = bookings.DoctorId INNER JOIN doctors AS f1 ON doctors.id = f1.id INNER JOIN clinics a ON a.id = doctors.ClinicId INNER JOIN clinics b ON b.id = doctors.ClinicId INNER JOIN bookings g ON g.id = bookings.id INNER JOIN allcodes c ON c.id = bookings.timeType INNER JOIN allcodes d ON d.id = bookings.StatusId WHERE bookings.DoctorId = ' +
        userId +
        ' ORDER by h.StatusId asc , bookings.id asc',
      { type: db.sequelize.QueryTypes.SELECT }
    );

    if (bookData.length === 0) {
      res.send({ data: { message: 'No booking records found!' } });
    } else res.send({ data: bookData });
  });
  router.get('/api/history/patient/:id', async (req, res) => {
    let userId = req.params.id;
    let history = await db.sequelize.query(
      'SELECT histories.id,b.History_description,doctors.Doctor_firstName,a.Doctor_lastName,clinics.Clinic_name,bookings.date,allcodes.valueEn as status from histories inner join histories as b on b.id = histories.id INNER join doctors on doctors.id = histories.DoctorId inner join doctors as a on a.id = histories.DoctorId inner join clinics on clinics.id = doctors.ClinicId INNER join bookings on bookings.id = histories.BookingId inner join allcodes on allcodes.id = bookings.StatusId where histories.PatientId = ' +
        userId,
      { type: db.sequelize.QueryTypes.SELECT }
    );
    if (history.length == 0)
      res.send({ data: { message: 'No histories found!' } });
    else res.send({ data: history });
  });

  router.get('/api/history/doctor/:id', async (req, res) => {
    let userId = req.params.id;
    let history = await db.sequelize.query(
      'select histories.id,a.History_description,patients.Patient_firstName,patients.Patient_lastName,clinics.Clinic_name,c.Clinic_address,bookings.date,d.valueEn,allcodes.valueEn as status from histories INNER join histories as a on a.id = histories.id inner join patients on patients.id = histories.PatientId inner join patients as b on b.id = histories.PatientId inner join doctors on doctors.id = histories.DoctorId inner join clinics on clinics.id = doctors.ClinicId inner join clinics as c on c.id = doctors.ClinicId inner join bookings on bookings.id = histories.BookingId inner join allcodes as d on d.id = bookings.timeType inner join allcodes on allcodes.id = bookings.StatusId WHERE histories.DoctorId = ' +
        userId,
      { type: db.sequelize.QueryTypes.SELECT }
    );
    if (history.length === 0)
      res.send({ data: { message: 'No histories found!' } });
    else res.send({ data: history });
  });
  //*****************APP*****************
  router.get(
    '/api/home/specialization',
    homeController.getSpecializationToHome
  );

  return app.use('/', router);
};

module.exports = initWebRoutes;
