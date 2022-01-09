import express from 'express'
import { playRoute } from './play.js'
import { spectateRoute } from './spectate.js'

export const router = express.Router()

// Register routes to the router.

router.get('/play/:gameID', playRoute)
router.get('/spectate/:gameID', spectateRoute)