import { getHomeRouteForUser, getRoleBaseRoute } from '../src/utils/role-routing';
import { makeUser } from '../test/test-utils';

describe('role routing', () => {
  it('routes admin role to /admin/(tabs)', () => {
    expect(getHomeRouteForUser(makeUser(['ADMIN', 'EMPLOYEE']))).toBe('/admin/(tabs)');
    expect(getRoleBaseRoute(makeUser(['ADMIN', 'EMPLOYEE']))).toBe('/admin');
  });

  it('routes leader role to /leader/(tabs)', () => {
    expect(getHomeRouteForUser(makeUser(['LEADER', 'EMPLOYEE']))).toBe('/leader/(tabs)');
    expect(getRoleBaseRoute(makeUser(['LEADER', 'EMPLOYEE']))).toBe('/leader');
  });

  it('routes employee role to /employee/(tabs)', () => {
    expect(getHomeRouteForUser(makeUser(['EMPLOYEE']))).toBe('/employee/(tabs)');
    expect(getRoleBaseRoute(makeUser(['EMPLOYEE']))).toBe('/employee');
  });
});
