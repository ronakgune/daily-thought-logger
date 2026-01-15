# Calculator Module

A TypeScript calculator module providing basic arithmetic operations with strict type safety.

## Features

- ✅ Addition
- ✅ Subtraction
- ✅ Multiplication
- ✅ Division with zero-division protection
- ✅ Full TypeScript support with strict mode
- ✅ ES Module exports
- ✅ Comprehensive test coverage

## Installation

```bash
npm install
```

## Usage

```typescript
import { add, subtract, multiply, divide } from './calculator';

// Addition
const sum = add(5, 3); // 8

// Subtraction
const difference = subtract(10, 4); // 6

// Multiplication
const product = multiply(6, 7); // 42

// Division
const quotient = divide(20, 4); // 5

// Division by zero throws an error
try {
  divide(10, 0);
} catch (error) {
  console.error(error.message); // "Division by zero is not allowed"
}
```

## API Reference

### `add(a: number, b: number): number`

Adds two numbers and returns the sum.

**Parameters:**
- `a` - First number
- `b` - Second number

**Returns:** The sum of a and b

### `subtract(a: number, b: number): number`

Subtracts the second number from the first.

**Parameters:**
- `a` - First number
- `b` - Second number

**Returns:** The difference of a and b

### `multiply(a: number, b: number): number`

Multiplies two numbers and returns the product.

**Parameters:**
- `a` - First number
- `b` - Second number

**Returns:** The product of a and b

### `divide(a: number, b: number): number`

Divides the first number by the second.

**Parameters:**
- `a` - Dividend
- `b` - Divisor

**Returns:** The quotient of a divided by b

**Throws:** `Error` when attempting to divide by zero

## Testing

Run tests with:

```bash
npm test
```

Run tests with coverage:

```bash
npm run test:coverage
```

## Building

Compile TypeScript to JavaScript:

```bash
npm run build
```

## Type Safety

All functions use explicit TypeScript types and the project is configured with strict mode enabled, ensuring:

- No implicit `any` types
- Strict null checks
- Strict function types
- All type safety features enabled
