import express from 'express'
import { homeScreenRoute } from './home-screen.js'
import { playRoute } from './play.js'
import { spectateRoute } from './spectate.js'
import { pastGamesRoute } from './past-games.js'
import { analyseRoute } from './analyse.js'

export const router = express.Router()

// Register routes to the router.

router.get('/', homeScreenRoute)
router.get('/play/:gameID', playRoute)
router.get('/spectate/:gameID', spectateRoute)
router.get('/past-games', pastGamesRoute)
router.get('/analyse/:gameID', analyseRoute)