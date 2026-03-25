import express from 'express'
import routeNames from '../config/myfatoorahRoutes.config'
import * as myFatoorahController from '../controllers/myFatoorahController'

const routes = express.Router()

routes.route(routeNames.createPayment).post(myFatoorahController.createPayment)
routes.route(routeNames.checkPayment).post(myFatoorahController.checkPayment)

export default routes
