# use-styled 🎨

A powerful library for creating React/React Native components

`use-styled` allows you to decouple styling and variant logic from your component logic, making your code cleaner, more reusable, and easier to maintain.

## Features

*   **Simple API:** A single `useStyled` hook to create your styled components.
*   **Declarative Configuration:** Define base styles, variants, default variants, and compound variants in a clear configuration object.
*   **Type-Safe:** Fully written in TypeScript, with compile-time configuration validation to prevent errors.
*   **Platform Agnostic (Styles):** Works with React for Web (via `style` or `className`) and React Native (via `style` or `className` with NativeWind v4).
*   **Tailwind/CSS Support:** Use the `className` prop in configurations to apply CSS classes, ideal for integration with Tailwind CSS, CSS Modules, etc.
*   **Multiple Variants:** Apply multiple variants simultaneously (size, color, state, etc.).
*   **Compound Variants:** Apply specific styles for combinations of variants.
*   **Default Variants:** Define default values for your variants.
*   **Smart Merging:** Automatically merges `style` (style objects) and `className` (for web with `clsx` and `tailwind-merge`, or for React Native with NativeWind v4) from different sources (base, variants, compounds, direct props).
*   **Automatic Prop Forwarding:** Props passed to the styled component that are not variant names are automatically forwarded to the base component.

## Basic Usage

The main API is the `useStyled` hook.

```tsx
import { useStyled } from 'use-styled'; // Adjust the import path
import { View } from 'react-native'; // or 'div', 'button', etc.

const StyledComponent = useStyled(BaseComponent, {
  base: {
    // ... base props
  },
  variants: {
    // ... variant definitions
  },
  defaultVariants: {
    // ... default values for variants
  },
  compoundVariants: [
    // ... rules for variant combinations
  ]
});

// Usage:
<StyledComponent variantProp1="value" variantProp2={true} baseComponentProp="abc" />
```

*   **`BaseComponent`**: The React component you want to style (e.g., `View`, `Text`, `'div'`, `'button'`, or a custom component).
*   **`configuration`**: An object that defines how the component will be styled.

## Detailed Configuration Object

The configuration object is the heart of `useStyled`.

### `base` (Optional)

An object containing props that will be unconditionally applied to the `BaseComponent`.

*   Use `style` to apply inline or React Native style objects.
*   Use `className` to apply CSS classes (e.g., Tailwind) on the web or with NativeWind v4 in React Native.
*   Other valid props for the `BaseComponent` (including `data-*`) are also allowed.

```js
{
  base: {
    style: { boxSizing: 'border-box', margin: 0 }, // Base style
    className: 'font-sans antialiased', // Base classes (e.g., Tailwind)
    'data-component': 'base-element'
  }
}
```

### `variants` (Optional)

Defines different visual or behavioral states.

*   Outer key: variant name (prop).
*   Inner key: variant value (`string` or `boolean`).
*   Final value: object of props to be applied (`style`, `className`, or other valid props).

```js
{
  variants: {
    intent: {
      primary: {
        style: { /* RN Style */ },
        className: 'bg-blue-500 text-white hover:bg-blue-600' // Web/Tailwind style or NativeWind
      },
      secondary: {
        style: { /* RN Style */ },
        className: 'bg-gray-200 text-gray-800 hover:bg-gray-300'
      }
    },
    size: {
      small: { style: { padding: '8px 12px', fontSize: 14 } }, // Style object
      medium: { style: { padding: '12px 16px', fontSize: 16 } }
    },
    disabled: {
      true: { 
        style: { opacity: 0.5 }, 
        className: 'opacity-50 cursor-not-allowed' 
      },
    }
  }
}
```

### `defaultVariants` (Optional)

Specifies which variant values to use when no corresponding prop is passed to the styled component.

```js
{
  variants: { /* ... as above ... */ },
  defaultVariants: {
    intent: 'primary', // If <Button /> is used, intent will be 'primary'
    size: 'medium',   // If <Button /> is used, size will be 'medium'
    disabled: false   // If <Button disabled /> or <Button disabled={undefined} /> is used, it will be false
  }
}
```

### `compoundVariants` (Optional)

Allows applying additional props when a **specific combination** of variants is active. It's an array of objects, where each object defines the conditions and the props to be applied.

The `props` defined here are merged over the props from `base` and active `variants` (following the precedence order: base -> variants -> compound -> direct props).

