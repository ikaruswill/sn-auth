import 'reflect-metadata'

import 'newrelic'

import '../src/Controller/HealthCheckController'
import '../src/Controller/SessionController'
import '../src/Controller/SessionsController'
import '../src/Controller/AuthController'
import '../src/Controller/UsersController'
import '../src/Controller/SettingsController'
import '../src/Controller/FeaturesController'
import '../src/Controller/WebSocketsController'
import '../src/Controller/AdminController'
import '../src/Controller/AccountController'

import * as cors from 'cors'
import { urlencoded, json, Request, Response, NextFunction } from 'express'
import * as winston from 'winston'
import * as dayjs from 'dayjs'
import * as utc from 'dayjs/plugin/utc'

import { InversifyExpressServer } from 'inversify-express-utils'
import { ContainerConfigLoader } from '../src/Bootstrap/Container'
import TYPES from '../src/Bootstrap/Types'
import { Env } from '../src/Bootstrap/Env'

const container = new ContainerConfigLoader
void container.load().then(container => {
  dayjs.extend(utc)

  const server = new InversifyExpressServer(container)

  server.setConfig((app) => {
    app.use((_request: Request, response: Response, next: NextFunction) => {
      response.setHeader('X-Auth-Version', container.get(TYPES.VERSION))
      next()
    })
    app.use(json())
    app.use(urlencoded({ extended: true }))
    app.use(cors())
  })

  const serverInstance = server.build()

  const env: Env = new Env()
  env.load()

  serverInstance.listen(env.get('PORT'))

  const logger: winston.Logger = container.get(TYPES.Logger)

  logger.info(`Server started on port ${process.env.PORT}`)
})
