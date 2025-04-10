import clsx, { type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ElementType, ComponentProps, ComponentType } from "react";

// --- Utility Functions ---

/**
 * Utility function to merge CSS classes with Tailwind CSS support.
 * Uses clsx for conditional classes and tailwind-merge to resolve conflicts.
 * @param inputs - Class values to combine.
 * @returns The merged class string.
 */
function cn(...inputs: ClassValue[]): string {
	return twMerge(clsx(inputs));
}

/**
 * Merges multiple props objects, combining classNames and styles intelligently.
 * Later props override earlier props.
 * @param propsList - An array of prop objects to merge.
 * @returns The merged props object.
 */
function mergeProps<T extends { className?: string; style?: object }>(
	...propsList: Array<Partial<T> | undefined | null>
): T {
	const result: Partial<T> = {};
	for (const props of propsList) {
		if (!props) continue;
		for (const key in props) {
			// Ensure the key is a valid key of T before proceeding
			if (!Object.prototype.hasOwnProperty.call(props, key)) continue;
			const value = props[key as keyof T]; // Cast here since we know key is in props

			// Handle className merging
			if (
				key === "className" &&
				typeof value === "string" &&
				value // Ensure value is not empty string if needed
			) {
				result.className = cn(result.className, value);
				// Handle style merging
			} else if (
				key === "style" &&
				typeof value === "object" &&
				value !== null &&
				typeof result.style === "object" &&
				result.style !== null
			) {
				// Simple style merge, last write wins for conflicting keys
				result.style = { ...result.style, ...value };
			} else if (value !== undefined) {
				// Use direct assignment after ensuring key is valid
				// Cast value explicitly to T[keyof T] to resolve complex type inference issue
				result[key as keyof T] = value as T[keyof T];
			}
		}
	}
	// Cast the final result back to T
	return result as T;
}

/**
 * Helper function to check if a variant is a boolean variant (only has 'true' key)
 */
function isBooleanVariant<T extends ElementType>(
	variant: unknown, // Use unknown for better type safety than any
): variant is BooleanVariant<T> {
	if (!variant || typeof variant !== "object") return false;

	// Check if it has exactly one key and that key is 'true'
	const keys = Object.keys(variant);
	return keys.length === 1 && keys[0] === "true";
}

/**
 * Extracts all valid props from a React element type.
 * This allows TypeScript to know all possible props for a component.
 * @template T - The base React element type (e.g., 'div', 'button', ComponentType).
 */
export type ElementProps<T extends ElementType> = ComponentProps<T>;

/**
 * Defines a partial set of props that can be applied as a variant style.
 * Allows defining only the props to be modified for a specific variant.
 * @template T - The base React element type.
 */
export type VariantValue<T extends ElementType> = Partial<ElementProps<T>>;

/**
 * Type for a boolean variant that only accepts the literal boolean value `true` as a key.
 * This helps enforce proper boolean variant usage.
 */
export type BooleanVariant<T extends ElementType> = {
	// Only allow true literal
	true: VariantValue<T>;
};

/**
 * Type for a regular string-keyed variant.
 */
export type StringVariant<T extends ElementType> = Record<
	string,
	VariantValue<T>
>;

/**
 * Defines the structure for variant configurations.
 * The first level Record keys are variant categories (e.g., "color", "size").
 * The second level keys are the possible values for that category.
 * For boolean variants, only the literal value `true` should be used as a key.
 * @template T - The base React element type.
 */
export type VariantsConfig<T extends ElementType> = Record<
	string,
	StringVariant<T> | BooleanVariant<T>
>;

/**
 * Extracts the possible variant keys and their allowed values from a VariantsConfig.
 * Enables TypeScript autocompletion and validation for variant props.
 * Example: If V = { color: { red, blue } }, then VariantKeys allows { color?: "red" | "blue" }.
 * For boolean variants (those with only 'true' key), allows using just the prop name as boolean.
 * @template V - The VariantsConfig object.
 */
