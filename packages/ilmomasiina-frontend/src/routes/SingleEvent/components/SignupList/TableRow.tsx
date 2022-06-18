import React from 'react';

import _ from 'lodash';
import moment from 'moment-timezone';

import { useTypedSelector } from '../../../../store/reducers';
import { SignupWithQuota } from '../../../../utils/signupUtils';

type Props = {
  index: number;
  showQuota: boolean;
  signup: SignupWithQuota;
};

const TableRow = ({ showQuota, signup, index }: Props) => {
  const {
    firstName,
    lastName,
    namePublic,
    answers,
    quotaName,
    createdAt,
    confirmed,
  } = signup;

  const { questions, nameQuestion } = useTypedSelector((state) => state.singleEvent.event)!;

  let fullName;
  if (!confirmed) {
    fullName = 'Vahvistamatta';
  } else if (!namePublic) {
    fullName = 'Piilotettu';
  } else {
    fullName = `${firstName || ''} ${lastName || ''}`;
  }

  return (
    <tr className={!confirmed ? 'text-muted' : ''}>
      <td>
        {`${index}.`}
      </td>
      {nameQuestion && (
        <td className={!confirmed || !namePublic ? 'text-muted font-italic' : ''}>
          {fullName}
        </td>
      )}
      {_.filter(questions, 'public').map((question) => (
        <td key={question.id}>
          {_.find(answers, { questionId: question.id })?.answer || ''}
        </td>
      ))}
      {showQuota && (
        <td>
          {`${quotaName || ''}`}
        </td>
      )}
      <td>
        {moment.tz(createdAt, 'Europe/Helsinki').format('DD.MM.YYYY HH:mm:ss')}
        <span className="hover">
          {moment.tz(createdAt, 'Europe/Helsinki').format('.SSS')}
        </span>
      </td>
    </tr>
  );
};

export default TableRow;
