import { lightColors, darkColors } from '../theme/tokens';
describe('tutor theme tokens', () => {
  it('primary is Sage, not Ocean', () => {
    expect(lightColors.primary).toBe('#4A6944');
    expect(lightColors.primary).not.toBe('#1A3A52');
  });
  it('borderFocus is Sage in light mode', () => {
    expect(lightColors.borderFocus).toBe('#4A6944');
  });
  it('dark primary is a lighter Sage variant', () => {
    expect(darkColors.primary).toBe('#8FB088');
  });
  it('ocean exists as accent but is never primary', () => {
    expect(lightColors.ocean).toBe('#1A3A52');
    expect(lightColors.primary).not.toBe(lightColors.ocean);
  });
});
