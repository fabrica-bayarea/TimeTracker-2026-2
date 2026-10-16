import { describe, expect, it } from 'vitest';
import { filterCollaborators, getCollaboratorStatus } from './agentFilters';

const people = [
  {
    username: 'ana',
    full_name: 'Ana Souza',
    department: 'Produto',
    status: 'online',
    realtime: { process_name: 'Editor', seconds_since_last_activity: 20 },
  },
  {
    username: 'bia',
    full_name: 'Bia Lima',
    department: 'TI',
    status: 'offline',
    realtime: { process_name: 'Chrome', seconds_since_last_activity: 901 },
  },
  { username: 'caio', full_name: 'Caio Nunes', status: 'no-data', realtime: null },
];

describe('collaborator activity filters', () => {
  it('combines accent-insensitive search, API status, and exact process filters', () => {
    expect(
      filterCollaborators(people, {
        query: 'bia lima',
        status: 'offline',
        process: 'Chrome',
      }).map(({ username }) => username),
    ).toEqual(['bia']);
  });

  it('treats failed realtime as unavailable instead of offline', () => {
    expect(getCollaboratorStatus(people[0], false)).toBe('unavailable');
    expect(
      filterCollaborators(people, { status: 'unavailable', realtimeAvailable: false }),
    ).toEqual(people);
    expect(filterCollaborators(people, { status: 'offline', realtimeAvailable: false })).toEqual(
      [],
    );
  });

  it('sorts by name or by last activity age with unknown readings last', () => {
    expect(filterCollaborators(people).map(({ username }) => username)).toEqual([
      'ana',
      'bia',
      'caio',
    ]);
    expect(filterCollaborators(people, { sort: 'recent' }).map(({ username }) => username)).toEqual(
      ['ana', 'bia', 'caio'],
    );
    expect(filterCollaborators(people, { sort: 'oldest' }).map(({ username }) => username)).toEqual(
      ['bia', 'ana', 'caio'],
    );
  });

  it('does not mutate the source list and handles missing input', () => {
    expect(filterCollaborators(null)).toEqual([]);
    expect(people.map(({ username }) => username)).toEqual(['ana', 'bia', 'caio']);
  });
});