export type VariantKeys<V> = V extends VariantsConfig<any>
	? {
			[K in keyof V]?: keyof V[K] extends "true" ? boolean : keyof V[K];
		}
	: {};

/**
 * Defines the conditions for a compound variant.
 * Represents the combination of variant props that must be active for the compound variant styles to apply.
 * @template V - The VariantsConfig object.
 */
export type CompoundVariantConditions<V> = VariantKeys<V>;

/**
 * Defines a compound variant, which applies styles only when specific combinations of base variants are active.
 * Combines the required conditions (CompoundVariantConditions) with the props to apply (VariantValue).
 * @template T - The base React element type.
 * @template V - The VariantsConfig object.
 */
export type CompoundVariant<
	T extends ElementType,
	V extends VariantsConfig<T>,
> = CompoundVariantConditions<V> & VariantValue<T>;

// --- Configuration Types ---

/**
 * Base configuration options applicable whether variants are present or not.
 * @template T - The base React element type.
 */
type BaseStyledConfig<T extends ElementType> = {
	/** Base props to apply to the component, merged with lower priority than variants and instance props. */
	base?: Partial<ElementProps<T>>;
	/** Component name for debugging purposes */
	name?: string;
	/** Enable debug mode to log the component's prop merging process */
	debug?: boolean;
};

/**
 * Configuration for a styled component WITHOUT variants.
 * Extends BaseStyledConfig.
 * @template T - The base React element type.
 */
export type StyledConfigWithoutVariants<T extends ElementType> =
	BaseStyledConfig<T>;

/**
 * Configuration for a styled component WITH variants.
 * Extends BaseStyledConfig and requires a 'variants' definition.
 * Optionally accepts 'defaultVariants' and 'compoundVariants'.
 * @template T - The base React element type.
 * @template V - The VariantsConfig object.
 */
export type StyledConfigWithVariants<
	T extends ElementType,
	V extends VariantsConfig<T>,
> = BaseStyledConfig<T> & {
	/** Definitions for component variants. */
	variants: V;
	/** Default variant values to apply if not specified in props. */
	defaultVariants?: VariantKeys<V>;
	/** Definitions for compound variants based on combinations of base variants. */
	compoundVariants?: Array<CompoundVariant<T, V>>;
};

// --- Component Prop Types ---

/**
 * Props for the resulting styled component when variants ARE defined.
 * Combines the original component props with the allowed variant keys.
 * @template T - The base React element type.
 * @template V - The VariantsConfig object.
 */
export type StyledPropsWithVariants<
	T extends ElementType,
	V extends VariantsConfig<T>,
> = ElementProps<T> & VariantKeys<V>;

// --- useStyled Overloads ---

/**
 * Creates a styled component factory.
 * OVERLOAD 1: For components WITHOUT variants.
 * Returns a new component type that accepts the original component's props.
 *
 * @template T - The base React element type.
 * @param component - The base component or tag name (e.g., 'div', Button).
 * @param config - Configuration object without variants (base only).
 * @returns A new React component type.
 */
export function useStyled<T extends ElementType>(
	component: T,
	config: StyledConfigWithoutVariants<T>,
): ComponentType<ElementProps<T>>;

/**
 * Creates a styled component factory.
 * OVERLOAD 2: For components WITH variants.
 * Returns a new component type that accepts the original component's props plus the defined variant props.
 *
 * @template T - The base React element type.
 * @template V - The VariantsConfig object type.
 * @param component - The base component or tag name (e.g., 'div', Button).
 * @param config - Configuration object including variants, defaultVariants, compoundVariants, and base.
 * @returns A new React component type supporting variants.
 */
export function useStyled<
	T extends ElementType,
	V extends VariantsConfig<T> = VariantsConfig<T>,
>(
	component: T,
	config: StyledConfigWithVariants<T, V>,
): ComponentType<StyledPropsWithVariants<T, V>>;

// --- useStyled Implementation ---

/**
 * Actual implementation of the useStyled hook.
 * Handles both cases (with and without variants) using TypeScript overload resolution.
 * Supports boolean variants and debugging capabilities.
 * Updated for React 19 to use native ref handling instead of forwardRef.
 */
