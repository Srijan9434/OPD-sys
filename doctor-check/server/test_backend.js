import 'dotenv/config'
import mongoose from 'mongoose'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { app } from './server.js'
import User from './models/User.js'
import Doctor from './models/Doctor.js'
import Appointment from './models/Appointments.js'

let server
let baseUrl

const runTests = async () => {
  console.log('--- STARTING SHARED BACKEND INTEGRATION TEST SUITE ---')

  // 1. Connect DB
  await mongoose.connect(process.env.MONGO_URI)
  console.log('✓ Connected to MongoDB:', process.env.MONGO_URI)

  // 2. Start server on ephemeral port for tests
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port
      baseUrl = `http://127.0.0.1:${port}`
      console.log(`✓ Test server running on ${baseUrl}`)
      resolve()
    })
  })

  let testPatientUser
  let testPatientToken
  let testPatient2User
  let testPatient2Token
  let testDoctorUser
  let testDoctorDoc
  let testDoctorToken
  let testAppointmentId

  try {
    // 3. Test Unauthenticated Access Rejection
    console.log('\n--- 1. Testing Unauthenticated Access Rejection ---')
    const unauthAptRes = await fetch(`${baseUrl}/api/appointments/my`)
    if (unauthAptRes.status === 401) {
      console.log('✓ GET /api/appointments/my rejected without token (401)')
    } else {
      throw new Error(`Expected 401, got ${unauthAptRes.status}`)
    }

    const unauthDocRes = await fetch(`${baseUrl}/api/doctor/dashboard`)
    if (unauthDocRes.status === 401) {
      console.log('✓ GET /api/doctor/dashboard rejected without token (401)')
    } else {
      throw new Error(`Expected 401, got ${unauthDocRes.status}`)
    }

    const unauthPostRes = await fetch(`${baseUrl}/api/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: '2026-11-01', slot: '9:00 am' }),
    })
    if (unauthPostRes.status === 401) {
      console.log('✓ POST /api/appointments rejected without token (401)')
    } else {
      throw new Error(`Expected 401, got ${unauthPostRes.status}`)
    }

    // Setup Test Users
    console.log('\n--- 2. Setting Up Test Accounts in opd Database ---')
    const hashedPassword = await bcrypt.hash('password123', 10)

    // Patient 1
    await User.deleteOne({ email: 'test_patient_integration@opd.local' })
    testPatientUser = await User.create({
      name: 'Test Patient Integration',
      email: 'test_patient_integration@opd.local',
      password: hashedPassword,
      role: 'user',
      phone: '9876543210',
    })
    testPatientToken = jwt.sign({ id: testPatientUser._id }, process.env.JWT_SECRET, { expiresIn: '1d' })
    console.log('✓ Test patient created with token')

    // Patient 2 (for unauthorized test)
    await User.deleteOne({ email: 'test_patient2_integration@opd.local' })
    testPatient2User = await User.create({
      name: 'Test Patient 2 Integration',
      email: 'test_patient2_integration@opd.local',
      password: hashedPassword,
      role: 'user',
      phone: '9876543211',
    })
    testPatient2Token = jwt.sign({ id: testPatient2User._id }, process.env.JWT_SECRET, { expiresIn: '1d' })
    console.log('✓ Test patient 2 created with token')

    // Doctor
    await User.deleteOne({ email: 'test_doctor_integration@opd.local' })
    testDoctorUser = await User.create({
      name: 'Dr. Test Integration',
      email: 'test_doctor_integration@opd.local',
      password: hashedPassword,
      role: 'doctor',
      phone: '9876543212',
    })
    testDoctorToken = jwt.sign({ id: testDoctorUser._id }, process.env.JWT_SECRET, { expiresIn: '1d' })

    await Doctor.deleteOne({ user: testDoctorUser._id })
    testDoctorDoc = await Doctor.create({
      user: testDoctorUser._id,
      name: 'Dr. Test Integration',
      speciality: 'Cardiology',
      degree: 'MD, MBBS',
      experience: '10 Years',
      fee: 650,
      available: true,
      slots: ['9:00 am', '9:30 am', '10:00 am', '10:30 am'],
      about: 'Integration test cardiologist',
    })
    console.log('✓ Test doctor created with profile and token')

    // 4. Test Role Authorization
    console.log('\n--- 3. Testing Role-Based Authorization ---')
    const patientDoctorDashboardRes = await fetch(`${baseUrl}/api/doctor/dashboard`, {
      headers: { Authorization: `Bearer ${testPatientToken}` },
    })
    if (patientDoctorDashboardRes.status === 403) {
      console.log('✓ Patient token accessing /api/doctor/dashboard was forbidden (403)')
    } else {
      throw new Error(`Expected 403, got ${patientDoctorDashboardRes.status}`)
    }

    const doctorDashboardRes = await fetch(`${baseUrl}/api/doctor/dashboard`, {
      headers: { Authorization: `Bearer ${testDoctorToken}` },
    })
    if (doctorDashboardRes.status === 200) {
      const docData = await doctorDashboardRes.json()
      if (docData.success && docData.data?.doctor) {
        console.log('✓ Doctor token accessing /api/doctor/dashboard succeeded (200)')
      } else {
        throw new Error('Doctor dashboard response missing data')
      }
    } else {
      throw new Error(`Expected 200, got ${doctorDashboardRes.status}`)
    }

    // 5. Test Public Doctor APIs
    console.log('\n--- 4. Testing Public Doctor Endpoints ---')
    const doctorsRes = await fetch(`${baseUrl}/api/doctors`)
    const doctorsData = await doctorsRes.json()
    if (doctorsRes.status === 200 && doctorsData.success && Array.isArray(doctorsData.data)) {
      console.log(`✓ GET /api/doctors returned ${doctorsData.count} doctor(s) (200)`)
    } else {
      throw new Error('GET /api/doctors failed')
    }

    const docDetailRes = await fetch(`${baseUrl}/api/doctors/${testDoctorDoc._id}`)
    const docDetailData = await docDetailRes.json()
    if (docDetailRes.status === 200 && docDetailData.success && docDetailData.data?._id === testDoctorDoc._id.toString()) {
      console.log(`✓ GET /api/doctors/:id returned doctor details (200)`)
    } else {
      throw new Error('GET /api/doctors/:id failed')
    }

    const invalidDocIdRes = await fetch(`${baseUrl}/api/doctors/invalid-object-id`)
    if (invalidDocIdRes.status === 400) {
      console.log('✓ GET /api/doctors/invalid-id properly returns 400 Bad Request')
    } else {
      throw new Error(`Expected 400, got ${invalidDocIdRes.status}`)
    }

    const notFoundDocRes = await fetch(`${baseUrl}/api/doctors/65f000000000000000000000`)
    if (notFoundDocRes.status === 404) {
      console.log('✓ GET /api/doctors/non-existent-id properly returns 404 Not Found')
    } else {
      throw new Error(`Expected 404, got ${notFoundDocRes.status}`)
    }

    // 6. Test Patient Appointment Booking Validation
    console.log('\n--- 5. Testing Patient Appointment Booking Validations ---')

    // Invalid slot
    const invalidSlotRes = await fetch(`${baseUrl}/api/appointments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${testPatientToken}`,
      },
      body: JSON.stringify({
        doctorId: testDoctorDoc._id,
        date: '2026-11-20',
        slot: '3:00 am', // Not in doctor's slots
      }),
    })
    if (invalidSlotRes.status === 400) {
      console.log('✓ Booking with invalid slot rejected with 400')
    } else {
      throw new Error(`Expected 400 for invalid slot, got ${invalidSlotRes.status}`)
    }

    // Past date
    const pastDateRes = await fetch(`${baseUrl}/api/appointments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${testPatientToken}`,
      },
      body: JSON.stringify({
        doctorId: testDoctorDoc._id,
        date: '2020-01-01',
        slot: '9:00 am',
      }),
    })
    if (pastDateRes.status === 400) {
      console.log('✓ Booking with past date rejected with 400')
    } else {
      throw new Error(`Expected 400 for past date, got ${pastDateRes.status}`)
    }

    // Valid booking
    console.log('\n--- 6. Testing Patient Appointment Creation ---')
    const bookRes = await fetch(`${baseUrl}/api/appointments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${testPatientToken}`,
      },
      body: JSON.stringify({
        doctorId: testDoctorDoc._id,
        date: '2026-11-20',
        slot: '9:00 am',
        reason: 'Chest discomfort test',
        paymentMode: 'cash',
      }),
    })
    const bookData = await bookRes.json()
    if (bookRes.status === 201 && bookData.success && bookData.data?._id) {
      testAppointmentId = bookData.data._id
      console.log(`✓ Appointment successfully created (201). ID: ${testAppointmentId}`)
      console.log(`  Patient derived from token: ${bookData.data.patient?.email}`)
      console.log(`  Doctor fee saved: ₹${bookData.data.payment?.amount}`)
      console.log(`  Initial status: ${bookData.data.status}`)
    } else {
      throw new Error(`Booking failed: ${JSON.stringify(bookData)}`)
    }

    // Duplicate booking collision
    console.log('\n--- 7. Testing Duplicate Slot Collision Prevention ---')
    const duplicateRes = await fetch(`${baseUrl}/api/appointments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${testPatient2Token}`,
      },
      body: JSON.stringify({
        doctorId: testDoctorDoc._id,
        date: '2026-11-20',
        slot: '9:00 am', // Same slot & date
      }),
    })
    if (duplicateRes.status === 409) {
      console.log('✓ Duplicate booking collision rejected with 409 Conflict')
    } else {
      throw new Error(`Expected 409, got ${duplicateRes.status}`)
    }

    // 7. Patient appointment retrieval
    console.log('\n--- 8. Testing Patient Appointment Retrieval ---')
    const myAptsRes = await fetch(`${baseUrl}/api/appointments/my`, {
      headers: { Authorization: `Bearer ${testPatientToken}` },
    })
    const myAptsData = await myAptsRes.json()
    if (myAptsRes.status === 200 && myAptsData.success && myAptsData.data.some((a) => a._id === testAppointmentId)) {
      console.log(`✓ GET /api/appointments/my retrieved patient appointment with populated doctor (200)`)
    } else {
      throw new Error('Patient appointments list did not contain created appointment')
    }

    // 8. Doctor API compatibility - Retrieval of the same appointment
    console.log('\n--- 9. Testing Doctor API Reading Patient Appointment ---')
    const doctorAptsRes = await fetch(`${baseUrl}/api/doctor/appointments`, {
      headers: { Authorization: `Bearer ${testDoctorToken}` },
    })
    const doctorAptsData = await doctorAptsRes.json()
    if (doctorAptsRes.status === 200 && doctorAptsData.success && doctorAptsData.data.some((a) => a._id === testAppointmentId)) {
      console.log(`✓ Doctor API GET /api/doctor/appointments successfully retrieved patient appointment! (200)`)
    } else {
      throw new Error('Doctor appointments did not contain the patient appointment')
    }

    // Doctor updates status to 'confirmed'
    const docUpdateRes = await fetch(`${baseUrl}/api/doctor/appointments/${testAppointmentId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${testDoctorToken}`,
      },
      body: JSON.stringify({ status: 'confirmed' }),
    })
    const docUpdateData = await docUpdateRes.json()
    if (docUpdateRes.status === 200 && docUpdateData.data?.status === 'confirmed') {
      console.log(`✓ Doctor updated appointment status to 'confirmed' (200)`)
    } else {
      throw new Error('Doctor status update failed')
    }

    // Patient verifies status is now confirmed
    const patientVerifyRes = await fetch(`${baseUrl}/api/appointments/my`, {
      headers: { Authorization: `Bearer ${testPatientToken}` },
    })
    const patientVerifyData = await patientVerifyRes.json()
    const verifiedApt = patientVerifyData.data.find((a) => a._id === testAppointmentId)
    if (verifiedApt && verifiedApt.status === 'confirmed') {
      console.log(`✓ Patient history confirmed updated status reflects across portals!`)
    } else {
      throw new Error('Cross-portal status synchronization check failed')
    }

    // 9. Unauthorized Modification Prevention
    console.log('\n--- 10. Testing Unauthorized Access Prevention ---')
    const unauthorizedCancelRes = await fetch(`${baseUrl}/api/appointments/${testAppointmentId}/cancel`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${testPatient2Token}`, // Patient 2 trying to cancel Patient 1's appointment
      },
    })
    if (unauthorizedCancelRes.status === 403) {
      console.log(`✓ Patient 2 attempting to cancel Patient 1's appointment rejected with 403 Forbidden`)
    } else {
      throw new Error(`Expected 403 for unauthorized cancellation, got ${unauthorizedCancelRes.status}`)
    }

    const unauthorizedReschedRes = await fetch(`${baseUrl}/api/appointments/${testAppointmentId}/reschedule`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${testPatient2Token}`, // Patient 2 trying to reschedule Patient 1's appointment
      },
      body: JSON.stringify({ date: '2026-11-20', slot: '10:00 am' }),
    })
    if (unauthorizedReschedRes.status === 403) {
      console.log(`✓ Patient 2 attempting to reschedule Patient 1's appointment rejected with 403 Forbidden`)
    } else {
      throw new Error(`Expected 403 for unauthorized rescheduling, got ${unauthorizedReschedRes.status}`)
    }

    // 10. Patient Appointment Rescheduling
    console.log('\n--- 11. Testing Patient Appointment Rescheduling ---')
    const reschedRes = await fetch(`${baseUrl}/api/appointments/${testAppointmentId}/reschedule`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${testPatientToken}`,
      },
      body: JSON.stringify({
        date: '2026-11-20',
        slot: '10:00 am',
      }),
    })
    const reschedData = await reschedRes.json()
    if (
      reschedRes.status === 200 &&
      reschedData.success &&
      reschedData.data?.slot === '10:00 am' &&
      reschedData.data?.rescheduledFrom?.slot === '9:00 am'
    ) {
      console.log(`✓ Appointment successfully rescheduled from 9:00 am to 10:00 am (200)`)
    } else {
      throw new Error(`Rescheduling failed: ${JSON.stringify(reschedData)}`)
    }

    // 11. Patient Appointment Cancellation
    console.log('\n--- 12. Testing Patient Appointment Cancellation ---')
    const cancelRes = await fetch(`${baseUrl}/api/appointments/${testAppointmentId}/cancel`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${testPatientToken}`,
      },
      body: JSON.stringify({ reason: 'Personal scheduling conflict' }),
    })
    const cancelData = await cancelRes.json()
    if (cancelRes.status === 200 && cancelData.data?.status === 'cancelled') {
      console.log(`✓ Appointment successfully cancelled (200)`)
    } else {
      throw new Error(`Cancellation failed: ${JSON.stringify(cancelData)}`)
    }

    // Cancel already cancelled appointment
    const repeatCancelRes = await fetch(`${baseUrl}/api/appointments/${testAppointmentId}/cancel`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${testPatientToken}`,
      },
    })
    if (repeatCancelRes.status === 400) {
      console.log('✓ Attempting to cancel an already-cancelled appointment rejected with 400')
    } else {
      throw new Error(`Expected 400 for duplicate cancel, got ${repeatCancelRes.status}`)
    }

    console.log('\n=============================================')
    console.log('🎉 ALL INTEGRATION TESTS PASSED SUCCESSFULLY! 🎉')
    console.log('=============================================')
  } finally {
    // Clean up test records
    console.log('\nCleaning up test records...')
    if (testAppointmentId) await Appointment.deleteOne({ _id: testAppointmentId })
    if (testDoctorDoc) await Doctor.deleteOne({ _id: testDoctorDoc._id })
    if (testDoctorUser) await User.deleteOne({ _id: testDoctorUser._id })
    if (testPatientUser) await User.deleteOne({ _id: testPatientUser._id })
    if (testPatient2User) await User.deleteOne({ _id: testPatient2User._id })
    console.log('✓ Clean-up complete.')

    if (server) {
      server.close()
    }
    await mongoose.disconnect()
    console.log('✓ Database disconnected.')
  }
}

runTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ TEST FAILED:', err)
    process.exit(1)
  })
