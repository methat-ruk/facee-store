import { HealthController } from './health.controller';

describe('HealthController', () => {
  const controller = new HealthController();

  it('returns the service heartbeat payload', () => {
    const response = controller.getHealth();

    expect(response.status).toBe('ok');
    expect(response.service).toBe('facee-api');
    expect(typeof response.timestamp).toBe('string');
  });
});