export function useStyled<T extends ElementType, V extends VariantsConfig<T>>(
	component: T,
	config: StyledConfigWithoutVariants<T> | StyledConfigWithVariants<T, V>,
): ComponentType<any> {
	const Tag = component;

	// Destructure config safely, checking if variants exist
	const {
		base = {}, // Base styles object
		name = "UnnamedStyledComponent", // Provide a default name
		variants,
		compoundVariants,
		defaultVariants,
		debug = false, // Default debug to false
	} = (config || {}) as StyledConfigWithVariants<T, V>;

	const variantKeys = variants ? Object.keys(variants) : [];

	// Helper for debug logging
	type LogEntry = {
		component: string;
		event: string;
		details?: Record<string, any>;
	};

	const logEvent = (event: string, details?: Record<string, any>) => {
		if (debug) {
			const entry: LogEntry = {
				component: name,
				event: event,
				...(details && { details }), // Only add details key if details object is provided
			};
			// Use console.log directly with stringify for one JSON object per line
			console.log(JSON.stringify(entry, null, 2));
		}
	};

	// --- Helper Functions within Hook Scope ---

	/**
	 * Applies compound variants based on current props.
	 * @param currentProps - The combined props including defaults and instance props.
	 * @returns Props derived from matching compound variants.
	 */
	const applyCompoundVariants = (
		currentProps: Record<string, any>,
	): Partial<ElementProps<T>> => {
		let compoundVariantProps: Partial<ElementProps<T>> = {};
		if (!compoundVariants || compoundVariants.length === 0) {
			logEvent("compound_variants_skip_empty");
			return {};
		}

		logEvent("compound_variants_start", {
			count: compoundVariants.length,
			currentPropsKeys: Object.keys(currentProps),
		});

		for (const compound of compoundVariants) {
			const { className, style, ...conditions } = compound;
			let isMatch = true;
			logEvent("compound_variants_check_condition", {
				conditionsKeys: Object.keys(conditions),
			});

			for (const key in conditions) {
				const conditionValue = (conditions as Record<string, unknown>)[key];
				const propValue = currentProps[key];

				logEvent("compound_variants_check_condition_value", {
					key,
					conditionValue,
					propValue,
				});

				if (propValue !== conditionValue) {
					isMatch = false;
					logEvent("compound_variants_condition_mismatch", {
						key,
						conditionValue,
						propValue,
					});
					break;
				}
				logEvent("compound_variants_condition_match", {
					key,
					conditionValue,
					propValue,
				});
			}

			if (isMatch) {
				logEvent("compound_variants_match_found", {
					conditionsKeys: Object.keys(conditions),
					appliedStylesKeys: Object.keys(compound),
				});
				// Create props object from the compound variant, excluding condition keys
				const compoundSpecificProps: VariantValue<T> = {};
				for (const key in compound) {
					if (!(key in conditions)) {
						// Assign non-condition props
						(compoundSpecificProps as Record<string, unknown>)[key] = (
							compound as Record<string, unknown>
						)[key];
					}
				}
				logEvent("compound_variants_apply_props", {
					compoundSpecificPropsKeys: Object.keys(compoundSpecificProps),
				});
				compoundVariantProps = mergeProps(
					compoundVariantProps,
					// Assert type here as we constructed it manually
					compoundSpecificProps as Partial<ElementProps<T>>,
				);
			} else {
				logEvent("compound_variants_match_not_found", {
					conditionsKeys: Object.keys(conditions),
				});
			}
		}

		logEvent("compound_variants_complete", {
			finalCompoundPropsKeys: Object.keys(compoundVariantProps),
		});
		return compoundVariantProps;
	};

	/**
	 * Applies base variants (non-compound) based on props and defaults.
	 * @param currentProps - The props passed to the component instance.
	 * @returns Props derived from matching base variants and defaults.
	 */
	const applyBaseVariants = (
		currentProps: Record<string, any>,
	): Partial<ElementProps<T>> => {
		let variantProps: Partial<ElementProps<T>> = {};
		if (!variants) {
			logEvent("base_variants_skip_empty");
			return {};
		}

		logEvent("base_variants_start", {
			count: variantKeys.length,
			variantsKeys: Object.keys(variants || {}),
			currentPropsKeys: Object.keys(currentProps),
			defaultVariantsKeys: Object.keys(defaultVariants || {}),
		});

		for (const key of variantKeys) {
			// Get the variant definition for this key
			const variantDef = variants[key as keyof typeof variants];
			if (!variantDef) continue;

			// Check if this is a boolean variant
			const isBoolean = isBooleanVariant<T>(variantDef);
			logEvent("base_variants_check_boolean", { key, isBoolean });

			// Get the value from props, falling back to defaultVariants
			let propValue = currentProps[key];
			const defaultValue =
				defaultVariants && key in defaultVariants
					? defaultVariants[key as keyof typeof defaultVariants]
					: undefined;

			// Handle boolean variants
			if (isBoolean) {
				// For boolean variants, we only accept true boolean values
				if (propValue === true) {
					// Convert to 'true' string for lookup
					propValue = "true";
					logEvent("base_variants_boolean_conversion", {
						key,
						originalValue: currentProps[key],
						convertedValue: "true",
					});
				} else if (propValue === false || propValue === undefined) {
					// Skip this variant if false or undefined
					logEvent("base_variants_boolean_skip", {
						key,
						value: propValue,
					});
					continue;
				} else if (propValue === "true" || propValue === "false") {
					// Skip string 'true'/'false' for boolean variants
					logEvent("base_variants_boolean_invalid", {
						key,
						value: propValue,
					});
					logEvent("base_variants_boolean_invalid_hint", {
						key,
						hint: "Use boolean value instead of string",
					});
					continue;
				}
			}

			// Ensure propValue is treated as string for lookup, unless it's undefined
			if (propValue !== undefined) {
				propValue = String(propValue);
			}

			// Check if propValue is valid and the corresponding style exists
			const variantStyles = variantDef[propValue as keyof typeof variantDef];
			if (propValue !== undefined && variantStyles) {
				logEvent("base_variants_applied", {
					key,
					value: propValue,
					stylesKeys: Object.keys(variantStyles),
				});
				variantProps = mergeProps(variantProps, variantStyles);
			} else {
				logEvent("base_variants_not_found", {
					key,
					lookupValue: propValue,
				});
			}
		}

		logEvent("base_variants_complete", {
			finalBasePropsKeys: Object.keys(variantProps),
		});
		return variantProps;
	};

	/**
	 * Separates variant props from other direct props passed to the component.
	 * @param allProps - All props passed to the component instance.
	 * @returns An object containing separated variant and direct props.
	 */
	const separateProps = (
		// Use unknown for initial catch-all, will be refined internally
		allProps: Record<string, unknown>,
	): {
		variantProps: VariantKeys<V>;
		directProps: Omit<ElementProps<T>, keyof VariantKeys<V>>;
	} => {
		// Initialize with more specific partial types
		const variantProps: Partial<VariantKeys<V>> = {};
		const directProps: Partial<Omit<ElementProps<T>, keyof VariantKeys<V>>> =
			{};

		logEvent("props_separation_start", {
			// Log only keys to avoid circular references in potential complex props
			inputPropKeys: Object.keys(allProps),
			variantKeys,
		});

		for (const key in allProps) {
			// Ensure the key is actually a property of allProps
			if (Object.prototype.hasOwnProperty.call(allProps, key)) {
				const value = allProps[key];
				if (variantKeys.includes(key)) {
					// Assign safely, ensuring key is valid for VariantKeys<V>
					// Cast the specific property assignment
					variantProps[key as keyof typeof variantProps] = value as any; // TODO: Revisit this cast if possible
					logEvent("props_separation_variant", {
						key,
						value,
					});
				} else {
					// Assign safely, ensuring key is valid for the Omit type
					// Cast the specific property assignment
					directProps[key as keyof typeof directProps] = value as any; // TODO: Revisit this cast if possible
					logEvent("props_separation_direct", {
						key,
						value,
					});
				}
			}
		}

		logEvent("props_separation_complete", {
			separatedVariantPropsKeys: Object.keys(variantProps),
			separatedDirectPropsKeys: Object.keys(directProps),
		});

		// Return with appropriate types, removing 'as any' from the return itself
		return {
			variantProps: variantProps as VariantKeys<V>,
			directProps: directProps as Omit<ElementProps<T>, keyof VariantKeys<V>>,
		};
	};

	// --- The Styled Component ---

	// No need for forwardRef in React 19 - refs are automatically forwarded
	function StyledComponent(
		props: typeof variants extends undefined
			? ElementProps<T>
			: StyledPropsWithVariants<T, V>,
	) {
		logEvent("render_start", { receivedPropKeys: Object.keys(props) });

		// Separate instance props from variant keys
		const { children, ...restProps } = props;
		const { variantProps, directProps } = separateProps(restProps);

		// Determine active variants including defaults
		const activeVariantProps = { ...defaultVariants, ...variantProps };
		logEvent("active_variants_determined", {
			inputVariantPropsKeys: Object.keys(variantProps),
			defaultVariantsKeys: Object.keys(defaultVariants || {}),
			finalActiveVariantPropsKeys: Object.keys(activeVariantProps),
		});

		// --- Prop Merging Logic ---
		logEvent("prop_merging_start", {
			baseKeys: Object.keys(base || {}),
			directPropsKeys: Object.keys(directProps),
			activeVariantPropsKeys: Object.keys(activeVariantProps),
		});
		// Priority (lower overrides higher):
		// 1. Base props from config.base
		// 2. Props from active compound variants
		logEvent("prop_merging_apply_compound");
		const compoundVariantStyles = applyCompoundVariants(activeVariantProps);

		logEvent("prop_merging_apply_base");
		const baseVariantStyles = applyBaseVariants(activeVariantProps);

		logEvent("prop_merging_final_merge");
		const mergedProps = mergeProps(
			base, // 1. Base
			compoundVariantStyles, // 2. Compound Variants
			baseVariantStyles, // 3. Base Variants
			// Cast directProps to Partial as required by mergeProps
			directProps as Partial<ElementProps<T>>, // 4. Instance overrides
		);

		// Separate className and style for potential framework specifics (e.g., React Native)
		const { className, style, ...finalRestProps } = mergedProps;
		logEvent("prop_merging_complete", {
			// Log final pieces separately to avoid complex object stringification issues
			finalClassName: className,
			finalStyleKeys: Object.keys(style || {}),
			finalRestPropKeys: Object.keys(finalRestProps),
		});

		// Render the base component with merged props
		logEvent("render_component", {
			// Avoid logging Tag component and full props object to prevent cycles
			componentDisplayName: typeof Tag === "string" ? Tag : name, // Use name for non-string tags
			renderedClassName: className,
			renderedStyleKeys: Object.keys(style || {}),
			renderedRestPropKeys: Object.keys(finalRestProps),
		});
		return (
			// Using 'as any' here as a pragmatic solution for complex generic type issues
			// in JSX spread attributes. Although not ideal for type safety, it resolves the
			// persistent compilation error related to LibraryManagedAttributes.
			<Tag className={className} style={style} {...(finalRestProps as any)}>
				{children}
			</Tag>
		);
	}

	// Set display name for better debugging
	const componentDisplayName =
		typeof Tag === "string"
			? Tag
			: (Tag as ComponentType).displayName ||
				(Tag as ComponentType).name ||
				"Component";
	StyledComponent.displayName = `Styled(${componentDisplayName})`;

	logEvent("hook_complete", { componentDisplayName });

	// Return the styled component
	// The cast is necessary because the implementation signature doesn't perfectly match the overloads
	return StyledComponent as ComponentType<any>;
}
