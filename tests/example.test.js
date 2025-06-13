/**
 * Example test file to verify Jest setup
 */

describe('Somnium Test Suite', () => {
  test('Jest is properly configured', () => {
    expect(true).toBe(true);
  });
  
  test('EGA color constants are defined', () => {
    const EGA_PALETTE = [
      '#000000', '#0000AA', '#00AA00', '#00AAAA',
      '#AA0000', '#AA00AA', '#AA5500', '#AAAAAA',
      '#555555', '#5555FF', '#55FF55', '#55FFFF',
      '#FF5555', '#FF55FF', '#FFFF55', '#FFFFFF'
    ];
    
    expect(EGA_PALETTE).toHaveLength(16);
    expect(EGA_PALETTE[0]).toBe('#000000'); // Black
    expect(EGA_PALETTE[15]).toBe('#FFFFFF'); // White
  });
});