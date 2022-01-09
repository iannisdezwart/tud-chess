import express from 'express'
import { gameRoute } from './game.js'

export const router = express.Router()

// Register routes to the router.

router.get('/game/:gameID', gameRoute)