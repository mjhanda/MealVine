import { cancelTimerAlert, scheduleTimerAlert } from '../../services/timerNotifications';
import { useTimerStore } from '../timerStore';

// jest.mock is hoisted above the imports by babel-jest.
jest.mock('../../services/timerNotifications', () => ({
  scheduleTimerAlert: jest.fn(() => Promise.resolve('notif-1')),
  cancelTimerAlert: jest.fn(() => Promise.resolve()),
}));

beforeEach(() => {
  useTimerStore.setState({ timer: null });
  jest.clearAllMocks();
});

describe('timerStore', () => {
  it('starts a timer, schedules an alert, and records its id', async () => {
    useTimerStore.getState().start('Soup: step 2', 15, 1_000);
    expect(useTimerStore.getState().timer).toMatchObject({ label: 'Soup: step 2', endsAt: 1_000 + 15 * 60_000 });
    expect(scheduleTimerAlert).toHaveBeenCalledWith('Soup: step 2', 900);
    await Promise.resolve();
    await Promise.resolve();
    expect(useTimerStore.getState().timer?.notificationId).toBe('notif-1');
  });

  it('stop cancels the scheduled alert', async () => {
    useTimerStore.getState().start('A', 5);
    await Promise.resolve();
    await Promise.resolve();
    useTimerStore.getState().stop();
    expect(cancelTimerAlert).toHaveBeenCalledWith('notif-1');
    expect(useTimerStore.getState().timer).toBeNull();
  });

  it('starting a new timer replaces the old one', async () => {
    useTimerStore.getState().start('A', 5);
    await Promise.resolve();
    await Promise.resolve();
    useTimerStore.getState().start('B', 10);
    expect(cancelTimerAlert).toHaveBeenCalledWith('notif-1');
    expect(useTimerStore.getState().timer?.label).toBe('B');
  });
});