```js
{
  variants: { /* ... as above ... */ },
  compoundVariants: [
    // When intent='primary' AND disabled=true
    {
      intent: 'primary',
      disabled: true,
      props: {
        style: { backgroundColor: 'darkblue' } // Overrides the backgroundColor from the 'primary' variant
      }
    },
    // When intent='secondary' AND size='small'
    {
      intent: 'secondary',
      size: 'small',
      props: {
        style: { borderWidth: 2, borderColor: 'black' } // Adds border
      }
    }
  ]
}
```

## Prop Forwarding (Direct Props)

Any prop you pass to the styled component that **is not** a variant name defined in the configuration will be automatically forwarded to the underlying `BaseComponent`.

This allows you to use all the native props of the base component, such as event handlers (`onClick`, `onPress`), `aria-*` attributes, `id`, etc., directly on your styled component.

```tsx
const MyStyledButton = useStyled('button', {
  variants: {
    intent: { /* ... */ }
  }
});

// Usage:
<MyStyledButton 
  intent="primary"  // <-- Variant prop
  onClick={() => alert('Clicked!')} // <-- Forwarded to <button>
  id="my-id"         // <-- Forwarded to <button>
  aria-label="Confirm" // <-- Forwarded to <button>
>
  Click Here
</MyStyledButton>
```

The `style` and `className` props passed directly are also treated specially: they are intelligently merged with the styles and classes defined in the configuration, with direct props having the highest priority in case of conflicts.

## Practical Examples

### Example 1: Flexible `Button` Component

Let's create a button that can have different intents, sizes, and loading states.

```tsx
import React from 'react';
import { useStyled } from 'use-styled';
import { ActivityIndicator, Pressable, Text } from 'react-native'; // RN Example

// Or for web:
// const SimpleButton = (props) => <button data-testid="simple-button" {...props} />;

// Use a base component that supports ref forwarding if needed.
// React Native's Pressable supports ref directly.
const ButtonBase = Pressable;

// OR if using a custom component without forwardRef:
// const ButtonBase = (props) => <Pressable {...props} />;

// Note: With NativeWind v4, you can also use className in your variants
const Button = useStyled(ButtonBase, {
  base: {
    style: {
      borderWidth: 0,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row', // To align text and indicator
    },
    // Using NativeWind v4, you could also add: className: 'rounded-lg flex-row items-center justify-center'
    // Default Pressable/Button props can go here
    accessibilityRole: 'button',
  },
  variants: {
    intent: {
      primary: {
        style: { backgroundColor: '#007AFF' }, // Blue
        // Let's define text color separately for clarity
      },
      secondary: {
        style: { backgroundColor: '#E5E5EA' }, // Light gray
      },
      danger: {
        style: { backgroundColor: '#FF3B30' }, // Red
      },
    },
    size: {
      medium: {
        style: { paddingVertical: 12, paddingHorizontal: 16, minHeight: 44 },
      },
      small: {
        style: { paddingVertical: 8, paddingHorizontal: 12, minHeight: 36 },
      },
    },
    outline: {
      true: {
        style: { borderWidth: 1 },
      },
    },
    loading: {
      true: {
        style: { opacity: 0.7 },
        // We could disable interactions here too
      },
    },
    // Separate variant for text/icon color
    contentColor: {
       white: { style: { color: '#FFFFFF' } },
       black: { style: { color: '#1C1C1E' } },
       blue: { style: { color: '#007AFF' } },
       red: { style: { color: '#FF3B30' } },
    }
  },
  defaultVariants: {
    intent: 'primary',
    size: 'medium',
    outline: false,
    loading: false,
    contentColor: 'white', // Default for primary
  },
  compoundVariants: [
    // Adjust content color and border for secondary
    {
      intent: 'secondary',
      props: { contentColor: 'blue' }
    },
    {
      intent: 'secondary',
      outline: true,
      props: { style: { borderColor: '#007AFF' }} // Blue border for outline secondary
    },
    // Adjust content color and border for danger
    {
      intent: 'danger',
      props: { contentColor: 'white' } // White text on red button
    },
    {
        intent: 'danger',
        outline: true,
        props: {
            style: { backgroundColor: 'transparent', borderColor: '#FF3B30' }, // Transparent background
            contentColor: 'red' // Red text
        }
    },
    // Adjust content color for primary outline
     {
      intent: 'primary',
      outline: true,
      props: {
          style: { backgroundColor: 'transparent', borderColor: '#007AFF' },
          contentColor: 'blue'
       }
    },
  ],
});

// Internal Text component to apply color
const ButtonText = useStyled(Text, {
    variants: {
        contentColor: {
           white: { style: { color: '#FFFFFF' } },
           black: { style: { color: '#1C1C1E' } },
           blue: { style: { color: '#007AFF' } },
           red: { style: { color: '#FF3B30' } },
        },
        size: {
            medium: { style: { fontSize: 16, fontWeight: '600' } },
            small: { style: { fontSize: 14, fontWeight: '500' } },
        }
    },
     defaultVariants: {
        size: 'medium',
        // contentColor will be passed from Button
    }
});


// Button Usage
const App = () => (
  <View style={{ padding: 20, gap: 10 }}>
    <Button>
      <ButtonText>Primary Medium</ButtonText>
    </Button>
    <Button intent="secondary" size="small">
       <ButtonText contentColor="blue" size="small">Secondary Small</ButtonText>
    </Button>
     <Button intent="danger" outline={true}>
       <ButtonText contentColor="red">Danger Outline</ButtonText>
    </Button>
    <Button intent="primary" outline={true} size="small">
       <ButtonText contentColor="blue" size="small">Primary Outline Small</ButtonText>
    </Button>
    <Button loading={true} intent="primary">
      {/* Pass contentColor explicitly here because of ActivityIndicator */}
      <ButtonText contentColor="white">Loading...</ButtonText>
      {/* RN: size and color on ActivityIndicator don't come from useStyled */}
      <ActivityIndicator size="small" color="#FFFFFF" style={{ marginLeft: 8 }} />
    </Button>
  </View>
);

```

