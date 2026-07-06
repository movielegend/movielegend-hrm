import { cleanup, fireEvent, render, waitFor } from '@testing-library/react-native';
import { LoginScreen } from '../src/features/auth/LoginScreen';
import { makeUser, apiError } from '../test/test-utils';

const mockReplace = jest.fn();
const mockLogin = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

jest.mock('../src/providers/AuthProvider', () => ({
  useAuth: () => ({ login: mockLogin }),
}));

describe('LoginScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await cleanup();
  });

  it('logs in successfully and routes by role', async () => {
    mockLogin.mockResolvedValue(makeUser(['ADMIN']));
    const view = await render(<LoginScreen />);

    await submitLogin(view, 'StrongPass123!');

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/admin'));
  });

  it('shows invalid credentials UI', async () => {
    mockLogin.mockRejectedValue(apiError('INVALID_CREDENTIALS'));
    const view = await render(<LoginScreen />);

    await submitLogin(view, 'wrong');

    await waitFor(() => expect(view.getByText('Sai số điện thoại hoặc mật khẩu')).toBeTruthy());
  });

  it('shows pending approval UI', async () => {
    mockLogin.mockRejectedValue(apiError('ACCOUNT_PENDING_APPROVAL'));
    const view = await render(<LoginScreen />);

    await submitLogin(view, 'StrongPass123!');

    await waitFor(() => expect(view.getByText('Tài khoản đang chờ phê duyệt')).toBeTruthy());
  });
});

type RenderedLogin = Awaited<ReturnType<typeof render>>;

async function submitLogin(view: RenderedLogin, password: string): Promise<void> {
  await fireEvent.changeText(view.getByPlaceholderText('Nhập số điện thoại'), '0900000000');
  await fireEvent.changeText(view.getByPlaceholderText('Nhập mật khẩu'), password);
  const submitText = view.getAllByText('Đăng nhập')[1];
  if (!submitText) throw new Error('Submit button not found');
  await fireEvent.press(submitText);
}
