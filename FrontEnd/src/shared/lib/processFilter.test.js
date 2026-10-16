import { describe, expect, it } from 'vitest';
import {
  filterPeopleByProcess,
  formatProcessName,
  formatProcessOption,
  getRealtimeProcessOptions,
} from './processFilter';

const people = [
  { username: 'ana', realtime: { process_name: '  VS   Code ' } },
  { username: 'bia', realtime: { process_name: 'Chrome' } },
  { username: 'caio', realtime: { process_name: 'Chrome' } },
  { username: 'dani', realtime: { process_name: '   ' } },
  { username: 'eli', realtime: null },
];

describe('realtime process filter', () => {
  it('derives unique options from received process names and formats labels only', () => {
    const options = getRealtimeProcessOptions(people);

    expect(options).toEqual(['Chrome', '  VS   Code ']);
    expect(formatProcessName(options[1])).toBe('VS Code');
  });

  it('filters exact raw identifiers without changing the source list', () => {
    const result = filterPeopleByProcess(people, 'Chrome');

    expect(result.map(({ username }) => username)).toEqual(['bia', 'caio']);
    expect(people).toHaveLength(5);
    expect(filterPeopleByProcess(people, '')).toBe(people);
    expect(filterPeopleByProcess(null, 'Chrome')).toEqual([]);
  });

  it('keeps case and whitespace variants distinct and disambiguates duplicate labels', () => {
    const options = ['Chrome', ' Chrome ', 'chrome'];

    expect(formatProcessOption('Chrome', options)).toBe('Chrome ("Chrome")');
    expect(formatProcessOption(' Chrome ', options)).toBe('Chrome ("␠Chrome␠")');
    expect(formatProcessOption('chrome', options)).toBe('chrome');
    expect(formatProcessOption('  ', options)).toBe('');
    expect(formatProcessOption('Chrome', null)).toBe('Chrome');
    expect(formatProcessOption('Code  Editor', ['Code Editor', 'Code  Editor'])).toBe(
      'Code Editor ("Code␠␠Editor")',
    );
    expect(filterPeopleByProcess([{ realtime: { process_name: 'Chrome' } }], ' Chrome ')).toEqual(
      [],
    );
  });
});
