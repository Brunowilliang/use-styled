// Import local types (defined in types.ts)
import type { Component, Config, ComponentProps } from './types'

// Imports for cn (add to your project)
import clsx, { type ClassValue } from 'clsx'
import { extendTailwindMerge, getDefaultConfig } from 'tailwind-merge'

// --- Helper Types ---
type AnyObject = Record<string, any>
// The generic type for `style` will be inferred as object or CSSProperties/RN Styles by usage.
type StyleValue = object | undefined | null
// Defining StyleObject correctly
type StyleObject = AnyObject

// --- Function Composition Helpers (V2 Feature) ---

/**
 * Checks if a value is a function
 */
const isFunction = (value: any): value is Function => {
	return typeof value === 'function'
}

/**
 * Composes multiple functions into a single function.
 * Functions are executed in order: first function executes first, then second, etc.
 * The return value of the last function is returned.
 * 
 * @param functions - Array of functions to compose
 * @returns A composed function that executes all functions in sequence
 */
const composeFunctions = (...functions: (Function | undefined)[]): Function => {
	const validFunctions: Function[] = []
	
	// Filter out undefined values and ensure we have only functions
	for (const fn of functions) {
		if (isFunction(fn)) {
			validFunctions.push(fn)
		}
	}
	
	if (validFunctions.length === 0) {
		return () => undefined
	}
	
	if (validFunctions.length === 1) {
		return validFunctions[0] as Function
	}
	
	return (...args: any[]) => {
		let result: any
		
		// Execute all functions in order, keeping the last result
		for (const fn of validFunctions) {
			try {
				result = fn(...args)
			} catch (error) {
				// Log error with function context for better debugging
				console.error('[use-styled] Error in composed function:', error)
				throw error
			}
		}
		
		return result
	}
}

// --- Specific Helper Functions ---

/**
 * Merges multiple style objects (plain objects).
 * Later objects in the list overwrite earlier keys.
 * Returns a single object or undefined if merging results in an empty object or only null/undefined entries.
 * NOTE: In React Native, if you need support for arrays/IDs,
 *       use StyleSheet.flatten BEFORE passing to this function.
 */
export const mergeStyles = (
	...styles: Array<StyleValue>
): StyleObject | undefined => {
	const validStyles = styles.filter(Boolean) as AnyObject[]

	if (validStyles.length === 0) return undefined
	if (validStyles.length === 1) return validStyles[0]

	// Merge valid style objects
	const merged = Object.assign({}, ...validStyles)
	// Return undefined if the merged object is empty
	return Object.keys(merged).length > 0 ? merged : undefined
}

// --- Custom tailwind-merge configuration ---
const customTwMerge = extendTailwindMerge(config => {
	// Pegar a configuração padrão para estendê-la
	const defaultConfig = getDefaultConfig();

	return {
		...config, // Manter a configuração base passada (geralmente vazia na primeira chamada)
		classGroups: {
			...config.classGroups, // Manter grupos existentes
			// Corrigido para 'font-size'
			'font-size': [
				...(config.classGroups?.['font-size'] ?? defaultConfig.classGroups['font-size']),
				{ text: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'h7', 'h8', 'h9', 'h10'] }
			],
		},
	}
})

/**
 * Merges CSS classes using clsx and tailwind-merge. Essential for Tailwind/NativeWind.
 */
export function cn(...inputs: ClassValue[]): string | undefined {
	// Usar a instância customizada
	const result = customTwMerge(clsx(inputs))
	return result.length > 0 ? result : undefined
}

/**
 * Checks compound variant conditions.
 */
const checkCompoundVariantConditions = (
	conditions: Record<string, string | boolean>,
	activeVariants: Record<string, string | boolean | undefined>,
): boolean => {
	for (const key in conditions) {
		if (conditions[key] !== activeVariants[key]) return false
	}
	return true
}

// --- Prop Resolution Functions ---

/**
 * Extracts and merges props defined for active variants.
 * Optimized version merging style/className iteratively.
 */
