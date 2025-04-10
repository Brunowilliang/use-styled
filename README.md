# use-styled

[![npm version](https://badge.fury.io/js/use-styled.svg)](https://badge.fury.io/js/use-styled) <!-- Placeholder: Update with actual package name if published -->
[![GitHub repo](https://img.shields.io/badge/GitHub-Repo-blue.svg)](https://github.com/Brunowilliang/use-styled)

A lightweight and flexible utility function for creating styled components in React and React Native, optimized for use with Tailwind CSS. It provides a clean API for defining base styles, variants, compound variants, and default props, leveraging `clsx` and `tailwind-merge` for efficient class name management.

## Features

*   **Tailwind CSS Optimized:** Works seamlessly with Tailwind CSS class names.
*   **Variant Support:** Easily define and apply style variations based on props (e.g., `size`, `color`).
*   **Boolean Variants:** Simple toggle variants (e.g., `disabled`, `active`).
*   **Compound Variants:** Apply styles based on combinations of other variants.
*   **Default Variants:** Set default styles for variants if no prop is provided.
*   **ClassName & Style Merging:** Intelligently merges `className` strings and `style` objects from base styles, variants, and instance props.
*   **TypeScript Support:** Fully typed for a great developer experience.
*   **Debugging:** Optional debug mode to trace prop merging and variant application.
*   **React & React Native:** Works for both web and mobile development.

## Installation

Using [Yarn](https://yarnpkg.com/):

```bash
yarn add use-styled clsx tailwind-merge
```

Or using [npm](https://www.npmjs.com/):

```bash
npm install use-styled clsx tailwind-merge
```

**Peer Dependencies:**

`use-styled` requires the following peer dependencies to be installed in your project:

*   `react`: `>=18.0.0`
*   `react-native`: `>=0.74.0` (if using React Native)
*   `clsx`: `>=2.0.0`
*   `tailwind-merge`: `>=3.0.0`

Make sure you have these installed and configured in your project.

## Usage

Import `useStyled` and your desired base component (e.g., `View`, `Text`, `Pressable` from `react-native`, or `div`, `button` from React).

```typescript
import { useStyled } from 'use-styled';
import { View as RNView, Text as RNText, Pressable as RNPressable } from 'react-native'; // Or import from React

// 1. Define a basic styled component
const View = useStyled(RNView, {
  name: 'MyStyledView', // Optional: Name for component identification, useful with debug: true
  debug: true, // Optional: Enable debug mode for tracing prop merging
  base: {
    className: 'p-4 bg-gray-100 rounded-md',
  },
});

// 2. Define a component with variants
const Text = useStyled(RNText, {
  name: 'MyStyledText', // Optional: Name for component identification
  base: {
    className: 'font-sans',
  },
  variants: {
    size: {
      sm: { className: 'text-sm' },
      md: { className: 'text-base' },
      lg: { className: 'text-lg font-semibold' },
    },
    color: {
      default: { className: 'text-gray-900' },
      primary: { className: 'text-blue-600' },
      muted: { className: 'text-gray-500' },
    },
    // Boolean variant
    italic: {
      true: { className: 'italic' },
    },
  },
  defaultVariants: {
    size: 'md',
    color: 'default',
  },
});

// 3. Define a component with compound variants and base onPress
const Button = useStyled(RNPressable, {
  name: 'MyButton', // Optional: Name for component identification
  base: {
    className: 'px-4 py-2 rounded-md items-center justify-center transition-colors duration-150',
    // Default onPress for all buttons, unless overridden by variants or instance props
    onPress: () => console.log('Default Button Press!'),
  },
  variants: {
    variant: {
      primary: { className: 'bg-blue-600 text-white active:bg-blue-700' },
      secondary: {
        className: 'bg-gray-200 text-gray-800 active:bg-gray-300',
        // Override onPress specifically for the secondary variant
        onPress: () => console.log('Secondary Variant Press!'),
      },
      danger: { className: 'bg-red-600 text-white active:bg-red-700' },
    },
    size: {
      sm: { className: 'h-8 text-sm' },
      md: { className: 'h-10 text-base' },
      lg: { className: 'h-12 text-lg' },
    },
    disabled: {
      true: { className: 'opacity-50 cursor-not-allowed' },
    }
  },
  compoundVariants: [
    // Make disabled danger button less intense
    {
      variant: 'danger',
      disabled: true,
      className: 'bg-red-300 active:bg-red-300',
    },
  ],
  defaultVariants: {
    variant: 'primary',
    size: 'md',
  },
});

// --- Using the components ---

function MyComponent() {
  return (
    <View> {/* Use the defined component variable name */}
      <Text>Default Text (md, default)</Text> {/* Use the defined component variable name */}
      <Text size="lg" color="primary">
        Large Primary Text
      </Text>
      <Text size="sm" color="muted" italic>
        Small Muted Italic Text
      </Text>

      <Button onPress={() => console.log('Primary Pressed! Instance override!')}> {/* Instance onPress overrides base and variant onPress */}
        {/* Button text needs styling too! */}
        <Text color="white">Primary Button (md)</Text>
      </Button>

      <Button variant="secondary" size="sm"> {/* This will use the onPress defined in the secondary variant */}
         <Text color="default">Secondary Button (sm)</Text>
      </Button>

      <Button variant="danger" size="lg" disabled> {/* Disabled button, default base onPress won't be reachable via UI but is defined */}
        <Text color="white">Disabled Danger Button (lg)</Text>
      </Button>
    </View>
  );
}
```

## API

### `useStyled(Component, config)`

*   `Component`: The base React or React Native component (`div`, `button`, `View`, `Text`, etc.).
*   `config`: An object to configure the styled component.
    *   `name` (optional): A string name for the component. Primarily used for identification in debugging logs when `debug: true` is enabled.
    *   `debug` (optional): A boolean. If `true`, logs the prop merging process to the console.
    *   `base` (optional): An object containing base props to apply by default. You can include **any valid prop** for the base `Component` here (e.g., `className`, `style`, `onPress`, `accessibilityLabel`, etc.).
    *   `variants` (optional): An object defining different style variations based on props.
        *   Each key represents a variant prop name (e.g., `size`, `color`).
        *   The value is an object where keys are the possible variant values (e.g., `sm`, `md`, `lg`) and values are `VariantValue` objects.
            *   A `VariantValue` object can contain **any valid prop** for the base `Component` (e.g., `{ className?: string, style?: object, onPress?: () => void, ...otherProps }`). These props will be applied when the variant is active.
        *   For boolean variants, use a single key `true`.
    *   `compoundVariants` (optional): An array of objects defining styles applied when multiple variant conditions are met. Each object includes condition keys (matching `variants` props) and a `VariantValue` object (containing any valid props) to apply.
    *   `defaultVariants` (optional): An object specifying the default values for variant props if they are not provided when using the component.

### Return Value

`useStyled` returns a new React component factory. The created component accepts all props of the base `Component` plus any props defined as `variants` keys.

## How it Works

1.  **Prop Separation:** When the styled component renders, `useStyled` separates the incoming props into *variant props* (keys defined in `config.variants`) and *direct props* (all other props).
2.  **Variant Application:**
    *   It determines the active variant values based on the provided `variantProps` and the `config.defaultVariants`.
    *   It applies styles from `config.compoundVariants` that match the active variant combination.
    *   It applies styles from the active base `config.variants`.
3.  **Prop Merging:** It merges props in the following order of priority (lower numbers override higher numbers):
    1.  `config.base` props.
    2.  Props from active `compoundVariants`.
    3.  Props from active base `variants`.
    4.  Direct props passed to the component instance.
4.  **ClassName & Style Handling:** `className` strings are merged using `clsx` and `tailwind-merge`. `style` objects are shallowly merged (last write wins for conflicting keys).
5.  **Rendering:** The base `Component` is rendered with the final merged props.

## Contributing

Contributions are welcome! Please feel free to open an issue or submit a pull request.
