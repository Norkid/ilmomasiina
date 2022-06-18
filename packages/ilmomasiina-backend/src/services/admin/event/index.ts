import { hooks as authHooks } from '@feathersjs/authentication';
import { ServiceMethods } from '@feathersjs/feathers';

import { AdminEventsServiceTypes } from '@tietokilta/ilmomasiina-models/src/services/admin/events';
import { AdminEventCreateBody } from '@tietokilta/ilmomasiina-models/src/services/admin/events/create';
import { AdminEventUpdateBody } from '@tietokilta/ilmomasiina-models/src/services/admin/events/update';
import { IlmoApplication } from '../../../defs';
import { getEventDetailsForAdmin } from '../../event/getEventDetails';
import { getEventsListForAdmin } from '../../event/getEventsList';
import createEvent from './createEvent';
import deleteEvent from './deleteEvent';
import updateEvent from './updateEvent';

export const adminEventService: Partial<ServiceMethods<AdminEventsServiceTypes>> = {
  find(params) {
    return getEventsListForAdmin(params);
  },

  get(id) {
    return getEventDetailsForAdmin(String(id));
  },

  create(data: AdminEventCreateBody, params) {
    return createEvent(data, params);
  },

  patch(id, data: Partial<AdminEventUpdateBody>, params) {
    return updateEvent(String(id), data, params);
  },

  remove(id, params) {
    return deleteEvent(String(id), params);
  },
};

export default function setupAdminEventsService(this: IlmoApplication) {
  const app = this;

  app.use('/api/admin/events', adminEventService);

  app.service('/api/admin/events').hooks({
    before: {
      all: [authHooks.authenticate('jwt')],
    },
  });
}