export const resolveVariantProps = <T extends Component, C extends Config>(
	configVariants: C['variants'],
	activeVariants: Record<string, string | boolean | undefined>,
): Partial<ComponentProps<T>> => {
	const finalProps: Partial<ComponentProps<T>> = {}
	let currentMergedStyle: StyleValue | undefined = undefined // Changed to let
	let currentMergedClassName: ClassValue | undefined = undefined // Changed to let

	if (!configVariants) return {}

	for (const variantKey in activeVariants) {
		const variantValue = activeVariants[variantKey]
		if (variantValue !== undefined && configVariants[variantKey]) {
			const propsForVariant = configVariants[variantKey]?.[String(variantValue)]
			if (propsForVariant) {
				const { style, className, ...restProps } = propsForVariant as any
				// Merge other props (last write wins)
				Object.assign(finalProps, restProps)
				// Merge style iteratively
				if (style) {
					currentMergedStyle = mergeStyles(currentMergedStyle, style)
				}
				// Merge className iteratively
				if (className) {
					currentMergedClassName = cn(currentMergedClassName, className)
				}
			}
		}
	}

	// Assign merged styles and classes at the end
	if (currentMergedStyle) (finalProps as any).style = currentMergedStyle
	if (currentMergedClassName)
		(finalProps as any).className = currentMergedClassName

	return finalProps
}

/**
 * Extracts and merges props defined for active compound variants.
 */
export const resolveCompoundVariantProps = <
	T extends Component,
	C extends Config,
>(
	compoundVariantsConfig: C['compoundVariants'],
	activeVariants: Record<string, string | boolean | undefined>,
): Partial<ComponentProps<T>> => {
	const compoundProps: Partial<ComponentProps<T>> = {}
	if (!compoundVariantsConfig) return compoundProps
	for (const compoundItem of compoundVariantsConfig) {
		const { props: itemProps, ...conditions } = compoundItem as AnyObject
		if (checkCompoundVariantConditions(conditions, activeVariants)) {
			if (itemProps) Object.assign(compoundProps, itemProps)
		}
	}
	return compoundProps
}

/**
 * Main function to merge all prop sources in the correct priority order.
 * V2 Feature: Automatically composes functions instead of overwriting them.
 * Execution order: base → variants → compounds → direct props
 */
export const mergeFinalProps = <T extends Component>(
	base: Partial<ComponentProps<T>> | undefined,
	variants: Partial<ComponentProps<T>>,
	compounds: Partial<ComponentProps<T>>,
	direct: Partial<ComponentProps<T>>, // Includes ref here
): ComponentProps<T> => {
	const { ref, ...otherDirectProps } = direct || {}

	const sources = [base, variants, compounds, otherDirectProps]
	const finalProps: AnyObject = {}
	const stylesToMerge: StyleValue[] = []
	const classesToMerge: ClassValue[] = []
	const functionsToCompose: Record<string, Function[]> = {}

	// Iterate through sources to collect styles, classes, functions, and other props
	for (const source of sources) {
		if (!source) continue

		for (const key in source) {
			const value = source[key as keyof typeof source]
			
			if (key === 'style') {
				stylesToMerge.push(value as StyleValue)
			} else if (key === 'className') {
				classesToMerge.push(value as ClassValue)
			} else if (key !== 'ref') {
				// V2 Feature: Check if the value is a function for composition
				if (isFunction(value)) {
					if (!functionsToCompose[key]) {
						functionsToCompose[key] = []
					}
					functionsToCompose[key].push(value)
				} else {
					// Non-function props: later props overwrite earlier ones
					finalProps[key] = value
				}
			}
		}
	}

	// V2 Feature: Compose all collected functions
	for (const [key, functions] of Object.entries(functionsToCompose)) {
		if (functions.length > 0) {
			finalProps[key] = composeFunctions(...functions)
		}
	}

	// Merge collected styles and classNames
	const mergedStyle = mergeStyles(...stylesToMerge)
	const mergedClassName = cn(...classesToMerge)

	// Add styles, classes, and ref to the final object
	if (mergedStyle) finalProps.style = mergedStyle
	if (mergedClassName) finalProps.className = mergedClassName
	if (ref) finalProps.ref = ref // Add ref back
	return finalProps as ComponentProps<T>
}
