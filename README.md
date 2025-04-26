![use-styled logo](./assets/logo.png)

Create React and React Native components with variants in an elegant and integrated way.

`use-styled` allows you to decouple styling and variant logic from component logic, making your code cleaner, reusable, and easier to maintain, with an API focused on developer experience (DX).

**➡️ [Visit the Full Documentation](https://usestyled.com/) for guides, examples, and references.**

## Installation

```bash
npm install use-styled
# or
yarn add use-styled
# or
pnpm add use-styled
# or
bun add use-styled
```

## Basic Usage

The heart of the library is the `useStyled` hook:

```tsx
import { useStyled } from 'use-styled';
import { Pressable, Text } from 'react-native'; // Or 'button', 'div', etc.

const Button = useStyled(Pressable, {
  base: {
    // Base styles/props always applied
    className: 'px-4 py-2 rounded-md',
  },
  variants: {
    intent: {
      primary: { className: 'bg-blue-500' },
      secondary: { className: 'bg-gray-200' },
    },
    size: {
      sm: { className: 'text-sm' },
      md: { className: 'text-base' },
    },
  },
  defaultVariants: {
    intent: 'primary',
    size: 'md',
  }
});

const ButtonText = useStyled(Text, {
  // ... configuration for the text ...
});

// Example usage
function MyComponent() {
  return (
    <Button intent="secondary" size="sm">
      <ButtonText>Click Me</ButtonText>
    </Button>
  );
}
```

## Key Features

*   **Integrated API**: Define styles, variants, and the component in a single hook.
*   **Type-Safe by Design**: Type inference and validation for safety and autocompletion.
*   **Cross-Platform**: Same API for React (Web) and React Native.
*   **Tailwind/NativeWind Ready**: Use `className` directly in variants.

**Explore the [Full Documentation](https://usestyled.com/) to learn about `compoundVariants`, `style` vs `className`, advanced usage, and more!**

## Acknowledgements

Software development is a collaborative and iterative process. `use-styled` wouldn't exist without the incredible work of other people and projects in the open-source community. We would like to express our sincere gratitude to:

*   **`class-variance-authority` (cva)** by Joe Bell: For popularizing a robust and type-safe way to handle class variants.
*   **`tailwind-variants`** by Junior Garcia and Tianen Pang: For expanding the CVA concept with a rich API, including `base`, `variants`, `compoundVariants`, and `defaultVariants`, which directly influenced the features of `use-styled`.
*   **`Tamagui`** by Nate: For its innovative and elegant approach to creating universal styled components (React/React Native), which served as the main inspiration for the API and developer experience (DX) of `use-styled`.

Thank you to Joe, Junior, Tianen, and Nate for their significant contributions that make the development ecosystem richer and more productive.

---

*Developed with ❤️ by Bruno Garcia*
