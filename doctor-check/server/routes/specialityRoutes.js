import { Router } from 'express'
import { getActiveSpecialities } from '../controllers/specialityController.js'

const router = Router()

router.get('/', getActiveSpecialities)

export default router
