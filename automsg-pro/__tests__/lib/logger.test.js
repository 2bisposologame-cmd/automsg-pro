import { createLogger } from '../../lib/logger';

describe('Logger', () => {
  let logger;
  let consoleSpy;

  beforeEach(() => {
    logger = createLogger('TestContext');
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('should create logger with context', () => {
    expect(logger).toBeDefined();
    expect(logger.info).toBeDefined();
    expect(logger.error).toBeDefined();
    expect(logger.warn).toBeDefined();
    expect(logger.debug).toBeDefined();
  });

  it('should log info messages', () => {
    logger.info('Test message', { key: 'value' });
    expect(console.log).toHaveBeenCalled();
  });

  it('should log error messages', () => {
    logger.error('Error message', { error: 'test' });
    expect(console.error).toHaveBeenCalled();
  });

  it('should log warning messages', () => {
    logger.warn('Warning message');
    expect(console.warn).toHaveBeenCalled();
  });

  it('should include context in log output', () => {
    logger.info('Test');
    const logOutput = console.log.mock.calls[0][0];
    const parsed = JSON.parse(logOutput);
    expect(parsed.context).toBe('TestContext');
  });

  it('should include timestamp in log output', () => {
    logger.info('Test');
    const logOutput = console.log.mock.calls[0][0];
    const parsed = JSON.parse(logOutput);
    expect(parsed.timestamp).toBeDefined();
  });
});