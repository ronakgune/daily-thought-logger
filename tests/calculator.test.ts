import { add, subtract, multiply, divide } from '../src/calculator';

describe('Calculator', () => {
  describe('add', () => {
    it('should add two positive numbers', () => {
      expect(add(2, 3)).toBe(5);
    });

    it('should add two negative numbers', () => {
      expect(add(-2, -3)).toBe(-5);
    });

    it('should add a positive and negative number', () => {
      expect(add(5, -3)).toBe(2);
    });

    it('should add zero to a number', () => {
      expect(add(5, 0)).toBe(5);
    });

    it('should handle decimal numbers', () => {
      expect(add(1.5, 2.3)).toBeCloseTo(3.8);
    });
  });

  describe('subtract', () => {
    it('should subtract two positive numbers', () => {
      expect(subtract(5, 3)).toBe(2);
    });

    it('should subtract two negative numbers', () => {
      expect(subtract(-5, -3)).toBe(-2);
    });

    it('should subtract a negative from a positive number', () => {
      expect(subtract(5, -3)).toBe(8);
    });

    it('should subtract zero from a number', () => {
      expect(subtract(5, 0)).toBe(5);
    });

    it('should handle decimal numbers', () => {
      expect(subtract(5.5, 2.3)).toBeCloseTo(3.2);
    });
  });

  describe('multiply', () => {
    it('should multiply two positive numbers', () => {
      expect(multiply(3, 4)).toBe(12);
    });

    it('should multiply two negative numbers', () => {
      expect(multiply(-3, -4)).toBe(12);
    });

    it('should multiply a positive and negative number', () => {
      expect(multiply(3, -4)).toBe(-12);
    });

    it('should multiply by zero', () => {
      expect(multiply(5, 0)).toBe(0);
    });

    it('should multiply by one', () => {
      expect(multiply(5, 1)).toBe(5);
    });

    it('should handle decimal numbers', () => {
      expect(multiply(2.5, 4)).toBe(10);
    });
  });

  describe('divide', () => {
    it('should divide two positive numbers', () => {
      expect(divide(10, 2)).toBe(5);
    });

    it('should divide two negative numbers', () => {
      expect(divide(-10, -2)).toBe(5);
    });

    it('should divide a positive by a negative number', () => {
      expect(divide(10, -2)).toBe(-5);
    });

    it('should divide a negative by a positive number', () => {
      expect(divide(-10, 2)).toBe(-5);
    });

    it('should handle decimal results', () => {
      expect(divide(5, 2)).toBe(2.5);
    });

    it('should handle decimal inputs', () => {
      expect(divide(7.5, 2.5)).toBe(3);
    });

    it('should throw error when dividing by zero', () => {
      expect(() => divide(5, 0)).toThrow('Division by zero is not allowed');
    });

    it('should throw error when dividing zero by zero', () => {
      expect(() => divide(0, 0)).toThrow('Division by zero is not allowed');
    });
  });
});
