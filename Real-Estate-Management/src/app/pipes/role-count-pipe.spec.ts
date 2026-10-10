import { RoleCountPipe } from './role-count-pipe';

describe('RoleCountPipe', () => {
  let pipe: RoleCountPipe;

  beforeEach(() => {
    pipe = new RoleCountPipe();
  });

  it('should create', () => {
    expect(pipe).toBeTruthy();
  });

  it('should return 0 when users is null', () => {
    expect(pipe.transform(null as any, 1)).toBe(0);
  });

  it('should return 0 when users is undefined', () => {
    expect(pipe.transform(undefined as any, 1)).toBe(0);
  });

  it('should return 0 when no users match the roleId', () => {
    const users = [{ roleId: 2 }, { roleId: 3 }];
    expect(pipe.transform(users, 1)).toBe(0);
  });

  it('should return correct count when some users match the roleId', () => {
    const users = [{ roleId: 1 }, { roleId: 2 }, { roleId: 1 }];
    expect(pipe.transform(users, 1)).toBe(2);
  });

  it('should return correct count when all users match the roleId', () => {
    const users = [{ roleId: 3 }, { roleId: 3 }];
    expect(pipe.transform(users, 3)).toBe(2);
  });

  it('should return 0 for an empty array', () => {
    expect(pipe.transform([], 1)).toBe(0);
  });
});