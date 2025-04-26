import type {
	ElementType,
	ComponentProps,
	ComponentType,
	RefAttributes,
} from 'react'
export type { ComponentProps } from 'react'

/**
 * Defines the expected structure of the component configuration.
 */
export type Config = {
	base?: object
	variants?: { [key: string]: { [key: string]: object } }
	defaultVariants?: { [key: string]: string | boolean }
	compoundVariants?: Array<object>
}

/**
 * Alias for ElementType representing a valid React component.
 */
export type Component = ElementType

/**
 * Validates a properties object `P` against the valid properties of a component `T`,
 * also allowing `data-*` attributes and rejecting other invalid props.
 */
// 1. Base type that accepts props from T or data-*
type AllowedProps<T extends Component> = ComponentProps<T> & {
	[key: `data-${string}`]: unknown
}

// 2. Type that forbids extra keys
type ForbidExtraProps<T extends Component, P> = {
	[K in keyof P as K extends keyof AllowedProps<T> ? never : K]: never
}

// 3. Final validation: P must be a subtype of AllowedProps AND cannot have extra keys
export type OnlyValidProps<T extends Component, P> = P extends AllowedProps<T> // Ensures P is (at least) a subset of allowed props
	? P & ForbidExtraProps<T, P> // Intersects with the type that forbids extras
	: AllowedProps<T> // If P is not compatible, shows the error relative to the expected type

/**
 * Recursively applies `OnlyValidProps` to each style object within the variants structure `V`.
 * Ensures that all properties defined within the variants are valid for the component `T`.
 *
 * @template T The type of the base component.
 * @template V The type of the `variants` section of the configuration object.
 */
export type ValidatedVariants<T extends Component, V> = V extends object
	? {
			[VK in keyof V]: VK extends string
				? {
						// Iterates over variant keys (e.g., 'test')
						[SK in keyof V[VK]]: SK extends string // Iterates over style keys (e.g., 'a', 'b')
							? OnlyValidProps<T, V[VK][SK]> // Validates properties within each style
							: never
					}
				: never
		}
	: V

/**
 * Defines the expected type for the `defaultVariants` section and improves IntelliSense.
 * For each variant key `K` in `V`, the expected value is the union of style keys (`keyof V[K]`)
 * If the style keys are 'true' | 'false', the expected type is `boolean`.
 *
 * @template V The type of the `variants` section of the configuration object.
 */
export type ValidatedDefaultVariants<V> = V extends object
	? {
			[K in keyof V]?: keyof V[K] extends 'true' | 'false'
				? boolean
				: keyof V[K]
		}
	: {}

/**
 * Defines the structure and expected types for the CONDITIONS of a `compoundVariants` item.
 * Based on the keys and values defined in the `variants` section (`V`).
 * Improves IntelliSense when defining conditions.
 *
 * @template V The type of the `variants` section of the configuration object.
 */
export type CompoundVariantConditions<V> = V extends object
	? {
			[K in keyof V]?: keyof V[K] extends 'true' | 'false'
				? boolean
				: keyof V[K]
		}
	: {}

/**
 * Validates a SINGLE item within the `compoundVariants` array.
 * PRIORITIZES IntelliSense for props, sacrificing local validation on them.
 */
export type ValidatedCompoundVariantItem<
	T extends Component,
	V,
	Item extends object,
> = CompoundVariantConditions<V> & // 1. Apply expected conditions
	// 2. Explicitly define the type of 'props' for IntelliSense
	//    Sacrifices automatic OnlyValidProps validation HERE.
	(Item extends { props: infer P }
		? { props?: Partial<ComponentProps<T>> }
		: {
				props?: never
			}) & {
		// 3. Ensure there are no extra keys beyond conditions + 'props'
		[K in keyof Item as K extends keyof V | 'props' ? never : K]?: never
	} & Item // 4. Intersect with the original Item to validate condition values etc.

// Validate the entire compoundVariants ARRAY (maintains ReadonlyArray)
type ValidatedCompoundVariants<
	T extends Component,
	V,
	CV,
