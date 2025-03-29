import sumBy from "lodash-es/sumBy";

import type {
  AdminEventResponse,
  AdminSignupSchema,
  PublicSignupSchema,
  QuotaID,
  QuotaWithSignupCount,
  UserEventResponse,
} from "@tietokilta/ilmomasiina-models";
import { SignupStatus } from "@tietokilta/ilmomasiina-models";
import { SignupState, signupState } from "./signupStateText";

export type AnyEventSchema = AdminEventResponse | UserEventResponse;
export type AnySignupSchema = AdminSignupSchema | PublicSignupSchema;

/** Grabs the signup type from {Admin,User}EventSchema and adds some extra information. */
export type SignupWithQuota<Ev extends AnyEventSchema = AnyEventSchema> = Ev["quotas"][number]["signups"][number] & {
  quota: Ev["quotas"][number];
};

export function getSignupsAsList<Ev extends AnyEventSchema>(event: Ev): SignupWithQuota<Ev>[] {
  return event.quotas.flatMap(
    (quota) =>
      quota.signups?.map((signup) => ({
        ...signup,
        quota,
      })) ?? [],
  );
}

/** Computes the number of signups in the open quota and queue. */
export function countOverflowSignups(quotas: QuotaWithSignupCount[], openQuotaSize: number) {
  const overflow = sumBy(quotas, (quota) => Math.max(0, quota.signupCount - (quota.size ?? Infinity)));
  return {
    openQuotaCount: Math.min(overflow, openQuotaSize),
    queueCount: Math.max(overflow - openQuotaSize, 0),
  };
}

export type QuotaSignups<S = SignupWithQuota> = {
  type: SignupStatus;
  id: QuotaID | null;
  title: string | null;
  size: number | null;
  signups: S[];
  signupCount: number;
};

/** Gathers all signups of an event into their assigned quotas, the open quota, and the queue. */
export function getSignupsByQuota(event: AnyEventSchema): QuotaSignups[] {
  const signupsDisabled =
    signupState(event.registrationStartDate, event.registrationEndDate).state === SignupState.disabled;
  const signups = getSignupsAsList(event);
  const quotas = [
    ...event.quotas
      // If the event does not have signups, only show quotas that somehow still have signups within.
      .filter((quota) => !signupsDisabled || quota.signupCount > 0)
      .map((quota) => {
        const quotaSignups = signups.filter((signup) => signup.quota.id === quota.id && signup.status === "in-quota");
        return {
          ...quota,
          type: SignupStatus.IN_QUOTA,
          signups: quotaSignups,
          // Trust signupCount and size, unless we have concrete information that more signups exist
          signupCount: Math.max(quotaSignups.length, Math.min(quota.signupCount, quota.size ?? Infinity)),
        };
      }),
  ];

  const { openQuotaCount, queueCount } = countOverflowSignups(event.quotas, event.openQuotaSize);

  const openSignups = signups.filter((signup) => signup.status === "in-open");
  // Open quota is shown if the event has one, or if signups have been assigned there nevertheless.
  const openQuota =
    openSignups.length > 0 || (!signupsDisabled && event.openQuotaSize > 0)
      ? [
          {
            type: SignupStatus.IN_OPEN_QUOTA,
            id: null,
            title: null,
            size: event.openQuotaSize,
            signups: openSignups,
            signupCount: Math.max(openQuotaCount, openSignups.length),
          },
        ]
      : [];

  const queueSignups = signups.filter((signup) => signup.status === "in-queue");
  // Queue is shown if signups have been assigned there.
  const queue =
    queueSignups.length > 0
      ? [
          {
            type: SignupStatus.IN_QUEUE,
            id: null,
            title: null,
            size: null,
            signups: queueSignups,
            signupCount: Math.max(queueCount, queueSignups.length),
          },
        ]
      : [];

  return [...quotas, ...openQuota, ...queue];
}

/** Formats an answer for display. */
export function stringifyAnswer(answer: string | string[] | undefined) {
  return Array.isArray(answer) ? answer.join(", ") : (answer ?? "");
}
