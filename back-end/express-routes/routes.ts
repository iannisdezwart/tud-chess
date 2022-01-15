import express from 'express'
import { playRoute } from './play.js'
import { spectateRoute } from './spectate.js'
import { pastGamesRoute } from './past-games.js'
import { analyseRoute } from './analyse.js'

export const router = express.Router()

// Register routes to the router.

router.get('/play/:gameID', playRoute)
router.get('/spectate/:gameID', spectateRoute)
router.get('/past-games', pastGamesRoute)
router.get('/analyse/:gameID', analyseRoute)