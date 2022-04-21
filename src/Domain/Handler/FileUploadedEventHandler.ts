import {
  DomainEventHandlerInterface,
  FileUploadedEvent,
} from '@standardnotes/domain-events'
import { SubscriptionSettingName } from '@standardnotes/settings'
import { inject, injectable } from 'inversify'
import { Logger } from 'winston'

import TYPES from '../../Bootstrap/Types'
import { SubscriptionSettingServiceInterface } from '../Setting/SubscriptionSettingServiceInterface'
import { UserSubscription } from '../Subscription/UserSubscription'
import { UserSubscriptionServiceInterface } from '../Subscription/UserSubscriptionServiceInterface'
import { UserRepositoryInterface } from '../User/UserRepositoryInterface'


@injectable()
export class FileUploadedEventHandler implements DomainEventHandlerInterface {
  constructor(
    @inject(TYPES.UserRepository) private userRepository: UserRepositoryInterface,
    @inject(TYPES.UserSubscriptionService) private userSubscriptionService: UserSubscriptionServiceInterface,
    @inject(TYPES.SubscriptionSettingService) private subscriptionSettingService: SubscriptionSettingServiceInterface,
    @inject(TYPES.Logger) private logger: Logger
  ) {
  }

  async handle(event: FileUploadedEvent): Promise<void> {
    const user = await this.userRepository.findOneByUuid(event.payload.userUuid)
    if (user === undefined) {
      this.logger.warn(`Could not find user with uuid: ${event.payload.userUuid}`)

      return
    }

    const { regularSubscription, sharedSubscription } = await this.userSubscriptionService.findRegularSubscriptionForUserUuid(event.payload.userUuid)
    if (regularSubscription === undefined) {
      this.logger.warn(`Could not find regular user subscription for user with uuid: ${event.payload.userUuid}`)

      return
    }

    await this.updateUploadBytesUsedSetting(regularSubscription, event.payload.fileByteSize)

    if (sharedSubscription !== undefined) {
      await this.updateUploadBytesUsedSetting(sharedSubscription, event.payload.fileByteSize)
    }
  }

  private async updateUploadBytesUsedSetting(subscription: UserSubscription, byteSize: number): Promise<void> {
    let bytesUsed = '0'
    const bytesUsedSetting = await this.subscriptionSettingService.findSubscriptionSettingWithDecryptedValue({
      userUuid: (await subscription.user).uuid,
      userSubscriptionUuid: subscription.uuid,
      subscriptionSettingName: SubscriptionSettingName.FileUploadBytesUsed,
    })
    if (bytesUsedSetting !== undefined) {
      bytesUsed = bytesUsedSetting.value as string
    }

    await this.subscriptionSettingService.createOrReplace({
      userSubscription: subscription,
      props: {
        name: SubscriptionSettingName.FileUploadBytesUsed,
        unencryptedValue: (+(bytesUsed) + byteSize).toString(),
        sensitive: false,
      },
    })
  }
}
