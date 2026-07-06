import { getHomeRouteForUser } from '../src/utils/role-routing';
import { makeUser } from '../test/test-utils';

describe('role routing', () => {
  it('routes admin role to /admin', () => {
    expect(getHomeRouteForUser(makeUser(['ADMIN', 'EMPLOYEE']))).toBe('/admin');
  });

  it('routes leader role to /leader', () => {
    expect(getHomeRouteForUser(makeUser(['LEADER', 'EMPLOYEE']))).toBe('/leader');
  });

  it('routes employee role to /employee', () => {
    expect(getHomeRouteForUser(makeUser(['EMPLOYEE']))).toBe('/employee');
  });
});