> = CV extends ReadonlyArray<infer Item extends object>
	? ReadonlyArray<ValidatedCompoundVariantItem<T, V, Item>>
	: CV

/**
 * Defines the expected structure of the debug configuration.
 */
export type DebugConfig = {
	name?: string
	debug?: boolean
}

/**
 * Validates the complete structure of the configuration object `C` against the component `T`.
 * Applies specific validations for `base`, `variants`, `defaultVariants`, and `compoundVariants`.
 * Uses conditional types to handle the optional absence of `defaultVariants` or `compoundVariants`.
 *
 * @template T The type of the base component.
 * @template C The literal type of the complete configuration object passed.
 */
export type ConfigSchema<T extends Component, C extends Config> = C extends {
	base?: infer B
	variants?: infer V
	defaultVariants?: infer DV
	compoundVariants?: infer CompV
}
	? {
			// Case 1: All exist
			base?: OnlyValidProps<T, B>
			variants?: ValidatedVariants<T, V>
			defaultVariants?: DV &
				ValidatedDefaultVariants<V> & {
					[KDV in keyof DV as KDV extends keyof V ? never : KDV]?: never
				}
			compoundVariants?: ValidatedCompoundVariants<T, V, CompV> // <<<--- VALIDATES compoundVariants
		}
	: C extends { base?: infer B; variants?: infer V; defaultVariants?: infer DV }
		? {
				// Case 2: No compoundVariants
				base?: OnlyValidProps<T, B>
				variants?: ValidatedVariants<T, V>
				defaultVariants?: DV &
					ValidatedDefaultVariants<V> & {
						[KDV in keyof DV as KDV extends keyof V ? never : KDV]?: never
					}
			}
		: C extends {
					base?: infer B
					variants?: infer V
					compoundVariants?: infer CompV
				}
			? {
					// Case 3: No defaultVariants
					base?: OnlyValidProps<T, B>
					variants?: ValidatedVariants<T, V>
					compoundVariants?: ValidatedCompoundVariants<T, V, CompV>
				}
			: C extends { base?: infer B; variants?: infer V }
				? // Case 4: Only base and variants
					{
						base?: OnlyValidProps<T, B>
						variants?: ValidatedVariants<T, V>
					}
				: { base?: unknown; variants?: unknown } // Generic fallback type

/**
 * Calculates the type of the properties representing the active variants.
 * Based on the `variants` section of the configuration object `C`.
 * If a variant has keys 'true'|'false', the resulting type is `boolean`.
 *
 * @template C The literal type of the complete configuration object passed.
 */
export type CalculateVariantProps<C extends Config> = C extends {
	variants?: infer V
}
	? V extends object
		? {
				[K in keyof V]?: keyof V[K] extends 'true' | 'false'
					? boolean
					: keyof V[K]
			}
		: {}
	: {}

/**
 * Calculates the final props type for the styled component returned by `useStyled`.
 * Combines the original props of the base component `T` (omitting collisions with variant names)
 * with the calculated variant properties (`CalculateVariantProps`) and adds `ref`.
 *
 * @template T The type of the base component.
 * @template C The literal type of the complete configuration object passed.
 */
export type FinalProps<T extends Component, C extends Config> = RefAttributes<
	// Includes RefAttributes<T> to allow the ref prop
	ComponentProps<T>['ref'] extends React.Ref<infer RefType> ? RefType : unknown
> &
	Omit<ComponentProps<T>, keyof CalculateVariantProps<C>> &
	CalculateVariantProps<C>

/**
 * Defines the generic type for the final component returned by `useStyled`.
 * It is a `ComponentType` (from React) whose props are defined by `FinalProps`,
 * using the specific types `T` (base component) and `C` (configuration) provided.
 *
 * @template T The type of the base component.
 * @template C The literal type of the complete configuration object passed.
 */
export type StyledComponent<
	T extends Component,
	C extends Config,
> = ComponentType<FinalProps<T, C>>