### Example 2: `Badge` Component (Web)

```tsx
import React from 'react';
import { useStyled } from 'use-styled';

const Badge = useStyled('span', {
  base: {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      borderRadius: '9999px', // pill shape
      fontWeight: 500,
      whiteSpace: 'nowrap',
    },
    className: 'badge',
  },
  variants: {
    colorScheme: {
      neutral: {
        style: { backgroundColor: '#E5E7EB', color: '#374151' },
        className: 'badge-neutral',
      },
      info: {
        style: { backgroundColor: '#DBEAFE', color: '#1D4ED8' },
        className: 'badge-info',
      },
      success: {
        style: { backgroundColor: '#D1FAE5', color: '#065F46' },
        className: 'badge-success',
      },
      warning: {
        style: { backgroundColor: '#FEF3C7', color: '#92400E' },
        className: 'badge-warning',
      },
      danger: {
        style: { backgroundColor: '#FEE2E2', color: '#991B1B' },
        className: 'badge-danger',
      },
    },
    size: {
      sm: { style: { fontSize: 12, padding: '2px 8px' } },
      md: { style: { fontSize: 14, padding: '3px 10px' } },
    },
    // Add a variant for having a dot
    withDot: {
      true: {
        style: { paddingLeft: '6px' }, // Adjust left padding for the dot
      },
    },
  },
  defaultVariants: {
    colorScheme: 'neutral',
    size: 'sm',
    withDot: false,
  },
});

// Helper component for the dot
const Dot = useStyled('span', {
    base: { style: { display: 'inline-block', width: 6, height: 6, marginRight: 5, borderRadius: '50%' } },
    variants: {
         colorScheme: {
            neutral: { style: { backgroundColor: '#6B7280' } },
            info: { style: { backgroundColor: '#3B82F6' } },
            success: { style: { backgroundColor: '#10B981' } },
            warning: { style: { backgroundColor: '#F59E0B' } },
            danger: { style: { backgroundColor: '#EF4444' } },
        }
    },
     defaultVariants: {
        colorScheme: 'neutral',
    }
});

// Usage
const App = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '20px' }}>
    <Badge>Default</Badge>
    <Badge colorScheme="success" size="md">
      Success MD
    </Badge>
    <Badge colorScheme="danger" withDot={true}>
      <Dot colorScheme="danger" />
      Danger with Dot
    </Badge>
     <Badge colorScheme="info" size="md" withDot={true}>
      <Dot colorScheme="info" />
      Info MD with Dot
    </Badge>
    <Badge colorScheme="warning">Warning</Badge>
  </div>
);
```

### Example 3: Styled `FlatList` in React Native

When styling complex components like FlatList that have required props such as `data` and `renderItem`, we can use a wrapper component approach:

