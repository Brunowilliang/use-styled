import React from 'react'
import type {
	Component,
	Config,
	StyledComponent,
	ComponentProps,
	ConfigSchema,
	FinalProps,
	DebugConfig,
} from './types'

import {
	resolveVariantProps,
	resolveCompoundVariantProps,
	mergeFinalProps,
} from './utils'
import { logger } from './logger'

/**
 * A hook that takes a base component and a configuration object to create a new styled component.
 * This new component can have base styles, variants, default variants, and compound variants.
 *
 * @template T - The type of the base React component.
 * @template C - The type of the configuration object, defining styles and variants.
 * @param {T} component - The base component to be styled (e.g., a built-in HTML tag as a string, or a React component).
 * @param {C & DebugConfig & ConfigSchema<T, C>} config - The configuration object which includes:
 *   - `name`: (Optional) A name for debugging purposes.
 *   - `debug`: (Optional) A boolean to enable detailed logging.
 *   - `base`: (Optional) An object of base props to apply to the component.
 *   - `variants`: (Optional) An object defining different style variants based on props.
 *   - `defaultVariants`: (Optional) An object specifying default variants to apply.
 *   - `compoundVariants`: (Optional) An array to define styles for combinations of variants.
 * @returns {StyledComponent<T, C>} A new React functional component that applies the defined styles and variants.
 */
export const useStyled = <T extends Component, C extends Config>(
	component: T,
	config: C & DebugConfig & ConfigSchema<T, C>, // Validate the config on input
) => {
	/**
	 * The internal functional component that receives props and applies styling logic.
	 */
	const StyledComponentInternal: React.FC<FinalProps<T, C>> = incomingProps => {
		// Extract configuration for easier access.
		const {
			name,
			debug,
			variants: configVariants,
			defaultVariants,
			compoundVariants: configCompoundVariants,
			base: baseProps,
		} = config

		if (debug) {
			logger.debug(name, 'Incoming Props:', incomingProps)
		}

		// Initialize active variants with defaults specified in the config.
		const activeVariantProps: Record<string, string | boolean | undefined> = {
			...(defaultVariants || {}),
		}
		const variantKeys = configVariants ? Object.keys(configVariants) : []
		const directProps: Partial<ComponentProps<T>> = {}

		if (debug && defaultVariants) {
			logger.debug(
				name,
				'Initialized Active Variants with Defaults:',
				activeVariantProps,
			)
		}

		// Separate incoming props into variant-triggering props and direct props.
		// Explicit variant props from `incomingProps` will overwrite default variants.
		for (const key in incomingProps) {
			const incomingKey = key as keyof typeof incomingProps
			const propValue = incomingProps[incomingKey]

			if (variantKeys.includes(key) && propValue !== undefined) {
				activeVariantProps[key] = propValue
			} else {
				directProps[incomingKey as keyof typeof directProps] = propValue as any
			}
		}

		if (debug) {
			logger.debug(
				name,
				'Final Active Variant Props (After Incoming Overwrite):',
				activeVariantProps,
			)
			logger.debug(name, 'Separated - Direct Props:', directProps)
		}

		// Resolve props from active variants and compound variants.
		const variantPropsResult = resolveVariantProps<T, C>(
			configVariants,
			activeVariantProps,
		)
		const compoundPropsResult = resolveCompoundVariantProps<T, C>(
			configCompoundVariants,
			activeVariantProps,
		)

		if (debug) {
			logger.debug(name, 'Resolved Variant Props:', variantPropsResult)
			logger.debug(
				name,
				'Resolved Compound Variant Props:',
				compoundPropsResult,
			)
		}

		// Merge all props: base, resolved variants, resolved compound variants, and direct props.
		const finalMergedProps = mergeFinalProps<T>(
			baseProps,
			variantPropsResult,
			compoundPropsResult,
			directProps,
		)

		if (debug) {
			logger.debug(name, 'Final Merged Props:', finalMergedProps)
		}

		// Render the original component with the final, merged props.
		return React.createElement(component, finalMergedProps)
	}

	// Set a displayName for the styled component for better debugging and React DevTools inspection.
	const componentName =
		config.name ||
		(typeof component === 'string'
			? component
			: (component as any).displayName ||
				(component as any).name ||
				'Component')
	StyledComponentInternal.displayName = `Styled(${componentName})`

	return StyledComponentInternal as StyledComponent<T, C>
}
