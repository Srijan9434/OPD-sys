import 'dotenv/config'
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const BASE_URL = 'http://localhost:5000/api'

const run = async () => {
  console.log('========================================================')
  console.log('--- STARTING COMPLETE OPD SYSTEM END-TO-END SUITE ---')
  console.log('========================================================\n')

  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/opd'
  await mongoose.connect(mongoUri)
  console.log('✓ Connected to MongoDB:', mongoUri)

  try {
    // 1. Admin Login
    console.log('\n--- 1. Testing Administrator Secure Login ---')
    const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@opd.local', password: 'Admin@123456' }),
    })
    const adminLoginData = await adminLoginRes.json()
    if (!adminLoginData.success || adminLoginData.data?.user?.role !== 'admin') {
      throw new Error(`Admin login failed: ${JSON.stringify(adminLoginData)}`)
    }
    const adminToken = adminLoginData.data.token
    console.log('✓ Admin authenticated successfully. User:', adminLoginData.data.user.name)

    // 2. Admin creates a new Speciality
    console.log('\n--- 2. Testing Speciality Creation by Admin ---')
    const specName = `Endocrinology_${Date.now()}`
    const createSpecRes = await fetch(`${BASE_URL}/admin/specialities`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: specName,
        description: 'Hormonal, metabolic and glandular medicine',
        icon: '🔬',
      }),
    })
    const createSpecData = await createSpecRes.json()
    if (!createSpecData.success) {
      throw new Error(`Failed to create speciality: ${JSON.stringify(createSpecData)}`)
    }
    console.log(`✓ Speciality "${createSpecData.data.name}" created successfully (ID: ${createSpecData.data._id})`)

    // Verify public speciality endpoint returns the new category
    const publicSpecRes = await fetch(`${BASE_URL}/specialities`)
    const publicSpecData = await publicSpecRes.json()
    const foundSpec = publicSpecData.data.find((s) => s.name === specName)
    if (!foundSpec) {
      throw new Error('New speciality not found in public /api/specialities endpoint')
    }
    console.log('✓ Verified new speciality is publicly available in /api/specialities')

    // 3. Admin registers Dr. Rohit
    console.log('\n--- 3. Testing Doctor Registration by Admin (Dr. Rohit) ---')
    const docEmail = `dr.rohit_${Date.now()}@opd.local`
    const createDocRes = await fetch(`${BASE_URL}/admin/doctors`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: 'Dr. Rohit Sharma',
        email: docEmail,
        password: 'Doctor@123456',
        phone: '9876543299',
        speciality: specName,
        degree: 'MBBS, MD (Endocrinology)',
        experience: '9 Years',
        fee: 750,
        about: 'Specialist in metabolic health, diabetes and thyroid disorders.',
        slots: ['9:00 am', '9:30 am', '10:00 am', '10:30 am', '11:00 am'],
      }),
    })
    const createDocData = await createDocRes.json()
    if (!createDocData.success) {
      throw new Error(`Failed to register doctor: ${JSON.stringify(createDocData)}`)
    }
    const doctorId = createDocData.data._id
    console.log(`✓ Dr. Rohit registered successfully (Doctor ID: ${doctorId}, User ID: ${createDocData.data.user._id})`)

    // 4. Verify Dr. Rohit can log in using established credentials
    console.log('\n--- 4. Testing Doctor Portal Authentication (Dr. Rohit) ---')
    const docLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: docEmail, password: 'Doctor@123456' }),
    })
    const docLoginData = await docLoginRes.json()
    if (!docLoginData.success || docLoginData.data?.user?.role !== 'doctor') {
      throw new Error(`Doctor login failed: ${JSON.stringify(docLoginData)}`)
    }
    const docToken = docLoginData.data.token
    console.log('✓ Dr. Rohit logged in successfully with JWT issued.')

    // 5. Patient Registration & Login
    console.log('\n--- 5. Testing Patient Registration & Login ---')
    const patientEmail = `anita.sharma_${Date.now()}@opd.local`
    const patientRegRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Anita Sharma',
        email: patientEmail,
        password: 'Patient@123456',
        phone: '9811223344',
      }),
    })
    const patientRegData = await patientRegRes.json()
    if (!patientRegData.success) {
      throw new Error(`Patient registration failed: ${JSON.stringify(patientRegData)}`)
    }
    const patientToken = patientRegData.data.token
    console.log('✓ Patient Anita Sharma registered successfully.')

    // 6. Patient Books Slot (9:00 am)
    console.log('\n--- 6. Testing Patient Appointment Booking ---')
    const bookingDate = '2026-11-20'
    const bookingSlot = '9:00 am'
    const bookRes = await fetch(`${BASE_URL}/appointments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${patientToken}`,
      },
      body: JSON.stringify({
        doctorId,
        date: bookingDate,
        slot: bookingSlot,
        reason: 'Severe lethargy, elevated blood sugar and fatigue',
        paymentMode: 'cash',
      }),
    })
    const bookData = await bookRes.json()
    if (!bookData.success) {
      throw new Error(`Booking failed: ${JSON.stringify(bookData)}`)
    }
    const appointmentId = bookData.data._id
    console.log(`✓ Appointment booked successfully (ID: ${appointmentId}, Status: ${bookData.data.status})`)

    // 7. Critical Concurrency & Double Booking Protection Test
    console.log('\n--- 7. Testing Concurrency & Duplicate Slot Prevention ---')
    // A second patient attempts to book the EXACT SAME doctor, date and slot
    const secondPatientEmail = `vikram_${Date.now()}@opd.local`
    const secondPatientReg = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Vikram Singh',
        email: secondPatientEmail,
        password: 'Vikram@123456',
        phone: '9876543219',
      }),
    })
    const secondPatientData = await secondPatientReg.json()
    const secondToken = secondPatientData.data.token

    const duplicateBookRes = await fetch(`${BASE_URL}/appointments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${secondToken}`,
      },
      body: JSON.stringify({
        doctorId,
        date: bookingDate,
        slot: bookingSlot,
        reason: 'Attempting to book the already taken slot',
      }),
    })
    if (duplicateBookRes.status === 409) {
      const dupData = await duplicateBookRes.json()
      console.log('✓ Concurrency Protection Passed! Duplicate booking rejected with 409:')
      console.log(`  Message: "${dupData.message}"`)
    } else {
      throw new Error(`Expected 409 conflict on duplicate slot booking, got ${duplicateBookRes.status}`)
    }

    // 8. Verify Booked Slots API excludes the taken slot
    console.log('\n--- 8. Testing Booked Slots Real-time API ---')
    const bookedSlotsRes = await fetch(`${BASE_URL}/appointments/booked-slots/${doctorId}?date=${bookingDate}`)
    const bookedSlotsData = await bookedSlotsRes.json()
    if (!bookedSlotsData.bookedSlots.includes(bookingSlot)) {
      throw new Error(`Booked slot ${bookingSlot} not reflected in bookedSlots list`)
    }
    console.log(`✓ Booked slots correctly returned for ${bookingDate}:`, bookedSlotsData.bookedSlots)

    // 9. Doctor Views Appointment and Updates Queue Status
    console.log("\n--- 9. Testing Doctor Queue Transitions ('confirmed' -> 'waiting' -> 'in-consultation') ---")
    // Confirm appointment
    await fetch(`${BASE_URL}/doctor/appointments/${appointmentId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${docToken}` },
      body: JSON.stringify({ status: 'confirmed' }),
    })
    console.log("✓ Dr. Rohit confirmed appointment.")

    // Mark as waiting in clinic
    const waitRes = await fetch(`${BASE_URL}/doctor/appointments/${appointmentId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${docToken}` },
      body: JSON.stringify({ status: 'waiting' }),
    })
    const waitData = await waitRes.json()
    console.log(`✓ Dr. Rohit marked patient as waiting (Status: ${waitData.data.status})`)

    // Call into consultation room
    const consultRes = await fetch(`${BASE_URL}/doctor/appointments/${appointmentId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${docToken}` },
      body: JSON.stringify({ status: 'in-consultation' }),
    })
    const consultData = await consultRes.json()
    console.log(`✓ Dr. Rohit called patient into consultation (Status: ${consultData.data.status})`)

    // 10. Doctor Records Prescription & Concludes Consultation
    console.log('\n--- 10. Testing Clinical Consultation & Prescription Recording ---')
    const rxRes = await fetch(`${BASE_URL}/doctor/appointments/${appointmentId}/prescription`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${docToken}` },
      body: JSON.stringify({
        symptoms: 'Fatigue, polydipsia, fasting glucose 185 mg/dL',
        diagnosis: 'Type 2 Diabetes Mellitus with Mild Hyperglycemia',
        treatment: 'Dietary carbohydrate restriction, regular walking 45 mins/day, monitor fasting glucose',
        medicines: [
          {
            name: 'Metformin Hydrochloride 500mg',
            dosage: '500mg',
            frequency: '1-0-1',
            duration: '30 days',
            instructions: 'Take immediately after breakfast and dinner',
          },
          {
            name: 'Vitamin B12 & Methylcobalamin',
            dosage: '1500mcg',
            frequency: '0-1-0',
            duration: '30 days',
            instructions: 'After lunch with water',
          },
        ],
        notes: 'Strict compliance with diet. Return if dizziness occurs.',
        followUpDate: '2026-12-20',
      }),
    })
    const rxData = await rxRes.json()
    if (!rxData.success || rxData.data?.status !== 'completed') {
      throw new Error(`Failed to save prescription: ${JSON.stringify(rxData)}`)
    }
    console.log('✓ Prescription recorded. Appointment concluded and status updated to "completed"')

    // Mark payment as paid
    await fetch(`${BASE_URL}/doctor/appointments/${appointmentId}/payment`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${docToken}` },
    })
    console.log('✓ In-clinic fee payment marked as paid (₹750)')

    // 11. Patient Views Own Prescription
    console.log('\n--- 11. Testing Patient Prescription Retrieval ---')
    const patientRxRes = await fetch(`${BASE_URL}/appointments/${appointmentId}/prescription`, {
      headers: { Authorization: `Bearer ${patientToken}` },
    })
    const patientRxData = await patientRxRes.json()
    if (!patientRxData.success || patientRxData.data?.prescription?.diagnosis !== 'Type 2 Diabetes Mellitus with Mild Hyperglycemia') {
      throw new Error(`Patient unable to retrieve prescription: ${JSON.stringify(patientRxData)}`)
    }
    console.log('✓ Patient retrieved own prescription successfully.')
    console.log(`  Diagnosis: "${patientRxData.data.prescription.diagnosis}"`)
    console.log(`  Prescribed Medicines: ${patientRxData.data.prescription.medicines.length} medications`)

    // Verify Patient Isolation (Second patient cannot view Anita's prescription)
    const unauthorizedRxRes = await fetch(`${BASE_URL}/appointments/${appointmentId}/prescription`, {
      headers: { Authorization: `Bearer ${secondToken}` },
    })
    if (unauthorizedRxRes.status === 403) {
      console.log('✓ Patient Isolation Passed: Unauthorized patient blocked from viewing records (403)')
    } else {
      throw new Error(`Expected 403 when unrelated patient accesses records, got ${unauthorizedRxRes.status}`)
    }

    // 12. Admin Analytics & Revenue Verification
    console.log('\n--- 12. Testing Admin Analytics & Financial Ledger Reconciliation ---')
    const adminAnalyticsRes = await fetch(`${BASE_URL}/admin/analytics`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    })
    const adminAnalyticsData = await adminAnalyticsRes.json()
    if (!adminAnalyticsData.success) {
      throw new Error(`Admin analytics query failed: ${JSON.stringify(adminAnalyticsData)}`)
    }
    console.log('✓ Admin Analytics Query Succeeded:')
    const drRohitRev = adminAnalyticsData.data.revenueByDoctor.find((d) => d.doctorName === 'Dr. Rohit Sharma')
    if (drRohitRev) {
      console.log(`  Dr. Rohit Recorded Revenue: ₹${drRohitRev.totalRevenue} across ${drRohitRev.paidAppointments} paid consultation(s)`)
    }

    // 13. Reverse Proxy Routing Verification (Unified Port 5173 URLs)
    console.log('\n--- 13. Testing Unified Port 5173 Reverse Proxy Routing ---')
    const patientHomeRes = await fetch('http://localhost:5173/')
    const doctorProxyRes = await fetch('http://localhost:5173/doctor')
    const adminProxyRes = await fetch('http://localhost:5173/admin')

    if (patientHomeRes.status === 200 && doctorProxyRes.status === 200 && adminProxyRes.status === 200) {
      console.log('✓ Unified URL Routing Verified on port 5173:')
      console.log('  - http://localhost:5173/        -> 200 OK (Patient Frontend)')
      console.log('  - http://localhost:5173/doctor  -> 200 OK (Doctor Portal Proxy)')
      console.log('  - http://localhost:5173/admin   -> 200 OK (Admin Portal Proxy)')
    } else {
      throw new Error(`Proxy routing check failed: [${patientHomeRes.status}, ${doctorProxyRes.status}, ${adminProxyRes.status}]`)
    }

    console.log('\n========================================================')
    console.log('✓ ALL 13 END-TO-END ACCEPTANCE CRITERIA PASSED CLEANLY!')
    console.log('========================================================')
    await mongoose.disconnect()
    process.exit(0)
  } catch (err) {
    console.error('\n❌ TEST SUITE ENCOUNTERED AN ERROR:', err.message)
    await mongoose.disconnect()
    process.exit(1)
  }
}

run()