```tsx
import React from 'react';
import { View, Text, FlatList as RNFlatList, type FlatListProps } from 'react-native';
import { useStyled } from 'use-styled';

// Sample data
const data = [
	{ id: 1, name: 'Item 1' },
	{ id: 2, name: 'Item 2' },
	{ id: 3, name: 'Item 3' },
]

type ItemData = {
	id: number
	name: string
}

// Create a wrapper component that provides default values for required props
type NewFlatListProps = Partial<FlatListProps<any>> & {}

const NewFlatList = ({ ...props }: NewFlatListProps) => {
	return <RNFlatList data={[]} renderItem={() => null} {...props} />
}

// Apply useStyled to the wrapper component
const StyledFlatList = useStyled(NewFlatList, {
	base: {
		data: data,
		keyExtractor: item => item.id.toString(),
		className: 'w-full',
	},
	variants: {
		variant: {
			blue: {
				renderItem: ({ item }: { item: ItemData }) => (
					<View className='h-10 items-center justify-center bg-blue-500'>
						<Text className='text-white'>{item.name}</Text>
					</View>
				),
			},
			green: {
				renderItem: ({ item }: { item: ItemData }) => (
					<View className='h-10 items-center justify-center bg-green-500'>
						<Text className='text-white'>{item.name}</Text>
					</View>
				),
			},
			red: {
				renderItem: ({ item }: { item: ItemData }) => (
					<View className='h-10 items-center justify-center bg-red-500'>
						<Text className='text-white'>{item.name}</Text>
					</View>
				),
			},
		},
		isLoading: {
			true: {
				renderItem: () => (
					<View className='h-10 w-screen animate-pulse bg-gray-500 transition-all' />
				),
			},
		},
	},
});

// Usage
const ListExample = () => {
  return (
    <View className="flex-1">
      {/* Basic usage with variant */}
      <StyledFlatList variant="blue" />
      
      {/* With loading state */}
      <StyledFlatList variant="green" isLoading={true} />
      
      {/* With custom data and other FlatList props */}
      <StyledFlatList
				variant='red'
				data={[
					{ id: 1, name: 'Custom Item' },
					{ id: 2, name: 'Custom Item' },
					{ id: 3, name: 'Custom Item' },
					{ id: 4, name: 'Custom Item' },
					{ id: 5, name: 'Custom Item' },
					{ id: 6, name: 'Custom Item' },
					{ id: 7, name: 'Custom Item' },
					{ id: 8, name: 'Custom Item' },
					{ id: 9, name: 'Custom Item' },
				]}
				horizontal
				showsHorizontalScrollIndicator={false}
			/>
    </View>
  );
};
```

This approach allows you to:
1. Create a stylized FlatList with variants
2. Handle complex component props elegantly
3. Override any prop when needed (data, renderItem, etc.)
4. Keep full TypeScript support

## TypeScript

The library offers strong integration with TypeScript. The configuration is validated at compile-time using the `ConfigSchema` type, ensuring that:

*   Properties defined in `base`, `variants`, and `compoundVariants.props` are valid for the `BaseComponent`.
*   Values in `defaultVariants` correspond to defined variants and values.
*   Conditions in `compoundVariants` use valid variant names and values.

`data-*` attributes are allowed in the configuration. Other invalid properties will generate type errors.

The props type of the final component is automatically inferred, combining the original props of the `BaseComponent` (except those used as variant names) with the defined variant props.

## Notes

*   **Performance:** The library adds a small runtime overhead to calculate styles. For most applications, this is negligible, but benchmarks are available (see tests section). Internal memoization helps optimize re-renders.
*   **Compatibility (NativeWind):** Support for **NativeWind v4** in React Native (passing NativeWind classes via the `className` prop) **is experimental but working**! Test it in your application and report any issues you find.

## IDE Configuration

### Tailwind CSS IntelliSense

To make Tailwind CSS IntelliSense work with the `className` properties in your `useStyled` configuration, add the following to your VS Code / Cursor settings:

```json
"tailwindCSS.experimental.classRegex": [
    [
        "((?:useStyled)(?:[\\.a-zA-Z0-9]*)?\\((?:[^)(]|\\((?:[^)(]|\\((?:[^)(]|\\([^)(]*\\))*\\))*\\))*\\))",
        "className\\s*:\\s*'(.*?)'"
    ]
]
```

This enables autocompletion and syntax highlighting for Tailwind classes inside the `className` properties of your styled components.

---

*Developed with ❤️*
