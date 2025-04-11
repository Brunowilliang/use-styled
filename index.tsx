import * as React from 'react'
import clsx, { type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { ElementType, ComponentProps, ComponentType } from 'react'

// --- Utility Functions ---

/**
 * Utility function to merge CSS classes with Tailwind CSS support.
 * Uses clsx for conditional classes and tailwind-merge to resolve conflicts.
 * @param inputs - Class values to combine.
 * @returns The merged class string.
 */
const cn = (...inputs: ClassValue[]): string => {
	return twMerge(clsx(inputs))
}

/**
 * Merges multiple props objects, combining classNames and styles intelligently.
 * Later props override earlier props.
 * @param propsList - An array of prop objects to merge.
 * @returns The merged props object.
 */
const mergeProps = <T extends { className?: string; style?: object }>(
	...propsList: Array<Partial<T> | undefined | null>
): T => {
	const result: Partial<T> = {}

	for (const props of propsList.filter(Boolean)) {
		for (const [key, value] of Object.entries(props as object)) {
			// Skip undefined values
			if (value === undefined) continue

			// Handle className merging
			if (key === 'className' && typeof value === 'string') {
				result.className = cn(result.className, value)
			}
			// Handle style merging
			else if (key === 'style' && typeof value === 'object' && value !== null) {
				result.style = { ...result.style, ...value }
			}
			// Handle all other props
			else {
				;(result as any)[key] = value
			}
		}
	}

	// Cast the final result back to T
	return result as T
}

/**
 * Extracts all valid props from a React element type.
 * This allows TypeScript to know all possible props for a component.
 * @template T - The base React element type (e.g., 'div', 'button', ComponentType).
 */
export type ElementProps<T extends ElementType> = ComponentProps<T>

/**
 * Defines a partial set of props that can be applied as a variant style.
 * Allows defining only the props to be modified for a specific variant.
 * @template T - The base React element type.
 */
export type VariantValue<T extends ElementType> = Partial<ElementProps<T>>

/**
 * Type for a regular string-keyed variant.
 */
export type StringVariant<T extends ElementType> = Record<
	string,
	VariantValue<T>
>

/**
 * Defines the structure for variant configurations.
 * The first level Record keys are variant categories (e.g., "color", "size").
 * The second level keys are the possible values for that category.
 * @template T - The base React element type.
 */
export type VariantsConfig<T extends ElementType> = Record<
	string,
	StringVariant<T>
>

/**
 * Extracts the possible variant keys and their allowed values from a VariantsConfig.
 * Enables TypeScript autocompletion and validation for variant props.
 * Example: If V = { color: { red, blue } }, then VariantKeys allows { color?: "red" | "blue" }.
 * @template V - The VariantsConfig object.
 */
export type VariantKeys<V> = {
	[K in keyof V]?: V[K] extends Record<infer ValueKeys, unknown>
		? ValueKeys extends string
			? ValueKeys
			: never
		: never
}

/**
 * Defines the conditions for a compound variant.
 * Represents the combination of variant props that must be active for the compound variant styles to apply.
 * @template V - The VariantsConfig object.
 */
export type CompoundVariantConditions<V> = Partial<VariantKeys<V>>

/**
 * Defines a compound variant, which applies styles only when specific combinations of base variants are active.
 * Combines the required conditions (CompoundVariantConditions) with the props to apply (VariantValue).
 * @template T - The base React element type.
 * @template V - The VariantsConfig object.
 */
export type CompoundVariant<
	T extends ElementType,
	V,
> = CompoundVariantConditions<V> & VariantValue<T>

/**
 * Configuration for a styled component with unified properties.
 * @template T - The base React element type.
 * @template V - The VariantsConfig object.
 */
export type StyledConfig<
	T extends ElementType,
	V extends VariantsConfig<T> = VariantsConfig<T>,
> = {
	/** Component name for debugging purposes */
	name?: string
	/** Enable debug mode to log the component's prop merging process */
	debug?: boolean
	/** Base props to apply to the component, merged with lower priority than variants and instance props. */
	base?: Partial<ElementProps<T>>
	/** Definitions for component variants. */
	variants?: V
	/** Default variant values to apply if not specified in props. */
	defaultVariants?: VariantKeys<V>
	/** Definitions for compound variants based on combinations of base variants. */
	compoundVariants?: Array<CompoundVariant<T, V>>
}

/**
 * Props for the resulting styled component when variants ARE defined.
 * Combines the original component props with the allowed variant keys.
 * @template T - The base React element type.
 * @template V - The VariantsConfig object.
 */
export type StyledPropsWithVariants<
	T extends ElementType,
	V extends VariantsConfig<T>,
> = ElementProps<T> & VariantKeys<V>

// --- useStyled Implementation ---

/**
 * Creates a styled component factory.
 * Returns a new component type that accepts the original component's props plus the defined variant props.
 *
 * @template T - The base React element type.
 * @template V - The VariantsConfig object type.
 * @param component - The base component or tag name (e.g., 'div', Button).
 * @param config - Configuration object including variants, defaultVariants, compoundVariants, and base.
 * @returns A new React component type supporting variants.
 */
export const useStyled = <
	T extends ElementType,
	V extends VariantsConfig<T> = VariantsConfig<T>,
>(
	component: T,
	config: StyledConfig<T, V>,
): ComponentType<
	V extends undefined ? ElementProps<T> : StyledPropsWithVariants<T, V>
> => {
	const Tag = component

	// Destructure config safely with defaults
	const {
		base = {},
		name = 'useStyled',
		variants,
		compoundVariants,
		defaultVariants,
		debug = false, // Default debug to false
	} = config || {}

	// List of variant keys for prop separation
	const variantKeys = variants ? Object.keys(variants) : []

	// Helper type for debug logging
	type LogEntry = {
		component: string
		event: string
		details?: Record<string, any>
	}

	// Logging function - preserved as per Bruno's request
	const logEvent = (event: string, details?: Record<string, any>) => {
		if (debug) {
			const entry: LogEntry = {
				component: name,
				event: event,
				...(details && { details }), // Only add details key if details object is provided
			}
			// Use console.log directly with stringify for one JSON object per line
			console.log(JSON.stringify(entry, null, 2))
		}
	}

	// --- Helper Functions within Hook Scope ---

	/**
	 * Applies compound variants based on current props.
	 * @param currentProps - The combined props including defaults and instance props.
	 * @returns Props derived from matching compound variants.
	 */
	const applyCompoundVariants = (
		currentProps: Record<string, any>,
	): Partial<ElementProps<T>> => {
		// Early return if no compound variants defined
		if (!compoundVariants || compoundVariants.length === 0) {
			logEvent('compound_variants_skip_empty')
			return {}
		}

		let compoundVariantProps: Partial<ElementProps<T>> = {}

		logEvent('compound_variants_start', {
			count: compoundVariants.length,
			currentPropsKeys: Object.keys(currentProps),
		})

		// Check each compound variant for matches
		for (const compound of compoundVariants) {
			// Separate style props from condition props
			const { className, style, ...conditions } = compound
			let isMatch = true

			logEvent('compound_variants_check_condition', {
				conditionsKeys: Object.keys(conditions),
			})

			// Check if all conditions match
			for (const key in conditions) {
				const conditionValue = (conditions as Record<string, unknown>)[key]
				const propValue = currentProps[key]

				logEvent('compound_variants_check_condition_value', {
					key,
					conditionValue,
					propValue,
				})

				// If any condition doesn't match, break early
				if (propValue !== conditionValue) {
					isMatch = false
					logEvent('compound_variants_condition_mismatch', {
						key,
						conditionValue,
						propValue,
					})
					break
				}

				logEvent('compound_variants_condition_match', {
					key,
					conditionValue,
					propValue,
				})
			}

			// Apply styles if all conditions matched
			if (isMatch) {
				logEvent('compound_variants_match_found', {
					conditionsKeys: Object.keys(conditions),
					appliedStylesKeys: Object.keys(compound),
				})

				// Extract only style properties (non-condition keys)
				const compoundSpecificProps: VariantValue<T> = {}

				for (const key in compound) {
					if (!(key in conditions)) {
						;(compoundSpecificProps as Record<string, unknown>)[key] = (
							compound as Record<string, unknown>
						)[key]
					}
				}

				logEvent('compound_variants_apply_props', {
					compoundSpecificPropsKeys: Object.keys(compoundSpecificProps),
				})

				// Merge with previously matched compound variants
				compoundVariantProps = mergeProps(
					compoundVariantProps,
					compoundSpecificProps as Partial<ElementProps<T>>,
				)
			} else {
				logEvent('compound_variants_match_not_found', {
					conditionsKeys: Object.keys(conditions),
				})
			}
		}

		logEvent('compound_variants_complete', {
			finalCompoundPropsKeys: Object.keys(compoundVariantProps),
		})

		return compoundVariantProps
	}

	/**
	 * Applies base variants (non-compound) based on props and defaults.
	 * @param currentProps - The props passed to the component instance.
	 * @returns Props derived from matching base variants and defaults.
	 */
	const applyBaseVariants = (
		currentProps: Record<string, any>,
	): Partial<ElementProps<T>> => {
		// Early return if no variants defined
		if (!variants) {
			logEvent('base_variants_skip_empty')
			return {}
		}

		let variantProps: Partial<ElementProps<T>> = {}

		logEvent('base_variants_start', {
			count: variantKeys.length,
			variantsKeys: Object.keys(variants),
			currentPropsKeys: Object.keys(currentProps),
			defaultVariantsKeys: Object.keys(defaultVariants || {}),
		})

		// Process each variant key
		for (const key of variantKeys) {
			// Get the variant definition for this key
			const variantDef = variants[key as keyof typeof variants]
			if (!variantDef) continue

			// Get the value from props, fallback to defaultVariants if needed
			let propValue = currentProps[key]
			if (propValue === undefined && defaultVariants) {
				propValue = defaultVariants[key as keyof typeof defaultVariants]
			}

			// Skip if we still don't have a value
			if (propValue === undefined) continue

			// Handle lookup by converting the value to a string (needed for object key lookup)
			// We keep the original value type in the log for debugging
			const lookupKey = String(propValue)
			const variantStyles = variantDef[lookupKey as keyof typeof variantDef]

			if (variantStyles) {
				logEvent('base_variants_applied', {
					key,
					value: propValue,
					lookupKey,
					stylesKeys: Object.keys(variantStyles),
				})

				// Merge with accumulated variant props
				variantProps = mergeProps(variantProps, variantStyles)
			} else {
				logEvent('base_variants_not_found', {
					key,
					value: propValue,
					lookupKey,
				})
			}
		}

		logEvent('base_variants_complete', {
			finalBasePropsKeys: Object.keys(variantProps),
		})

		return variantProps
	}

	/**
	 * Separates variant props from other direct props passed to the component.
	 * @param allProps - All props passed to the component instance.
	 * @returns An object containing separated variant and direct props.
	 */
	const separateProps = (
		allProps: Record<string, unknown>,
	): {
		variantProps: VariantKeys<V>
		directProps: Omit<ElementProps<T>, keyof VariantKeys<V>>
	} => {
		// Initialize result objects
		const variantProps: Partial<VariantKeys<V>> = {}
		const directProps: Partial<Omit<ElementProps<T>, keyof VariantKeys<V>>> = {}

		logEvent('props_separation_start', {
			inputPropKeys: Object.keys(allProps),
			variantKeys,
		})

		// Categorize properties into variant or direct props
		for (const [key, value] of Object.entries(allProps)) {
			if (value === undefined) continue // Skip undefined values

			if (variantKeys.includes(key)) {
				// This is a variant prop
				variantProps[key as keyof typeof variantProps] = value as any

				logEvent('props_separation_variant', {
					key,
					value,
				})
			} else {
				// This is a direct prop
				directProps[key as keyof typeof directProps] = value as any

				logEvent('props_separation_direct', {
					key,
					value,
				})
			}
		}

		logEvent('props_separation_complete', {
			separatedVariantPropsKeys: Object.keys(variantProps),
			separatedDirectPropsKeys: Object.keys(directProps),
		})

		// Cast to final types
		return {
			variantProps: variantProps as VariantKeys<V>,
			directProps: directProps as Omit<ElementProps<T>, keyof VariantKeys<V>>,
		}
	}

	// --- The Styled Component ---

	// No need for forwardRef in React 19 - refs are automatically forwarded
	const StyledComponent = (
		props: typeof variants extends undefined
			? ElementProps<T>
			: StyledPropsWithVariants<T, V>,
	) => {
		logEvent('render_start', { receivedPropKeys: Object.keys(props) })

		// Separate instance props from variant keys
		const { children, ...restProps } = props
		const { variantProps, directProps } = separateProps(restProps)

		// Determine active variants including defaults
		const activeVariantProps = { ...defaultVariants, ...variantProps }
		logEvent('active_variants_determined', {
			inputVariantPropsKeys: Object.keys(variantProps),
			defaultVariantsKeys: Object.keys(defaultVariants || {}),
			finalActiveVariantPropsKeys: Object.keys(activeVariantProps),
		})

		// --- Prop Merging Logic ---
		logEvent('prop_merging_start', {
			baseKeys: Object.keys(base || {}),
			directPropsKeys: Object.keys(directProps),
			activeVariantPropsKeys: Object.keys(activeVariantProps),
		})

		// Apply styles in priority order (props with higher indices override those with lower indices)
		logEvent('prop_merging_apply_base')
		const baseVariantStyles = applyBaseVariants(activeVariantProps)

		logEvent('prop_merging_apply_compound')
		const compoundVariantStyles = applyCompoundVariants(activeVariantProps)

		logEvent('prop_merging_final_merge')
		const mergedProps = mergeProps(
			base, // 1. Base styles (lowest priority)
			baseVariantStyles, // 2. Base variant styles
			compoundVariantStyles, // 3. Compound variant styles
			directProps as Partial<ElementProps<T>>, // 4. Direct props (highest priority)
		)

		// Extract className and style for JSX prop spreading
		const { className, style, ...finalRestProps } = mergedProps

		logEvent('prop_merging_complete', {
			finalClassName: className,
			finalStyleKeys: style ? Object.keys(style) : [],
			finalRestPropKeys: Object.keys(finalRestProps),
		})

		// Render the base component with merged props
		logEvent('render_component', {
			componentDisplayName: typeof Tag === 'string' ? Tag : name,
			renderedClassName: className,
			renderedStyleKeys: Object.keys(style || {}),
			renderedRestPropKeys: Object.keys(finalRestProps),
		})

		return (
			<Tag className={className} style={style} {...(finalRestProps as any)}>
				{children}
			</Tag>
		)
	}

	// Set display name for better debugging
	const componentDisplayName =
		typeof Tag === 'string'
			? Tag
			: (Tag as ComponentType).displayName ||
				(Tag as ComponentType).name ||
				'Component'

	StyledComponent.displayName = `Styled(${componentDisplayName})`

	logEvent('hook_complete', { componentDisplayName })

	// Return the styled component with appropriate type casting
	// Cast is necessary to handle both variants and no-variants cases
	return StyledComponent as ComponentType<
		V extends undefined ? ElementProps<T> : StyledPropsWithVariants<T, V>
	>
}

// -------------------
// Example usage
// -------------------

// const Button = useStyled('button', {
// 	base: {
// 		className: 'bg-blue-500 text-white',
// 		onClick: () => {
// 			console.log('Button clicked')
// 		},
// 	},
// 	variants: {
// 		color: {
// 			blue: {
// 				className: 'bg-blue-500',
// 			},
// 			red: {
// 				className: 'bg-red-500',
// 			},
// 		},
// 		size: {
// 			sm: {
// 				className: 'p-2',
// 			},
// 			md: {
// 				className: 'p-4',
// 			},
// 			lg: {
// 				className: 'p-6',
// 			},
// 		},
// 	},
// 	compoundVariants: [
// 		{
// 			color: 'blue',
// 			size: 'md',
// 			className: 'bg-blue-500',
// 		},
// 		{
// 			color: 'red',
// 			className: 'bg-red-500',
// 		},
// 	],
// 	defaultVariants: {
// 		color: 'blue',
// 		size: 'md',
// 	},
// })

// const App = () => {
// 	return (
// 		<div>
// 			<Button>Button</Button>
// 		</div>
// 	)
// }
