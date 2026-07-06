import { mapLoginError } from '../src/utils/api-error';
import { apiError } from '../test/test-utils';

describe('login error mapping', () => {
  it('renders invalid credentials UI message', () => {
    expect(mapLoginError(apiError('INVALID_CREDENTIALS'))).toBe('Sai số điện thoại hoặc mật khẩu');
  });

  it('renders pending approval UI message', () => {
    expect(mapLoginError(apiError('ACCOUNT_PENDING_APPROVAL'))).toBe('Tài khoản đang chờ phê duyệt');
  });
});
