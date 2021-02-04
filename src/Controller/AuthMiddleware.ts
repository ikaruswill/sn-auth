import { NextFunction, Request, Response } from 'express'
import { inject, injectable } from 'inversify'
import { BaseMiddleware } from 'inversify-express-utils'
import TYPES from '../Bootstrap/Types'
import { AuthenticateRequest } from '../Domain/UseCase/AuthenticateRequest'

@injectable()
export class AuthMiddleware extends BaseMiddleware {
  constructor (
    @inject(TYPES.AuthenticateRequest) private authenticateRequest: AuthenticateRequest
  ) {
    super()
  }

  async handler (request: Request, response: Response, next: NextFunction): Promise<void> {
    const authenticateRequestResponse = await this.authenticateRequest.execute({ authorizationHeader: request.headers.authorization })

    if (!authenticateRequestResponse.success) {
      response.status(authenticateRequestResponse.responseCode).send({
        error: {
          tag: authenticateRequestResponse.errorTag,
          message: authenticateRequestResponse.errorMessage,
        },
      })

      return
    }

    response.locals.user = authenticateRequestResponse.user
    response.locals.session = authenticateRequestResponse.session

    return next()
  }
}