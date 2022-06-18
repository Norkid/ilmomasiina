import { Forbidden, NotFound } from '@feathersjs/errors';

import { SignupCreateBody, SignupCreateResponse } from '@tietokilta/ilmomasiina-models/src/services/signups/create';
import { Event } from '../../models/event';
import { Quota } from '../../models/quota';
import { Signup } from '../../models/signup';
import { refreshSignupPositions } from './computeSignupPosition';
import { generateToken } from './editTokens';

export const signupsAllowed = (event: Event) => {
  if (event.registrationStartDate === null || event.registrationEndDate === null) {
    return false;
  }

  const now = new Date();
  return now >= event.registrationStartDate && now <= event.registrationEndDate;
};

export default async ({ quotaId }: SignupCreateBody): Promise<SignupCreateResponse> => {
  // Find the given quota and event.
  const quota = await Quota.findByPk(quotaId, {
    attributes: [],
    include: [
      {
        model: Event.scope('user'),
        attributes: ['id', 'registrationStartDate', 'registrationEndDate', 'openQuotaSize'],
      },
    ],
  });

  // Do some validation.
  if (quota === null) {
    throw new NotFound('Quota doesn\'t exist.');
  }
  if (!signupsAllowed(quota.event!)) {
    throw new Forbidden('Signups closed for this event.');
  }

  // Create the signup.
  const newSignup = await Signup.create({ quotaId });
  await refreshSignupPositions(quota.event!);

  const editToken = generateToken(newSignup);

  return {
    id: newSignup.id,
    editToken,
  };
};
