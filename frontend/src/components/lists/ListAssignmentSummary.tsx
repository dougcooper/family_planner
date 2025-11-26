import React from 'react';
import { withObservables } from '@nozbe/watermelondb/react';
import { Q } from '@nozbe/watermelondb';
import { database } from '../../model/database';
import { ListItem, User } from '../../model/models';
import { FamilyAssignmentSummary } from '../common/FamilyAssignmentSummary';

interface ListAssignmentSummaryProps {
  listItems: ListItem[];
  users: User[];
  onUserPress?: (user: User) => void;
}

const ListAssignmentSummaryComponent = ({ listItems, users, onUserPress }: ListAssignmentSummaryProps) => {
  const counts = listItems.reduce((acc, item) => {
    if (!item.isChecked && item.assigneeId) {
      acc[item.assigneeId] = (acc[item.assigneeId] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  return <FamilyAssignmentSummary users={users} counts={counts} title="List Assignments" onUserPress={onUserPress} />;
};

export const ListAssignmentSummary = withObservables(['familyId'], ({ familyId }: { familyId: string }) => ({
  listItems: database.collections.get<ListItem>('list_items').query(
      Q.experimentalJoinTables(['lists']),
      Q.on('lists', 'family_id', familyId),
      Q.where('is_checked', false)
  ),
  users: database.collections.get<User>('users').query(
    Q.where('family_id', familyId)
  ),
}))(ListAssignmentSummaryComponent);
