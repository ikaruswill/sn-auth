import { inject } from 'inversify'
import { Request, Response } from 'express'
import {
  BaseHttpController,
  controller,
  httpPost,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  results,
} from 'inversify-express-utils'
import { CreateValetTokenPayload } from '@standardnotes/payloads'

import TYPES from '../Bootstrap/Types'
import { CreateValetToken } from '../Domain/UseCase/CreateValetToken/CreateValetToken'

@controller('/valet-tokens', TYPES.ApiGatewayAuthMiddleware)
export class ValetTokenController extends BaseHttpController {
  constructor(
    @inject(TYPES.CreateValetToken) private createValetKey: CreateValetToken,
  ) {
    super()
  }

  @httpPost('/')
  public async create(request: Request, response: Response): Promise<results.JsonResult> {
    const payload: CreateValetTokenPayload = request.body

    const createValetKeyResponse = await this.createValetKey.execute({
      userUuid: response.locals.user.uuid,
      operation: payload.operation,
      resources: payload.resources,
    })

    if (!createValetKeyResponse.success) {
      return this.json(createValetKeyResponse, 403)
    }

    return this.json(createValetKeyResponse)
  }
}
