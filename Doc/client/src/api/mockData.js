export const specialities = [
  { name: 'General physician', icon: '🩺' },
  { name: 'Gynecologist', icon: '🤰' },
  { name: 'Dermatologist', icon: '🧴' },
  { name: 'Pediatricians', icon: '👶' },
  { name: 'Neurologist', icon: '🧠' },
  { name: 'Gastroenterologist', icon: '🫃' },
]

const about = 'Committed to comprehensive medical care, focusing on preventive medicine, early diagnosis, and effective treatment strategies.'

export const doctors = [
  { _id: 'd1', name: 'Dr. Richard James', speciality: 'General physician', degree: 'MBBS', experience: '4 Years', fee: 500, available: true, image: '/doctors/doc1.png', about },
  { _id: 'd2', name: 'Dr. Emily Larson', speciality: 'Gynecologist', degree: 'MBBS', experience: '3 Years', fee: 600, available: true, image: '/doctors/doc2.png', about },
  { _id: 'd3', name: 'Dr. Sarah Patel', speciality: 'Dermatologist', degree: 'MBBS', experience: '1 Year', fee: 400, available: true, image: '/doctors/doc3.png', about },
  { _id: 'd4', name: 'Dr. Christopher Lee', speciality: 'Pediatricians', degree: 'MBBS', experience: '2 Years', fee: 450, available: true, image: '/doctors/doc4.png', about },
  { _id: 'd5', name: 'Dr. Jennifer Garcia', speciality: 'Neurologist', degree: 'MBBS', experience: '4 Years', fee: 700, available: false, image: '/doctors/doc5.png', about },
  { _id: 'd6', name: 'Dr. Andrew Williams', speciality: 'Gastroenterologist', degree: 'MBBS', experience: '3 Years', fee: 650, available: true, image: '/doctors/doc6.png', about },
  { _id: 'd7', name: 'Dr. Amelia Hill', speciality: 'General physician', degree: 'MBBS', experience: '5 Years', fee: 500, available: true, image: '/doctors/doc7.png', about },
  { _id: 'd8', name: 'Dr. Daniel Moore', speciality: 'Gynecologist', degree: 'MBBS', experience: '2 Years', fee: 600, available: true, image: '/doctors/doc8.png', about },
]
export const myAppointments = [
  { _id: 'a1', doctorId: 'd1', date: '2026-10-28', slot: '9:00 am', status: 'confirmed', payment: { mode: 'cash', status: 'pending', amount: 500 }, prescription: null },
  { _id: 'a2', doctorId: 'd2', date: '2026-10-30', slot: '10:30 am', status: 'pending', payment: { mode: 'online', status: 'paid', amount: 600 }, prescription: null },
  { _id: 'a3', doctorId: 'd3', date: '2026-10-10', slot: '8:30 am', status: 'completed', payment: { mode: 'card', status: 'paid', amount: 400 }, prescription: { notes: 'Rest and drink plenty of water.', medicines: [{ name: 'Paracetamol 500mg', dosage: '1-0-1', duration: '5 days' }] } },
  { _id: 'a4', doctorId: 'd4', date: '2026-10-05', slot: '11:00 am', status: 'cancelled', payment: { mode: 'cash', status: 'pending', amount: 450 }, prescription: null },
]