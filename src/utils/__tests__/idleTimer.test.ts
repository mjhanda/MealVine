import { createIdleTimer } from '../idleTimer';

describe('createIdleTimer', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  const setup = () => {
    const onActive = jest.fn();
    const onIdle = jest.fn();
    return { onActive, onIdle, timer: createIdleTimer(1000, onActive, onIdle) };
  };

  it('goes active on the first poke and idle after the window', () => {
    const { onActive, onIdle, timer } = setup();
    timer.poke();
    expect(onActive).toHaveBeenCalledTimes(1);
    expect(timer.isActive()).toBe(true);
    jest.advanceTimersByTime(999);
    expect(onIdle).not.toHaveBeenCalled();
    jest.advanceTimersByTime(1);
    expect(onIdle).toHaveBeenCalledTimes(1);
    expect(timer.isActive()).toBe(false);
  });

  it('restarts the window on every poke without re-activating', () => {
    const { onActive, onIdle, timer } = setup();
    timer.poke();
    jest.advanceTimersByTime(800);
    timer.poke();
    jest.advanceTimersByTime(800);
    expect(onIdle).not.toHaveBeenCalled();
    expect(onActive).toHaveBeenCalledTimes(1);
    jest.advanceTimersByTime(200);
    expect(onIdle).toHaveBeenCalledTimes(1);
  });

  it('re-activates on a poke after going idle', () => {
    const { onActive, timer } = setup();
    timer.poke();
    jest.advanceTimersByTime(1000);
    timer.poke();
    expect(onActive).toHaveBeenCalledTimes(2);
  });

  it('stop releases an active timer once and ignores later pokes', () => {
    const { onActive, onIdle, timer } = setup();
    timer.poke();
    timer.stop();
    timer.stop();
    expect(onIdle).toHaveBeenCalledTimes(1);
    timer.poke();
    jest.advanceTimersByTime(5000);
    expect(onActive).toHaveBeenCalledTimes(1);
    expect(onIdle).toHaveBeenCalledTimes(1);
  });

  it('stop before any poke does nothing', () => {
    const { onIdle, timer } = setup();
    timer.stop();
    expect(onIdle).not.toHaveBeenCalled();
  });
});
